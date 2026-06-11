from django.urls import path
from .views import (
    ReportListCreateView,
    ReportDownloadView,
    DashboardExecutiveView,
    DashboardSalesView,
    DashboardInventoryView,
    DashboardDealersView,
    DashboardCRMView,
    DashboardCustomersView,
    AnalyticsRevenueView,
    AnalyticsOrdersView,
    AnalyticsInventoryView
)

urlpatterns = [
    # Reports list and generate
    path('reports/', ReportListCreateView.as_view(), name='report_list_create'),
    path('reports/download/<int:pk>/', ReportDownloadView.as_view(), name='report_download'),

    # Dashboard endpoints
    path('dashboard/executive/', DashboardExecutiveView.as_view(), name='dashboard_executive'),
    path('dashboard/sales/', DashboardSalesView.as_view(), name='dashboard_sales'),
    path('dashboard/inventory/', DashboardInventoryView.as_view(), name='dashboard_inventory'),
    path('dashboard/dealers/', DashboardDealersView.as_view(), name='dashboard_dealers'),
    path('dashboard/crm/', DashboardCRMView.as_view(), name='dashboard_crm'),
    path('dashboard/customers/', DashboardCustomersView.as_view(), name='dashboard_customers'),

    # Analytics streams
    path('analytics/revenue/', AnalyticsRevenueView.as_view(), name='analytics_revenue'),
    path('analytics/orders/', AnalyticsOrdersView.as_view(), name='analytics_orders'),
    path('analytics/inventory/', AnalyticsInventoryView.as_view(), name='analytics_inventory'),
]
