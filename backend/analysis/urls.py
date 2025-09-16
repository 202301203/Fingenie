from django.urls import path
from .views import AnalysisView

urlpatterns = [
    path('analyze/', AnalysisView.as_view(), name='analyze'),
]
