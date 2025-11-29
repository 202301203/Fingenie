# dataprocessor/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ============================================
    # MAIN PROCESSING ENDPOINTS
    # ============================================
    path('api/process/', views.process_financial_statements_api, name='process_financial_statements'),
    
    # ============================================
    # REPORT ACCESS ENDPOINTS
    # ============================================
    path('api/reports/<str:report_id>/', views.get_report_by_id_api, name='get_report_by_id_api'),
    path('api/latest-report/', views.get_latest_report_api, name='get_latest_report_api'),
    
    # ============================================
    # PROFILE-INTEGRATED ENDPOINTS (NEW)
    # ============================================
    path('api/profile/summary-history/', views.user_summary_history, name='user_summary_history'),
    path('api/profile/recent-analyses/', views.get_recent_analyses, name='recent_analyses'),
    path('api/reports/<str:report_id>/delete/', views.delete_report_api, name='delete_report_api'),
    
    # ============================================
    # STOCK DATA ENDPOINTS
    # ============================================
    path('api/stock-data/<str:ticker_symbol>/', views.get_stock_data_api, name='get_stock_data_api'),
    path('api/stock-data/<str:ticker_symbol>/<str:period>/', views.get_stock_data_api, name='get_stock_data_with_period'),
    
    # ============================================
    # TEST ENDPOINT (Optional)
    # ============================================
    # path('api/test/', views.test_process_api, name='test_process_api'),
]
