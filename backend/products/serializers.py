from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, QualityGrade, Product, ProductImage, Wishlist, Review

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

    def validate_name(self, value):
        # Generate slug on validate/save if not present
        from django.utils.text import slugify
        slug = slugify(value)
        if Category.objects.filter(slug=slug).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("A category with a similar name already exists.")
        return value

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)

class QualityGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityGrade
        fields = ('id', 'name', 'priority', 'description', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text')

class ReviewSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'product', 'customer', 'customer_username', 'rating', 'review', 'created_at', 'updated_at')
        read_only_fields = ('id', 'product', 'customer', 'customer_username', 'created_at', 'updated_at')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    quality_grade_name = serializers.CharField(source='quality_grade.name', read_only=True)
    quality_grade_priority = serializers.IntegerField(source='quality_grade.priority', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'category', 'category_name', 'category_slug', 'quality_grade', 
            'quality_grade_name', 'quality_grade_priority', 'name', 'slug', 
            'short_description', 'price', 'stock', 'sku', 'weight', 'image', 
            'is_featured', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    quality_grade = QualityGradeSerializer(read_only=True)
    gallery = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    available_stock = serializers.IntegerField(source='inventory.available_stock', read_only=True)
    reserved_stock = serializers.IntegerField(source='inventory.reserved_stock', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'category', 'quality_grade', 'gallery', 'reviews', 'name', 'slug', 
            'short_description', 'description', 'price', 'stock', 'sku', 'weight', 
            'image', 'is_featured', 'is_active', 'available_stock', 'reserved_stock',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

class WishlistSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'customer', 'customer_username', 'product', 'product_details', 'created_at', 'updated_at')
        read_only_fields = ('id', 'customer', 'customer_username', 'product_details', 'created_at', 'updated_at')

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("User must be authenticated.")
        
        customer = request.user
        product = attrs.get('product')

        if Wishlist.objects.filter(customer=customer, product=product).exists():
            raise serializers.ValidationError("This product is already in your wishlist.")

        attrs['customer'] = customer
        return attrs
