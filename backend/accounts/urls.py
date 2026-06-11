from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    DealerRegisterView,
    LoginView,
    OTPVerifyView,
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UserProfileView,
    TerritoryListCreateView,
    TerritoryDetailView,
    DealerListView,
    DealerDetailView,
    DealerApprovalView,
    DealerDocumentUploadView,
    DealerDocumentVerifyView,
    CommissionListView,
    CommissionPayoutView,
    DealerAnalyticsView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/register-dealer/', DealerRegisterView.as_view(), name='auth_register_dealer'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/verify-otp/', OTPVerifyView.as_view(), name='auth_verify_otp'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='auth_password_reset_request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='auth_password_reset_confirm'),
    path('users/profile/', UserProfileView.as_view(), name='user_profile'),
    
    # Dealer Management Module
    path('territories/', TerritoryListCreateView.as_view(), name='territory_list_create'),
    path('territories/<int:pk>/', TerritoryDetailView.as_view(), name='territory_detail'),
    path('dealers/', DealerListView.as_view(), name='dealer_list'),
    path('dealers/<int:pk>/', DealerDetailView.as_view(), name='dealer_detail'),
    path('dealers/<int:pk>/approve/', DealerApprovalView.as_view(), name='dealer_approve'),
    path('dealers/documents/upload/', DealerDocumentUploadView.as_view(), name='dealer_document_upload'),
    path('dealers/documents/<int:pk>/verify/', DealerDocumentVerifyView.as_view(), name='dealer_document_verify'),
    path('commissions/', CommissionListView.as_view(), name='commission_list'),
    path('commissions/<int:pk>/payout/', CommissionPayoutView.as_view(), name='commission_payout'),
    path('dealers/analytics/', DealerAnalyticsView.as_view(), name='dealer_analytics'),
]
