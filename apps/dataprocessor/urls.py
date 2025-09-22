from django.urls import path
from . import views

urlpatterns = [
    path("api/upload_financial/", views.upload_financial_file, name="upload_financial_file"),
]
