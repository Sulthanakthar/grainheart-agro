from django.utils import timezone
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.permissions import IsEmployee
from .models import Payment
from .serializers import PaymentSerializer, PaymentVerifySerializer

class PaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def get_queryset(self):
        queryset = Payment.objects.all().select_related('order', 'order__customer').order_by('-created_at')
        
        # Simple filters
        payment_method = self.request.query_params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)

        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)

        return queryset

class PaymentVerifyView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsEmployee)

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"error": "Payment record not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']

        with transaction.atomic():
            payment.payment_status = new_status
            payment.verified_by = request.user
            if new_status in ['completed', 'verified']:
                payment.payment_date = timezone.now()
            payment.save()

            # Update order payment status
            order = payment.order
            order.payment_status = new_status

            # Proactively transition order status from pending to confirmed upon payment clearance
            if new_status in ['completed', 'verified'] and order.order_status == 'pending':
                order.order_status = 'confirmed'
            
            order.save()

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)
