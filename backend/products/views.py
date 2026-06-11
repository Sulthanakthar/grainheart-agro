from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from .models import Category, QualityGrade, Product, ProductImage, Wishlist, Review, SEOMetadata
from .serializers import (
    CategorySerializer,
    QualityGradeSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ReviewSerializer,
    WishlistSerializer,
    SEOMetadataSerializer
)

class IsAdminOrInventory(permissions.BasePermission):
    """
    Allows write access only to Administrators and Inventory Managers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'inventory']
        )

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminOrInventory()]

class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminOrInventory()]

class QualityGradeListAPIView(generics.ListAPIView):
    queryset = QualityGrade.objects.all().order_by('priority')
    serializer_class = QualityGradeSerializer
    permission_classes = (permissions.AllowAny,)

class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductListSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminOrInventory()]

    def get_queryset(self):
        queryset = Product.objects.all().select_related('category', 'quality_grade')
        
        # Inactive products and products in inactive categories are only visible to employees
        user = self.request.user
        is_employee = user.is_authenticated and user.role in ['admin', 'sales', 'inventory']
        if not is_employee:
            queryset = queryset.filter(is_active=True, category__status='active')
            
        # Category Filter
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
            
        # Quality Grade Priority Filter
        quality_priority = self.request.query_params.get('quality_grade')
        if quality_priority:
            queryset = queryset.filter(quality_grade__priority=quality_priority)
            
        # Featured Filter
        is_featured = self.request.query_params.get('is_featured')
        if is_featured:
            val = is_featured.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_featured=val)
            
        # Search Query
        query = self.request.query_params.get('q') or self.request.query_params.get('search')
        if query:
            queryset = queryset.filter(
                models.Q(name__icontains=query) |
                models.Q(short_description__icontains=query) |
                models.Q(description__icontains=query) |
                models.Q(sku__icontains=query)
            )
            
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        # Automate slug generation from name
        from django.utils.text import slugify
        name = serializer.validated_data.get('name')
        slug = slugify(name)
        original_slug = slug
        counter = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        serializer.save(slug=slug)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all().select_related('category', 'quality_grade').prefetch_related('gallery', 'reviews', 'reviews__customer')
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminOrInventory()]

    def perform_update(self, serializer):
        if 'name' in serializer.validated_data:
            from django.utils.text import slugify
            name = serializer.validated_data['name']
            slug = slugify(name)
            original_slug = slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(id=self.get_object().id).exists():
                slug = f"{original_slug}-{counter}"
                counter += 1
            serializer.save(slug=slug)
        else:
            serializer.save()

class ReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, slug):
        try:
            product = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
            
        reviews = product.reviews.all().order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, slug):
        try:
            product = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.role not in ['customer', 'dealer']:
            return Response({"error": "Only customers and dealers can write reviews."}, status=status.HTTP_403_FORBIDDEN)

        # Ensure unique review per customer-product combination
        if Review.objects.filter(product=product, customer=request.user).exists():
            return Response({"error": "You have already reviewed this product."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product, customer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WishlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Wishlist.objects.filter(customer=self.request.user).select_related('product', 'product__category', 'product__quality_grade')

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

class WishlistDestroyView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, product_slug):
        try:
            wishlist_item = Wishlist.objects.get(customer=request.user, product__slug=product_slug)
            wishlist_item.delete()
            return Response({"message": "Product removed from wishlist."}, status=status.HTTP_200_OK)
        except Wishlist.DoesNotExist:
            return Response({"error": "Product not found in your wishlist."}, status=status.HTTP_404_NOT_FOUND)

class SEOMetadataView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        path = request.query_params.get('path')
        if not path:
            return Response({"error": "path parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        if path.endswith('/') and len(path) > 1:
            path = path[:-1]

        try:
            seo = SEOMetadata.objects.get(path=path)
            serializer = SEOMetadataSerializer(seo)
            return Response(serializer.data)
        except SEOMetadata.DoesNotExist:
            # Dynamic defaults
            if path.startswith('/products/') and len(path) > 10:
                slug = path.split('/products/')[-1].strip('/')
                product = Product.objects.filter(slug=slug).first()
                if product:
                    title = f"{product.name} ({product.quality_grade.name}) | Healthy Grains, Happy Families"
                    desc = product.short_description or f"Purchase high-quality {product.name} online at the best prices."
                    return Response({
                        "path": path,
                        "meta_title": title,
                        "meta_description": desc,
                        "meta_keywords": f"{product.name}, {product.sku}, pulses, grains",
                        "og_title": title,
                        "og_description": desc,
                        "og_image": product.image.url if product.image else "",
                        "canonical_url": request.build_absolute_uri(path)
                    })
            elif path.startswith('/categories/') and len(path) > 12:
                slug = path.split('/categories/')[-1].strip('/')
                cat = Category.objects.filter(slug=slug).first()
                if cat:
                    title = f"Premium {cat.name} Grains Collection | Healthy Grains, Happy Families"
                    desc = cat.description or f"Explore our premium selection of {cat.name} grains."
                    return Response({
                        "path": path,
                        "meta_title": title,
                        "meta_description": desc,
                        "meta_keywords": f"{cat.name}, grains, wholesale pulses",
                        "og_title": title,
                        "og_description": desc,
                        "og_image": cat.image.url if cat.image else "",
                        "canonical_url": request.build_absolute_uri(path)
                    })

            default_title = "Healthy Grains, Happy Families | High-Quality Pulses & Grains"
            default_desc = "Get high-quality Sortex pulses, wheat, and grains delivered to your home or retail store. Order online today!"
            return Response({
                "path": path,
                "meta_title": default_title,
                "meta_description": default_desc,
                "meta_keywords": "pulses, wheat, sortex, dealer onboarding, grain dealer",
                "og_title": default_title,
                "og_description": default_desc,
                "og_image": "",
                "canonical_url": request.build_absolute_uri(path)
            })
