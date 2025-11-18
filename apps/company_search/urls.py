from django.urls import path
from . import views

app_name = 'company_search'

urlpatterns = [
    # Search endpoints
    path('search/', views.SearchCompanyView.as_view(), name='search-company'),
    
    # Comprehensive financial data - main endpoint
    path('company/<str:symbol>/', views.ComprehensiveFinancialDataView.as_view(), name='company-financial-data'),
    
    # Individual financial statements
    path('company/<str:symbol>/balance-sheet/', views.BalanceSheetView.as_view(), name='balance-sheet'),
    path('company/<str:symbol>/income-statement/', views.IncomeStatementView.as_view(), name='income-statement'),
    path('company/<str:symbol>/cash-flow/', views.CashFlowView.as_view(), name='cash-flow'),
    
    # Alternative: Single endpoint with statement type parameter (optional)
    # path('company/<str:symbol>/statement/<str:statement_type>/', 
    #      views.IndividualStatementView.as_view(), 
    #      name='financial-statement'),
    
    # Stock data endpoints
    path('company/<str:symbol>/stock-price/', views.StockPriceView.as_view(), name='stock-price'),
    path('company/<str:symbol>/info/', views.CompanyInfoView.as_view(), name='company-info'),
    path('company/<str:symbol>/historical/', views.HistoricalDataView.as_view(), name='historical-data'),
    
    # Analytics and metadata endpoints
    path('popular-searches/', views.PopularSearchesView.as_view(), name='popular-searches'),
    path('market-summary/', views.MarketSummaryView.as_view(), name='market-summary'),
    
    # Health check and API info
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    path('', views.APIRootView.as_view(), name='api-root'),
    path('search-suggestions/', views.SearchSuggestionsView.as_view(), name='search-suggestions'),
    path('company/<str:symbol>/analysis/', views.CompanyAnalysisView.as_view(), name='company-analysis'),
    path('company/<str:symbol>/ratios/', views.FinancialRatiosView.as_view(), name='financial-ratios'),
    path('company/<str:symbol>/quarterly/', views.QuarterlyResultsView.as_view(), name='quarterly-results'),

    path('company/<str:symbol>/chart/historical/', views.ChartHistoricalDataView.as_view(), name='chart-historical-data'),
    path('company/<str:symbol>/chart/financial-metrics/', views.FinancialMetricsChartView.as_view(), name='financial-metrics-chart'),
    path('company/<str:symbol>/chart/technical-indicators/', views.TechnicalIndicatorsView.as_view(), name='technical-indicators'),
    
    path('company/<str:symbol>/peer-analysis/', views.PeerAnalysisView.as_view(), name='peer-analysis'),
    path('company/<str:symbol>/custom-peers/', views.CustomPeerSearchView.as_view(), name='custom-peers'),
    
]