from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from crm.models import Enquiry, Lead

class Command(BaseCommand):
    help = 'Purges enquiries and leads older than 3 years for GDPR compliance'

    def handle(self, *args, **options):
        three_years_ago = timezone.now() - timedelta(days=3 * 365)
        
        # 1. Get closed enquiries older than 3 years
        expired_enquiries = Enquiry.objects.filter(created_at__lt=three_years_ago, status='closed')
        enquiries_count = expired_enquiries.count()
        
        # 2. Get lost or converted leads older than 3 years
        expired_leads = Lead.objects.filter(created_at__lt=three_years_ago, lead_status__in=['lost', 'converted'])
        leads_count = expired_leads.count()
        
        # Delete records
        expired_leads.delete()
        expired_enquiries.delete()
        
        self.stdout.write(self.style.SUCCESS(
            f"GDPR Data Purge Completed: Successfully deleted {enquiries_count} closed enquiries and {leads_count} inactive/lost/converted leads older than 3 years."
        ))
