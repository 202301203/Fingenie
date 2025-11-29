import pytest
import json
from apps.company_search.renderers import (
    SafeJSONRenderer, CompactJSONRenderer, 
    FinancialDataRenderer, PrettyJSONRenderer
)

class TestSafeJSONRenderer:
    def test_01_render_basic_dict(self):
        """Test standard dictionary rendering."""
        renderer = SafeJSONRenderer()
        data = {"key": "value", "num": 123}
        result = renderer.render(data)
        assert b'"key":"value"' in result

    def test_02_render_nan_handling(self):
        """Test that NaN values are removed (cleaned) from the output."""
        renderer = SafeJSONRenderer()
        data = {"bad": float('nan'), "good": 1}
        result = renderer.render(data)
        parsed = json.loads(result)
        
        # Your clean_financial_data removes keys with NaN/None values
        assert "bad" not in parsed
        assert parsed["good"] == 1

    def test_03_render_inf_handling(self):
        """Test that Infinity values are removed (cleaned) from the output."""
        renderer = SafeJSONRenderer()
        data = {"high": float('inf'), "low": float('-inf'), "valid": 10}
        result = renderer.render(data)
        parsed = json.loads(result)
        
        assert "high" not in parsed
        assert "low" not in parsed
        assert parsed["valid"] == 10

    def test_04_format_error_response_structure(self):
        """Test standard error structure for 400+ status codes."""
        renderer = SafeJSONRenderer()
        context = {'response': type('obj', (), {'status_code': 400})()}
        data = {"detail": "Invalid input"}
        
        result = renderer.render(data, renderer_context=context)
        parsed = json.loads(result)
        
        assert parsed['success'] is False
        assert parsed['status_code'] == 400
        assert parsed['error'] == "An error occurred"

    def test_05_format_string_error(self):
        """Test handling string error messages."""
        renderer = SafeJSONRenderer()
        context = {'response': type('obj', (), {'status_code': 500})()}
        data = "Server Error"
        
        result = renderer.render(data, renderer_context=context)
        parsed = json.loads(result)
        
        assert parsed['success'] is False
        assert parsed['error'] == "Server Error"


class TestCompactJSONRenderer:
    def test_06_removes_null_values(self):
        """Test that None values are stripped from output."""
        renderer = CompactJSONRenderer()
        data = {"keep": 1, "drop": None}
        result = renderer.render(data)
        parsed = json.loads(result)
        assert "drop" not in parsed
        assert parsed["keep"] == 1

    def test_07_removes_nested_nulls(self):
        """Test recursive null removal."""
        renderer = CompactJSONRenderer()
        data = {"outer": {"inner": None, "valid": 2}}
        result = renderer.render(data)
        parsed = json.loads(result)
        assert "inner" not in parsed["outer"]
        assert parsed["outer"]["valid"] == 2

    def test_08_handles_lists(self):
        """Test null removal in lists."""
        renderer = CompactJSONRenderer()
        data = {"list": [1, None, 3]}
        result = renderer.render(data)
        parsed = json.loads(result)
        assert parsed["list"] == [1, 3]


class TestFinancialDataRenderer:
    def test_09_adds_metadata_on_success(self):
        """Test metadata injection for success responses."""
        renderer = FinancialDataRenderer()
        context = {'response': type('obj', (), {'status_code': 200})()}
        data = {"revenue": 100}
        
        result = renderer.render(data, renderer_context=context)
        parsed = json.loads(result)
        
        assert "_metadata" in parsed
        assert parsed["_metadata"]["currency"] == "USD"

    def test_10_skips_metadata_on_error(self):
        """Test metadata is NOT added for error responses."""
        renderer = FinancialDataRenderer()
        context = {'response': type('obj', (), {'status_code': 404})()}
        data = {"error": "Not Found"}
        
        result = renderer.render(data, renderer_context=context)
        parsed = json.loads(result)
        
        assert "_metadata" not in parsed
        assert parsed["success"] is False


