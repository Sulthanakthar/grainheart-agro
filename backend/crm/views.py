import datetime
import uuid
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from django.contrib.auth import get_user_model

from accounts.permissions import IsEmployee
from .models import Enquiry, Lead, Followup, CustomerInteraction, Notification
from .serializers import (
    EnquirySerializer,
    LeadSerializer,
    LeadUpdateSerializer,
    FollowupSerializer,
    CustomerInteractionSerializer,
    NotificationSerializer
)

User = get_user_model()

def generate_enquiry_number():
    date_str = datetime.date.today().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"ENQ-{date_str}-{unique_suffix}"

class EnquiryListCreateView(generics.ListCreateAPIView):
    serializer_class = EnquirySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsEmployee()]

    def get_queryset(self):
        queryset = Enquiry.objects.all().order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        enquiry_type = self.request.query_params.get('enquiry_type')
        if enquiry_type:
            queryset = queryset.filter(enquiry_type=enquiry_type)
        return queryset

    def perform_create(self, serializer):
        enquiry_number = generate_enquiry_number()
        while Enquiry.objects.filter(enquiry_number=enquiry_number).exists():
            enquiry_number = generate_enquiry_number()
        serializer.save(enquiry_number=enquiry_number)

class EnquiryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

class LeadListView(generics.ListAPIView):
    queryset = Lead.objects.all().select_related('enquiry', 'assigned_to').order_by('-created_at')
    serializer_class = LeadSerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get_queryset(self):
        queryset = super().get_queryset()
        lead_status = self.request.query_params.get('lead_status')
        if lead_status:
            queryset = queryset.filter(lead_status=lead_status)
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        return queryset

class LeadDetailView(generics.RetrieveUpdateAPIView):
    queryset = Lead.objects.all()
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return LeadUpdateSerializer
        return LeadSerializer

    def perform_update(self, serializer):
        lead = serializer.save()
        from accounts.models import log_action
        log_action(
            self.request.user,
            "update_lead",
            self.request,
            f"Lead: {lead.lead_number}, Status: {lead.lead_status}, Priority: {lead.priority}, Revenue: {lead.expected_revenue}"
        )

class FollowupListCreateView(generics.ListCreateAPIView):
    queryset = Followup.objects.all().select_related('lead', 'assigned_to').order_by('followup_date')
    serializer_class = FollowupSerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get_queryset(self):
        queryset = super().get_queryset()
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

class FollowupDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Followup.objects.all()
    serializer_class = FollowupSerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

class CustomerInteractionListCreateView(generics.ListCreateAPIView):
    queryset = CustomerInteraction.objects.all().select_related('customer', 'lead').order_by('-interaction_date')
    serializer_class = CustomerInteractionSerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        return queryset

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)

class CRMAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get(self, request):
        total_leads = Lead.objects.count()
        
        # Leads by status
        status_counts = Lead.objects.values('lead_status').annotate(count=models.Count('id'))
        
        # Leads by priority
        priority_counts = Lead.objects.values('priority').annotate(count=models.Count('id'))
        
        # Expected Revenue
        total_revenue = Lead.objects.aggregate(sum=models.Sum('expected_revenue'))['sum'] or 0.00
        
        # Conversion rate
        converted_leads = Lead.objects.filter(lead_status='converted').count()
        conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0.00

        # Sales Exec performance
        reps_data = []
        sales_reps = User.objects.filter(role='sales')
        for rep in sales_reps:
            assigned = Lead.objects.filter(assigned_to=rep).count()
            converted = Lead.objects.filter(assigned_to=rep, lead_status='converted').count()
            reps_data.append({
                "username": rep.username,
                "assigned_leads": assigned,
                "converted_leads": converted,
                "conversion_rate": (converted / assigned * 100) if assigned > 0 else 0.00
            })

        return Response({
            "total_leads": total_leads,
            "expected_revenue": total_revenue,
            "conversion_rate": conversion_rate,
            "leads_by_status": status_counts,
            "leads_by_priority": priority_counts,
            "sales_rep_performance": reps_data
        })
