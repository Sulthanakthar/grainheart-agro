import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils import timezone
from products.models import Category, QualityGrade, Product
from accounts.models import Territory, Customer, Dealer
from inventory.models import Inventory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with default categories, quality grades, products, territories, and test users.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. Create or get test users
        self.stdout.write('Creating users...')
        
        # Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@healthygrains.com',
                'first_name': 'Admin',
                'last_name': 'Manager',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Admin user created (admin / admin123)'))

        # Sales Rep
        sales_user, created = User.objects.get_or_create(
            username='sales_user',
            defaults={
                'email': 'sales@healthygrains.com',
                'first_name': 'Sales',
                'last_name': 'Executive',
                'role': 'sales',
                'is_staff': True
            }
        )
        if created:
            sales_user.set_password('sales123')
            sales_user.save()
            self.stdout.write(self.style.SUCCESS('Sales user created (sales_user / sales123)'))

        # Customer User
        cust_user, created = User.objects.get_or_create(
            username='customer_user',
            defaults={
                'email': 'customer@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'role': 'customer'
            }
        )
        if created:
            cust_user.set_password('customer123')
            cust_user.save()
            Customer.objects.create(
                user=cust_user,
                phone='9898989898',
                address='123 Green Street, Camp',
                city='Tirupattur',
                state='Tamil Nadu',
                country='India'
            )
            self.stdout.write(self.style.SUCCESS('Customer user created (customer_user / customer123)'))

        # Dealer User
        dealer_user, created = User.objects.get_or_create(
            username='dealer_user',
            defaults={
                'email': 'dealer@example.com',
                'first_name': 'Mohan',
                'last_name': 'Lal',
                'role': 'dealer'
            }
        )
        
        # 2. Create Territories
        self.stdout.write('Creating territories...')
        t_north, _ = Territory.objects.get_or_create(
            territory_name='Tirupattur North',
            defaults={'district': 'Tirupattur', 'state': 'Tamil Nadu', 'manager_name': 'Sales Mgr North'}
        )
        t_south, _ = Territory.objects.get_or_create(
            territory_name='Tirupattur South',
            defaults={'district': 'Tirupattur', 'state': 'Tamil Nadu', 'manager_name': 'Sales Mgr South'}
        )
        t_east, _ = Territory.objects.get_or_create(
            territory_name='Tirupattur East',
            defaults={'district': 'Tirupattur', 'state': 'Tamil Nadu', 'manager_name': 'Sales Mgr East'}
        )
        t_west, _ = Territory.objects.get_or_create(
            territory_name='Tirupattur West',
            defaults={'district': 'Tirupattur', 'state': 'Tamil Nadu', 'manager_name': 'Sales Mgr West'}
        )
        self.stdout.write(self.style.SUCCESS('Territories seeded.'))

        # Create Dealer Profile if user created
        if created:
            dealer_user.set_password('dealer123')
            dealer_user.save()
            Dealer.objects.create(
                user=dealer_user,
                dealer_code='DL-TIRU-001',
                business_name='Mohan Grain Distributors',
                owner_name='Mohan Lal',
                phone='9988776655',
                email='mohan.grains@example.com',
                gst_number='27AAAAA1111A1Z1',
                pan_number='ABCDE1234F',
                territory=t_north,
                commission_rate=3.50,
                status='active',
                approval_date=timezone.now()
            )
            self.stdout.write(self.style.SUCCESS('Dealer user created (dealer_user / dealer123)'))

        # 3. Create Categories
        self.stdout.write('Creating categories...')
        cat_pulses, _ = Category.objects.get_or_create(
            name='Pulses',
            defaults={'slug': 'pulses', 'description': 'Premium Sortex Quality Pulses and Lentils', 'status': 'active'}
        )
        cat_wheat, _ = Category.objects.get_or_create(
            name='Wheat',
            defaults={'slug': 'wheat', 'description': 'Premium Sortex Quality Wheat and Flour', 'status': 'active'}
        )

        # 4. Create Quality Grades
        self.stdout.write('Creating quality grades...')
        g_high_sortex, _ = QualityGrade.objects.get_or_create(
            name='High Sortex',
            defaults={'priority': 1, 'description': '100% Sortex Cleaned and Polished'}
        )
        g_sortex, _ = QualityGrade.objects.get_or_create(
            name='Sortex',
            defaults={'priority': 2, 'description': 'Standard Sortex Quality'}
        )
        g_fine, _ = QualityGrade.objects.get_or_create(
            name='Fine Quality',
            defaults={'priority': 3, 'description': 'Regular Double Cleaned Grains'}
        )

        # 5. Create Products
        self.stdout.write('Creating products...')
        
        products_to_seed = [
            {
                'category': cat_pulses,
                'quality_grade': g_high_sortex,
                'name': 'Toor Dal (Pigeon Peas)',
                'price': 165.00,
                'stock': 500,
                'sku': 'TD-HS-001',
                'weight': 1.00,
                'short_description': 'Premium quality protein-rich pulses, perfectly polished and sortex cleaned.',
                'description': 'Our Toor Dal is sourced from the finest farms in Maharashtra. Using state-of-the-art Sortex cleaning tech, we ensure each grain is uniform, impurity-free, and retains maximum nutritional value. High in protein, fiber, and delicious in taste.',
                'is_featured': True
            },
            {
                'category': cat_pulses,
                'quality_grade': g_sortex,
                'name': 'Chana Dal (Bengal Gram)',
                'price': 95.00,
                'stock': 400,
                'sku': 'CD-S-002',
                'weight': 1.00,
                'short_description': 'Farm-fresh yellow lentils, rich in fiber and taste. Best for authentic dishes.',
                'description': 'Premium quality Chana Dal, processed under hygienic conditions to preserve its natural nutrients and rich flavor. Ideal for preparing traditional dals, snacks, and sweet dishes.',
                'is_featured': False
            },
            {
                'category': cat_pulses,
                'quality_grade': g_fine,
                'name': 'Moong Dal (Yellow Moong)',
                'price': 120.00,
                'stock': 350,
                'sku': 'MD-FQ-003',
                'weight': 1.00,
                'short_description': 'Easy-to-digest yellow lentils. Triple-cleaned for maximum purity.',
                'description': 'Nutritious yellow Moong Dal that cooks quickly and is easy to digest. Perfectly split and cleaned, it is ideal for khichdi, dals, and soups.',
                'is_featured': True
            },
            {
                'category': cat_pulses,
                'quality_grade': g_high_sortex,
                'name': 'Urad Dal (Black Gram)',
                'price': 145.00,
                'stock': 300,
                'sku': 'UD-HS-004',
                'weight': 1.00,
                'short_description': 'Superior quality black gram, ideal for idli and dosa batter.',
                'description': 'Hygienically processed white split Urad Dal, free from foreign particles. Perfect for making soft, fluffy idlis and crisp dosas.',
                'is_featured': False
            },
            {
                'category': cat_wheat,
                'quality_grade': g_high_sortex,
                'name': 'Premium Sharbati Wheat',
                'price': 45.00,
                'stock': 600,
                'sku': 'SW-HS-005',
                'weight': 1.00,
                'short_description': 'Finest wheat from the fields of MP. Pure, clean, and nutritious.',
                'description': 'Golden Sharbati Wheat grains sourced directly from Sehore, Madhya Pradesh. Known for making soft, sweet, and highly nutritious rotis that stay soft for hours.',
                'is_featured': True
            },
            {
                'category': cat_wheat,
                'quality_grade': g_sortex,
                'name': 'Lokwan Wheat',
                'price': 38.00,
                'stock': 700,
                'sku': 'LW-S-006',
                'weight': 1.00,
                'short_description': 'Trusted variety for soft rotis. Properly sortex-cleaned stock.',
                'description': 'Lokwan Wheat is popular for its high dietary fiber content, excellent baking quality, and cost effectiveness. Double cleaned and sortex sorted for standard compliance.',
                'is_featured': False
            }
        ]

        for p_data in products_to_seed:
            slug = slugify(p_data['name'])
            prod, created = Product.objects.get_or_create(
                sku=p_data['sku'],
                defaults={
                    'category': p_data['category'],
                    'quality_grade': p_data['quality_grade'],
                    'name': p_data['name'],
                    'slug': slug,
                    'price': p_data['price'],
                    'stock': p_data['stock'],
                    'weight': p_data['weight'],
                    'short_description': p_data['short_description'],
                    'description': p_data['description'],
                    'is_featured': p_data['is_featured'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Seeded product: {p_data['name']}"))
            else:
                self.stdout.write(f"Product already exists: {p_data['name']}")

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
