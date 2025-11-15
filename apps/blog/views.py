from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import BlogPost, BlogLike, BlogBookmark
from .serializers import (
    BlogPostListSerializer, 
    BlogPostDetailSerializer, 
    BlogPostCreateSerializer
)

class BlogPostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = BlogPost.objects.filter(published=True)
        
        # Search functionality
        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(content__icontains=search_query) |
                Q(snippet__icontains=search_query)
            )
        
        # Category filter
        category = self.request.query_params.get('category', '')
        if category and category != 'all':
            queryset = queryset.filter(category=category)
        
        # Sort by created date (most recent first)
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BlogPostListSerializer
        elif self.action in ['create', 'update']:
            return BlogPostCreateSerializer
        return BlogPostDetailSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.increment_views()  # Increment view count
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        post = self.get_object()
        like, created = BlogLike.objects.get_or_create(
            user=request.user, 
            post=post
        )
        
        if not created:
            like.delete()
            post.likes = max(0, post.likes - 1)
            liked = False
        else:
            post.likes += 1
            liked = True
        
        post.save()
        
        return Response({
            'liked': liked,
            'likes_count': post.likes
        })
    
    @action(detail=True, methods=['post'])
    def toggle_bookmark(self, request, pk=None):
        post = self.get_object()
        bookmark, created = BlogBookmark.objects.get_or_create(
            user=request.user, 
            post=post
        )
        
        if not created:
            bookmark.delete()
            bookmarked = False
        else:
            bookmarked = True
        
        return Response({
            'bookmarked': bookmarked
        })
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Get posts by current user"""
        if not request.user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)
            
        posts = BlogPost.objects.filter(author=request.user).order_by('-created_at')
        serializer = BlogPostListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_bookmarks(self, request):
        """Get bookmarked posts by current user"""
        if not request.user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)
            
        bookmarked_posts = BlogPost.objects.filter(
            blogbookmark__user=request.user
        ).order_by('-blogbookmark__created_at')
        serializer = BlogPostListSerializer(bookmarked_posts, many=True, context={'request': request})
        return Response(serializer.data)