from django.contrib import admin
from .models import CompanySearch, FinancialStatementCache

@admin.register(CompanySearch)
class CompanySearchAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'name', 'search_count', 'last_searched', 'created_at')
    list_filter = ('last_searched', 'created_at')
    search_fields = ('symbol', 'name')
    ordering = ('-search_count',)
    readonly_fields = ('search_count', 'last_searched', 'created_at')

@admin.register(FinancialStatementCache)
class FinancialStatementCacheAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'statement_type', 'period', 'last_updated')
    list_filter = ('statement_type', 'last_updated')
    search_fields = ('symbol',)
    ordering = ('-last_updated',)
    readonly_fields = ('last_updated',)
