from django.test import TestCase
from products.models import Category, QualityGrade, Product
from inventory.models import Inventory

class InventoryModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Pulses", slug="pulses")
        self.quality = QualityGrade.objects.create(name="High Sortex", priority=1)
        self.product = Product.objects.create(
            category=self.category,
            quality_grade=self.quality,
            name="Premium Toor Dal",
            slug="premium-toor-dal",
            price=120.00,
            stock=100,
            sku="TD-PREM-001",
            weight=1.00
        )
        self.inventory = Inventory.objects.create(
            product=self.product,
            available_stock=100,
            reserved_stock=10,
            reorder_level=15
        )

    def test_inventory_details(self):
        self.assertEqual(self.inventory.product, self.product)
        self.assertEqual(self.product.inventory, self.inventory)
        self.assertEqual(self.inventory.available_stock, 100)

