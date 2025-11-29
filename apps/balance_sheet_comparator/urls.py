from django.urls import path
from . import views
#URLS for balance_sheet_comparator app
app_name = 'balance_sheet_comparator'

urlpatterns = [
    path('compare/', views.compare_balance_sheets_api, name='compare'),
    path('comparison/<str:comparison_id>/', views.get_comparison_api, name='get_comparison'),
    path('comparisons/', views.list_comparisons_api, name='list_comparisons'),
]
