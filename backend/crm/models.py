from django.db import models
from django.conf import settings
from accounts.models import BaseModel

class Enquiry(BaseModel):
    ENQUIRY_TYPES = (
        ('product', 'Product Enquiry'),
        ('price', 'Price Enquiry'),
        ('wholesale', 'Wholesale Enquiry'),
        ('dealer', 'Dealer Enquiry'),
        ('bulk_purchase', 'Bulk Purchase Enquiry'),
        ('availability', 'Product Availability Enquiry'),
        ('support', 'Support Request'),
        ('general', 'General Contact Enquiry'),
    )
    ENQUIRY_STATUS = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('closed', 'Closed'),
    )
    enquiry_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    enquiry_type = models.CharField(max_length=50, choices=ENQUIRY_TYPES, default='general')
    subject = models.CharField(max_length=250)
    message = models.TextField()
    source = models.CharField(max_length=50, choices=(('web', 'Web'), ('whatsapp', 'WhatsApp'), ('direct', 'Direct')), default='web')
    status = models.CharField(max_length=30, choices=ENQUIRY_STATUS, default='pending')

    def __str__(self):
        return f"Enquiry: {self.enquiry_number} ({self.customer_name})"

    class Meta:
        verbose_name_plural = "enquiries"
        indexes = [
            models.Index(fields=['status']),
        ]

class Lead(BaseModel):
    LEAD_STATUS = (
        ('new_lead', 'New Lead'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('quotation_sent', 'Quotation Sent'),
        ('negotiation', 'Negotiation'),
        ('converted', 'Converted'),
        ('lost', 'Lost'),
    )
    PRIORITIES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    lead_number = models.CharField(max_length=50, unique=True)
    enquiry = models.OneToOneField(Enquiry, on_delete=models.CASCADE, related_name="lead")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_leads"
    )
    lead_status = models.CharField(max_length=50, choices=LEAD_STATUS, default='new_lead')
    priority = models.CharField(max_length=30, choices=PRIORITIES, default='medium')
    expected_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    conversion_probability = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  # percentage

    def __str__(self):
        return f"Lead: {self.lead_number} ({self.lead_status})"

    class Meta:
        indexes = [
            models.Index(fields=['lead_status']),
            models.Index(fields=['assigned_to', 'lead_status']),
        ]

class Followup(BaseModel):
    FOLLOWUP_TYPE_CHOICES = (
        ('call', 'Call'),
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('meeting', 'Meeting'),
    )
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('missed', 'Missed'),
        ('rescheduled', 'Rescheduled'),
    )
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="followups")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="followups")
    followup_date = models.DateTimeField()
    followup_type = models.CharField(max_length=50, choices=FOLLOWUP_TYPE_CHOICES, default='call')
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='scheduled')

    def __str__(self):
        return f"Follow-up for Lead {self.lead.lead_number} on {self.followup_date}"

class CustomerInteraction(models.Model):
    INTERACTION_TYPES = (
        ('call', 'Call'),
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('meeting', 'Meeting'),
        ('checkout_attempt', 'Checkout Attempt'),
    )
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interactions")
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name="interactions")
    interaction_type = models.CharField(max_length=50, choices=INTERACTION_TYPES)
    description = models.TextField()
    interaction_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interaction: {self.interaction_type} with {self.customer.username}"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('lead_assigned', 'Lead Assigned'),
        ('followup_due', 'Follow-up Due'),
        ('order_update', 'Order Update'),
        ('stock_alert', 'Low Stock Alert'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification: {self.title} for {self.user.username}"
