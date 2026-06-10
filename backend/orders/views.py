import datetime
import uuid
import logging
from decimal import Decimal
from django.db import transaction
from django.http import HttpResponse
from django.views import View

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from products.models import Product
from payments.models import Payment
from accounts.permissions import IsEmployee
from .models import Cart, CartItem, Order, OrderItem, Invoice
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    CheckoutSerializer,
    InvoiceSerializer
)

logger = logging.getLogger(__name__)

def generate_order_number():
    date_str = datetime.date.today().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"ORD-{date_str}-{unique_suffix}"

def generate_invoice_number():
    date_str = datetime.date.today().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"INV-{date_str}-{unique_suffix}"

def recalculate_cart(cart):
    total_amount = 0.00
    total_items = 0
    for item in cart.items.all():
        total_amount += float(item.total_price)
        total_items += item.quantity
    cart.total_amount = total_amount
    cart.total_items = total_items
    cart.save()

class CartView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        cart, created = Cart.objects.get_or_create(customer=request.user, status='active')
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class CartAddItemView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))

        if quantity <= 0:
            return Response({"error": "Quantity must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id, is_active=True, is_deleted=False)
        except Product.DoesNotExist:
            return Response({"error": "Product not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        # Get active cart
        cart, created = Cart.objects.get_or_create(customer=request.user, status='active')

        # Check existing item
        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': 0, 'unit_price': product.price, 'total_price': 0.00}
        )

        target_quantity = cart_item.quantity + quantity

        # Verify stock availability
        available_stock = product.inventory.available_stock if hasattr(product, 'inventory') else product.stock
        if available_stock < target_quantity:
            return Response(
                {"error": f"Insufficient stock. Available: {available_stock}, Requested total: {target_quantity}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = target_quantity
        cart_item.unit_price = product.price
        cart_item.total_price = cart_item.quantity * cart_item.unit_price
        cart_item.save()

        recalculate_cart(cart)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

class CartUpdateItemView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def put(self, request):
        product_id = request.data.get('product')
        quantity = request.data.get('quantity')

        if quantity is None or int(quantity) <= 0:
            return Response({"error": "Valid quantity is required."}, status=status.HTTP_400_BAD_REQUEST)

        quantity = int(quantity)

        try:
            cart = Cart.objects.get(customer=request.user, status='active')
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        product = cart_item.product
        available_stock = product.inventory.available_stock if hasattr(product, 'inventory') else product.stock
        if available_stock < quantity:
            return Response(
                {"error": f"Insufficient stock. Available: {available_stock}, Requested: {quantity}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.total_price = cart_item.quantity * cart_item.unit_price
        cart_item.save()

        recalculate_cart(cart)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

class CartRemoveItemView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        product_id = request.data.get('product')

        try:
            cart = Cart.objects.get(customer=request.user, status='active')
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
            cart_item.delete()
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        recalculate_cart(cart)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

class OrderCreateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.get(customer=request.user, status='active')
        except Cart.DoesNotExist:
            return Response({"error": "No active cart found."}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({"error": "Cannot checkout an empty cart."}, status=status.HTTP_400_BAD_REQUEST)

        checkout_data = serializer.validated_data

        with transaction.atomic():
            # 1. Lock and Verify Stock
            for item in cart.items.select_related('product', 'product__inventory'):
                product = item.product
                available_stock = product.inventory.available_stock
                if available_stock < item.quantity:
                    transaction.set_rollback(True)
                    return Response(
                        {"error": f"Product '{product.name}' is out of stock. Available: {available_stock}, In cart: {item.quantity}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # 2. Setup Order details
            subtotal = cart.total_amount
            tax_amount = subtotal * Decimal('0.05') # 5% tax
            total_amount = subtotal + tax_amount
            order_type = 'wholesale' if request.user.role == 'dealer' else 'retail'
            order_number = generate_order_number()

            order = Order.objects.create(
                customer=request.user,
                order_number=order_number,
                order_type=order_type,
                subtotal=subtotal,
                discount=0.00,
                tax_amount=tax_amount,
                total_amount=total_amount,
                order_status='pending',
                payment_status='pending',
                delivery_address=checkout_data['delivery_address'],
                notes=checkout_data['notes']
            )

            # 3. Create Order Items & Reserve Inventory
            for item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total_price
                )

                # Reserve stock
                inv = item.product.inventory
                inv.available_stock -= item.quantity
                inv.reserved_stock += item.quantity
                inv.save()

                # Sync product stock
                item.product.stock = inv.available_stock
                item.product.save()

            # 4. Mark Cart Checked Out
            cart.status = 'checked_out'
            cart.save()

            # 5. Create Payment record (verification_pending for accountants approval)
            Payment.objects.create(
                order=order,
                payment_method=checkout_data['payment_method'],
                transaction_reference=checkout_data['transaction_reference'],
                amount=order.total_amount,
                payment_status='verification_pending'
            )
            order.payment_status = 'verification_pending'
            order.save()

            # 6. Generate Invoice
            Invoice.objects.create(
                order=order,
                invoice_number=generate_invoice_number(),
                invoice_total=order.total_amount,
                generated_by=request.user
            )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'sales', 'inventory']:
            queryset = Order.objects.all().order_by('-created_at')
        else:
            queryset = Order.objects.filter(customer=user).order_by('-created_at')

        # Filters
        order_status = self.request.query_params.get('order_status')
        if order_status:
            queryset = queryset.filter(order_status=order_status)

        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)

        order_type = self.request.query_params.get('order_type')
        if order_type:
            queryset = queryset.filter(order_type=order_type)

        return queryset

class OrderDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, order_number):
        try:
            if request.user.role in ['admin', 'sales', 'inventory']:
                order = Order.objects.get(order_number=order_number)
            else:
                order = Order.objects.get(order_number=order_number, customer=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderSerializer(order)
        return Response(serializer.data)

class OrderStatusUpdateView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def put(self, request, order_number):
        new_status = request.data.get('order_status')
        if not new_status:
            return Response({"error": "order_status field is required."}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = [choice[0] for choice in Order.ORDER_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"error": "Invalid order status."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            old_status = order.order_status
            if old_status == new_status:
                return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

            order.order_status = new_status
            order.save()

            # Handle Stock Cancellation
            if new_status == 'cancelled' and old_status != 'cancelled':
                for item in order.items.all():
                    inv = item.product.inventory
                    inv.available_stock += item.quantity
                    inv.reserved_stock -= item.quantity
                    inv.save()

                    item.product.stock = inv.available_stock
                    item.product.save()

                # Mark payment rejected
                for payment in order.payments.all():
                    payment.payment_status = 'rejected'
                    payment.save()
                order.payment_status = 'rejected'
                order.save()

            # Handle dispatch/delivery (finalizing reservation)
            elif new_status in ['dispatched', 'delivered'] and old_status not in ['dispatched', 'delivered', 'cancelled']:
                for item in order.items.all():
                    inv = item.product.inventory
                    if inv.reserved_stock >= item.quantity:
                        inv.reserved_stock -= item.quantity
                        inv.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

class InvoiceDownloadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, order_number):
        try:
            if request.user.role in ['admin', 'sales', 'inventory']:
                invoice = Invoice.objects.get(order__order_number=order_number)
            else:
                invoice = Invoice.objects.get(order__order_number=order_number, order__customer=request.user)
        except Invoice.DoesNotExist:
            return HttpResponse("Invoice not found.", status=404)

        order = invoice.order
        items_html = ""
        for item in order.items.all():
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{item.product.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">{item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹{item.unit_price:.2f}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹{item.total_price:.2f}</td>
            </tr>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - {invoice.invoice_number}</title>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 0; padding: 40px; background: #fff; }}
                .invoice-box {{ max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); }}
                .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #5a7d5a; padding-bottom: 20px; }}
                .company-details {{ text-align: right; }}
                .meta-table {{ width: 100%; margin: 20px 0; border-collapse: collapse; }}
                .meta-table td {{ padding: 5px 0; }}
                .items-table {{ width: 100%; border-collapse: collapse; margin-top: 30px; }}
                .items-table th {{ background-color: #f6f8f6; color: #2e4d2e; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }}
                .total-section {{ text-align: right; margin-top: 30px; font-size: 16px; line-height: 24px; }}
                .print-btn {{ display: block; width: 120px; padding: 10px; background: #5a7d5a; color: #fff; text-align: center; border-radius: 5px; text-decoration: none; margin: 20px auto 0 auto; }}
                @media print {{
                    .print-btn {{ display: none; }}
                    body {{ padding: 0; }}
                    .invoice-box {{ border: none; box-shadow: none; }}
                }}
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <div>
                        <h1 style="color: #2e4d2e; margin: 0 0 10px 0; font-size: 28px;">HEALTHY GRAINS</h1>
                        <p style="margin: 0; color: #666;">Happy Families Premium Pulses & Wheat</p>
                    </div>
                    <div class="company-details">
                        <h3 style="margin: 0;">INVOICE</h3>
                        <p style="margin: 5px 0 0 0; font-weight: bold; color: #5a7d5a;">{invoice.invoice_number}</p>
                        <p style="margin: 2px 0 0 0; font-size: 13px; color: #666;">Date: {invoice.invoice_date.strftime('%B %d, %Y')}</p>
                    </div>
                </div>

                <table class="meta-table">
                    <tr>
                        <td style="width: 50%;">
                            <strong style="color: #2e4d2e;">Billed To:</strong><br>
                            {order.customer.username}<br>
                            Email: {order.customer.email}<br>
                            Address: {order.delivery_address}
                        </td>
                        <td style="text-align: right; width: 50%; vertical-align: top;">
                            <strong>Order Ref:</strong> {order.order_number}<br>
                            <strong>Order Type:</strong> {order.get_order_type_display()}<br>
                            <strong>Payment Status:</strong> {order.get_payment_status_display()}
                        </td>
                    </tr>
                </table>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: right;">Quantity</th>
                            <th style="text-align: right;">Unit Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>

                <div class="total-section">
                    <table style="float: right; width: 250px;">
                        <tr>
                            <td>Subtotal:</td>
                            <td style="text-align: right;">₹{order.subtotal:.2f}</td>
                        </tr>
                        <tr>
                            <td>GST (5%):</td>
                            <td style="text-align: right;">₹{order.tax_amount:.2f}</td>
                        </tr>
                        <tr style="font-weight: bold; font-size: 18px; border-top: 1px solid #ddd;">
                            <td style="padding-top: 10px; color: #2e4d2e;">Total:</td>
                            <td style="padding-top: 10px; text-align: right; color: #2e4d2e;">₹{order.total_amount:.2f}</td>
                        </tr>
                    </table>
                    <div style="clear: both;"></div>
                </div>

                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
                    Thank you for buying from Healthy Grains! This is a system-generated invoice.
                </div>
                
                <a href="#" class="print-btn" onclick="window.print(); return false;">Print Invoice</a>
            </div>
        </body>
        </html>
        """
        return HttpResponse(html_content)
