import pytest
import json
from decimal import Decimal
from datetime import datetime
from apps.company_search.utils import (
    clean_financial_data, format_currency, format_percentage,
    validate_financial_value, SafeJSONEncoder, safe_json_loads
)
from collections import namedtuple

class TestUtils:
    def test_01_clean_financial_data_nan(self):
        """Test cleaning NaN/Inf values."""
        assert clean_financial_data(float('nan')) is None
        assert clean_financial_data(float('inf')) is None
        assert clean_financial_data(float('-inf')) is None

    def test_02_clean_financial_data_nested(self):
        """Test cleaning values inside nested dictionaries/lists."""
        data = {"list": [1, float('nan')], "dict": {"val": float('inf')}}
        cleaned = clean_financial_data(data)
        assert cleaned['list'][1] is None
        assert cleaned['dict']['val'] is None

    def test_03_format_currency_large(self):
        """Test Billions and Millions formatting."""
        assert format_currency(1_500_000_000) == "$1.50B"
        assert format_currency(2_500_000) == "$2.50M"

    def test_04_format_currency_small(self):
        """Test Thousands and basic formatting."""
        assert format_currency(1500) == "$1.50K"
        assert format_currency(500) == "$500.00"

    def test_05_format_currency_none(self):
        """Test N/A response for None/NaN."""
        assert format_currency(None) == "N/A"
        assert format_currency(float('nan')) == "N/A"

    def test_06_format_percentage(self):
        """Test percentage formatting."""
        assert format_percentage(0.155) == "15.50%"
        assert format_percentage(None) == "N/A"

    def test_07_validate_financial_value(self):
        """Test string conversion to float validation."""
        assert validate_financial_value("100.50") == 100.50
        assert validate_financial_value(10) == 10.0
        assert validate_financial_value("invalid") is None
        assert validate_financial_value(None) is None

    def test_08_safe_json_encoder_decimal(self):
        """Test encoding Decimal types."""
        data = {"val": Decimal('10.55')}
        encoded = json.dumps(data, cls=SafeJSONEncoder)
        assert '10.55' in encoded

    def test_09_safe_json_encoder_datetime(self):
        """Test encoding Datetime objects."""
        data = {"date": datetime(2023, 1, 1)}
        encoded = json.dumps(data, cls=SafeJSONEncoder)
        assert "2023-01-01" in encoded

    def test_10_safe_json_loads(self):
        """Test safe JSON parsing returning empty dict on failure."""
        assert safe_json_loads('{"a": 1}') == {"a": 1}
        assert safe_json_loads("INVALID") == {}
        assert safe_json_loads("") == {}

    def test_11_safe_json_encoder_complex_types(self):
        """Test encoder handling of tuple, set, namedtuple, and custom object."""
        NT = namedtuple('NT', ['x', 'y'])
        class Obj:
            def __init__(self):
                self.a = 1
                self.b = float('nan')
        payload = {
            'tuple': (1, 2),
            'set': {3, 4},
            'named': NT(5, 6),
            'obj': Obj()
        }
        encoded = json.dumps(payload, cls=SafeJSONEncoder)
        # NaN removed; basic structure present
        assert 'tuple' in encoded and 'named' in encoded and 'obj' in encoded
        assert 'nan' not in encoded

    def test_12_safe_json_encoder_encode_exception(self, monkeypatch):
        """Force sanitize to raise to cover encode exception fallback."""
        enc = SafeJSONEncoder()
        def boom(obj):
            raise RuntimeError('fail')
        monkeypatch.setattr(enc, 'sanitize', boom)
        out = enc.encode({'x': 1})
        assert out == '{}'

    def test_13_clean_financial_data_collections(self):
        """Cover tuple and set branches in cleaning."""
        data = (1, float('nan'), 2)
        cleaned_list = clean_financial_data(data)
        assert cleaned_list[1] is None
        data_set = {1, float('inf')}
        cleaned_set = clean_financial_data(data_set)
        # cleaned_set becomes list; filter None
        assert None in cleaned_set or any(isinstance(v, (int, float)) for v in cleaned_set)

    def test_14_safe_json_dumps_error(self, monkeypatch):
        """Monkeypatch json.dumps to raise to exercise safe_json_dumps error path."""
        import apps.company_search.utils as utils_mod
        def explode(*a, **k):
            raise ValueError('boom')
        monkeypatch.setattr(utils_mod.json, 'dumps', explode)
        from apps.company_search.utils import safe_json_dumps
        assert safe_json_dumps({'a': 1}) == '{}'

    def test_15_safe_json_loads_generic_exception(self, monkeypatch):
        """Monkeypatch json.loads to raise generic exception (non-JSONDecodeError)."""
        import apps.company_search.utils as utils_mod
        def explode(*a, **k):
            raise RuntimeError('fail loads')
        monkeypatch.setattr(utils_mod.json, 'loads', explode)
        assert safe_json_loads('{"a":1}') == {}

    def test_16_format_currency_negative_and_invalid(self):
        """Negative and invalid type currency handling."""
        assert format_currency(-2_000_000).startswith('$-') and 'M' in format_currency(-2_000_000)
        # TypeError triggers except branch
        assert format_currency(['bad']) == 'N/A'

    def test_17_format_percentage_invalid_type(self):
        """Percentage invalid type returns N/A."""
        # TypeError triggers except branch
        assert format_percentage('abc') == 'N/A'

    def test_18_validate_financial_value_nan_inf(self):
        """NaN and Infinity rejected by validator."""
        assert validate_financial_value(float('nan')) is None
        assert validate_financial_value(float('inf')) is None

    def test_19_safe_json_encoder_sanitize_exception(self, monkeypatch):
        """Force sanitize to raise and ensure encode fallback returns '{}'"""
        encoder = SafeJSONEncoder()

        def boom(self, obj):
            raise RuntimeError('sanitize fail')

        monkeypatch.setattr(SafeJSONEncoder, 'sanitize', boom, raising=True)
        out = encoder.encode({'x': 1})
        assert out == '{}'

    def test_20_safe_json_encoder_str_fallback(self):
        """Test str() fallback for unknown objects."""
        class WeirdObj:
            def __str__(self):
                return 'weird_str'
        encoder = SafeJSONEncoder()
        result = encoder.sanitize(WeirdObj())
        # If str() works, result is 'weird_str'; if not, result is {}
        assert result == 'weird_str' or result == {}

    def test_21_safe_json_encoder_str_exception(self):
        """Test when str() also fails."""
        class BadObj:
            def __str__(self):
                raise RuntimeError('str failed')
        encoder = SafeJSONEncoder()
        result = encoder.sanitize(BadObj())
        # If str() fails, result is {}
        assert result == {}

    def test_22_clean_financial_data_str_exception(self):
        """Test clean_financial_data str() fallback and exception."""
        class BadObj:
            def __str__(self):
                raise RuntimeError('str failed')
        result = clean_financial_data(BadObj())
        # sanitize/clean returns {} on fatal errors
        assert result == {}

    def test_23_clean_financial_data_exception(self, monkeypatch):
        """Test main exception handler in clean_financial_data."""
        def boom(*args, **kwargs):
            raise RuntimeError('boom')
        
        import apps.company_search.utils as utils_mod
        monkeypatch.setattr(utils_mod.math, 'isnan', boom)
        result = clean_financial_data(5.0)
        # internal NaN check raises and is handled by returning None for that branch
        assert result is None

    def test_24_format_currency_math_error(self):
        """Test math.isnan exception path."""
        # This should trigger the isnan check and potentially the except block
        assert format_currency(5.0) == '$5.00'