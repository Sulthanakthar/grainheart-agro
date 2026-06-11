import os
import datetime
from django.conf import settings
from django.utils import timezone
from django.http import FileResponse, Http404
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncMonth, TruncDay
from django.contrib.auth import get_user_model

from accounts.permissions import IsEmployee, IsAdminRole
from .models import Report, DashboardConfiguration, KPITracker
from .serializers import (
    ReportSerializer,
    ReportGenerateSerializer,
    DashboardConfigurationSerializer,
    KPITrackerSerializer
)
from .tasks import generate_report_task
from orders.models import Order, OrderItem
from products.models import Product, Category, QualityGrade
from accounts.models import Dealer, Customer
from crm.models import Lead, CustomerInteraction
from payments.models import Payment

User = get_user_model()

class IsAdminOrSales(permissions.BasePermission):
    """
    Grants access only to Administrators or Sales Executives.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'sales'])

class IsAdminOrInventory(permissions.BasePermission):
    """
    Grants access only to Administrators or Inventory Managers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'inventory'])


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get_queryset(self):
        return Report.objects.all().order_by('-generated_at')

    def create(self, request, *args, **kwargs):
        serializer = ReportGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        report_type = serializer.validated_data['report_type']
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        
        start_date_str = start_date.strftime("%Y-%m-%d") if start_date else None
        end_date_str = end_date.strftime("%Y-%m-%d") if end_date else None
        
        # Trigger report generation
        try:
            # Try running asynchronously
            task = generate_report_task.delay(request.user.id, report_type, start_date_str, end_date_str)
            # Fetch or create placeholder to tell client it's being generated.
            # However, since the model only stores final file path and has no status,
            # we can run it synchronously in case Celery result backend is not monitored,
            # or just run it synchronously as fallback immediately.
            # To be absolutely sure, let's catch Celery exceptions or run it synchronously
            # so the DB record is created immediately.
            # Let's run Celery task. In tests, we run synchronously or Celery is in eager mode.
            # Let's trigger delay and if it fails, run synchronously.
            # To provide immediate response with the report object, we can run the task directly.
            report_id = generate_report_task(request.user.id, report_type, start_date_str, end_date_str)
            report_obj = Report.objects.get(id=report_id)
            from accounts.models import log_action
            log_action(request.user, "generate_report", request, f"Report: {report_obj.report_name}, Type: {report_type}")
            return Response(ReportSerializer(report_obj).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Fallback
            report_id = generate_report_task(request.user.id, report_type, start_date_str, end_date_str)
            report_obj = Report.objects.get(id=report_id)
            from accounts.models import log_action
            log_action(request.user, "generate_report", request, f"Report: {report_obj.report_name}, Type: {report_type} (Fallback)")
            return Response(ReportSerializer(report_obj).data, status=status.HTTP_201_CREATED)


class ReportDownloadView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            raise Http404("Report not found.")
            
        # Verify signature
        signature = request.query_params.get('signature')
        if not signature:
            return Response({"error": "Signature is missing."}, status=status.HTTP_403_FORBIDDEN)
            
        signer = TimestampSigner()
        try:
            # Verify signature matches pk and is less than 1 hour old
            signed_pk = signer.unsign(signature, max_age=3600)
            if signed_pk != str(pk):
                return Response({"error": "Invalid signature details."}, status=status.HTTP_403_FORBIDDEN)
        except SignatureExpired:
            return Response({"error": "The download link has expired."}, status=status.HTTP_403_FORBIDDEN)
        except BadSignature:
            return Response({"error": "Invalid signature details."}, status=status.HTTP_403_FORBIDDEN)
            
        filepath = os.path.join(settings.MEDIA_ROOT, report.file_path)
        if not os.path.exists(filepath):
            return Response({"error": "Physical report file does not exist on disk."}, status=status.HTTP_404_NOT_FOUND)
            
        from accounts.models import log_action
        log_action(request.user, "download_report", request, f"Report: {report.report_name}, ID: {report.id}")

        response = FileResponse(open(filepath, 'rb'), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(filepath)}"'
        return response


# --- Dashboard Views ---

class DashboardExecutiveView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminRole)

    def get(self, request):
        completed_orders = Order.objects.filter(order_status='delivered')
        total_sales = completed_orders.aggregate(sum=Sum('total_amount'))['sum'] or 0.00
        
        # 10% estimation profit margin
        total_profit = float(total_sales) * 0.10
        total_users = User.objects.count()
        
        orders_count = completed_orders.count()
        avg_order_value = float(total_sales) / orders_count if orders_count > 0 else 0.00
        
        # Lead conversion rate
        total_leads = Lead.objects.count()
        conversion_rate = (orders_count / total_leads * 100) if total_leads > 0 else 0.00
        
        # State wise dealer distribution
        state_distribution = Dealer.objects.values('territory__state').annotate(count=Count('id'))
        
        return Response({
            "total_sales": float(total_sales),
            "total_profit": total_profit,
            "total_users": total_users,
            "average_order_value": avg_order_value,
            "conversion_rate": conversion_rate,
            "state_dealer_distribution": state_distribution
        })


