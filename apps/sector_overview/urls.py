from django.urls import path
from . import views

urlpatterns = [
    path('api/sector-overview/', views.sector_overview_api, name='sector-overview'),
    path('api/health/', views.health_check, name='health-check'),
    path('api/available-sectors/', views.available_sectors_api, name='available-sectors'),
]
