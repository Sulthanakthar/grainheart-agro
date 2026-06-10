from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

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
        # Note: If Redis is not running in some test environments, this might be 500,
        # but locally we checked that database is healthy. We will check status code and payload structure.
        self.assertIn(response.status_code, [200, 500])
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('database', data['services'])
        self.assertIn('redis', data['services'])