class TestPrettyJSONRenderer:
    def test_11_indentation(self):
        """Test that output contains indentation/newlines."""
        renderer = PrettyJSONRenderer()
        data = {"a": 1, "b": 2}
        result = renderer.render(data)
        assert b'\n' in result
        assert b'  ' in result

    def test_12_pretty_existing_indent(self):
        """If indent provided, renderer keeps it."""
        renderer = PrettyJSONRenderer()
        data = {"a": 1}
        ctx = {'response': type('obj', (), {'status_code': 200})(), 'indent': 4}
        result = renderer.render(data, renderer_context=ctx)
        # Expect indentation of 4 spaces present
        assert b'    "a"' in result


class TestAdditionalSafeJSONBranches:
    def test_13_error_dict_branch(self):
        """SafeJSONRenderer formats dict with existing error key differently."""
        renderer = SafeJSONRenderer()
        ctx = {'response': type('obj', (), {'status_code': 404})()}
        data = {"error": "Not Found", "detail": "Missing", "code": "custom"}
        result = renderer.render(data, renderer_context=ctx)
        parsed = json.loads(result)
        assert parsed['error'] == 'Not Found'
        assert parsed['code'] == 'custom'
        assert parsed['status_code'] == 404

    def test_14_safe_renderer_exception_fallback(self, monkeypatch):
        """Trigger exception inside render to cover except path."""
        from apps.company_search import renderers as rmods
        def boom(*args, **kwargs):
            raise RuntimeError("clean fail")
        monkeypatch.setattr(rmods, 'clean_financial_data', boom)
        renderer = SafeJSONRenderer()
        ctx = {'response': type('obj', (), {'status_code': 200})()}
        result = renderer.render({"x": 1}, renderer_context=ctx)
        parsed = json.loads(result)
        assert 'error' in parsed
        assert parsed['error'].startswith('Internal server error')


class TestCompactJSONRendererExtra:
    def test_15_compact_exception_fallback(self, monkeypatch):
        """Trigger exception to exercise CompactJSONRenderer except block."""
        renderer = CompactJSONRenderer()
        def explode(*args, **kwargs):
            raise ValueError("boom")
        monkeypatch.setattr(renderer, 'remove_null_values', explode)
        result = renderer.render({"a": None})
        # Falls back to SafeJSONRenderer logic yielding basic success dict (None cleaned out)
        parsed = json.loads(result)
        assert isinstance(parsed, dict)


class TestFinancialDataRendererBranches:
    def test_16_financial_non_dict(self):
        """Enhance method passes through non-dict unchanged with metadata skipped."""
        renderer = FinancialDataRenderer()
        ctx = {'response': type('obj', (), {'status_code': 200})()}
        data = [1, 2, 3]
        result = renderer.render(data, renderer_context=ctx)
        parsed = json.loads(result)
        # Non-dict data becomes list (no metadata injection)
        assert parsed == [1, 2, 3]

    def test_17_financial_error_dict(self):
        """Error status >=400 prevents metadata injection."""
        renderer = FinancialDataRenderer()
        ctx = {'response': type('obj', (), {'status_code': 500})()}
        data = {"revenue": 100}
        result = renderer.render(data, renderer_context=ctx)
        parsed = json.loads(result)
        assert '_metadata' not in parsed

    def test_18_financial_exception_fallback(self, monkeypatch):
        """Trigger exception in enhance_financial_data to cover except path."""
        renderer = FinancialDataRenderer()
        def bomb(*args, **kwargs):
            raise RuntimeError("fail enhance")
        monkeypatch.setattr(renderer, 'enhance_financial_data', bomb)
        ctx = {'response': type('obj', (), {'status_code': 200})()}
        result = renderer.render({"x": 2}, renderer_context=ctx)
        parsed = json.loads(result)
        # Fallback should just output cleaned original data
        assert parsed.get('x') == 2