from django.db import models
from django.conf import settings
from accounts.models import BaseModel

class Category(BaseModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "categories"

class QualityGrade(BaseModel):
    name = models.CharField(max_length=100)
    priority = models.IntegerField(default=1)  # 1 Premium, 2 Standard Premium, 3 Economy
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} (Priority: {self.priority})"

class Product(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    quality_grade = models.ForeignKey(QualityGrade, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True)
    short_description = models.TextField(blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    sku = models.CharField(max_length=50, unique=True)
    weight = models.DecimalField(max_digits=8, decimal_places=2)  # in kg
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.quality_grade.name}"

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['sku']),
            models.Index(fields=['category', 'quality_grade']),
        ]

class ProductImage(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="gallery")
    image = models.ImageField(upload_to='product_gallery/')
    alt_text = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Gallery image for {self.product.name}"

class Wishlist(BaseModel):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")

    class Meta:
        unique_together = ('customer', 'product')

    def __str__(self):
        return f"{self.customer.username} wants {self.product.name}"

class Review(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    rating = models.IntegerField(default=5)  # 1 to 5
    review = models.TextField(blank=True)

    def __str__(self):
        return f"Review by {self.customer.username} on {self.product.name} ({self.rating}/5)"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Product)
def create_or_update_product_inventory(sender, instance, created, **kwargs):
    from inventory.models import Inventory
    # Create or update Inventory record
    inventory, created_inv = Inventory.objects.get_or_create(
        product=instance,
        defaults={'available_stock': instance.stock}
    )
    if not created_inv and inventory.available_stock != instance.stock:
        inventory.available_stock = instance.stock
        inventory.save()


class SEOMetadata(models.Model):
    path = models.CharField(max_length=255, unique=True, db_index=True)
    meta_title = models.CharField(max_length=255)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    og_title = models.CharField(max_length=255, blank=True)
    og_description = models.TextField(blank=True)
    og_image = models.CharField(max_length=255, blank=True)
    canonical_url = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SEO: {self.path}"

    class Meta:
        verbose_name_plural = "SEO Metadata"


