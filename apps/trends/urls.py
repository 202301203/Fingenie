# pdf_app/urls.py
from django.urls import path
from . import views

urlpatterns = [

    path('generate_trend/', views.process_financial_statements_api, name='process_financial_statements_api'),
    
    # This was the simple HTML upload form view you already had
    path('upload/', views.upload_file_view, name='upload_file'),
    
]