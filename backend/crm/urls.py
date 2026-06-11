from django.urls import path
from .views import (
    EnquiryListCreateView,
    EnquiryDetailView,
    LeadListView,
    LeadDetailView,
    FollowupListCreateView,
    FollowupDetailView,
    CustomerInteractionListCreateView,
    NotificationListView,
    NotificationReadView,
    CRMAnalyticsView
)

urlpatterns = [
    path('enquiries/', EnquiryListCreateView.as_view(), name='enquiry_list_create'),
    path('enquiries/<int:pk>/', EnquiryDetailView.as_view(), name='enquiry_detail'),
    path('leads/', LeadListView.as_view(), name='lead_list'),
    path('leads/<int:pk>/', LeadDetailView.as_view(), name='lead_detail'),
    path('followups/', FollowupListCreateView.as_view(), name='followup_list_create'),
    path('followups/<int:pk>/', FollowupDetailView.as_view(), name='followup_detail'),
    path('interactions/', CustomerInteractionListCreateView.as_view(), name='interaction_list_create'),
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification_read'),
    path('crm/analytics/', CRMAnalyticsView.as_view(), name='crm_analytics'),
]
