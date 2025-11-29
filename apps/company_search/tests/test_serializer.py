import pytest
import apps.company_search.serializers as serializers_module

class TestFinancialStatementBaseSerializer:
    def test_01_nan_cleaning(self):
        """Test that NaN values are cleaned to None."""
        class TestSer(serializers_module.FinancialStatementBaseSerializer):
            val = pytest.importorskip("rest_framework.serializers").FloatField()
            
        obj = type('Obj', (), {'symbol': 'A', 'period': '2023-01-01', 'val': float('nan')})()
        serializer = TestSer(obj)
        assert serializer.data['val'] is None

    def test_02_period_validation(self):
        """Test date format validation."""
        # Valid
        ser = serializers_module.FinancialStatementBaseSerializer(data={'symbol': 'A', 'period': '2023-01-01'})
        assert ser.is_valid()
        
        # Invalid length
        ser = serializers_module.FinancialStatementBaseSerializer(data={'symbol': 'A', 'period': '01/01/202'})
        assert not ser.is_valid()
        
        # Invalid separators
        ser = serializers_module.FinancialStatementBaseSerializer(data={'symbol': 'A', 'period': '2023/01/01'})
        assert not ser.is_valid()


class TestBalanceSheetSerializer:
    def test_03_valid_equation(self):
        """Test Asset = Liab + Equity."""
        data = {
            "symbol": "T", "period": "2023-01-01",
            "total_assets": 100.0, "total_liabilities": 40.0,
            "total_equity": 60.0, "total_liabilities_and_equity": 100.0
        }
        serializer = serializers_module.BalanceSheetSerializer(data=data)
        assert serializer.is_valid()

    def test_04_invalid_equation(self):
        """Test validation error when equations don't balance."""
        data = {
            "symbol": "T", "period": "2023-01-01",
            "total_assets": 100.0, "total_liabilities": 40.0,
            "total_equity": 40.0, "total_liabilities_and_equity": 80.0
        }
        serializer = serializers_module.BalanceSheetSerializer(data=data)
        assert not serializer.is_valid()
        assert "Balance sheet doesn't balance" in str(serializer.errors)

    def test_04b_boundary_equation(self):
        """
        Test strict boundary conditions to kill ROR mutants ( > vs >= ).
        Logic: abs(diff) > 0.01 is Error.
        """
        # Case 1: Diff is 0.01. (0.01 > 0.01 is False) -> Valid
        # 100.01 - 100.00 = 0.01
        data_valid = {
            "symbol": "T", "period": "2023-01-01",
            "total_assets": 100.01, 
            "total_liabilities": 0, "total_equity": 0, 
            "total_liabilities_and_equity": 100.0
        }
        ser_valid = serializers_module.BalanceSheetSerializer(data=data_valid)
        assert ser_valid.is_valid(), f"Should be valid (diff 0.01): {ser_valid.errors}"

        # Case 2: Diff is 0.011. (0.011 > 0.01 is True) -> Invalid
        # 100.011 - 100.00 = 0.011
        data_invalid = {
            "symbol": "T", "period": "2023-01-01",
            "total_assets": 100.011, 
            "total_liabilities": 0, "total_equity": 0, 
            "total_liabilities_and_equity": 100.0
        }
        ser_invalid = serializers_module.BalanceSheetSerializer(data=data_invalid)
        assert not ser_invalid.is_valid(), "Should be invalid (diff 0.011)"


class TestIncomeStatementSerializer:
    def test_05_valid_profit(self):
        """Test Revenue - Cost = Gross Profit."""
        data = {
            "symbol": "T", "period": "2023-01-01",
            "total_revenue": 200, "cost_of_revenue": 100, "gross_profit": 100
        }
        serializer = serializers_module.IncomeStatementSerializer(data=data)
        assert serializer.is_valid()

    def test_06_invalid_profit(self):
        """Test validation error on math mismatch."""
        data = {
            "symbol": "T", "period": "2023-01-01",
            "total_revenue": 200, "cost_of_revenue": 100, "gross_profit": 999
        }
        serializer = serializers_module.IncomeStatementSerializer(data=data)
        assert not serializer.is_valid()

    def test_06b_boundary_profit(self):
        """Kill ROR mutants for Income Statement."""
        # Diff 0.01 -> Valid
        data_valid = {
            "symbol": "T", "period": "2023-01-01",
            "total_revenue": 100.01, "cost_of_revenue": 0, "gross_profit": 100.0
        }
        ser_valid = serializers_module.IncomeStatementSerializer(data=data_valid)
        assert ser_valid.is_valid()

        # Diff 0.011 -> Invalid
        data_invalid = {
            "symbol": "T", "period": "2023-01-01",
            "total_revenue": 100.011, "cost_of_revenue": 0, "gross_profit": 100.0
        }
        ser_invalid = serializers_module.IncomeStatementSerializer(data=data_invalid)
        assert not ser_invalid.is_valid()


