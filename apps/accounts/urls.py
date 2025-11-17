# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ============================================
    # AUTHENTICATION ENDPOINTS
    # ============================================
    path('api/register/', views.register_api, name='register'),
    path('api/login/', views.login_api, name='login'),
    path('api/google-login/', views.google_login_api, name='google_login'),
    path('api/logout/', views.logout_api, name='logout'),
    path('api/check-auth/', views.check_auth_api, name='check_auth'),
    path('api/auth-methods/', views.auth_methods_api, name='auth_methods'),
    
    # ============================================
    # PROFILE MANAGEMENT ENDPOINTS
    # ============================================
    # Main profile dashboard (complete user data)
    path('api/profile/dashboard/', views.profile_dashboard, name='profile_dashboard'),
    
    # Profile information (legacy and update)
    path('api/user/', views.user_profile_api, name='user_profile'),  # Legacy endpoint
    path('api/profile/update/', views.update_profile, name='update_profile'),
    
    # ============================================
    # ACTIVITY & HISTORY ENDPOINTS
    # ============================================
    path('api/profile/activities/', views.activity_log, name='activity_log'),
    
    # ============================================
    # SETTINGS ENDPOINTS
    # ============================================
    path('api/profile/settings/', views.user_settings, name='user_settings'),
    path('api/profile/password/', views.change_password, name='change_password'),
    
    # ============================================
    # FEEDBACK & SUPPORT ENDPOINTS
    # ============================================
    path('api/feedback/', views.feedback, name='feedback'),
    path('api/support/tickets/', views.support_tickets, name='support_tickets'),
    
    # ============================================
    # DATA & PRIVACY ENDPOINTS
    # ============================================
    path('api/profile/data-export/', views.user_data_export, name='user_data_export'),
    path('api/profile/delete-account/', views.delete_account, name='delete_account'),
    
    # ============================================
    # UTILITY ENDPOINTS
    # ============================================
    path('api/csrf-token/', views.get_csrf_token, name='csrf_token'),
    path('api/debug-session/', views.debug_session, name='debug_session'),
    path('api/test/', views.test_api, name='test_api'),
]