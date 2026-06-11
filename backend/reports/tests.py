import os
from django.urls import reverse
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, timedelta
from django.core.signing import TimestampSigner
from .models import Report
from products.models import Category, QualityGrade, Product
from inventory.models import Inventory
from orders.models import Order
from crm.models import Lead

User = get_user_model()

class ReportsAndDashboardAPITests(APITestCase):
    def setUp(self):
        # Create user accounts with roles
        self.admin = User.objects.create_user(
            username="admin_user", email="admin@test.com", password="Password123!", role="admin"
        )
        self.sales = User.objects.create_user(
            username="sales_user", email="sales@test.com", password="Password123!", role="sales"
        )
        self.inventory_mgr = User.objects.create_user(
            username="inventory_user", email="inventory@test.com", password="Password123!", role="inventory"
        )
        self.customer = User.objects.create_user(
            username="customer_user", email="customer@test.com", password="Password123!", role="customer"
        )

        # Setup mock products and categories for analytics/dashboards
        self.cat = Category.objects.create(name="Wheat", slug="wheat")
        self.grade = QualityGrade.objects.create(name="Premium", priority=1)
        self.product = Product.objects.create(
            category=self.cat,
            quality_grade=self.grade,
            name="Premium Wheat Flour",
            price=150.00,
            stock=100,
            sku="WF-PREM-001",
            weight=10.00
        )
        
        # Update Inventory mapping auto-created by signals
        self.inv = Inventory.objects.get(product=self.product)
        self.inv.available_stock = 80
        self.inv.reserved_stock = 10
        self.inv.reorder_level = 15
        self.inv.save()

        # Setup URLs
        self.executive_dashboard_url = reverse('dashboard_executive')
        self.sales_dashboard_url = reverse('dashboard_sales')
        self.inventory_dashboard_url = reverse('dashboard_inventory')
        self.crm_dashboard_url = reverse('dashboard_crm')
        self.dealers_dashboard_url = reverse('dashboard_dealers')
        self.customers_dashboard_url = reverse('dashboard_customers')
        
        self.report_list_url = reverse('report_list_create')
        
        self.analytics_revenue_url = reverse('analytics_revenue')
        self.analytics_orders_url = reverse('analytics_orders')
        self.analytics_inventory_url = reverse('analytics_inventory')

        # List of created test report files to delete during tearDown
        self.test_files = []

    def tearDown(self):
        # Clean up any generated Excel files
        for filename in self.test_files:
            filepath = os.path.join(settings.MEDIA_ROOT, filename)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except OSError:
                    pass

    def test_dashboard_executive_rbac(self):
        # Anonymous fails
        response = self.client.get(self.executive_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Customer fails (403)
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.executive_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Sales Exec fails (403)
        self.client.force_authenticate(user=self.sales)
        response = self.client.get(self.executive_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin succeeds (200)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.executive_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('total_profit', response.data)

    def test_dashboard_sales_rbac(self):
        # Customer fails
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.sales_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Sales succeeds
        self.client.force_authenticate(user=self.sales)
        response = self.client.get(self.sales_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_orders', response.data)
        self.assertIn('completed_sales', response.data)

        # Admin succeeds
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.sales_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_dashboard_inventory_rbac(self):
        self.client.force_authenticate(user=self.sales)
        response = self.client.get(self.inventory_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.inventory_mgr)
        response = self.client.get(self.inventory_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('low_stock_products_count', response.data)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.inventory_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_report_generation_date_safety_checks(self):
        self.client.force_authenticate(user=self.sales)

        # Exceeds 365 days range -> 400 Bad Request
        payload = {
            "report_type": "sales",
            "start_date": "2025-01-01",
            "end_date": "2026-03-01"  # > 1 year
        }
        response = self.client.post(self.report_list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertTrue(any("365 days" in err for err in response.data["non_field_errors"]))

        # End date before start date -> 400 Bad Request
        payload = {
            "report_type": "sales",
            "start_date": "2026-06-01",
            "end_date": "2026-05-01"
        }
        response = self.client.post(self.report_list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_report_generation_and_signed_download(self):
        self.client.force_authenticate(user=self.sales)

        # 1. Trigger report generation
        payload = {
            "report_type": "sales",
            "start_date": "2026-06-01",
            "end_date": "2026-06-10"
        }
        response = self.client.post(self.report_list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        report_id = response.data['id']
        download_url = response.data['download_url']
        file_path = response.data['file_path']
        self.test_files.append(file_path)

        # 2. Download with correct signature -> 200 OK
        response = self.client.get(download_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        # 3. Download with missing signature -> 403 Forbidden
        base_download_url = reverse('report_download', kwargs={'pk': report_id})
        response = self.client.get(base_download_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 4. Download with tampered signature -> 403 Forbidden
        tampered_url = f"{base_download_url}?signature=tampered_sig_data"
        response = self.client.get(tampered_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_analytics_streams(self):
        self.client.force_authenticate(user=self.sales)

        # Revenue Stream
        response = self.client.get(self.analytics_revenue_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Orders Status Stream
        response = self.client.get(self.analytics_orders_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Inventory Value Stream
        response = self.client.get(self.analytics_inventory_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_stock_value', response.data)
