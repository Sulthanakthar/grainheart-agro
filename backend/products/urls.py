from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    QualityGradeListAPIView,
    ProductListCreateView,
    ProductDetailView,
    ReviewListCreateView,
    WishlistListCreateView,
    WishlistDestroyView,
    SEOMetadataView
)

urlpatterns = [
    path('categories/', CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category_detail'),
    path('quality-grades/', QualityGradeListAPIView.as_view(), name='quality_grade_list'),
    path('products/', ProductListCreateView.as_view(), name='product_list_create'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product_detail'),
    path('products/<slug:slug>/reviews/', ReviewListCreateView.as_view(), name='product_reviews'),
    path('wishlist/', WishlistListCreateView.as_view(), name='wishlist_list_create'),
    path('wishlist/<slug:product_slug>/', WishlistDestroyView.as_view(), name='wishlist_destroy'),
    path('seo/metadata/', SEOMetadataView.as_view(), name='seo_metadata'),
]
