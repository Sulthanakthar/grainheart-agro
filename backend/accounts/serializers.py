from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.conf import settings
from .models import Customer, Dealer, OTPVerification, Territory
import uuid
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'created_at', 'updated_at')
        read_only_fields = ('id', 'username', 'role', 'created_at', 'updated_at')

class CustomerProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = Customer
        fields = ('id', 'user', 'phone', 'address', 'city', 'state', 'country', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

class DealerProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    territory_name = serializers.CharField(source='territory.territory_name', read_only=True)

    class Meta:
        model = Dealer
        fields = (
            'id', 'user', 'dealer_code', 'business_name', 'owner_name', 'phone', 'email', 
            'gst_number', 'pan_number', 'territory_name', 'commission_rate', 'status', 'approval_date'
        )
        read_only_fields = (
            'id', 'user', 'dealer_code', 'gst_number', 'pan_number', 'territory_name', 
            'commission_rate', 'status', 'approval_date'
        )

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    phone = serializers.CharField(required=True)
    address = serializers.CharField(required=True)
    city = serializers.CharField(required=True)
    state = serializers.CharField(required=True)
    country = serializers.CharField(default='India', required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'phone', 'address', 'city', 'state', 'country')

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        phone = validated_data.pop('phone')
        address = validated_data.pop('address')
        city = validated_data.pop('city')
        state = validated_data.pop('state')
        country = validated_data.pop('country', 'India')
        password = validated_data.pop('password')

        user = User.objects.create_user(**validated_data, role='customer')
        user.set_password(password)
        user.save()

        Customer.objects.create(
            user=user,
            phone=phone,
            address=address,
            city=city,
            state=state,
            country=country
        )
        return user

class DealerRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    business_name = serializers.CharField(required=True)
    owner_name = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    gst_number = serializers.CharField(required=True)
    pan_number = serializers.CharField(required=True)
    territory_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Dealer
        fields = ('username', 'password', 'business_name', 'owner_name', 'phone', 'email', 'gst_number', 'pan_number', 'territory_id')

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_gst_number(self, value):
        if len(value) != 15:
            raise serializers.ValidationError("GST number must be 15 characters long.")
        if Dealer.objects.filter(gst_number=value).exists():
            raise serializers.ValidationError("A dealer with this GST number already exists.")
        return value

    def validate_pan_number(self, value):
        if len(value) != 10:
            raise serializers.ValidationError("PAN number must be 10 characters long.")
        if Dealer.objects.filter(pan_number=value).exists():
            raise serializers.ValidationError("A dealer with this PAN number already exists.")
        return value

    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        territory_id = validated_data.pop('territory_id', None)

        user = User.objects.create_user(
            username=username,
            email=validated_data.get('email'),
            role='dealer'
        )
        user.set_password(password)
        user.save()

        # Generate unique dealer code
        dealer_code = f"DL-{uuid.uuid4().hex[:8].upper()}"
        while Dealer.objects.filter(dealer_code=dealer_code).exists():
            dealer_code = f"DL-{uuid.uuid4().hex[:8].upper()}"

        territory = None
        if territory_id:
            try:
                territory = Territory.objects.get(id=territory_id)
            except Territory.DoesNotExist:
                pass

        dealer = Dealer.objects.create(
            user=user,
            dealer_code=dealer_code,
            business_name=validated_data['business_name'],
            owner_name=validated_data['owner_name'],
            phone=validated_data['phone'],
            email=validated_data['email'],
            gst_number=validated_data['gst_number'],
            pan_number=validated_data['pan_number'],
            territory=territory,
            status='pending_verification'
        )
        return dealer

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        from django.contrib.auth import authenticate
        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        attrs['user'] = user
        return attrs

class OTPVerifySerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        session_id = attrs.get('session_id')
        otp_code = attrs.get('otp_code')

        try:
            otp_verification = OTPVerification.objects.get(session_id=session_id)
        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid session ID.")

        if otp_verification.is_verified:
            raise serializers.ValidationError("This OTP has already been verified.")

        if otp_verification.is_expired:
            raise serializers.ValidationError("This OTP has expired.")

        if otp_verification.otp_code != otp_code:
            raise serializers.ValidationError("Incorrect OTP code.")

        attrs['otp_verification'] = otp_verification
        return attrs

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user is registered with this email address.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    otp_code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        session_id = attrs.get('session_id')
        otp_code = attrs.get('otp_code')

        try:
            otp_verification = OTPVerification.objects.get(session_id=session_id, purpose='password_reset')
        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid session ID for password reset.")

        if otp_verification.is_verified:
            raise serializers.ValidationError("This OTP has already been verified.")

        if otp_verification.is_expired:
            raise serializers.ValidationError("This OTP has expired.")

        if otp_verification.otp_code != otp_code:
            raise serializers.ValidationError("Incorrect OTP code.")

        attrs['otp_verification'] = otp_verification
        return attrs


class TerritorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Territory
        fields = ('id', 'territory_name', 'district', 'state', 'country', 'manager_name', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


from .models import DealerDocument, Commission, DealerPerformance

class DealerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealerDocument
        fields = ('id', 'dealer', 'document_type', 'document_file', 'verification_status', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


class DealerAdminSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    territory_details = TerritorySerializer(source='territory', read_only=True)
    documents = DealerDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Dealer
        fields = (
            'id', 'user', 'dealer_code', 'business_name', 'owner_name', 'phone', 'email', 
            'gst_number', 'pan_number', 'territory', 'territory_details', 'commission_rate', 
            'status', 'approval_date', 'documents', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'dealer_code', 'approval_date', 'created_at', 'updated_at')


class DealerApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=(('active', 'Active'), ('suspended', 'Suspended'), ('rejected', 'Rejected')),
        required=True
    )
    commission_rate = serializers.DecimalField(max_digits=4, decimal_places=2, required=False)


class CommissionSerializer(serializers.ModelSerializer):
    dealer_business_name = serializers.CharField(source='dealer.business_name', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Commission
        fields = (
            'id', 'dealer', 'dealer_business_name', 'order', 'order_number', 
            'sales_amount', 'commission_percentage', 'commission_amount', 
            'payout_status', 'payout_date', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'dealer', 'dealer_business_name', 'order', 'order_number', 
            'sales_amount', 'commission_percentage', 'commission_amount', 
            'created_at', 'updated_at'
        )


class DealerPerformanceSerializer(serializers.ModelSerializer):
    dealer_business_name = serializers.CharField(source='dealer.business_name', read_only=True)

    class Meta:
        model = DealerPerformance
        fields = ('id', 'dealer', 'dealer_business_name', 'month', 'total_orders', 'total_sales', 'total_customers', 'growth_percentage', 'updated_at')
        read_only_fields = ('id', 'updated_at')

