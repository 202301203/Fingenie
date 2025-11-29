import os
import io
import sys
import json
import types
import unittest
from types import ModuleType
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------------
# Put project root on sys.path so "apps.dataprocessor.services" is importable
# ---------------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # .../apps
PROJECT_ROOT = os.path.dirname(BASE_DIR)  # repo root
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ---------------------------------------------------------------------------------
# Create minimal stubs for external packages BEFORE importing the SUT
# ---------------------------------------------------------------------------------

# --- langchain_core.documents.Document stub ---
lc_core = ModuleType("langchain_core")
lc_core.documents = ModuleType("langchain_core.documents")

class _Doc:
    def __init__(self, page_content, metadata=None):
        self.page_content = page_content
        self.metadata = metadata or {}

lc_core.documents.Document = _Doc
sys.modules["langchain_core"] = lc_core
sys.modules["langchain_core.documents"] = lc_core.documents

# --- langchain_community loaders stubs ---
lc_comm = ModuleType("langchain_community")
lc_comm.document_loaders = ModuleType("langchain_community.document_loaders")

class _StubPDFLoader:
    def __init__(self, path): self.path = path
    def load(self):
        # Default returns short content (we'll monkeypatch per test)
        return [_Doc("short", {"source": self.path})]

class _StubExcelLoader:
    def __init__(self, path): self.path = path
    def load(self):
        return [_Doc("Excel content " * 20, {"source": self.path})]

lc_comm.document_loaders.PyPDFLoader = _StubPDFLoader
lc_comm.document_loaders.UnstructuredExcelLoader = _StubExcelLoader
sys.modules["langchain_community"] = lc_comm
sys.modules["langchain_community.document_loaders"] = lc_comm.document_loaders

# --- langchain_groq.ChatGroq stub ---
lc_groq = ModuleType("langchain_groq")

class _StubChatGroq:
    def __init__(self, model, groq_api_key, temperature, max_tokens, timeout, max_retries):
        # keep attributes so tests can assert
        self.model = model
        self.groq_api_key = groq_api_key
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.max_retries = max_retries

    # structured output wrapper just returns self
    def with_structured_output(self, schema_cls):
        self._schema = schema_cls
        return self

    # default invoke is patched per test to return schema instances
    def invoke(self, prompt):
        raise RuntimeError("Test should patch ChatGroq.invoke per scenario")

lc_groq.ChatGroq = _StubChatGroq
sys.modules["langchain_groq"] = lc_groq

# --- pdfplumber stub (open->context manager with pages) ---
pdfplumber_stub = ModuleType("pdfplumber")

class _StubPage:
    def __init__(self, text=""):
        self._text = text
        self._img = object()
    def extract_text(self):
        return self._text
    class _ImgWrap:
        @property
        def original(self):
            return object()
    def to_image(self):
        return self._ImgWrap()

class _StubPDF:
    def __init__(self, pages):
        self.pages = pages
    def __enter__(self): return self
    def __exit__(self, *a): return False

def _open_stub(path):
    # default (overridden per test)
    return _StubPDF([_StubPage("Some text")])

pdfplumber_stub.open = _open_stub
sys.modules["pdfplumber"] = pdfplumber_stub

# --- pytesseract stub ---
pytesseract_stub = ModuleType("pytesseract")
def _image_to_string(img):
    return "OCR extracted numbers and text"
pytesseract_stub.image_to_string = _image_to_string
sys.modules["pytesseract"] = pytesseract_stub

# --- pandas stub (we'll monkeypatch functions per test) ---
import pandas as pd  # allow real import; we'll patch read_csv / read_excel

# ---------------------------------------------------------------------------------
# Import the SUT now that deps are stubbed
# ---------------------------------------------------------------------------------
import apps.dataprocessor.services as svc

# Convenience handle to Document
Document = sys.modules["langchain_core.documents"].Document

