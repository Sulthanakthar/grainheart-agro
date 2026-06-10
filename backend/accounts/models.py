from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('sales', 'Sales Executive'),
        ('inventory', 'Inventory Manager'),
        ('dealer', 'Dealer'),
        ('customer', 'Customer'),
        ('guest', 'Guest'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

