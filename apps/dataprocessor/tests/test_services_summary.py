# apps/dataprocessor/tests/test_services_summary.py
from types import SimpleNamespace
from unittest.mock import patch
from apps.dataprocessor import services


def _fake_structured_runner(return_obj):
    return SimpleNamespace(invoke=lambda prompt: return_obj)


def test_generate_summary_from_data():
    class FakeSummary:
        def __init__(self):
            self.pros = ["Strong margins"]
            self.cons = ["High leverage"]
            self.financial_health_summary = "Overall healthy"

    with patch.object(services, "create_groq_llm") as m:
        fake_llm = SimpleNamespace(with_structured_output=lambda schema: _fake_structured_runner(FakeSummary()))
        m.return_value = fake_llm
        out = services.generate_summary_from_data([{"particulars": "Revenue", "current_year": 100}], api_key="k")

    assert out["success"] is True
    assert "Strong margins" in out["pros"]
