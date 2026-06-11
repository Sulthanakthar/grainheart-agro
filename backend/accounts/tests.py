from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import Customer, Dealer, OTPVerification, Territory, Commission
from accounts.permissions import IsAdminRole, IsSalesRole, IsInventoryRole, IsDealerRole, IsCustomerRole, IsEmployee
from products.models import Category, QualityGrade, Product

User = get_user_model()

class CustomUserTests(TestCase):
    def test_create_user_with_default_role(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.assertEqual(user.role, 'customer')
        self.assertEqual(str(user), 'testuser (Customer)')

    def test_create_user_with_custom_role(self):
        user = User.objects.create_user(
            username='salesexec',
            email='sales@example.com',
            password='testpassword123',
            role='sales'
        )
        self.assertEqual(user.role, 'sales')
        self.assertEqual(str(user), 'salesexec (Sales Executive)')

class HealthCheckTests(TestCase):
    def test_health_check_endpoint(self):
        url = reverse('health_check')
        response = self.client.get(url)
        # Redis check might fail in test environments (which is okay, returning 500)
        self.assertIn(response.status_code, [200, 500])
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('database', data['services'])
        self.assertIn('redis', data['services'])


class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.register_dealer_url = reverse('auth_register_dealer')
        self.login_url = reverse('auth_login')
        self.verify_otp_url = reverse('auth_verify_otp')
        self.logout_url = reverse('auth_logout')
        self.password_reset_url = reverse('auth_password_reset_request')
        self.password_reset_confirm_url = reverse('auth_password_reset_confirm')
        self.profile_url = reverse('user_profile')

        # Create a default user for testing login
        self.user_password = 'Password123!'
        self.test_user = User.objects.create_user(
            username='authuser',
            email='authuser@example.com',
            password=self.user_password,
            role='customer'
        )
        # Create profile for the user
        self.customer_profile = Customer.objects.create(
            user=self.test_user,
            phone='1234567890',
            address='123 Main St',
            city='Bangalore',
            state='Karnataka',
            country='India'
        )

    def test_customer_registration_success(self):
        data = {
            'username': 'newcustomer',
            'email': 'newcustomer@example.com',
            'password': 'StrongPassword123!',
            'phone': '9876543210',
            'address': '456 Grain Way',
            'city': 'Chennai',
            'state': 'Tamil Nadu',
            'country': 'India'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['username'], 'newcustomer')
        
        # Verify database
        user = User.objects.get(username='newcustomer')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(Customer.objects.filter(user=user).exists())

    def test_customer_registration_invalid_password(self):
        data = {
            'username': 'badpwuser',
            'email': 'badpwuser@example.com',
            'password': '123',  # too short
            'phone': '9876543210',
            'address': '456 Grain Way',
            'city': 'Chennai',
            'state': 'Tamil Nadu'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_dealer_registration_success(self):
        data = {
            'username': 'dealer1',
            'password': 'StrongPassword123!',
            'business_name': 'Grains Corp',
            'owner_name': 'John Doe',
            'phone': '9999999999',
            'email': 'dealer1@example.com',
            'gst_number': '12ABCDE1234F1Z1',  # 15 chars
            'pan_number': 'ABCDE1234F'  # 10 chars
        }
        response = self.client.post(self.register_dealer_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['dealer']['business_name'], 'Grains Corp')
        self.assertEqual(response.data['dealer']['status'], 'pending_verification')

        # Verify database
        user = User.objects.get(username='dealer1')
        self.assertEqual(user.role, 'dealer')
        dealer = Dealer.objects.get(user=user)
        self.assertEqual(dealer.status, 'pending_verification')
        self.assertTrue(dealer.dealer_code.startswith('DL-'))

    def test_two_step_otp_login_flow(self):
        # Step 1: Login with credentials
        login_data = {
            'username': 'authuser',
            'password': self.user_password
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('session_id', response.data)
        
        session_id = response.data['session_id']
        
        # Verify OTP created in DB
        otp_entry = OTPVerification.objects.get(session_id=session_id)
        self.assertEqual(otp_entry.user, self.test_user)
        self.assertEqual(otp_entry.purpose, 'login')
        self.assertFalse(otp_entry.is_verified)

        # Step 2: Verify OTP
        otp_data = {
            'session_id': session_id,
            'otp_code': otp_entry.otp_code
        }
        response = self.client.post(self.verify_otp_url, otp_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'authuser')

        # Verify OTP marked as verified in DB
        otp_entry.refresh_from_db()
        self.assertTrue(otp_entry.is_verified)

    def test_login_invalid_credentials(self):
        login_data = {
            'username': 'authuser',
            'password': 'WrongPassword'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_otp_expired(self):
        # Create pre-expired OTP
        otp_entry = OTPVerification.objects.create(
            user=self.test_user,
            otp_code='111111',
            purpose='login'
        )
        # Shift created_at back by 6 minutes
        otp_entry.created_at = timezone.now() - timezone.timedelta(minutes=6)
        otp_entry.save()

        otp_data = {
            'session_id': str(otp_entry.session_id),
            'otp_code': '111111'
        }
        response = self.client.post(self.verify_otp_url, otp_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_password_reset_flow(self):
        # Step 1: Request Password Reset
        reset_request_data = {
            'email': 'authuser@example.com'
        }
        response = self.client.post(self.password_reset_url, reset_request_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('session_id', response.data)
        
        session_id = response.data['session_id']
        
        # Verify OTP created in DB
        otp_entry = OTPVerification.objects.get(session_id=session_id, purpose='password_reset')
        
        # Step 2: Confirm Password Reset
        reset_confirm_data = {
            'session_id': session_id,
            'otp_code': otp_entry.otp_code,
            'new_password': 'NewSecurePassword123!'
        }
        response = self.client.post(self.password_reset_confirm_url, reset_confirm_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Step 3: Login with new password
        login_data = {
            'username': 'authuser',
            'password': 'NewSecurePassword123!'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_profile_endpoints(self):
        # Verify access denied without token
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticate user
        self.client.force_authenticate(user=self.test_user)

        # GET Profile
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '1234567890')

        # PUT Profile Update
        update_data = {
            'phone': '5555555555',
            'city': 'Mysore'
        }
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '5555555555')
        self.assertEqual(response.data['city'], 'Mysore')

        # Verify in DB
        self.customer_profile.refresh_from_db()
        self.assertEqual(self.customer_profile.phone, '5555555555')

    def test_logout_blacklists_token(self):
        # Login and get tokens
        login_data = {
            'username': 'authuser',
            'password': self.user_password
        }
        response_login = self.client.post(self.login_url, login_data)
        session_id = response_login.data['session_id']
        otp_entry = OTPVerification.objects.get(session_id=session_id)
        
        response_verify = self.client.post(self.verify_otp_url, {
            'session_id': session_id,
            'otp_code': otp_entry.otp_code
        })
        access_token = response_verify.data['access']
        refresh_token = response_verify.data['refresh']

        # Call logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response_logout = self.client.post(self.logout_url, {'refresh': refresh_token})
        self.assertEqual(response_logout.status_code, status.HTTP_200_OK)

        # Try to use refresh token to get new access token (should fail since it is blacklisted)
        refresh_url = reverse('auth_token_refresh')
        response_refresh = self.client.post(refresh_url, {'refresh': refresh_token})
        self.assertEqual(response_refresh.status_code, status.HTTP_401_UNAUTHORIZED)


class RBACPermissionsTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(username='admin', email='a@a.com', password='pw', role='admin')
        self.sales_user = User.objects.create_user(username='sales', email='s@s.com', password='pw', role='sales')
        self.inventory_user = User.objects.create_user(username='inventory', email='i@i.com', password='pw', role='inventory')
        self.dealer_user = User.objects.create_user(username='dealer', email='d@d.com', password='pw', role='dealer')
        self.customer_user = User.objects.create_user(username='customer', email='c@c.com', password='pw', role='customer')
        self.guest_user = User.objects.create_user(username='guest', email='g@g.com', password='pw', role='guest')

        # Dummy view request mock class
        class DummyRequest:
            def __init__(self, user):
                self.user = user

        self.DummyRequest = DummyRequest

    def test_is_admin_role(self):
        perm = IsAdminRole()
        self.assertTrue(perm.has_permission(self.DummyRequest(self.admin_user), None))
        self.assertFalse(perm.has_permission(self.DummyRequest(self.sales_user), None))
        self.assertFalse(perm.has_permission(self.DummyRequest(self.customer_user), None))

    def test_is_sales_role(self):
        perm = IsSalesRole()
        self.assertTrue(perm.has_permission(self.DummyRequest(self.sales_user), None))
        self.assertFalse(perm.has_permission(self.DummyRequest(self.admin_user), None))

    def test_is_inventory_role(self):
        perm = IsInventoryRole()
        self.assertTrue(perm.has_permission(self.DummyRequest(self.inventory_user), None))
        self.assertFalse(perm.has_permission(self.DummyRequest(self.dealer_user), None))

    def test_is_dealer_role(self):
        perm = IsDealerRole()
        self.assertTrue(perm.has_permission(self.DummyRequest(self.dealer_user), None))
        self.assertFalse(perm.has_permission(self.DummyRequest(self.customer_user), None))

    def test_is_customer_role(self):
        perm = IsCustomerRole()
        self.assertTrue(perm.has_permission(self.DummyRequest(self.customer_user), None))
        self.assertFalse(perm.has_permission(self.DummyRequest(self.guest_user), None))

    def test_is_employee_role(self):
        perm = IsEmployee()
        self.assertTrue(perm.has_permission(self.DummyRequest(self.admin_user), None))
        self.assertTrue(perm.has_permission(self.DummyRequest(self.sales_user), None))
        self.assertTrue(perm.has_permission(self.DummyRequest(self.inventory_user), None))
        self.assertFalse(perm.has_permission(self.DummyRequest(self.dealer_user), None))
        self.assertFalse(perm.has_permission(self.DummyRequest(self.customer_user), None))


class DealerManagementAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', email='a@a.com', password='Password123!', role='admin')
        self.customer = User.objects.create_user(username='cust', email='c@c.com', password='Password123!', role='customer')
        self.dealer_user = User.objects.create_user(username='dlr', email='d@d.com', password='Password123!', role='dealer')
        
        self.territory = Territory.objects.create(territory_name="Malleswaram", district="Bangalore", state="Karnataka")
        
        self.dealer = Dealer.objects.create(
            user=self.dealer_user,
            dealer_code="DL-TEST1234",
            business_name="Test Dealer Grains",
            owner_name="Owner Joe",
            phone="9000000000",
            email="d@d.com",
            gst_number="29ABCDE1234F1Z5",
            pan_number="ABCDE1234E",
            territory=self.territory,
            commission_rate=5.00,
            status="pending_verification"
        )
        
        self.territory_list_url = reverse('territory_list_create')
        self.dealer_list_url = reverse('dealer_list')
        self.dealer_approve_url = reverse('dealer_approve', kwargs={'pk': self.dealer.pk})
        self.doc_upload_url = reverse('dealer_document_upload')
        self.commission_list_url = reverse('commission_list')
        self.analytics_url = reverse('dealer_analytics')

    def test_territory_crud_rbac(self):
        # Customer fails
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(self.territory_list_url, {
            'territory_name': 'Jayanagar', 'district': 'Bangalore', 'state': 'Karnataka'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin succeeds
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.territory_list_url, {
            'territory_name': 'Jayanagar', 'district': 'Bangalore', 'state': 'Karnataka'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Territory.objects.filter(territory_name='Jayanagar').exists())

    def test_dealer_onboarding_approval(self):
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.post(self.dealer_approve_url, {
            'status': 'active', 'commission_rate': 4.50
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.dealer.refresh_from_db()
        self.assertEqual(self.dealer.status, 'active')
        self.assertEqual(float(self.dealer.commission_rate), 4.50)
        self.assertIsNotNone(self.dealer.approval_date)
        
        self.dealer_user.refresh_from_db()
        self.assertTrue(self.dealer_user.is_active)

    def test_dealer_document_verification(self):
        self.client.force_authenticate(user=self.dealer_user)
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        temp_file = SimpleUploadedFile("gst.pdf", b"pdfcontent", content_type="application/pdf")
        response = self.client.post(self.doc_upload_url, {
            'document_type': 'gst_registration',
            'document_file': temp_file
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        doc_id = response.data['id']
        
        self.client.force_authenticate(user=self.admin)
        verify_url = reverse('dealer_document_verify', kwargs={'pk': doc_id})
        response = self.client.post(verify_url, {'status': 'verified'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['verification_status'], 'verified')

    def test_commission_ledger_analytics_and_signals(self):
        # 1. Activate Dealer
        self.dealer.status = 'active'
        self.dealer.save()

        # Create Category, QualityGrade, and Product
        category = Category.objects.create(name="Grains", slug="grains")
        grade = QualityGrade.objects.create(name="Sortex", priority=2)
        product = Product.objects.create(
            category=category, quality_grade=grade, name="Wheat", price=100.00, stock=500, sku="WH-TEST", weight=1.00
        )

        # 2. Setup Customer matching territory state/district
        Customer.objects.create(
            user=self.customer, phone="99", address="456 Main", city="Bangalore", state="Karnataka"
        )
        
        # Place order
        self.client.force_authenticate(user=self.customer)
        self.client.post(reverse('cart_add_item'), {'product': product.id, 'quantity': 10})
        checkout_res = self.client.post(reverse('order_create'), {'delivery_address': 'Bangalore', 'payment_method': 'cash'})
        order_number = checkout_res.data['order_number']

        # 3. Transition order status to delivered to trigger signal
        self.client.force_authenticate(user=self.admin)
        status_url = reverse('order_status_update', kwargs={'order_number': order_number})
        response = self.client.put(status_url, {'order_status': 'delivered'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 4. Verify Commission and Performance created
        self.assertTrue(Commission.objects.filter(order__order_number=order_number).exists())
        commission = Commission.objects.get(order__order_number=order_number)
        self.assertEqual(commission.dealer, self.dealer)
        self.assertEqual(float(commission.commission_amount), 1050.00 * 0.05)

        # 5. Check Payout
        payout_url = reverse('commission_payout', kwargs={'pk': commission.pk})
        response = self.client.post(payout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        commission.refresh_from_db()
        self.assertEqual(commission.payout_status, 'paid')

        # 6. Verify Analytics
        # Dealer analytics
        self.client.force_authenticate(user=self.dealer_user)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['mode'], 'dealer')
        self.assertEqual(float(response.data['summary']['total_sales']), 1050.00)
        self.assertEqual(float(response.data['summary']['paid_payout']), 52.50)

        # Admin analytics
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['mode'], 'global')

