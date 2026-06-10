from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    verified_by_username = serializers.CharField(source='verified_by.username', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'order', 'order_number', 'payment_method', 'transaction_reference', 
            'amount', 'payment_status', 'verified_by', 'verified_by_username', 
            'payment_date', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class PaymentVerifySerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=(('completed', 'Completed'), ('verified', 'Verified'), ('rejected', 'Rejected')),
        required=True
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')
