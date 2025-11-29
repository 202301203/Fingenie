# apps/dataprocessor/tests/test_services_ratios.py
from types import SimpleNamespace
from unittest.mock import patch
from apps.dataprocessor import services


def _fake_structured_runner(return_obj):
    return SimpleNamespace(invoke=lambda prompt: return_obj)


def test_generate_ratios_from_data():
    class RatioObj:
        def __init__(self):
            self.ratio_name = "Current Ratio"
            self.formula = "CA/CL"
            self.calculation = "200/100 = 2.0"
            self.result = 2.0
            self.interpretation = "Good"

    class FakeRatios:
        def __init__(self):
            self.financial_ratios = [RatioObj()]

    with patch.object(services, "create_groq_llm") as m:
        fake_llm = SimpleNamespace(with_structured_output=lambda schema: _fake_structured_runner(FakeRatios()))
        m.return_value = fake_llm
        out = services.generate_ratios_from_data([{"particulars": "CA", "current_year": 200}], api_key="k")

    assert out["success"] is True
    assert out["financial_ratios"][0]["result"] == 2.0
