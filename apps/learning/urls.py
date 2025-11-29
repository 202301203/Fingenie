from django.urls import path
from . import views

urlpatterns = [
    # This will be the endpoint your frontend calls
    # e.g., /api/learning/daily-topic/
    path('daily-topic/', views.get_daily_topic_view, name='get_daily_topic'),
]
