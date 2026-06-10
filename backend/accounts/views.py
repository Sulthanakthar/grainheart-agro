import logging
from django.db import connection
from django.http import JsonResponse
from django.views import View
import redis
from django.conf import settings

logger = logging.getLogger(__name__)

class HealthCheckView(View):
    def get(self, request, *args, **kwargs):
        status = {
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
            status['services']['database'] = 'healthy'
        except Exception as e:
            logger.error(f"Health check: Database connection failed: {e}")
            status['services']['database'] = 'unhealthy'
            status['status'] = 'unhealthy'
            
        # 2. Check Redis (using Celery Broker configuration as connection string)
        try:
            redis_url = getattr(settings, 'CELERY_BROKER_URL', 'redis://127.0.0.1:6379/0')
            r = redis.Redis.from_url(redis_url, socket_timeout=2)
            r.ping()
            status['services']['redis'] = 'healthy'
        except Exception as e:
            logger.error(f"Health check: Redis connection failed: {e}")
            status['services']['redis'] = 'unhealthy'
            status['status'] = 'unhealthy'
            
        response_status = 200 if status['status'] == 'healthy' else 500
        return JsonResponse(status, status=response_status)

