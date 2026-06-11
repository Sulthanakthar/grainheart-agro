from rest_framework import serializers
from django.utils import timezone
from .models import Report, DashboardConfiguration, KPITracker

class ReportSerializer(serializers.ModelSerializer):
    generated_by_username = serializers.CharField(source='generated_by.username', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ('id', 'report_name', 'report_type', 'generated_by', 'generated_by_username', 'generated_at', 'file_path', 'download_url')
        read_only_fields = ('id', 'generated_by', 'generated_at', 'file_path', 'download_url')

    def get_download_url(self, obj):
        from django.urls import reverse
        from django.core.signing import TimestampSigner
        signer = TimestampSigner()
        base_url = reverse('report_download', kwargs={'pk': obj.pk})
        signature = signer.sign(str(obj.pk))
        # signature looks like pk:timestamp:hash. Extract just the signing part after pk: to keep it clean,
        # or pass the entire signed value as signature.
        return f"{base_url}?signature={signature}"

class ReportGenerateSerializer(serializers.Serializer):
    REPORT_TYPES = Report.REPORT_TYPES
    report_type = serializers.ChoiceField(choices=REPORT_TYPES)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError("End date cannot be before start date.")
            delta = end_date - start_date
            if delta.days > 365:
                raise serializers.ValidationError("Date range filter cannot exceed 365 days to prevent database memory exhaustion.")
        return data

class DashboardConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardConfiguration
        fields = ('id', 'dashboard_name', 'widget_name', 'position', 'visibility', 'updated_at')

class KPITrackerSerializer(serializers.ModelSerializer):
    class Meta:
        model = KPITracker
        fields = ('id', 'metric_name', 'metric_value', 'calculated_at')
