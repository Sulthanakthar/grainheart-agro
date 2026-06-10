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
    UserProfileView
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
]
