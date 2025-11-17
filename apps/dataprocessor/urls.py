from django.urls import path
from . import views

urlpatterns = [
    # Main processing endpoint
    path('api/process/', views.process_financial_statements_api, name='process_financial_statements'),
    
    # Report endpoints
    path('api/reports/<str:report_id>/', views.get_report_by_id_api, name='get_report_by_id_api'),
    path('api/latest-report/', views.get_latest_report_api, name='get_latest_report_api'),
    
    # Stock data endpoints (placeholder - will implement later)
    # path('api/stock-data/<str:ticker_symbol>/', views.get_stock_data_api, name='get_stock_data_api'),
    # path('api/stock-data/<str:ticker_symbol>/<str:period>/', views.get_stock_data_api, name='get_stock_data_with_period'),
]