# -*- coding: utf-8 -*-
from unittest.mock import patch
from langchain_core.documents import Document
from apps.dataprocessor import services


def test_process_financial_statements_happy_path(tmp_path):
    f = tmp_path / "fin.pdf"
    f.write_bytes(b"%PDF-1.4")

    with patch.object(services, "load_financial_document", return_value=[Document(page_content="Revenue 100")]), \
         patch.object(services, "prepare_context_smart", return_value=("Revenue 100 " * 10)), \
         patch.object(services, "extract_raw_financial_data", return_value={"success": True, "company_name": "Acme", "ticker_symbol": "ACM", "financial_items":[{"particulars":"Revenue","current_year":100}]}), \
         patch.object(services, "generate_summary_from_data", return_value={"success": True, "pros": ["+"], "cons": ["-"], "financial_health_summary": "ok"}), \
         patch.object(services, "generate_ratios_from_data", return_value={"success": True, "financial_ratios": []}):
        out = services.process_financial_statements(str(f), google_api_key="k")

    assert out["success"] is True
    assert out["metadata"]["file_type"] == "pdf"
    assert out["company_info"]["ticker_symbol"] == "ACM"


def test_process_financial_statements_missing_file():
    out = services.process_financial_statements("not-here.pdf", google_api_key="k")
    assert out["success"] is False
    assert "File not found" in out["error"]