# ---------------------------------------------------------------------------------
# Helpers to make simple files for detection tests
# ---------------------------------------------------------------------------------
def _touch(path, content=b"x"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(content)

class TestServicesMutationStrong(unittest.TestCase):

    # ---------------------------
    # detect_file_type
    # ---------------------------
    def test_detect_file_type_pdf_and_excel_and_error(self):
        with self.assertRaises(ValueError):
            svc.detect_file_type("report.txt")
        self.assertEqual(svc.detect_file_type("report.PDF"), "pdf")
        self.assertEqual(svc.detect_file_type("foo.xlsx"), "excel")
        self.assertEqual(svc.detect_file_type("foo.csv"), "excel")

    # ---------------------------
    # load_excel_file: UnstructuredExcelLoader success and pandas fallback
    # ---------------------------
    def test_load_excel_file_uses_loader_when_available(self):
        docs = svc.load_excel_file("dummy.xlsx")
        self.assertTrue(docs and isinstance(docs[0], Document))
        self.assertIn("Excel content", docs[0].page_content)

    def test_load_excel_file_pandas_fallback_builds_text(self):
        # Make loader raise so fallback triggers
        with patch("langchain_community.document_loaders.UnstructuredExcelLoader.load", side_effect=Exception("boom")):
            with patch.object(pd, "read_excel", return_value=pd.DataFrame({"A": [1,2], "B": ["x","y"]})) as rx:
                docs = svc.load_excel_file("a.xlsx")
        self.assertTrue(docs and isinstance(docs[0], Document))
        txt = docs[0].page_content
        self.assertIn("FINANCIAL STATEMENT DATA", txt)
        self.assertIn("A:", txt)
        self.assertIn("B:", txt)

    # ---------------------------
    # load_pdf_robust: PyPDFLoader success and pdfplumber+OCR fallback
    # ---------------------------
    def test_load_pdf_robust_prefers_pypdfloader_when_large(self):
        class _BigPDFLoader:
            def __init__(self, p): pass
            def load(self):
                # Make it "large" by char count
                return [Document("A"*3000)]
        with patch("apps.dataprocessor.services.PyPDFLoader", _BigPDFLoader):
    
            docs = svc.load_pdf_robust("x.pdf")
        self.assertGreaterEqual(sum(len(d.page_content) for d in docs), 3000)

    def test_load_pdf_robust_falls_back_to_pdfplumber_and_ocr(self):
        # Make PyPDFLoader fail
        class _FailLoader:
            def __init__(self, p): pass
            def load(self): raise RuntimeError("fail")
        # Create pages: first with tiny text (triggers OCR), second with decent text
        p1 = _StubPage(text="x")         # too short, OCR should replace
        p2 = _StubPage(text="Long enough content " * 10)
        def _open(_):
            return _StubPDF([p1, p2])
        with patch("langchain_community.document_loaders.PyPDFLoader", _FailLoader):
            with patch("pdfplumber.open", _open):
                with patch("pytesseract.image_to_string", return_value="OCR TEXT MUCH LONGER"):
                    docs = svc.load_pdf_robust("y.pdf")
        self.assertEqual(len(docs), 2)
        self.assertTrue(any("OCR TEXT" in d.page_content for d in docs))

    # ---------------------------
    # prepare_context_smart
    # ---------------------------
    def test_prepare_context_smart_long_financial_focus(self):
        # Build long text with many financial keywords to hit the "focus" path
        financial = "\n".join([f"balance sheet assets liabilities equity revenue expenses {i}" for i in range(400)])
        docs = [Document(page_content=financial)]
        out = svc.prepare_context_smart(docs)
        self.assertTrue(len(out) <= 50000)
        # Should contain financial keywords (prioritized selection)
        self.assertIn("balance sheet", out)

    def test_prepare_context_smart_short_pass_through(self):
        docs = [Document("tiny text")]
        self.assertEqual(svc.prepare_context_smart(docs), "tiny text")

    # ---------------------------
    # create_groq_llm + extract paths
    # ---------------------------
    def test_create_groq_llm_model_selection(self):
        llm = svc.create_groq_llm("KEY123", "summary")
        self.assertIsInstance(llm, sys.modules["langchain_groq"].ChatGroq)
        self.assertEqual(llm.model, "llama-3.1-8b-instant")
        self.assertEqual(llm.groq_api_key, "KEY123")
        self.assertLessEqual(llm.temperature, 0.2)

    def test_extract_raw_financial_data_happy_structured(self):
        # Return a proper FinancialExtractionResult instance
        FER = svc.FinancialExtractionResult
        FI = svc.FinancialItem
        def _invoke_ok(prompt):
            return FER(
                company_name="Acme Ltd",
                ticker_symbol="ACME.NS",
                financial_items=[
                    FI(particulars="Assets: Cash", current_year=10.0, previous_year=9.0),
                    FI(particulars="Revenue", current_year=100.0, previous_year=90.0),
                ],
            )
        class _LLMOK(sys.modules["langchain_groq"].ChatGroq):
            def with_structured_output(self, schema): return self
            def invoke(self, p): return _invoke_ok(p)
        with patch.object(svc, "create_groq_llm", return_value=_LLMOK("m","k",0.1,100,10,1)):
            out = svc.extract_raw_financial_data("CTX", "API")
        self.assertTrue(out["success"])
        self.assertEqual(out["company_name"], "Acme Ltd")
        self.assertEqual(out["ticker_symbol"], "ACME.NS")
        self.assertEqual(len(out["financial_items"]), 2)

    def test_extract_raw_financial_data_fallback_to_manual(self):
        # Make primary extraction raise, ensure manual called
        with patch.object(svc, "create_groq_llm", side_effect=Exception("boom")):
            with patch.object(svc, "extract_financial_data_manual", return_value={"success": True, "financial_items": []}) as mf:
                out = svc.extract_raw_financial_data("CTX", "API")
        self.assertTrue(out["success"])
        mf.assert_called_once()

    def test_extract_financial_data_manual_parses_json(self):
        # Return content as string JSON via ChatGroq.invoke
        class _LLM(sys.modules["langchain_groq"].ChatGroq):
            def invoke(self, prompt):
                class _Resp: pass
                r = _Resp()
                r.content = json.dumps({
                    "company_name": "Foobar Inc",
                    "ticker_symbol": "FOO",
                    "financial_items": [{"particulars":"Revenue", "current_year": 1.0, "previous_year": 0.5}]
                })
                return r
        with patch.object(svc, "create_groq_llm", return_value=_LLM("m","k",0.1,100,10,1)):
            out = svc.extract_financial_data_manual("CTX", "API")
        self.assertTrue(out["success"])
        self.assertEqual(out["company_name"], "Foobar Inc")
        self.assertEqual(out["financial_items"][0]["particulars"], "Revenue")

    # ---------------------------
    # summary & ratios
    # ---------------------------
    def test_generate_summary_from_data_structured(self):
        FS = svc.FinancialSummary
        def _invoke_summary(prompt):
            return FS(pros=["Good"], cons=["Bad"], financial_health_summary="OK")
        class _LLM(sys.modules["langchain_groq"].ChatGroq):
            def with_structured_output(self, schema): return self
            def invoke(self, p): return _invoke_summary(p)
        with patch.object(svc, "create_groq_llm", return_value=_LLM("m","k",0.1,100,10,1)):
            out = svc.generate_summary_from_data([{"particulars":"Revenue","current_year":1}], "KEY")
        self.assertTrue(out["success"])
        self.assertIn("pros", out)
        self.assertIn("cons", out)
        self.assertIn("financial_health_summary", out)

    def test_generate_ratios_from_data_structured(self):
        FR = svc.FinancialRatios
        def _invoke_ratios(prompt):
            return FR(financial_ratios=[svc.RatioItem(
                ratio_name="Current Ratio",
                formula="CA/CL",
                calculation="100/50=2.00",
                result=2.0,
                interpretation="Healthy"
            )])
        class _LLM(sys.modules["langchain_groq"].ChatGroq):
            def with_structured_output(self, schema): return self
            def invoke(self, p): return _invoke_ratios(p)
        with patch.object(svc, "create_groq_llm", return_value=_LLM("m","k",0.1,100,10,1)):
            out = svc.generate_ratios_from_data([{"p":"x"}], "KEY")
        self.assertTrue(out["success"])
        self.assertEqual(out["financial_ratios"][0]["ratio_name"], "Current Ratio")

    # ---------------------------
    # process_financial_statements orchestrator
    # ---------------------------
    def test_process_financial_statements_happy_flow(self):
        fake_path = os.path.join(PROJECT_ROOT, "tmp", "file.pdf")
        _touch(fake_path)

        docs = [Document("Balance sheet and revenue data here " * 20)]
        with patch.object(svc, "load_financial_document", return_value=docs), \
             patch.object(svc, "prepare_context_smart", return_value="Some financial content " * 20), \
             patch.object(svc, "extract_raw_financial_data", return_value={
                 "success": True,
                 "company_name": "Zeta Ltd",
                 "ticker_symbol": "ZETA",
                 "financial_items": [{"particulars":"Revenue","current_year":10,"previous_year":9}]
             }), \
             patch.object(svc, "generate_summary_from_data", return_value={
                 "success": True,
                 "pros": ["Strong revenue"],
                 "cons": [],
                 "financial_health_summary": "Good"
             }), \
             patch.object(svc, "generate_ratios_from_data", return_value={
                 "success": True,
                 "financial_ratios": []
             }), \
             patch.object(svc, "detect_file_type", return_value="pdf"):
            out = svc.process_financial_statements(fake_path, "KEY")
        self.assertTrue(out["success"])
        self.assertEqual(out["company_info"]["company_name"], "Zeta Ltd")
        self.assertEqual(out["metadata"]["file_type"], "pdf")
        self.assertIn("items_extracted", out["metadata"])

    # ---------------------------
    # ensure_service_response_structure
    # ---------------------------
    def test_ensure_service_response_structure(self):
        self.assertEqual(
            svc.ensure_service_response_structure({"ok": 1, "success": True})["success"], True
        )
        self.assertEqual(
            svc.ensure_service_response_structure({"ok": 1})["success"], True
        )
        bad = svc.ensure_service_response_structure("oops")
        self.assertFalse(bad["success"])
        self.assertIn("error", bad)


if __name__ == "__main__":
    unittest.main()
