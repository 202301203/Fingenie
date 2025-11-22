from rest_framework import serializers
from .models import CompanySearch, FinancialStatementCache
from .utils import validate_financial_value, format_currency, format_percentage


class CompanySearchSerializer(serializers.ModelSerializer):
    last_searched = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = CompanySearch
        fields = ['symbol', 'name', 'search_count', 'last_searched', 'created_at']
        read_only_fields = ['search_count', 'last_searched', 'created_at']


class FinancialStatementCacheSerializer(serializers.ModelSerializer):
    last_updated = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    period = serializers.DateField(format='%Y-%m-%d')
    
    class Meta:
        model = FinancialStatementCache
        fields = ['symbol', 'statement_type', 'period', 'data', 'last_updated']
        read_only_fields = ['last_updated']


# Base serializer for common fields and validation
class FinancialStatementBaseSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=20)
    period = serializers.CharField(max_length=10)
    
    def validate_period(self, value):
        """Validate period format (YYYY-MM-DD)"""
        if len(value) != 10 or value[4] != '-' or value[7] != '-':
            raise serializers.ValidationError("Period must be in YYYY-MM-DD format")
        return value
    
    def to_representation(self, instance):
        """Convert NaN/None values to null in output"""
        representation = super().to_representation(instance)
        
        # Clean financial values in the representation
        for key, value in representation.items():
            if isinstance(value, float) and (value != value):  # Check for NaN
                representation[key] = None
        return representation


class BalanceSheetSerializer(FinancialStatementBaseSerializer):
    # Assets
    cash_and_cash_equivalents = serializers.FloatField(allow_null=True, required=False)
    short_term_investments = serializers.FloatField(allow_null=True, required=False)
    net_receivables = serializers.FloatField(allow_null=True, required=False)
    inventory = serializers.FloatField(allow_null=True, required=False)
    other_current_assets = serializers.FloatField(allow_null=True, required=False)
    total_current_assets = serializers.FloatField(allow_null=True, required=False)
    property_plant_equipment = serializers.FloatField(allow_null=True, required=False)
    long_term_investments = serializers.FloatField(allow_null=True, required=False)
    intangible_assets = serializers.FloatField(allow_null=True, required=False)
    other_assets = serializers.FloatField(allow_null=True, required=False)
    total_assets = serializers.FloatField(allow_null=True, required=False)
    
    # Liabilities
    accounts_payable = serializers.FloatField(allow_null=True, required=False)
    short_long_term_debt = serializers.FloatField(allow_null=True, required=False)
    other_current_liabilities = serializers.FloatField(allow_null=True, required=False)
    total_current_liabilities = serializers.FloatField(allow_null=True, required=False)
    long_term_debt = serializers.FloatField(allow_null=True, required=False)
    other_liabilities = serializers.FloatField(allow_null=True, required=False)
    total_liabilities = serializers.FloatField(allow_null=True, required=False)
    
    # Equity
    common_stock = serializers.FloatField(allow_null=True, required=False)
    retained_earnings = serializers.FloatField(allow_null=True, required=False)
    other_equity = serializers.FloatField(allow_null=True, required=False)
    total_equity = serializers.FloatField(allow_null=True, required=False)
    total_liabilities_and_equity = serializers.FloatField(allow_null=True, required=False)
    
    def validate(self, data):
        """Validate balance sheet accounting equation"""
        total_assets = data.get('total_assets')
        total_liabilities = data.get('total_liabilities')
        total_equity = data.get('total_equity')
        total_liabilities_and_equity = data.get('total_liabilities_and_equity')
        
        # Check if assets = liabilities + equity (with tolerance for rounding)
        if (total_assets is not None and total_liabilities is not None and 
            total_equity is not None and total_liabilities_and_equity is not None):
            if abs(total_assets - total_liabilities_and_equity) > 0.01:
                raise serializers.ValidationError(
                    "Balance sheet doesn't balance: Assets != Liabilities + Equity"
                )
        
        return data


