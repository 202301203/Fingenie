# apps/dataprocessor/tests/test_services_extraction.py
from types import SimpleNamespace
from unittest.mock import patch
from apps.dataprocessor import services


def _fake_structured_runner(return_obj):
    """Builds a fake with .invoke() returning `return_obj`."""
    return SimpleNamespace(invoke=lambda prompt: return_obj)


def test_extract_raw_financial_data_happy_path():
    # Mock ChatGroq → with_structured_output → invoke => returns pydantic-like object
    class FakeItem:
        def __init__(self, p, cy=None, py=None):
            self.particulars = p
            self.current_year = cy
            self.previous_year = py

    class FakeExtraction:
        def __init__(self):
            self.company_name = "Acme Ltd"
            self.ticker_symbol = "ACME.NS"
            self.financial_items = [FakeItem("Revenue", 1000, 900)]

    with patch.object(services, "create_groq_llm") as m:
        fake_llm = SimpleNamespace(with_structured_output=lambda schema: _fake_structured_runner(FakeExtraction()))
        m.return_value = fake_llm
        res = services.extract_raw_financial_data("ctx", api_key="k")
    assert res["success"] is True
    assert res["company_name"] == "Acme Ltd"
    assert res["financial_items"][0]["particulars"] == "Revenue"


def test_extract_raw_financial_data_fallback_manual():
    # Force create_groq_llm to raise so we hit manual fallback path
    with patch.object(services, "create_groq_llm", side_effect=Exception("boom")), \
         patch.object(services, "extract_financial_data_manual", return_value={"success": True, "financial_items": []}) as mf:
        res = services.extract_raw_financial_data("ctx", api_key="k")
    assert res["success"] is True
    mf.assert_called()
