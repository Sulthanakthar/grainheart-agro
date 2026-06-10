from django.db import models
from django.conf import settings
from accounts.models import BaseModel
from orders.models import Order

class Payment(BaseModel):
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('bank_cheque', 'Bank Cheque'),
        ('upi', 'UPI'),
        ('razorpay', 'Razorpay'),
        ('net_banking', 'Net Banking'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('received', 'Received'),
        ('verification_pending', 'Verification Pending'),
        ('verified', 'Verified'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    transaction_reference = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=50, choices=PAYMENT_STATUS_CHOICES, default='pending')
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_payments"
    )
    payment_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payment of {self.amount} for Order {self.order.order_number} ({self.payment_status})"

    class Meta:
        indexes = [
            models.Index(fields=['payment_status', 'payment_method']),
        ]
