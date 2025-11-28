# apps/chatbot/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('chatbot/', views.chatbot_api_view, name='chatbot_api'),
]