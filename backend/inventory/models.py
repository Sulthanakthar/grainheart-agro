from django.db import models
from accounts.models import BaseModel
from products.models import Product

class Inventory(BaseModel):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="inventory")
    available_stock = models.IntegerField(default=0)
    reserved_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)  # low-stock threshold alert

    def __str__(self):
        return f"Inventory for {self.product.name} (Available: {self.available_stock})"

    class Meta:
        verbose_name_plural = "inventories"
        indexes = [
            models.Index(fields=['product']),
        ]
