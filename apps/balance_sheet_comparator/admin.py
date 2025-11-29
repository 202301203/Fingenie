from django.contrib import admin
from .models import BalanceSheetComparison

@admin.register(BalanceSheetComparison)
class BalanceSheetComparisonAdmin(admin.ModelAdmin):
    list_display = ('comparison_id', 'company1_name', 'company2_name', 'created_at')
    search_fields = ('company1_name', 'company2_name')
    list_filter = ('created_at',)
    readonly_fields = ('comparison_id', 'created_at')
#ADMIN