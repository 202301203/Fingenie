# apps/chatbot/urls.py (NEW FILE)
from django.urls import path
from . import views

urlpatterns = [
    path('api/chatbot/', views.chatbot_api_view, name='chatbot_api'),
]