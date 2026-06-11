from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Enquiry, Lead, Followup, CustomerInteraction, Notification

User = get_user_model()

class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = (
            'id', 'enquiry_number', 'customer_name', 'email', 'phone', 
            'enquiry_type', 'subject', 'message', 'source', 'status', 
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'enquiry_number', 'status', 'created_at', 'updated_at')

class LeadSerializer(serializers.ModelSerializer):
    enquiry_details = EnquirySerializer(source='enquiry', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Lead
        fields = (
            'id', 'lead_number', 'enquiry', 'enquiry_details', 'assigned_to', 
            'assigned_to_username', 'lead_status', 'priority', 'expected_revenue', 
            'conversion_probability', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'lead_number', 'created_at', 'updated_at')

class LeadUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ('assigned_to', 'lead_status', 'priority', 'expected_revenue', 'conversion_probability')

class FollowupSerializer(serializers.ModelSerializer):
    lead_number = serializers.CharField(source='lead.lead_number', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Followup
        fields = (
            'id', 'lead', 'lead_number', 'assigned_to', 'assigned_to_username', 
            'followup_date', 'followup_type', 'notes', 'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class CustomerInteractionSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    lead_number = serializers.CharField(source='lead.lead_number', read_only=True)

    class Meta:
        model = CustomerInteraction
        fields = (
            'id', 'customer', 'customer_username', 'lead', 'lead_number', 
            'interaction_type', 'description', 'interaction_date'
        )
        read_only_fields = ('id', 'interaction_date')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'user', 'title', 'message', 'notification_type', 'is_read', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