class TestCashFlowSerializer:
    def test_07_valid_flow(self):
        """Test cash flow equation."""
        data = {
            "symbol": "T", "period": "2023-01-01",
            "net_cash_from_operating_activities": 10,
            "net_cash_from_investing_activities": 10,
            "net_cash_from_financing_activities": 10,
            "net_change_in_cash": 30
        }
        serializer = serializers_module.CashFlowSerializer(data=data)
        assert serializer.is_valid()

    def test_08_invalid_flow(self):
        """Test validation failure on math mismatch."""
        data = {
            "symbol": "T", "period": "2023-01-01",
            "net_cash_from_operating_activities": 10,
            "net_cash_from_investing_activities": 10,
            "net_cash_from_financing_activities": 10,
            "net_change_in_cash": 0
        }
        serializer = serializers_module.CashFlowSerializer(data=data)
        assert not serializer.is_valid()

    def test_08b_boundary_flow(self):
        """Kill ROR mutants for Cash Flow."""
        # Diff 0.01 -> Valid
        data_valid = {
            "symbol": "T", "period": "2023-01-01",
            "net_cash_from_operating_activities": 100.01, 
            "net_cash_from_investing_activities": 0,
            "net_cash_from_financing_activities": 0,
            "net_change_in_cash": 100.0
        }
        ser_valid = serializers_module.CashFlowSerializer(data=data_valid)
        assert ser_valid.is_valid()

        # Diff 0.011 -> Invalid
        data_invalid = {
            "symbol": "T", "period": "2023-01-01",
            "net_cash_from_operating_activities": 100.011, 
            "net_cash_from_investing_activities": 0,
            "net_cash_from_financing_activities": 0,
            "net_change_in_cash": 100.0
        }
        ser_invalid = serializers_module.CashFlowSerializer(data=data_invalid)
        assert not ser_invalid.is_valid()


class TestStockPriceSerializer:
    def test_09_computed_fields(self):
        """Test calculation of change and formatted fields."""
        data = {"symbol": "T", "current_price": 110, "previous_close": 100, "market_cap": 1000000}
        serializer = serializers_module.StockPriceSerializer(data)
        assert serializer.data['price_change'] == 10
        assert serializer.data['price_change_percent'] == 10.0
        assert serializer.data['formatted_market_cap'] == "$1.00M"

    def test_09b_dividend_and_zero_prev_close(self):
        """Dividend yield formatting and percent None when previous_close==0."""
        data = {"symbol": "T", "current_price": 110, "previous_close": 0, "dividend_yield": 0.025}
        serializer = serializers_module.StockPriceSerializer(data)
        assert serializer.data['price_change_percent'] is None
        assert serializer.data['formatted_dividend_yield'] == "2.50%"

    def test_09c_missing_values_paths(self):
        """Cover None-return paths for computed fields when inputs absent."""
        data = {"symbol": "T"}  # No prices/dividend/market cap
        serializer = serializers_module.StockPriceSerializer(data)
        assert serializer.data['price_change'] is None
        assert serializer.data['price_change_percent'] is None
        assert serializer.data['formatted_market_cap'] is None
        assert serializer.data['formatted_dividend_yield'] is None
        
    def test_09d_math_operators(self):
        """
        Target AOR (Arithmetic Operator Replacement) mutants in price_change logic.
        Mutant: current - previous  --> current + previous
        """
        data = {"symbol": "T", "current_price": 100, "previous_close": 50}
        serializer = serializers_module.StockPriceSerializer(data)
        
        # If operator was changed to +, result would be 150
        assert serializer.data['price_change'] == 50  
        
        # Test percent calculation: ((100-50)/50)*100 = 100.0%
        assert serializer.data['price_change_percent'] == 100.0


class TestComprehensiveSerializer:
    def test_10_symbol_mismatch(self):
        """Test that nested components must match the main symbol."""
        data = {
            "company_info": {"symbol": "A", "name": "A"},
            "stock_price": {"symbol": "B"}, # Mismatch
            "balance_sheet": [], "income_statement": [], "cash_flow": []
        }
        serializer = serializers_module.ComprehensiveFinancialDataSerializer(data=data)
        assert not serializer.is_valid()
        assert "must belong to the same company" in str(serializer.errors)


