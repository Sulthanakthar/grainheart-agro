import logging
import random
from django.db import connection, transaction
from django.http import JsonResponse
from django.views import View
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
import redis

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import OTPVerification, Customer, Dealer
from .serializers import (
    RegisterSerializer,
    DealerRegisterSerializer,
    LoginSerializer,
    OTPVerifySerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserProfileSerializer,
    CustomerProfileSerializer,
    DealerProfileSerializer
)

logger = logging.getLogger(__name__)
User = get_user_model()

class HealthCheckView(View):
    def get(self, request, *args, **kwargs):
        status_data = {
            'status': 'healthy',
            'services': {
                'database': 'unknown',
                'redis': 'unknown'
            }
        }
        
        # 1. Check Database (MySQL)
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            status_data['services']['database'] = 'healthy'
        except Exception as e:
            logger.error(f"Health check: Database connection failed: {e}")
            status_data['services']['database'] = 'unhealthy'
            status_data['status'] = 'unhealthy'
            
        # 2. Check Redis (using Celery Broker configuration as connection string)
        try:
            redis_url = getattr(settings, 'CELERY_BROKER_URL', 'redis://127.0.0.1:6379/0')
            r = redis.Redis.from_url(redis_url, socket_timeout=2)
            r.ping()
            status_data['services']['redis'] = 'healthy'
        except Exception as e:
            logger.error(f"Health check: Redis connection failed: {e}")
            status_data['services']['redis'] = 'unhealthy'
            status_data['status'] = 'unhealthy'
            
        response_status = 200 if status_data['status'] == 'healthy' else 500
        return JsonResponse(status_data, status=response_status)


class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User registered successfully.",
                "user": UserProfileSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DealerRegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = DealerRegisterSerializer(data=request.data)
        if serializer.is_valid():
            dealer = serializer.save()
            return Response({
                "message": "Dealer registration submitted successfully, pending approval.",
                "dealer": DealerProfileSerializer(dealer).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate 6-digit OTP
            otp_code = f"{random.randint(100000, 999999)}"
            
            # Save OTP to database
            otp_ver = OTPVerification.objects.create(
                user=user,
                otp_code=otp_code,
                purpose='login'
            )

            # Log to stdout and logging for simulation
            msg = f"--- [OTP DISPATCH SIMULATION] --- User: {user.username}, OTP: {otp_code}, Session ID: {otp_ver.session_id}"
            logger.warning(msg)
            print(msg)

            return Response({
                "session_id": str(otp_ver.session_id),
                "message": "OTP has been generated and sent to your registered contact channel."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OTPVerifyView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            otp_ver = serializer.validated_data['otp_verification']
            otp_ver.is_verified = True
            otp_ver.save()

            user = otp_ver.user
            # Generate SimpleJWT tokens
            refresh = RefreshToken.for_user(user)
            refresh['role'] = user.role

            # Retrieve profile if customer or dealer
            profile_data = {}
            if user.role == 'customer':
                try:
                    profile_data = CustomerProfileSerializer(user.customer_profile).data
                except Customer.DoesNotExist:
                    pass
            elif user.role == 'dealer':
                try:
                    profile_data = DealerProfileSerializer(user.dealer_profile).data
                except Dealer.DoesNotExist:
                    pass

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserProfileSerializer(user).data,
                "profile": profile_data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response({"error": "An error occurred during logout."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)

            # Generate OTP
            otp_code = f"{random.randint(100000, 999999)}"

            otp_ver = OTPVerification.objects.create(
                user=user,
                otp_code=otp_code,
                purpose='password_reset'
            )

            msg = f"--- [PASSWORD RESET OTP SIMULATION] --- User: {user.username}, OTP: {otp_code}, Session ID: {otp_ver.session_id}"
            logger.warning(msg)
            print(msg)

            return Response({
                "session_id": str(otp_ver.session_id),
                "message": "Password reset OTP sent to your email address."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            otp_ver = serializer.validated_data['otp_verification']
            new_password = serializer.validated_data['new_password']

            with transaction.atomic():
                otp_ver.is_verified = True
                otp_ver.save()

                user = otp_ver.user
                user.set_password(new_password)
                user.save()

            return Response({
                "message": "Password has been reset successfully. You can now login with your new password."
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        if user.role == 'customer':
            try:
                profile = user.customer_profile
                serializer = CustomerProfileSerializer(profile)
                return Response(serializer.data)
            except Customer.DoesNotExist:
                return Response(UserProfileSerializer(user).data)
        elif user.role == 'dealer':
            try:
                profile = user.dealer_profile
                serializer = DealerProfileSerializer(profile)
                return Response(serializer.data)
            except Dealer.DoesNotExist:
                return Response(UserProfileSerializer(user).data)
        else:
            serializer = UserProfileSerializer(user)
            return Response(serializer.data)

    def put(self, request):
        user = request.user
        if user.role == 'customer':
            profile, created = Customer.objects.get_or_create(
                user=user,
                defaults={'phone': '', 'address': '', 'city': '', 'state': '', 'country': 'India'}
            )
            serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif user.role == 'dealer':
            try:
                profile = user.dealer_profile
                serializer = DealerProfileSerializer(profile, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except Dealer.DoesNotExist:
                return Response({"error": "Dealer profile does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            serializer = UserProfileSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
