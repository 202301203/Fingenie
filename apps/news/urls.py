# blog/urls.py

from django.urls import path
from . import views

app_name = 'news'

urlpatterns = [
    path('api/articles/', views.article_api, name='article_api'),
]