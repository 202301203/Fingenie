# pdf_app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.extract_data_api, name='extract_api'),
]
