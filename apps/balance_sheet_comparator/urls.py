from django.urls import path, include
from . import views

app_name = 'balance_sheet_comparator'

urlpatterns = [
    path('compare/', views.compare_balance_sheets_api, name='compare'),
    path('comparison/<str:comparison_id>/', views.get_comparison_api, name='get_comparison'),
    path('comparisons/', views.list_comparisons_api, name='list_comparisons'),
    path('api/balance_sheet_comparator/', include('apps.balance_sheet_comparator.urls')),
]
