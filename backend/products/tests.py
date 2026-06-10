from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.db.models import ProtectedError
from rest_framework.test import APITestCase
from rest_framework import status
from products.models import Category, QualityGrade, Product, Review, Wishlist
from inventory.models import Inventory

User = get_user_model()

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


class ProductCatalogueAPITests(APITestCase):
    def setUp(self):
        self.category_list_url = reverse('category_list_create')
        self.product_list_url = reverse('product_list_create')
        self.wishlist_url = reverse('wishlist_list_create')

        # Create base Category and Quality Grade
        self.category_pulses = Category.objects.create(
            name="Pulses", slug="pulses", description="Lentils and beans"
        )
        self.category_wheat = Category.objects.create(
            name="Wheat", slug="wheat", description="Wheat varieties"
        )
        self.grade_premium = QualityGrade.objects.create(
            name="High Sortex", priority=1, description="Premium quality"
        )
        self.grade_economy = QualityGrade.objects.create(
            name="Fine Quality", priority=3, description="Economy quality"
        )

        # Create Products
        self.product1 = Product.objects.create(
            category=self.category_pulses,
            quality_grade=self.grade_premium,
            name="Premium Toor Dal",
            slug="premium-toor-dal",
            price=120.00,
            stock=150,
            sku="TD-PREM-001",
            weight=1.00,
            is_featured=True,
            is_active=True
        )
        self.product2 = Product.objects.create(
            category=self.category_wheat,
            quality_grade=self.grade_economy,
            name="Economy Wheat Flour",
            slug="economy-wheat-flour",
            price=45.00,
            stock=200,
            sku="WF-ECON-002",
            weight=5.00,
            is_featured=False,
            is_active=True
        )

        # Users
        self.admin_user = User.objects.create_user(
            username='adminuser', email='admin@example.com', password='Password123!', role='admin'
        )
        self.customer_user = User.objects.create_user(
            username='customeruser', email='customer@example.com', password='Password123!', role='customer'
        )

    def test_public_browsing(self):
        # Retrieve categories publicly
        response = self.client.get(self.category_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

        # Retrieve products publicly
        response = self.client.get(self.product_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_product_detail(self):
        url = reverse('product_detail', kwargs={'slug': self.product1.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Premium Toor Dal")
        self.assertEqual(response.data['available_stock'], 150)  # Verify Inventory sync

    def test_product_filtering(self):
        # Filter by Category slug
        response = self.client.get(self.product_list_url, {'category': 'pulses'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], self.product1.slug)

        # Filter by Quality Grade Priority
        response = self.client.get(self.product_list_url, {'quality_grade': 3})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], self.product2.slug)

        # Filter by Featured
        response = self.client.get(self.product_list_url, {'is_featured': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], self.product1.slug)

    def test_product_search(self):
        # Search by keyword
        response = self.client.get(self.product_list_url, {'q': 'Wheat'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['slug'], self.product2.slug)

    def test_product_creation_rbac(self):
        data = {
            'category': self.category_pulses.id,
            'quality_grade': self.grade_premium.id,
            'name': 'Organic Chana Dal',
            'price': 140.00,
            'stock': 80,
            'sku': 'CD-ORG-003',
            'weight': 1.00
        }
        # Check that customer cannot create product
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.post(self.product_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Check that admin can create product
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.product_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Product.objects.filter(sku='CD-ORG-003').exists())

        # Verify inventory record is automatically created due to signals
        new_prod = Product.objects.get(sku='CD-ORG-003')
        self.assertTrue(Inventory.objects.filter(product=new_prod).exists())
        self.assertEqual(new_prod.inventory.available_stock, 80)

    def test_review_system(self):
        reviews_url = reverse('product_reviews', kwargs={'slug': self.product1.slug})

        # Get reviews (currently empty)
        response = self.client.get(reviews_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        # Submit review
        review_data = {
            'rating': 5,
            'review': 'Excellent sorting and great quality.'
        }
        # Anonymous fails
        response = self.client.post(reviews_url, review_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Customer succeeds
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.post(reviews_url, review_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)

        # Duplicate fails
        response = self.client.post(reviews_url, review_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify rating constraint validation
        bad_review_data = {'rating': 6, 'review': 'Too high'}
        bad_reviews_url = reverse('product_reviews', kwargs={'slug': self.product2.slug})
        response = self.client.post(bad_reviews_url, bad_review_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_wishlist_flow(self):
        # 1. Access without login should fail
        response = self.client.get(self.wishlist_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticate
        self.client.force_authenticate(user=self.customer_user)

        # 2. Add product to wishlist
        response = self.client.post(self.wishlist_url, {'product': self.product1.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['product'], self.product1.id)

        # 3. Add same product again should fail (uniqueness validation)
        response = self.client.post(self.wishlist_url, {'product': self.product1.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. List wishlist items
        response = self.client.get(self.wishlist_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

        # 5. Remove product from wishlist
        destroy_url = reverse('wishlist_destroy', kwargs={'product_slug': self.product1.slug})
        response = self.client.delete(destroy_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 6. Verify wishlist is empty in DB
        self.assertFalse(Wishlist.objects.filter(customer=self.customer_user, product=self.product1).exists())