class DashboardSalesView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrSales)

    def get(self, request):
        total_orders = Order.objects.count()
        completed_sales = Order.objects.filter(order_status='delivered').aggregate(sum=Sum('total_amount'))['sum'] or 0.00
        
        pending_cheques = Payment.objects.filter(
            payment_method='bank_cheque',
            payment_status='verification_pending'
        ).count()
        
        # Monthly sales trend
        monthly_trend = Order.objects.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            sales=Sum('total_amount'),
            count=Count('id')
        ).order_by('month')
        
        # Top 5 products
        top_products = OrderItem.objects.values(
            'product__name'
        ).annotate(
            qty=Sum('quantity'),
            total=Sum('total_price')
        ).order_by('-qty')[:5]
        
        return Response({
            "total_orders": total_orders,
            "completed_sales": float(completed_sales),
            "pending_cheque_verifications": pending_cheques,
            "monthly_sales_trend": monthly_trend,
            "top_selling_products": top_products
        })


class DashboardInventoryView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrInventory)

    def get(self, request):
        # Count low stock products (where stock <= reorder_level)
        low_stock_count = Product.objects.filter(
            inventory__available_stock__lte=F('inventory__reorder_level')
        ).count()
        
        # Stock by category
        stock_by_category = Product.objects.values(
            'category__name'
        ).annotate(
            total_stock=Sum('inventory__available_stock')
        )
        
        # Stock by quality grade
        stock_by_grade = Product.objects.values(
            'quality_grade__name'
        ).annotate(
            total_stock=Sum('inventory__available_stock')
        )
        
        return Response({
            "low_stock_products_count": low_stock_count,
            "stock_by_category": stock_by_category,
            "stock_by_grade": stock_by_grade
        })


class DashboardDealersView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminRole)

    def get(self, request):
        active_dealers = Dealer.objects.filter(status='active').count()
        pending_dealers = Dealer.objects.filter(status='pending_verification').count()
        
        commissions = Commission = Dealer.objects.aggregate(
            paid=Sum('commissions__commission_amount', filter=models.Q(commissions__payout_status='paid')),
            pending=Sum('commissions__commission_amount', filter=models.Q(commissions__payout_status='pending'))
        )
        
        # Dealer performance ranking
        ranking = Dealer.objects.annotate(
            total_sales_val=Sum('commissions__sales_amount')
        ).values('business_name', 'total_sales_val').order_by('-total_sales_val')[:10]
        
        return Response({
            "active_dealers": active_dealers,
            "pending_dealers": pending_dealers,
            "total_commission_paid": float(commissions['paid'] or 0.00),
            "total_commission_pending": float(commissions['pending'] or 0.00),
            "dealer_sales_ranking": ranking
        })


class DashboardCRMView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrSales)

    def get(self, request):
        total_enquiries = Enquiry = Enquiry = Lead.objects.count()  # simple lead count
        total_leads = Lead.objects.count()
        
        leads_by_status = Lead.objects.values('lead_status').annotate(count=Count('id'))
        leads_by_priority = Lead.objects.values('priority').annotate(count=Count('id'))
        
        totals = Lead.objects.aggregate(
            revenue=Sum('expected_revenue'),
            avg_probability=Avg('conversion_probability')
        )
        
        return Response({
            "total_leads": total_leads,
            "leads_by_status": leads_by_status,
            "leads_by_priority": leads_by_priority,
            "expected_revenue_sum": float(totals['revenue'] or 0.00),
            "average_conversion_probability": float(totals['avg_probability'] or 0.00)
        })


class DashboardCustomersView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminOrSales)

    def get(self, request):
        total_customers = Customer.objects.count()
        
        monthly_signup = Customer.objects.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        top_customers = Customer.objects.annotate(
            total_ordered=Sum('user__orders__total_amount')
        ).values('user__username', 'total_ordered').order_by('-total_ordered')[:10]
        
        return Response({
            "total_customers": total_customers,
            "monthly_signup_trend": monthly_signup,
            "top_customers": top_customers
        })


# --- Analytics Streams ---

class AnalyticsRevenueView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get(self, request):
        # Returns daily revenue trend for the last 30 days
        start_date = timezone.now() - datetime.timedelta(days=30)
        
        revenue_trend = Order.objects.filter(
            order_status='delivered',
            created_at__gte=start_date
        ).annotate(
            day=TruncDay('created_at')
        ).values('day').annotate(
            revenue=Sum('total_amount')
        ).order_by('day')
        
        return Response(revenue_trend)


class AnalyticsOrdersView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get(self, request):
        status_counts = Order.objects.values('order_status').annotate(count=Count('id'))
        return Response(status_counts)


class AnalyticsInventoryView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get(self, request):
        # Calculate overall stock values
        total_stock_value = Product.objects.annotate(
            val=F('price') * F('inventory__available_stock')
        ).aggregate(sum=Sum('val'))['sum'] or 0.00
        
        stock_status = Product.objects.values('is_active').annotate(count=Count('id'))
        
        return Response({
            "total_stock_value": float(total_stock_value),
            "stock_status_counts": stock_status
        })
