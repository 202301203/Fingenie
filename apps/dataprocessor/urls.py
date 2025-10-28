# pdf_app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # This makes your API endpoint available at:
    # http://localhost:8000/dataprocessor/extract/
    path('extract/', views.extract_data_api, name='extract_data_api'),
    
    # This was the simple HTML upload form view you already had
    path('upload/', views.upload_file_view, name='upload_file'),
]