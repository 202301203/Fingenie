from rest_framework import serializers
from .models import BlogPost, BlogLike, BlogBookmark
from django.contrib.auth.models import User

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class BlogPostListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'snippet', 'author', 'author_name', 'category',
            'image', 'created_at', 'views', 'likes', 'is_liked', 'is_bookmarked'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return BlogLike.objects.filter(user=request.user, post=obj).exists()
        return False
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return BlogBookmark.objects.filter(user=request.user, post=obj).exists()
        return False

class BlogPostDetailSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'content', 'snippet', 'author', 'author_name',
            'category', 'image', 'created_at', 'updated_at', 'views',
            'likes', 'is_liked', 'is_bookmarked'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return BlogLike.objects.filter(user=request.user, post=obj).exists()
        return False
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return BlogBookmark.objects.filter(user=request.user, post=obj).exists()
        return False

class BlogPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = ['title', 'content', 'snippet', 'category', 'image']
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
