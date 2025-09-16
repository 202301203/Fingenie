# Common_BS_analysis/urls.py
from django.urls import path
from .views import AnalysisView   # import your class-based view

urlpatterns = [
    path('analyze/', AnalysisView.as_view(), name='analyze'),
]
