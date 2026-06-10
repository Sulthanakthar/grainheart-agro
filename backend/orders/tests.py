from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from products.models import Category, QualityGrade, Product
from inventory.models import Inventory
from orders.models import Cart, CartItem, Order, OrderItem, Invoice
from payments.models import Payment

User = get_user_model()

class CartAndOrderAPITests(APITestCase):
    def setUp(self):
        # Category and Grade
        self.category = Category.objects.create(name="Pulses", slug="pulses")
        self.grade = QualityGrade.objects.create(name="High Sortex", priority=1)
        
        # Product & automatic inventory setup
        self.product = Product.objects.create(
            category=self.category,
            quality_grade=self.grade,
            name="Premium Toor Dal",
            price=120.00,
            stock=100,  # Automatically creates Inventory record with available_stock=100
            sku="TD-PREM-001",
            weight=1.00
        )
        
        # Users
        self.customer = User.objects.create_user(
            username="testcustomer", email="c@c.com", password="Password123!", role="customer"
        )
        self.admin = User.objects.create_user(
            username="adminuser", email="a@a.com", password="Password123!", role="admin"
        )

        # URLs
        self.cart_url = reverse('cart_detail')
        self.add_item_url = reverse('cart_add_item')
        self.update_item_url = reverse('cart_update_item')
        self.remove_item_url = reverse('cart_remove_item')
        self.checkout_url = reverse('order_create')
        self.orders_list_url = reverse('order_list')

    def test_cart_workflow(self):
        self.client.force_authenticate(user=self.customer)

        # 1. GET cart (should create an active cart)
        response = self.client.get(self.cart_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'active')
        self.assertEqual(len(response.data['items']), 0)

        # 2. Add product to cart
        data = {'product': self.product.id, 'quantity': 2}
        response = self.client.post(self.add_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['quantity'], 2)

        # 3. Add quantity exceeding stock (stock limit validation)
        data = {'product': self.product.id, 'quantity': 150}
        response = self.client.post(self.add_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Update cart item quantity
        data = {'product': self.product.id, 'quantity': 5}
        response = self.client.put(self.update_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['items'][0]['quantity'], 5)

        # 5. Remove cart item
        data = {'product': self.product.id}
        response = self.client.post(self.remove_item_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 0)

    def test_order_creation_checkout_stock_reservation(self):
        self.client.force_authenticate(user=self.customer)

        # Add item to cart
        self.client.post(self.add_item_url, {'product': self.product.id, 'quantity': 10})

        # Checkout
        checkout_data = {
            'delivery_address': '456 Grain Warehouse, Bangalore',
            'notes': 'Deliver before 5 PM',
            'payment_method': 'bank_cheque',
            'transaction_reference': 'CHQ123456'
        }
        response = self.client.post(self.checkout_url, checkout_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['order_status'], 'pending')
        self.assertEqual(response.data['payment_status'], 'verification_pending')

        order_number = response.data['order_number']

        # Verify stock reservation in DB
        inv = self.product.inventory
        inv.refresh_from_db()
        self.assertEqual(inv.available_stock, 90)  # 100 - 10
        self.assertEqual(inv.reserved_stock, 10)   # 0 + 10

        # Verify synced Product.stock field
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 90)

        # Verify Payment and Invoice records automatically created
        self.assertTrue(Payment.objects.filter(order__order_number=order_number).exists())
        self.assertTrue(Invoice.objects.filter(order__order_number=order_number).exists())

    def test_order_status_transitions(self):
        # Set up active cart and place order
        self.client.force_authenticate(user=self.customer)
        self.client.post(self.add_item_url, {'product': self.product.id, 'quantity': 10})
        checkout_data = {
            'delivery_address': 'Bangalore',
            'payment_method': 'cash'
        }
        checkout_res = self.client.post(self.checkout_url, checkout_data)
        order_number = checkout_res.data['order_number']

        # Authenticate as Admin to transition status
        self.client.force_authenticate(user=self.admin)
        status_url = reverse('order_status_update', kwargs={'order_number': order_number})

        # 1. Update status to Ready For Dispatch
        response = self.client.put(status_url, {'order_status': 'ready_for_dispatch'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order_status'], 'ready_for_dispatch')

        # 2. Update status to Dispatched (should release reserved_stock from reservation bucket)
        response = self.client.put(status_url, {'order_status': 'dispatched'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        inv = self.product.inventory
        inv.refresh_from_db()
        self.assertEqual(inv.reserved_stock, 0) # Clear reserved stock on dispatch
        self.assertEqual(inv.available_stock, 90) # Physical stock remains 90

    def test_order_cancellation_returns_stock(self):
        self.client.force_authenticate(user=self.customer)
        self.client.post(self.add_item_url, {'product': self.product.id, 'quantity': 10})
        checkout_res = self.client.post(self.checkout_url, {'delivery_address': 'India', 'payment_method': 'cash'})
        order_number = checkout_res.data['order_number']

        # Cancel as Admin
        self.client.force_authenticate(user=self.admin)
        status_url = reverse('order_status_update', kwargs={'order_number': order_number})
        response = self.client.put(status_url, {'order_status': 'cancelled'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify stock returned
        inv = self.product.inventory
        inv.refresh_from_db()
        self.assertEqual(inv.available_stock, 100) # Returned to available
        self.assertEqual(inv.reserved_stock, 0)

        # Verify payment rejected
        payment = Payment.objects.get(order__order_number=order_number)
        self.assertEqual(payment.payment_status, 'rejected')

    def test_invoice_download_view(self):
        self.client.force_authenticate(user=self.customer)
        self.client.post(self.add_item_url, {'product': self.product.id, 'quantity': 2})
        checkout_res = self.client.post(self.checkout_url, {'delivery_address': 'India', 'payment_method': 'cash'})
        order_number = checkout_res.data['order_number']

        # Get invoice HTML
        invoice_url = reverse('invoice_download', kwargs={'order_number': order_number})
        response = self.client.get(invoice_url)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"HEALTHY GRAINS", response.content)
        self.assertIn(b"INVOICE", response.content)
