from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from products.models import Category, QualityGrade, Product
from orders.models import Order, OrderItem
from payments.models import Payment

User = get_user_model()

class PaymentVerifyAPITests(APITestCase):
    def setUp(self):
        # Category and Grade
        self.category = Category.objects.create(name="Pulses", slug="pulses")
        self.grade = QualityGrade.objects.create(name="High Sortex", priority=1)
        
        # Product
        self.product = Product.objects.create(
            category=self.category,
            quality_grade=self.grade,
            name="Premium Toor Dal",
            price=120.00,
            stock=100,
            sku="TD-PREM-001",
            weight=1.00
        )
        
        # Users
        self.customer = User.objects.create_user(
            username="testcustomer", email="c@c.com", password="Password123!", role="customer"
        )
        self.sales_exec = User.objects.create_user(
            username="salesexec", email="s@s.com", password="Password123!", role="sales"
        )
        self.admin = User.objects.create_user(
            username="adminuser", email="a@a.com", password="Password123!", role="admin"
        )

        # Create Order
        self.order = Order.objects.create(
            customer=self.customer,
            order_number="ORD-TEST-12345",
            order_type="retail",
            subtotal=240.00,
            discount=0.00,
            tax_amount=12.00,
            total_amount=252.00,
            order_status="pending",
            payment_status="verification_pending",
            delivery_address="Bangalore"
        )
        
        # Create Payment record linked
        self.payment = Payment.objects.create(
            order=self.order,
            payment_method="bank_cheque",
            transaction_reference="CHQ7890",
            amount=252.00,
            payment_status="verification_pending"
        )

        # URLs
        self.payment_list_url = reverse('payment_list')
        self.payment_verify_url = reverse('payment_verify', kwargs={'pk': self.payment.pk})

    def test_payment_list_rbac(self):
        # Anonymous fails
        response = self.client.get(self.payment_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Customer fails (restricted to employee)
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.payment_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Sales Exec succeeds
        self.client.force_authenticate(user=self.sales_exec)
        response = self.client.get(self.payment_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_payment_verification_clearance(self):
        # Authenticate as Sales Exec
        self.client.force_authenticate(user=self.sales_exec)

        # Approve clearance
        data = {'status': 'completed', 'notes': 'Cheque cleared successfully at HDFC bank'}
        response = self.client.post(self.payment_verify_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['payment_status'], 'completed')

        # Verify Payment model updated
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.payment_status, 'completed')
        self.assertEqual(self.payment.verified_by, self.sales_exec)
        self.assertIsNotNone(self.payment.payment_date)

        # Verify Order model updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'completed')
        self.assertEqual(self.order.order_status, 'confirmed')  # Proactive confirm check
