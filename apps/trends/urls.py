# pdf_app/urls.py
from django.urls import path
from . import views

urlpatterns = [

    path('api/process-financial-statements/', views.process_financial_statements_api, name='process_financial_statements_api'),
    
    
]
