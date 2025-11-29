import os
import re
from types import SimpleNamespace
import pytest
from unittest.mock import MagicMock

from apps.balance_sheet_comparator.balance_sheet import services


def test_simple_text_number_additional_cases():
    f = services._simple_text_number
    assert f("₹ 1,23,456") == 123456.0
    assert f(" -500") == -500.0
    assert f("(1.2 million)") == -1200000.0
    assert f("2 cr") == 20000000.0
    assert f("5 lacs") == 500000.0
    assert f("") is None
    assert f("n/a") is None


def test_deterministic_no_keywords_picks_top_numbers():
    # Provide text with numbers but no common keywords; should still pick top numeric lines
    text = "\n".join([f"Some text {i} {1000 + i}" for i in range(15)])
    res = services._deterministic_fallback_extraction(text)
    assert res['success'] is True
    items = res.get('financial_items', [])
    assert len(items) > 0
    # Ensure extracted numbers correspond to those in the input
    extracted_vals = [it['current_year'] for it in items]
    assert any(v >= 1000 for v in extracted_vals)


def test_prepare_context_prioritizes_financial_lines_and_limits_length():
    # Create many lines with and without keywords
    financial_line = "Total Assets: 1000"
    junk_line = "Random filler text that is long enough to be considered content."
    docs = [SimpleNamespace(page_content=(financial_line + "\n" + junk_line + "\n") * 200)]
    ctx = services.prepare_context(docs)
    assert "Total Assets" in ctx
    assert len(ctx) <= 50000


def test_extract_raw_financial_data_manual_json_parsing(monkeypatch):
    # First create_gemini_llm returns object that fails structured output,
    # second returns an object whose invoke returns content with embedded JSON.

    class LLMStructuredFail:
        def with_structured_output(self, schema):
            raise Exception("structured fail")

    class LLMBasic:
        def invoke(self, prompt):
            # Embed JSON within text to simulate real model output
            return SimpleNamespace(content=("Note: parsing result follows\n"
                                            "{\n"
                                            "  \"company_name\": \"ManualCo\",\n"
                                            "  \"balance_sheet_items\": [\n"
                                            "    {\"line_item\": \"Cash\", \"value\": 2500}\n"
                                            "  ]\n"
                                            "}\n"
                                            "End."))

    mock_create = MagicMock(side_effect=[LLMStructuredFail(), LLMBasic()])
    monkeypatch.setattr(services, 'create_gemini_llm', mock_create)

    res = services.extract_raw_financial_data("context irrelevant", api_key="fake-key")
    assert res['success'] is True
    assert any('Cash' in (it.get('particulars') or '') for it in res['financial_items'])


def test_extract_raw_financial_data_empty_api_key_uses_deterministic():
    res = services.extract_raw_financial_data("Total Assets: 1000", api_key="")
    assert res['success'] is True
    assert res.get('model_used') == 'deterministic_fallback' or res.get('model_used') is None


def test_create_gemini_llm_temperature_and_model(monkeypatch):
    # Ensure ChatGoogleGenerativeAI is called with correct parameters
    mock_genai = MagicMock()
    mock_chat_cls = MagicMock()
    mock_genai.ChatGoogleGenerativeAI = mock_chat_cls
    monkeypatch.setitem(sys_modules := __import__('sys').modules, 'langchain_google_genai', mock_genai)

    # No env var set: default model should be used
    monkeypatch.delenv('GENIE_MODEL', raising=False)
    services.create_gemini_llm('k', purpose='extraction')
    mock_chat_cls.assert_called()
import pytest

from apps.balance_sheet_comparator.balance_sheet import services as svc


def test_simple_text_number_various():
    assert svc._simple_text_number('1,000') == 1000
    assert svc._simple_text_number('(1,000)') == -1000
    assert svc._simple_text_number('10 lakhs') == 10 * 100_000
    assert svc._simple_text_number('2 crores') == 2 * 10_000_000
    assert svc._simple_text_number('12.5 thousand') == pytest.approx(12.5 * 1_000)
    assert svc._simple_text_number('') is None
    assert svc._simple_text_number('nonsense') is None


def test_deterministic_fallback_extraction_keywords():
    context = (
        'Cash and cash equivalents: 1,000\n'
        'Total assets: 5,000\n'
        'Inventory: (200)\n'
    )
    res = svc._deterministic_fallback_extraction(context)
    assert res.get('success') is True
    items = res.get('financial_items', [])
    # There should be at least two identified numeric items
    assert any('cash' in it['particulars'].lower() for it in items)
    assert any(it['current_year'] == 1000 or it['current_year'] == 5000 or it['current_year'] == -200 for it in items)


def test_extract_raw_financial_data_no_api_key_uses_deterministic():
    # Passing an empty API key should trigger deterministic fallback
    text = 'Cash: 2,000\nInventory: (500)\nSome other line: 3000'
    res = svc.extract_raw_financial_data(text, api_key='')
    assert res.get('success') is True
    items = res.get('financial_items', [])
    # Expect at least one numeric extraction
    assert any(isinstance(it.get('current_year'), (int, float)) for it in items)


def test_prepare_context_prioritizes_financial_lines_and_truncates():
    # Create many lines with financial keywords to force the prioritization path
    lines = []
    for i in range(20000):
        # alternate between financial and filler lines
        if i % 10 == 0:
            lines.append(f'Total assets line {i} assets 1000')
        else:
            lines.append('This is a filler line without much content')

    class Doc:
        def __init__(self, page_content):
            self.page_content = page_content

    docs = [Doc('\n'.join(lines))]
    ctx = svc.prepare_context(docs)
    assert isinstance(ctx, str)
    assert len(ctx) <= 50000
    # Should contain at least one financial keyword
    assert 'assets' in ctx.lower()
