# blogs/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BlogPostViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'posts', BlogPostViewSet, basename='blogpost')

# Additional direct URLs for better organization
additional_urlpatterns = [
    # Utility endpoints that don't fit well in the ViewSet
    path('categories/', BlogPostViewSet.as_view({'get': 'list'}), name='blog_categories'),
]

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/', include(additional_urlpatterns)),
]

# Optional: Add this for backward compatibility or direct access
legacy_urlpatterns = [
    path('blog/', include(router.urls)),  # Also available at /blog/posts/ etc.
]

urlpatterns += legacy_urlpatterns