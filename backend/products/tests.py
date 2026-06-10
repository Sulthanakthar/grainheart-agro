from django.test import TestCase
from products.models import Category, QualityGrade, Product
from django.db.models import ProtectedError

class ProductSoftDeleteTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Pulses",
            slug="pulses",
            description="All pulses and dals"
        )
        self.quality = QualityGrade.objects.create(
            name="High Sortex",
            priority=1,
            description="Premium quality"
        )
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

    def test_product_soft_delete(self):
        # 1. Active count should be 1
        self.assertEqual(Product.objects.count(), 1)
        
        # 2. Soft-delete the product
        self.product.delete()
        
        # 3. Active count should now be 0 (Soft delete manager filters it out)
        self.assertEqual(Product.objects.count(), 0)
        
        # 4. Inactive check (retains records in database)
        db_product = Product.all_objects.get(id=self.product.id)
        self.assertTrue(db_product.is_deleted)
        self.assertIsNotNone(db_product.deleted_at)

    def test_category_protection(self):
        # Category cannot be deleted if it has products linked to it (PROTECT)
        with self.assertRaises(ProtectedError):
            self.category.delete()

