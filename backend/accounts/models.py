from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(is_deleted=True, deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="%(class)s_created",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="%(class)s_updated",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        from django.db.models.deletion import Collector
        
        using = using or self._state.db or 'default'
        collector = Collector(using=using)
        collector.collect([self], keep_parents=keep_parents)
        
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('sales', 'Sales Executive'),
        ('inventory', 'Inventory Manager'),
        ('dealer', 'Dealer'),
        ('customer', 'Customer'),
        ('guest', 'Guest'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    role_relation = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class Territory(BaseModel):
    territory_name = models.CharField(max_length=100, unique=True)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    manager_name = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=(('active', 'Active'), ('inactive', 'Inactive')), default='active')

    def __str__(self):
        return f"{self.territory_name} ({self.district}, {self.state})"

    class Meta:
        verbose_name_plural = "territories"

class Customer(BaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_profile")
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')

    def __str__(self):
        return f"Customer: {self.user.username}"

class Dealer(BaseModel):
    STATUS_CHOICES = (
        ('pending_verification', 'Pending Verification'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dealer_profile")
    dealer_code = models.CharField(max_length=50, unique=True)
    business_name = models.CharField(max_length=250)
    owner_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    gst_number = models.CharField(max_length=15, unique=True)
    pan_number = models.CharField(max_length=10, unique=True)
    territory = models.ForeignKey(Territory, on_delete=models.SET_NULL, null=True, blank=True, related_name="dealers")
    commission_rate = models.DecimalField(max_digits=4, decimal_places=2, default=2.00)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_verification')
    approval_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Dealer: {self.business_name} ({self.dealer_code})"

class DealerDocument(BaseModel):
    DOC_TYPES = (
        ('gst_registration', 'GST Registration'),
        ('pan_card', 'PAN Card'),
        ('business_permit', 'Business Permit'),
    )
    VERIFY_STATUS = (
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=50, choices=DOC_TYPES)
    document_file = models.FileField(upload_to='dealer_docs/')
    verification_status = models.CharField(max_length=20, choices=VERIFY_STATUS, default='pending')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_document_type_display()} for {self.dealer.dealer_code}"

import uuid

class OTPVerification(models.Model):
    PURPOSE_CHOICES = (
        ('login', 'Login'),
        ('password_reset', 'Password Reset'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otp_verifications")
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='login')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expired(self):
        return timezone.now() > self.created_at + timezone.timedelta(minutes=5)

    def __str__(self):
        return f"OTP for {self.user.username} - {self.purpose} (Verified: {self.is_verified})"


class Commission(BaseModel):
    PAYOUT_STATUS_CHOICES = (
        ('pending', 'Pending Payout'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    )
    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name="commissions")
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name="commissions")
    sales_amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_percentage = models.DecimalField(max_digits=4, decimal_places=2, default=2.00)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payout_status = models.CharField(max_length=30, choices=PAYOUT_STATUS_CHOICES, default='pending')
    payout_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Commission: ₹{self.commission_amount} for {self.dealer.business_name} on Order {self.order.order_number}"


class DealerPerformance(models.Model):
    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name="performance_metrics")
    month = models.CharField(max_length=7)  # YYYY-MM
    total_orders = models.IntegerField(default=0)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_customers = models.IntegerField(default=0)
    growth_percentage = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('dealer', 'month')

    def __str__(self):
        return f"Performance for {self.dealer.business_name} - {self.month}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender='orders.Order')
def create_dealer_commission_on_delivery(sender, instance, created, **kwargs):
    if instance.order_status == 'delivered':
        dealer = None
        # 1. Check if customer is a dealer themselves
        if instance.customer.role == 'dealer':
            try:
                dealer = instance.customer.dealer_profile
            except Exception:
                pass
        
        # 2. Check if customer's region/territory maps to a dealer
        if not dealer:
            try:
                customer_profile = instance.customer.customer_profile
                territory = Territory.objects.filter(
                    models.Q(district__iexact=customer_profile.city) | 
                    models.Q(state__iexact=customer_profile.state)
                ).first()
                if territory:
                    dealer = Dealer.objects.filter(territory=territory, status='active').first()
            except Exception:
                pass
                
        # 3. Write commission record if active dealer is found
        if dealer and dealer.status == 'active':
            if not Commission.objects.filter(order=instance).exists():
                sales_amount = instance.total_amount
                commission_pct = dealer.commission_rate
                commission_amt = sales_amount * (commission_pct / 100)
                
                Commission.objects.create(
                    dealer=dealer,
                    order=instance,
                    sales_amount=sales_amount,
                    commission_percentage=commission_pct,
                    commission_amount=commission_amt,
                    payout_status='pending'
                )

                # Dynamically update monthly dealer performance
                month_str = timezone.now().strftime("%Y-%m")
                perf, perf_created = DealerPerformance.objects.get_or_create(
                    dealer=dealer,
                    month=month_str
                )
                perf.total_orders += 1
                from decimal import Decimal
                perf.total_sales = Decimal(str(perf.total_sales)) + Decimal(str(sales_amount))
                
                # Simple approximation for unique customers matching this dealer
                from orders.models import Order
                unique_cust = Order.objects.filter(
                    commissions__dealer=dealer,
                    created_at__year=timezone.now().year,
                    created_at__month=timezone.now().month
                ).values('customer').distinct().count()
                perf.total_customers = unique_cust
                perf.save()


