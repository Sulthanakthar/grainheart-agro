from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from .models import Enquiry, Lead, Followup, CustomerInteraction, Notification

User = get_user_model()

class CRMAPITests(APITestCase):
    def setUp(self):
        # Create different roles
        self.customer = User.objects.create_user(
            username="customer_user",
            email="customer@example.com",
            password="Password123!",
            role="customer"
        )
        self.sales_rep1 = User.objects.create_user(
            username="sales_exec1",
            email="sales1@example.com",
            password="Password123!",
            role="sales"
        )
        self.sales_rep2 = User.objects.create_user(
            username="sales_exec2",
            email="sales2@example.com",
            password="Password123!",
            role="sales"
        )
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="Password123!",
            role="admin"
        )

        # Enquiries and Leads URLs
        self.enquiry_list_url = reverse('enquiry_list_create')
        self.lead_list_url = reverse('lead_list')
        self.followup_list_url = reverse('followup_list_create')
        self.interaction_list_url = reverse('interaction_list_create')
        self.notification_list_url = reverse('notification_list')
        self.crm_analytics_url = reverse('crm_analytics')

    def test_anonymous_public_enquiry_submission_generates_lead(self):
        # 1. Anonymous submission for a general contact enquiry
        payload = {
            "customer_name": "John Doe",
            "email": "johndoe@example.com",
            "phone": "+919876543210",
            "enquiry_type": "general",
            "subject": "Need catalog",
            "message": "Please send me the latest healthy grains catalog.",
            "source": "web"
        }
        
        response = self.client.post(self.enquiry_list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('enquiry_number', response.data)
        
        # Verify Enquiry model saved
        enquiry_obj = Enquiry.objects.get(enquiry_number=response.data['enquiry_number'])
        self.assertEqual(enquiry_obj.customer_name, "John Doe")
        self.assertEqual(enquiry_obj.status, "pending")
        
        # Verify corresponding Lead was created via signal
        lead_obj = Lead.objects.get(enquiry=enquiry_obj)
        self.assertEqual(lead_obj.lead_status, "new_lead")
        self.assertEqual(lead_obj.priority, "medium")  # general enquiry -> medium priority

    def test_anonymous_wholesale_enquiry_scales_priority(self):
        # 2. Wholesale enquiry should promote to 'high' priority
        payload = {
            "customer_name": "Suresh Wholesalers",
            "email": "suresh@example.com",
            "phone": "+919999999999",
            "enquiry_type": "wholesale",
            "subject": "Bulk order discount",
            "message": "Looking to purchase 5 tonnes of Sortex Toor Dal.",
            "source": "web"
        }
        
        response = self.client.post(self.enquiry_list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        enquiry_obj = Enquiry.objects.get(enquiry_number=response.data['enquiry_number'])
        lead_obj = Lead.objects.get(enquiry=enquiry_obj)
        self.assertEqual(lead_obj.priority, "high")  # wholesale -> high priority

    def test_enquiry_access_rbac(self):
        # Anonymous GET should fail
        response = self.client.get(self.enquiry_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Customer GET should fail
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.enquiry_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Employee (Sales Rep) GET should succeed
        self.client.force_authenticate(user=self.sales_rep1)
        response = self.client.get(self.enquiry_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_lead_assignment_and_notification(self):
        # Create an enquiry first
        enquiry = Enquiry.objects.create(
            enquiry_number="ENQ-TEST-001",
            customer_name="Alice Smith",
            email="alice@example.com",
            phone="1234567890",
            enquiry_type="dealer",
            subject="Interested in becoming a dealer",
            message="Dealer info required."
        )
        
        lead = Lead.objects.get(enquiry=enquiry)
        lead_detail_url = reverse('lead_detail', kwargs={'pk': lead.pk})
        
        # Customer cannot view or update lead
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(lead_detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Sales Rep can view and update lead
        self.client.force_authenticate(user=self.sales_rep1)
        response = self.client.get(lead_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Update lead (assign to sales_rep2 and set estimates)
        update_data = {
            "assigned_to": self.sales_rep2.id,
            "lead_status": "contacted",
            "priority": "urgent",
            "expected_revenue": "150000.00",
            "conversion_probability": "75.00"
        }
        
        response = self.client.put(lead_detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify DB values updated
        lead.refresh_from_db()
        self.assertEqual(lead.assigned_to, self.sales_rep2)
        self.assertEqual(lead.lead_status, "contacted")
        self.assertEqual(lead.priority, "urgent")
        self.assertEqual(lead.expected_revenue, Decimal("150000.00"))
        self.assertEqual(lead.conversion_probability, Decimal("75.00"))
        
        # Verify notification created for sales_rep2 via signal
        notification = Notification.objects.filter(user=self.sales_rep2).first()
        self.assertIsNotNone(notification)
        self.assertEqual(notification.notification_type, "lead_assigned")
        self.assertIn(lead.lead_number, notification.message)
        
        # Now authenticate as sales_rep2 and read notification
        self.client.force_authenticate(user=self.sales_rep2)
        response = self.client.get(self.notification_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertFalse(response.data['results'][0]['is_read'])
        
        notification_read_url = reverse('notification_read', kwargs={'pk': notification.pk})
        response = self.client.post(notification_read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_read'])

    def test_followup_and_interactions(self):
        # Create Enquiry and Lead
        enquiry = Enquiry.objects.create(
            enquiry_number="ENQ-TEST-002",
            customer_name="Bob Brown",
            email="bob@example.com",
            phone="0987654321",
            enquiry_type="product"
        )
        lead = Lead.objects.get(enquiry=enquiry)
        
        # Authenticate as sales rep
        self.client.force_authenticate(user=self.sales_rep1)
        
        # 1. Schedule a follow-up
        followup_data = {
            "lead": lead.id,
            "assigned_to": self.sales_rep1.id,
            "followup_date": "2026-07-01T10:00:00Z",
            "followup_type": "call",
            "notes": "Discuss initial pricing brochure.",
            "status": "scheduled"
        }
        
        response = self.client.post(self.followup_list_url, followup_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        followup_id = response.data['id']
        followup_detail_url = reverse('followup_detail', kwargs={'pk': followup_id})
        
        # 2. Update follow-up status to completed
        response = self.client.patch(followup_detail_url, {"status": "completed", "notes": "Had call, positive reception."}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'completed')
        
        # 3. Log customer interaction
        interaction_data = {
            "customer": self.customer.id,  # customer profile
            "lead": lead.id,
            "interaction_type": "call",
            "description": "Phone call explaining product catalogs and bulk discounts."
        }
        
        response = self.client.post(self.interaction_list_url, interaction_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['interaction_type'], 'call')

    def test_crm_analytics(self):
        # Create mock data
        e1 = Enquiry.objects.create(enquiry_number="ENQ-A", customer_name="User A", email="a@a.com", phone="123", enquiry_type="wholesale")
        e2 = Enquiry.objects.create(enquiry_number="ENQ-B", customer_name="User B", email="b@b.com", phone="456", enquiry_type="general")
        
        lead1 = Lead.objects.get(enquiry=e1)
        lead2 = Lead.objects.get(enquiry=e2)
        
        # Update details
        lead1.assigned_to = self.sales_rep1
        lead1.lead_status = "converted"
        lead1.expected_revenue = Decimal("50000.00")
        lead1.save()
        
        lead2.assigned_to = self.sales_rep1
        lead2.lead_status = "negotiation"
        lead2.expected_revenue = Decimal("25000.00")
        lead2.save()
        
        # Retrieve CRM Analytics
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.crm_analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(response.data['total_leads'], 2)
        self.assertEqual(float(response.data['expected_revenue']), 75000.00)
        self.assertEqual(response.data['conversion_rate'], 50.0)  # 1 out of 2 converted -> 50%
        
        # Sales Rep Performance
        rep_perf = response.data['sales_rep_performance']
        sales_rep1_perf = next(item for item in rep_perf if item["username"] == self.sales_rep1.username)
        self.assertEqual(sales_rep1_perf['assigned_leads'], 2)
        self.assertEqual(sales_rep1_perf['converted_leads'], 1)
        self.assertEqual(sales_rep1_perf['conversion_rate'], 50.0)
