from django.urls import path
from . import views

urlpatterns = [
    # This will be the endpoint your frontend calls
    # e.g., /api/insights/chat/
    path('chat/', views.ai_insights_view, name='ai_insights_chat'),
]