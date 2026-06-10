from django.db import models
from django.conf import settings

class Report(models.Model):
    REPORT_TYPES = (
        ('sales', 'Sales Report'),
        ('inventory', 'Inventory Report'),
        ('dealer', 'Dealer Report'),
        ('crm', 'CRM Report'),
        ('customer', 'Customer Report'),
        ('financial', 'Financial Report'),
        ('operational', 'Operational Report'),
    )
    report_name = models.CharField(max_length=150)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports"
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    file_path = models.CharField(max_length=255)

    def __str__(self):
        return f"Report: {self.report_name} ({self.get_report_type_display()})"

    class Meta:
        indexes = [
            models.Index(fields=['report_type', 'generated_at']),
        ]

class DashboardConfiguration(models.Model):
    DASHBOARD_CHOICES = (
        ('executive', 'Executive Dashboard'),
        ('sales', 'Sales Dashboard'),
        ('inventory', 'Inventory Dashboard'),
        ('dealer', 'Dealer Dashboard'),
        ('crm', 'CRM Dashboard'),
        ('customers', 'Customer Dashboard'),
        ('financial', 'Financial Dashboard'),
        ('system_health', 'System Health Dashboard'),
    )
    dashboard_name = models.CharField(max_length=50, choices=DASHBOARD_CHOICES)
    widget_name = models.CharField(max_length=100)
    position = models.IntegerField(default=0)  # rendering sequence
    visibility = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.widget_name} on {self.get_dashboard_name_display()}"

class KPITracker(models.Model):
    metric_name = models.CharField(max_length=100, unique=True)
    metric_value = models.DecimalField(max_digits=16, decimal_places=4)
    calculated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"KPI: {self.metric_name} = {self.metric_value}"

    class Meta:
        indexes = [
            models.Index(fields=['metric_name']),
        ]
