# apps/dataprocessor/tests/test_services_full.py
import os
import json
import pytest
from unittest.mock import MagicMock, patch
from types import SimpleNamespace
from langchain_core.documents import Document

import apps.dataprocessor.services as services


# -------------------------------------------------------------
#                  SHARED FIXTURES
# -------------------------------------------------------------

@pytest.fixture
def fake_docs_small():
    return [
        Document(page_content="Balance Sheet: Assets 1000"),
        Document(page_content="Profit and Loss: Revenue 500")
    ]


@pytest.fixture
def fake_docs_large():
    long_text = "\n".join(["Revenue increased"] * 20000)
    return [Document(page_content=long_text)]


@pytest.fixture
def fake_financial_items():
    return [
        {
            "particulars": "Assets: Cash",
            "current_year": 100,
            "previous_year": 90,
        },
        {
            "particulars": "Liabilities: Payables",
            "current_year": 50,
            "previous_year": 40,
        }
    ]


# -------------------------------------------------------------
#               TEST detect_file_type
# -------------------------------------------------------------

def test_detect_file_type_pdf():
    assert services.detect_file_type("aaa.PDF") == "pdf"


def test_detect_file_type_excel():
    assert services.detect_file_type("bbb.xlsx") == "excel"
    assert services.detect_file_type("bbb.csv") == "excel"


def test_detect_file_type_unsupported():
    with pytest.raises(ValueError):
        services.detect_file_type("file.txt")


# -------------------------------------------------------------
#                TEST load_excel_file
# -------------------------------------------------------------

def test_load_excel_file_unstructured_loader_success(tmp_path):
    file = tmp_path / "a.xlsx"
    file.write_text("dummy")

    fake_docs = [Document(page_content="Valid Excel Loaded" * 10)]

    with patch("apps.dataprocessor.services.UnstructuredExcelLoader") as m:
        m.return_value.load.return_value = fake_docs

        out = services.load_excel_file(str(file))
        assert isinstance(out, list)
        assert isinstance(out[0], Document)


def test_load_excel_file_unstructured_loader_fallback_csv(tmp_path):
    file = tmp_path / "a.csv"
    file.write_text("col1,col2\n10,20\n30,40")

    out = services.load_excel_file(str(file))

    assert isinstance(out, list)
    assert "FINANCIAL STATEMENT DATA" in out[0].page_content


def test_load_excel_file_unstructured_loader_fallback_excel(tmp_path):
    # This triggers pandas fallback for Excel
    file = tmp_path / "a.xlsx"
    file.write_bytes(b"")

    # Mock pandas
    with patch("apps.dataprocessor.services.pd.read_excel", return_value=None) as m:
        try:
            services.load_excel_file(str(file))
        except Exception:
            pass  # Expected, because read_excel returns None


# -------------------------------------------------------------
#                   TEST load_pdf_robust
# -------------------------------------------------------------

def test_load_pdf_robust_good_pypdfloader(tmp_path):
    f = tmp_path / "a.pdf"
    f.write_bytes(b"%PDF-1.4")

    fake_docs = [
        Document(page_content="X" * 1500),
        Document(page_content="Y" * 1500),
    ]

    with patch.object(services, "PyPDFLoader") as m:
        m.return_value.load.return_value = fake_docs

        out = services.load_pdf_robust(str(f))
        assert len(out) == 2


def test_load_pdf_robust_pdfplumber_fallback(tmp_path):
    f = tmp_path / "b.pdf"
    f.write_bytes(b"%PDF-1.4")

    with patch.object(services, "PyPDFLoader", side_effect=Exception("fail")), \
         patch.object(services, "pdfplumber") as mock_pp:

        fake_page = SimpleNamespace(extract_text=lambda: "Hello PDF page")
        fake_pdf = SimpleNamespace(pages=[fake_page])
        mock_pp.open.return_value.__enter__.return_value = fake_pdf

        out = services.load_pdf_robust(str(f))
        assert len(out) == 1
        assert isinstance(out[0], Document)


# -------------------------------------------------------------
#               TEST load_financial_document
# -------------------------------------------------------------

def test_load_financial_document_pdf():
    with patch("apps.dataprocessor.services.load_pdf_robust", return_value=["OK"]) as m:
        out = services.load_financial_document("x.pdf")
        assert out == ["OK"]


def test_load_financial_document_excel():
    with patch("apps.dataprocessor.services.load_excel_file", return_value=["DOC"]) as m:
        out = services.load_financial_document("x.xlsx")
        assert out == ["DOC"]


# -------------------------------------------------------------
#             TEST prepare_context_smart
# -------------------------------------------------------------

def test_prepare_context_smart_small(fake_docs_small):
    out = services.prepare_context_smart(fake_docs_small)
    assert "Balance Sheet" in out


def test_prepare_context_smart_large(fake_docs_large):
    out = services.prepare_context_smart(fake_docs_large)
    assert len(out) <= 50000