class IncomeStatementSerializer(FinancialStatementBaseSerializer):
    # Revenue
    total_revenue = serializers.FloatField(allow_null=True, required=False)
    cost_of_revenue = serializers.FloatField(allow_null=True, required=False)
    gross_profit = serializers.FloatField(allow_null=True, required=False)
    
    # Operating Expenses
    research_development = serializers.FloatField(allow_null=True, required=False)
    selling_general_administrative = serializers.FloatField(allow_null=True, required=False)
    total_operating_expenses = serializers.FloatField(allow_null=True, required=False)
    operating_income = serializers.FloatField(allow_null=True, required=False)
    
    # Other Income/Expenses
    interest_expense = serializers.FloatField(allow_null=True, required=False)
    other_income_expense = serializers.FloatField(allow_null=True, required=False)
    income_before_tax = serializers.FloatField(allow_null=True, required=False)
    income_tax_expense = serializers.FloatField(allow_null=True, required=False)
    
    # Net Income
    net_income = serializers.FloatField(allow_null=True, required=False)
    net_income_applicable_to_common_shares = serializers.FloatField(allow_null=True, required=False)
    
    # EPS
    basic_eps = serializers.FloatField(allow_null=True, required=False)
    diluted_eps = serializers.FloatField(allow_null=True, required=False)
    
    def validate(self, data):
        """Validate income statement relationships"""
        total_revenue = data.get('total_revenue')
        cost_of_revenue = data.get('cost_of_revenue')
        gross_profit = data.get('gross_profit')
        
        # Check gross profit calculation
        if (total_revenue is not None and cost_of_revenue is not None and 
            gross_profit is not None):
            expected_gross_profit = total_revenue - cost_of_revenue
            if abs(gross_profit - expected_gross_profit) > 0.01:
                raise serializers.ValidationError(
                    f"Gross profit validation failed: {gross_profit} != {total_revenue} - {cost_of_revenue}"
                )
        
        return data


class CashFlowSerializer(FinancialStatementBaseSerializer):
    # Operating Activities
    net_income = serializers.FloatField(allow_null=True, required=False)
    depreciation_amortization = serializers.FloatField(allow_null=True, required=False)
    change_in_receivables = serializers.FloatField(allow_null=True, required=False)
    change_in_inventory = serializers.FloatField(allow_null=True, required=False)
    change_in_payables = serializers.FloatField(allow_null=True, required=False)
    other_operating_activities = serializers.FloatField(allow_null=True, required=False)
    net_cash_from_operating_activities = serializers.FloatField(allow_null=True, required=False)
    
    # Investing Activities
    capital_expenditures = serializers.FloatField(allow_null=True, required=False)
    investments = serializers.FloatField(allow_null=True, required=False)
    other_investing_activities = serializers.FloatField(allow_null=True, required=False)
    net_cash_from_investing_activities = serializers.FloatField(allow_null=True, required=False)
    
    # Financing Activities
    dividends_paid = serializers.FloatField(allow_null=True, required=False)
    stock_repurchase = serializers.FloatField(allow_null=True, required=False)
    debt_issuance_repayment = serializers.FloatField(allow_null=True, required=False)
    other_financing_activities = serializers.FloatField(allow_null=True, required=False)
    net_cash_from_financing_activities = serializers.FloatField(allow_null=True, required=False)
    
    # Net Change
    net_change_in_cash = serializers.FloatField(allow_null=True, required=False)
    free_cash_flow = serializers.FloatField(allow_null=True, required=False)
    
    def validate(self, data):
        """Validate cash flow statement relationships"""
        net_cash_operating = data.get('net_cash_from_operating_activities')
        net_cash_investing = data.get('net_cash_from_investing_activities')
        net_cash_financing = data.get('net_cash_from_financing_activities')
        net_change_cash = data.get('net_change_in_cash')
        
        # Check cash flow equation
        if (net_cash_operating is not None and net_cash_investing is not None and 
            net_cash_financing is not None and net_change_cash is not None):
            expected_change = net_cash_operating + net_cash_investing + net_cash_financing
            if abs(net_change_cash - expected_change) > 0.01:
                raise serializers.ValidationError(
                    f"Cash flow validation failed: {net_change_cash} != {net_cash_operating} + {net_cash_investing} + {net_cash_financing}"
                )
        
        return data


class StockPriceSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=20)
    current_price = serializers.FloatField(allow_null=True, required=False)
    previous_close = serializers.FloatField(allow_null=True, required=False)
    open_price = serializers.FloatField(allow_null=True, required=False)
    day_high = serializers.FloatField(allow_null=True, required=False)
    day_low = serializers.FloatField(allow_null=True, required=False)
    volume = serializers.FloatField(allow_null=True, required=False)
    market_cap = serializers.FloatField(allow_null=True, required=False)
    fifty_two_week_high = serializers.FloatField(allow_null=True, required=False)
    fifty_two_week_low = serializers.FloatField(allow_null=True, required=False)
    dividend_yield = serializers.FloatField(allow_null=True, required=False)
    pe_ratio = serializers.FloatField(allow_null=True, required=False)
    beta = serializers.FloatField(allow_null=True, required=False)
    
    # Computed fields for display
    price_change = serializers.SerializerMethodField()
    price_change_percent = serializers.SerializerMethodField()
    formatted_market_cap = serializers.SerializerMethodField()
    formatted_dividend_yield = serializers.SerializerMethodField()
    
    def get_price_change(self, obj):
        current = obj.get('current_price')
        previous = obj.get('previous_close')
        if current is not None and previous is not None:
            return current - previous
        return None
    
    def get_price_change_percent(self, obj):
        current = obj.get('current_price')
        previous = obj.get('previous_close')
        if current is not None and previous is not None and previous != 0:
            return ((current - previous) / previous) * 100
        return None
    
    def get_formatted_market_cap(self, obj):
        market_cap = obj.get('market_cap')
        if market_cap is not None:
            return format_currency(market_cap)
        return None
    
    def get_formatted_dividend_yield(self, obj):
        dividend_yield = obj.get('dividend_yield')
        if dividend_yield is not None:
            return format_percentage(dividend_yield)
        return None


class CompanyInfoSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=20)
    name = serializers.CharField(max_length=200)
    sector = serializers.CharField(allow_null=True, required=False, max_length=100)
    industry = serializers.CharField(allow_null=True, required=False, max_length=100)
    country = serializers.CharField(allow_null=True, required=False, max_length=50)
    website = serializers.URLField(allow_null=True, required=False, max_length=200)
    description = serializers.CharField(allow_null=True, required=False)
    employees = serializers.IntegerField(allow_null=True, required=False)
    currency = serializers.CharField(allow_null=True, required=False, max_length=10)
    exchange = serializers.CharField(allow_null=True, required=False, max_length=20)
    market = serializers.CharField(allow_null=True, required=False, max_length=20)
    
    # Computed field for formatted employee count
    formatted_employees = serializers.SerializerMethodField()
    
    def get_formatted_employees(self, obj):
        employees = obj.get('employees')
        if employees is not None:
            if employees >= 1_000_000:
                return f"{employees/1_000_000:.1f}M"
            elif employees >= 1_000:
                return f"{employees/1_000:.1f}K"
            else:
                return str(employees)
        return None


class ComprehensiveFinancialDataSerializer(serializers.Serializer):
    company_info = CompanyInfoSerializer()
    stock_price = StockPriceSerializer()
    balance_sheet = BalanceSheetSerializer(many=True)
    income_statement = IncomeStatementSerializer(many=True)
    cash_flow = CashFlowSerializer(many=True)
    recommendations = serializers.ListField(
        child=serializers.DictField(), 
        allow_empty=True, 
        required=False
    )
    historical_data = serializers.ListField(
        child=serializers.DictField(), 
        allow_empty=True, 
        required=False
    )
    earnings_dates = serializers.ListField(
        child=serializers.DictField(), 
        allow_empty=True, 
        required=False
    )
    options_chain = serializers.DictField(allow_null=True, required=False)
    
    def validate(self, data):
        """Validate that all data belongs to the same company"""
        symbol = data.get('company_info', {}).get('symbol')
        
        # Check if all components have the same symbol
        if symbol:
            if (data.get('stock_price', {}).get('symbol') != symbol or
                any(bs.get('symbol') != symbol for bs in data.get('balance_sheet', [])) or
                any(is_.get('symbol') != symbol for is_ in data.get('income_statement', [])) or
                any(cf.get('symbol') != symbol for cf in data.get('cash_flow', []))):
                raise serializers.ValidationError("All financial data must belong to the same company symbol")
        
        return data


# Additional serializers for API responses
class SearchResultSerializer(serializers.Serializer):
    symbol = serializers.CharField()
    name = serializers.CharField()
    exchange = serializers.CharField(allow_null=True, required=False)
    type = serializers.CharField(allow_null=True, required=False)


class ErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField()
    detail = serializers.CharField(allow_null=True, required=False)
    code = serializers.CharField(allow_null=True, required=False)


class SuccessResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(allow_null=True, required=False)
    data = serializers.DictField(allow_null=True, required=False)