from django.db import models
from django.conf import settings
from accounts.models import BaseModel
from products.models import Product

class Cart(BaseModel):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="carts")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_items = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default='active')  # active, abandoned, checked_out

    def __str__(self):
        return f"Cart: {self.customer.username} ({self.status})"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Cart {self.cart.id}"

class Order(BaseModel):
    ORDER_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('packed', 'Packed'),
        ('ready_for_dispatch', 'Ready For Dispatch'),
        ('dispatched', 'Dispatched'),
        ('out_for_delivery', 'Out For Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('received', 'Received'),
        ('verification_pending', 'Verification Pending'),
        ('verified', 'Verified'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    order_number = models.CharField(max_length=50, unique=True)
    order_type = models.CharField(max_length=30, choices=(('retail', 'Retail'), ('wholesale', 'Wholesale')), default='retail')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    order_status = models.CharField(max_length=50, choices=ORDER_STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=50, choices=PAYMENT_STATUS_CHOICES, default='pending')
    delivery_address = models.TextField()
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Order: {self.order_number} ({self.order_status})"

    class Meta:
        indexes = [
            models.Index(fields=['order_number']),
        ]

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order {self.order.order_number}"

class Invoice(BaseModel):
    order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name="invoice")
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateTimeField(auto_now_add=True)
    invoice_total = models.DecimalField(max_digits=12, decimal_places=2)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="generated_invoices")

    def __str__(self):
        return f"Invoice: {self.invoice_number}"