class TestCompanyInfoSerializer:
    def test_11_employee_formatting(self):
        """Test K/M formatting for employees."""
        ser = serializers_module.CompanyInfoSerializer({"symbol": "A", "name": "A", "employees": 1500})
        assert ser.data["formatted_employees"] == "1.5K"
        ser2 = serializers_module.CompanyInfoSerializer({"symbol": "A", "name": "A", "employees": 2500000})
        assert ser2.data["formatted_employees"] == "2.5M"

    def test_12_employee_small_and_none(self):
        """Employees <1000 returns raw number; None yields None."""
        ser_small = serializers_module.CompanyInfoSerializer({"symbol": "A", "name": "A", "employees": 500})
        assert ser_small.data['formatted_employees'] == '500'
        ser_none = serializers_module.CompanyInfoSerializer({"symbol": "A", "name": "A", "employees": None})
        assert ser_none.data['formatted_employees'] is None
        
    def test_12b_employee_boundary(self):
        """
        Kill ROR mutants on employee count boundaries (>= 1000, >= 1000000).
        """
        # Exact 1000 -> 1.0K
        ser_1k = serializers_module.CompanyInfoSerializer({"symbol": "A", "name": "A", "employees": 1000})
        assert ser_1k.data['formatted_employees'] == "1.0K"
        
        # 999 -> '999'
        ser_999 = serializers_module.CompanyInfoSerializer({"symbol": "A", "name": "A", "employees": 999})
        assert ser_999.data['formatted_employees'] == "999"
        
        # Exact 1,000,000 -> 1.0M
        ser_1m = serializers_module.CompanyInfoSerializer({"symbol": "A", "name": "A", "employees": 1000000})
        assert ser_1m.data['formatted_employees'] == "1.0M"


class TestComprehensiveFinancialDataSerializer:
    def test_13_valid_match(self):
        """All nested symbols match => valid."""
        data = {
            "company_info": {"symbol": "X", "name": "X"},
            "stock_price": {"symbol": "X"},
            "balance_sheet": [{"symbol": "X", "period": "2023-01-01"}],
            "income_statement": [{"symbol": "X", "period": "2023-01-01"}],
            "cash_flow": [{"symbol": "X", "period": "2023-01-01"}],
        }
        ser = serializers_module.ComprehensiveFinancialDataSerializer(data=data)
        assert ser.is_valid(), ser.errors

    def test_13b_skip_symbol_validation_when_missing(self):
        """Missing company_info.symbol should raise required field error."""
        data = {
            "company_info": {"name": "NoSymbol"},
            "stock_price": {"symbol": "OTHER"},  
            "balance_sheet": [], "income_statement": [], "cash_flow": []
        }
        ser = serializers_module.ComprehensiveFinancialDataSerializer(data=data)
        assert not ser.is_valid()
        assert 'symbol' in ser.errors['company_info']


class TestAdditionalSerializers:
    def test_14_search_result_serializer(self):
        ser = serializers_module.SearchResultSerializer({"symbol": "AAPL", "name": "Apple", "exchange": "NASDAQ", "type": "Equity"})
        assert ser.data['symbol'] == 'AAPL'

    def test_15_error_response_serializer(self):
        ser = serializers_module.ErrorResponseSerializer({"error": "Bad", "detail": "x", "code": "bad_request"})
        assert ser.data['code'] == 'bad_request'

    def test_16_success_response_serializer_defaults(self):
        ser = serializers_module.SuccessResponseSerializer({"message": "OK", "data": {"v": 1}})
        assert ser.data['success'] is True
        assert ser.data['data']['v'] == 1


class TestSerializerSkipValidationPaths:
    def test_17_balance_sheet_skip_when_incomplete(self):
        """No validation error when equation fields missing."""
        data = {"symbol": "T", "period": "2023-01-01", "total_assets": 10}
        ser = serializers_module.BalanceSheetSerializer(data=data)
        assert ser.is_valid(), ser.errors

    def test_18_income_statement_skip_gross_profit_missing(self):
        data = {"symbol": "T", "period": "2023-01-01", "total_revenue": 10}
        ser = serializers_module.IncomeStatementSerializer(data=data)
        assert ser.is_valid(), ser.errors

    def test_19_cash_flow_skip_when_incomplete(self):
        data = {"symbol": "T", "period": "2023-01-01", "net_cash_from_operating_activities": 1}
        ser = serializers_module.CashFlowSerializer(data=data)
        assert ser.is_valid(), ser.errors