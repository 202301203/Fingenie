from django.urls import path
from . import views

app_name = "sector_overview"

urlpatterns = [
    path("", views.dashboard_view, name="dashboard"),
    path("api/overview/", views.sector_overview_api, name="api_overview"),
]
