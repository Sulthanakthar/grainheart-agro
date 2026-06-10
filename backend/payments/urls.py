from django.urls import path
from .views import PaymentListView, PaymentVerifyView

urlpatterns = [
    path('payments/', PaymentListView.as_view(), name='payment_list'),
    path('payments/<int:pk>/verify/', PaymentVerifyView.as_view(), name='payment_verify'),
]