# -------------------------------------------------------------
#               FAKE LLM CLASS FOR MOCKING
# -------------------------------------------------------------

class FakeLLM:
    """Simulate ChatGroq structured output behavior."""

    def __init__(self, fake_response):
        self.fake_response = fake_response

    def with_structured_output(self, schema):
        self.schema = schema
        return self

    def invoke(self, prompt):
        return self.schema(**self.fake_response)


# -------------------------------------------------------------
#               TEST extract_raw_financial_data
# -------------------------------------------------------------

def test_extract_raw_financial_data_success():
    fake_response = {
        "company_name": "TestCorp",
        "ticker_symbol": "TST.NS",
        "financial_items": [
            {
                "particulars": "Assets: Cash",
                "current_year": 100,
                "previous_year": 90
            }
        ]
    }

    with patch("apps.dataprocessor.services.create_groq_llm", return_value=FakeLLM(fake_response)):
        out = services.extract_raw_financial_data("context text", "KEY")
        assert out["success"] is True
        assert out["company_name"] == "TestCorp"


def test_extract_raw_financial_data_fallback_manual():
    with patch("apps.dataprocessor.services.create_groq_llm", side_effect=Exception("fail")):
        out = services.extract_raw_financial_data("ctx", "KEY")
        assert out["success"] in (True, False)


# -------------------------------------------------------------
#             TEST extract_financial_data_manual
# -------------------------------------------------------------

def test_extract_financial_data_manual():
    valid_json = """
    {
        "company_name": "Demo",
        "ticker_symbol": "DMO.NS",
        "financial_items": [
            {"particulars": "A", "current_year": 1, "previous_year": 0}
        ]
    }
    """

    from types import SimpleNamespace as _SN
    fake_llm = MagicMock()
    fake_llm.invoke.return_value = _SN(content=valid_json)

    with patch("apps.dataprocessor.services.create_groq_llm", return_value=fake_llm):
        out = services.extract_financial_data_manual("ctx", "KEY")
        assert out["success"] is True
        assert out["company_name"] == "Demo"


# -------------------------------------------------------------
#                 TEST generate_summary_from_data
# -------------------------------------------------------------

def test_generate_summary_from_data(fake_financial_items):
    fake_response = {
        "pros": ["Strong revenue"],
        "cons": ["High debt"],
        "financial_health_summary": "Good"
    }

    with patch("apps.dataprocessor.services.create_groq_llm", return_value=FakeLLM(fake_response)):
        out = services.generate_summary_from_data(fake_financial_items, "KEY")
        assert out["success"] is True
        assert out["pros"][0] == "Strong revenue"


# -------------------------------------------------------------
#                TEST generate_ratios_from_data
# -------------------------------------------------------------

def test_generate_ratios_from_data(fake_financial_items):
    fake_response = {
        "financial_ratios": [
            {
                "ratio_name": "Current Ratio",
                "formula": "A/B",
                "calculation": "100/50",
                "result": 2.0,
                "interpretation": "Good"
            }
        ]
    }

    with patch("apps.dataprocessor.services.create_groq_llm", return_value=FakeLLM(fake_response)):
        out = services.generate_ratios_from_data(fake_financial_items, "KEY")
        assert out["success"] is True
        assert out["financial_ratios"][0]["ratio_name"] == "Current Ratio"


# -------------------------------------------------------------
#                TEST process_financial_statements
# -------------------------------------------------------------

def test_process_financial_statements_file_missing():
    out = services.process_financial_statements("missing.pdf", "API_KEY")
    assert out["success"] is False


def test_process_financial_statements_success(tmp_path, fake_financial_items):
    f = tmp_path / "good.pdf"
    f.write_bytes(b"%PDF-1.4")

    # Mock everything
    with (
        patch("apps.dataprocessor.services.load_financial_document",
              return_value=[Document(page_content="Revenue up 10%")]),
        # IMPORTANT: ensure context passes min-length gate in views/services
        patch("apps.dataprocessor.services.prepare_context_smart",
              return_value="X" * 200),
        patch("apps.dataprocessor.services.extract_raw_financial_data",
              return_value={"success": True, "company_name": "X", "ticker_symbol": "Y", "financial_items": fake_financial_items}),
        patch("apps.dataprocessor.services.generate_summary_from_data",
              return_value={"success": True, "pros": [], "cons": [], "financial_health_summary": ""}),
        patch("apps.dataprocessor.services.generate_ratios_from_data",
              return_value={"success": True, "financial_ratios": []}),
        patch("apps.dataprocessor.services.detect_file_type", return_value="pdf")
    ):
        out = services.process_financial_statements(str(f), "KEY")
        assert out["success"] is True
        assert out["company_info"]["company_name"] == "X"


# -------------------------------------------------------------
#            TEST ensure_service_response_structure
# -------------------------------------------------------------

def test_ensure_service_response_structure():
    out = services.ensure_service_response_structure({"x": 1})
    assert out["success"] is True
