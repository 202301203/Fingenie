from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from .models import BlogPost, BlogLike, BlogBookmark
from apps.accounts.models import UserActivity  # Add this import
from .serializers import (
    BlogPostListSerializer, 
    BlogPostDetailSerializer, 
    BlogPostCreateSerializer
)

class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read access to anyone,
    but write access only to authenticated users.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        queryset = BlogPost.objects.filter(published=True).select_related('author')
        
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
            queryset = queryset.filter(category__iexact=category)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BlogPostListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return BlogPostCreateSerializer
        return BlogPostDetailSerializer
    
    def get_serializer_context(self):
        """Pass request to serializer for is_liked and is_bookmarked"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to handle authentication and provide better error messages"""
        
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'You need to be logged in to create a blog post. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        print(f"Creating blog post for user: {request.user.username}")
        print(f"Request data: {request.data}")
        print(f"Files: {request.FILES}")
        
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Save the blog post and get the instance
            blog_post = serializer.save(author=request.user, published=True)
            print(f" Blog post created with ID: {blog_post.id}")
            
            # Create activity log for blog post creation
            UserActivity.objects.create(
                user=request.user,
                activity_type='blog_post',
                title=f'Published: {blog_post.title}',
                description=f'Blog post published in {blog_post.category} category',
                content_type='blog',
                object_id=blog_post.id
            )
            
            # Use the detail serializer for response
            response_serializer = BlogPostDetailSerializer(
                blog_post, 
                context=self.get_serializer_context()
            )
            
            headers = self.get_success_headers(response_serializer.data)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        
        print(f"Validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        """Save the blog post with the current user as author"""
        # This is now handled in the create method above
        pass
        
    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        """Toggle like on a blog post"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
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
            
            # Create activity log for liking
            UserActivity.objects.create(
                user=request.user,
                activity_type='blog_like',
                title=f'Liked: {post.title}',
                description=f'Liked blog post by {post.author.username}',
                content_type='blog',
                object_id=post.id
            )
        
        post.save()
        
        return Response({
            'liked': liked,
            'likes_count': post.likes
        })
    
    @action(detail=True, methods=['post'])
    def toggle_bookmark(self, request, pk=None):
        """Toggle bookmark on a blog post"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
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
            
            # Create activity log for bookmarking
            UserActivity.objects.create(
                user=request.user,
                activity_type='blog_like',  # Using same type as likes for bookmarks
                title=f'Bookmarked: {post.title}',
                description=f'Bookmarked blog post for later reading',
                content_type='blog',
                object_id=post.id
            )
        
        return Response({
            'bookmarked': bookmarked
        })
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Get current user's blog posts"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        posts = BlogPost.objects.filter(author=request.user).order_by('-created_at')
        serializer = BlogPostListSerializer(
            posts, 
            many=True, 
            context=self.get_serializer_context()
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_bookmarks(self, request):
        """Get current user's bookmarked posts"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        bookmarks = BlogBookmark.objects.filter(user=request.user).select_related('post')
        posts = [bookmark.post for bookmark in bookmarks]
        serializer = BlogPostListSerializer(
            posts, 
            many=True, 
            context=self.get_serializer_context()
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def increment_views(self, request, pk=None):
        """Increment view count for a blog post"""
        post = self.get_object()
        post.increment_views()
        
        # Optional: Create activity log for viewing (if you want to track this)
        # UserActivity.objects.create(
        #     user=request.user if request.user.is_authenticated else None,
        #     activity_type='blog_view',
        #     title=f'Viewed: {post.title}',
        #     description=f'Viewed blog post',
        #     content_type='blog',
        #     object_id=post.id
        # )
        
        return Response({
            'views': post.views
        })