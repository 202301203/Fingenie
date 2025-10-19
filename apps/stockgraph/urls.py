# stock_graph/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('graph-data/<str:ticker>/<str:period>/', views.get_stock_data_api, name='get_stock_data_api'),
]