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
from rest_framework import status, permissions, generics
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import OTPVerification, Customer, Dealer, log_action
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

            # Log action
            log_action(user, "request_otp_login", request, f"OTP Session ID: {otp_ver.session_id}")

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

            # Log action
            log_action(user, "login_success", request, f"User {user.username} logged in successfully with role {user.role}")

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


from django.db import models
from .permissions import IsAdminRole, IsSalesRole, IsInventoryRole, IsDealerRole, IsCustomerRole, IsEmployee
from .models import Territory, Dealer, DealerDocument, Commission, DealerPerformance
from .serializers import (
    TerritorySerializer,
    DealerAdminSerializer,
    DealerApprovalSerializer,
    DealerDocumentSerializer,
    CommissionSerializer,
    DealerPerformanceSerializer
)

class TerritoryListCreateView(generics.ListCreateAPIView):
    queryset = Territory.objects.all().order_by('territory_name')
    serializer_class = TerritorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsEmployee()]

class TerritoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Territory.objects.all()
    serializer_class = TerritorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsEmployee()]

class DealerListView(generics.ListAPIView):
    queryset = Dealer.objects.all().order_by('-created_at')
    serializer_class = DealerAdminSerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

class DealerDetailView(generics.RetrieveUpdateAPIView):
    queryset = Dealer.objects.all()
    serializer_class = DealerAdminSerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

class DealerApprovalView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminRole)

    def post(self, request, pk):
        try:
            dealer = Dealer.objects.get(pk=pk)
        except Dealer.DoesNotExist:
            return Response({"error": "Dealer profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DealerApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']
        rate = serializer.validated_data.get('commission_rate')

        with transaction.atomic():
            dealer.status = new_status
            if new_status == 'active':
                dealer.approval_date = timezone.now()
                dealer.user.is_active = True
                dealer.user.save()
            if rate is not None:
                dealer.commission_rate = rate
            dealer.save()

            # Log action
            log_action(request.user, "dealer_approval", request, f"Dealer: {dealer.business_name}, Status: {new_status}, Rate: {rate}")

        return Response(DealerAdminSerializer(dealer).data, status=status.HTTP_200_OK)

class DealerDocumentUploadView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsDealerRole)

    def post(self, request):
        try:
            dealer = request.user.dealer_profile
        except Dealer.DoesNotExist:
            return Response({"error": "Dealer profile not found for this account."}, status=status.HTTP_400_BAD_REQUEST)

        doc_type = request.data.get('document_type')
        doc_file = request.FILES.get('document_file')

        if not doc_type or not doc_file:
            return Response({"error": "document_type and document_file are required fields."}, status=status.HTTP_400_BAD_REQUEST)

        doc = DealerDocument.objects.create(
            dealer=dealer,
            document_type=doc_type,
            document_file=doc_file,
            verification_status='pending'
        )

        return Response(DealerDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)

class DealerDocumentVerifyView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def post(self, request, pk):
        try:
            doc = DealerDocument.objects.get(pk=pk)
        except DealerDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['verified', 'rejected']:
            return Response({"error": "Invalid verification status choice. Use 'verified' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

        doc.verification_status = new_status
        doc.save()

        return Response(DealerDocumentSerializer(doc).data, status=status.HTTP_200_OK)

class CommissionListView(generics.ListAPIView):
    serializer_class = CommissionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'sales', 'inventory']:
            queryset = Commission.objects.all().order_by('-created_at')
            dealer_id = self.request.query_params.get('dealer_id')
            if dealer_id:
                queryset = queryset.filter(dealer_id=dealer_id)
        else:
            try:
                dealer = user.dealer_profile
                queryset = Commission.objects.filter(dealer=dealer).order_by('-created_at')
            except Dealer.DoesNotExist:
                queryset = Commission.objects.none()

        payout_status = self.request.query_params.get('payout_status')
        if payout_status:
            queryset = queryset.filter(payout_status=payout_status)

        return queryset

class CommissionPayoutView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminRole)

    def post(self, request, pk):
        try:
            commission = Commission.objects.get(pk=pk)
        except Commission.DoesNotExist:
            return Response({"error": "Commission ledger entry not found."}, status=status.HTTP_404_NOT_FOUND)

        if commission.payout_status == 'paid':
            return Response({"error": "Commission is already marked as paid."}, status=status.HTTP_400_BAD_REQUEST)

        commission.payout_status = 'paid'
        commission.payout_date = timezone.now()
        commission.save()

        # Log action
        log_action(request.user, "commission_payout", request, f"Commission ID: {commission.id}, Amount: {commission.commission_amount}, Dealer: {commission.dealer.business_name}")

        return Response(CommissionSerializer(commission).data, status=status.HTTP_200_OK)

class DealerAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        is_employee = user.role in ['admin', 'sales', 'inventory']

        if is_employee:
            # Executive/Global Dealer Analytics
            total_sales = Commission.objects.aggregate(sum=models.Sum('sales_amount'))['sum'] or 0.00
            total_commissions = Commission.objects.aggregate(sum=models.Sum('commission_amount'))['sum'] or 0.00
            pending_payout = Commission.objects.filter(payout_status='pending').aggregate(sum=models.Sum('commission_amount'))['sum'] or 0.00
            paid_payout = Commission.objects.filter(payout_status='paid').aggregate(sum=models.Sum('commission_amount'))['sum'] or 0.00
            
            dealers_count = Dealer.objects.count()
            active_dealers = Dealer.objects.filter(status='active').count()

            # State-wise distribution
            state_data = Dealer.objects.annotate(state=models.F('territory__state')).values('state').annotate(count=models.Count('id'))

            return Response({
                "mode": "global",
                "summary": {
                    "total_sales": total_sales,
                    "total_commissions": total_commissions,
                    "pending_payout": pending_payout,
                    "paid_payout": paid_payout,
                    "dealers_count": dealers_count,
                    "active_dealers": active_dealers
                },
                "state_wise_distribution": state_data
            })
        else:
            # Individual Dealer Analytics
            try:
                dealer = user.dealer_profile
            except Dealer.DoesNotExist:
                return Response({"error": "Dealer profile not found."}, status=status.HTTP_400_BAD_REQUEST)

            commissions = Commission.objects.filter(dealer=dealer)
            total_sales = commissions.aggregate(sum=models.Sum('sales_amount'))['sum'] or 0.00
            total_commissions = commissions.aggregate(sum=models.Sum('commission_amount'))['sum'] or 0.00
            pending_payout = commissions.filter(payout_status='pending').aggregate(sum=models.Sum('commission_amount'))['sum'] or 0.00
            paid_payout = commissions.filter(payout_status='paid').aggregate(sum=models.Sum('commission_amount'))['sum'] or 0.00

            # Performance reviews list
            perf = DealerPerformance.objects.filter(dealer=dealer).order_by('-month')
            perf_serializer = DealerPerformanceSerializer(perf, many=True)

            return Response({
                "mode": "dealer",
                "summary": {
                    "total_sales": total_sales,
                    "total_commissions": total_commissions,
                    "pending_payout": pending_payout,
                    "paid_payout": paid_payout
                },
                "monthly_performance": perf_serializer.data
            })

