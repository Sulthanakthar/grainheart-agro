from rest_framework import serializers
from products.serializers import ProductListSerializer
from .models import Cart, CartItem, Order, OrderItem, Invoice

class CartItemSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_name', 'product_sku', 'product_details', 'quantity', 'unit_price', 'total_price')
        read_only_fields = ('id', 'unit_price', 'total_price')

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'customer', 'customer_username', 'total_amount', 'total_items', 'status', 'items')
        read_only_fields = ('id', 'customer', 'total_amount', 'total_items', 'status')

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_sku', 'quantity', 'unit_price', 'total_price')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'customer', 'customer_username', 'order_number', 'order_type', 'subtotal', 
            'discount', 'tax_amount', 'total_amount', 'order_status', 'payment_status', 
            'delivery_address', 'notes', 'items', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'order_number', 'created_at', 'updated_at')

class CheckoutSerializer(serializers.Serializer):
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('bank_cheque', 'Bank Cheque'),
        ('upi', 'UPI'),
        ('razorpay', 'Razorpay'),
        ('net_banking', 'Net Banking'),
    )
    delivery_address = serializers.CharField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    payment_method = serializers.ChoiceField(choices=PAYMENT_METHOD_CHOICES, required=True)
    transaction_reference = serializers.CharField(required=False, allow_blank=True, default='')

class InvoiceSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    generated_by_username = serializers.CharField(source='generated_by.username', read_only=True)

    class Meta:
        model = Invoice
        fields = ('id', 'order', 'order_number', 'invoice_number', 'invoice_date', 'invoice_total', 'generated_by', 'generated_by_username')
        read_only_fields = ('id', 'invoice_number', 'invoice_date', 'invoice_total')
