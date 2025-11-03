# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('api/register/', views.register_api, name='register'),
    path('api/login/', views.login_api, name='login'),
    path('api/logout/', views.logout_api, name='logout'),
    path('api/check-auth/', views.check_auth_api, name='check-auth'),
    path('api/google-login/', views.google_login_api, name='google-login'),
    #path('api/google-connect/', views.google_connect_api, name='google-connect'),
    #path('api/google-auth-url/', views.google_auth_url_api, name='google-auth-url'),
    
    # Utility endpoints
    path('api/csrf-token/', views.get_csrf_token, name='csrf-token'),
    path('api/profile/', views.user_profile_api, name='profile'),
    path('api/test/', views.test_api, name='test-api'),
]