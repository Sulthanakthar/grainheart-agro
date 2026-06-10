from django.urls import path
from .views import (
    CartView,
    CartAddItemView,
    CartUpdateItemView,
    CartRemoveItemView,
    OrderCreateView,
    OrderListView,
    OrderDetailView,
    OrderStatusUpdateView,
    InvoiceDownloadView
)

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart_detail'),
    path('cart/add-item/', CartAddItemView.as_view(), name='cart_add_item'),
    path('cart/update-item/', CartUpdateItemView.as_view(), name='cart_update_item'),
    path('cart/remove-item/', CartRemoveItemView.as_view(), name='cart_remove_item'),
    path('orders/create/', OrderCreateView.as_view(), name='order_create'),
    path('orders/', OrderListView.as_view(), name='order_list'),
    path('orders/<str:order_number>/', OrderDetailView.as_view(), name='order_detail'),
    path('orders/<str:order_number>/status/', OrderStatusUpdateView.as_view(), name='order_status_update'),
    path('invoices/<str:order_number>/download/', InvoiceDownloadView.as_view(), name='invoice_download'),
]
