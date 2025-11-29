# apps/dataprocessor/tests/test_ai_financial_processor_full.py

import os
import json
import tempfile
from types import SimpleNamespace, ModuleType
import pandas as pd
import pytest
from unittest.mock import patch

# -------------------------------------------------------------------
# 0) BLOCK the problematic import BEFORE importing the module
# -------------------------------------------------------------------

# Create a fake langchain_google_genai module to avoid metaclass conflict
fake_lc = ModuleType("langchain_google_genai")

class DummyLLM:
    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.calls = []

    def invoke(self, payload):
        self.calls.append(payload)
        return SimpleNamespace(content="{}")  # default empty JSON

fake_lc.ChatGoogleGenerativeAI = DummyLLM

# Insert fake module into sys.modules BEFORE importing tested file
import sys
sys.modules["langchain_google_genai"] = fake_lc

# -------------------------------------------------------------------
# Now safely import the module under test
# -------------------------------------------------------------------
import apps.dataprocessor.ai_financial_processor as mod


# -------------------------------------------------------------------
# Helper function for creating temporary files
# -------------------------------------------------------------------
def write_tmp_file(suffix, data: bytes) -> str:
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    return path


# -------------------------------------------------------------------
# Test create_gemini_llm
# -------------------------------------------------------------------
def test_create_gemini_llm_uses_dummy_class():
    llm = mod.create_gemini_llm("XYZ")
    assert isinstance(llm, DummyLLM)
    assert llm.kwargs["google_api_key"] == "XYZ"


# -------------------------------------------------------------------
# Test load_file_content
# -------------------------------------------------------------------
def test_load_pdf():
    path = write_tmp_file(".pdf", b"%PDF-test")
    ftype, content = mod.load_file_content(path)
    assert ftype == "pdf"
    assert content.startswith(b"%PDF")


def test_load_csv(tmp_path):
    p = tmp_path / "x.csv"
    p.write_text("A,B\n1,2\n")
    ftype, content = mod.load_file_content(str(p))
    assert ftype == "excel"
    assert "FINANCIAL DATA" in content


def test_load_xlsx(monkeypatch, tmp_path):
    df1 = pd.DataFrame({"A": [1]})
    df2 = pd.DataFrame({"B": [2]})
    monkeypatch.setattr(pd, "read_excel", lambda *a, **k: {"S1": df1, "S2": df2})

    p = tmp_path / "y.xlsx"
    p.write_bytes(b"fake")

    ftype, content = mod.load_file_content(str(p))
    assert ftype == "excel"
    assert "A" in content and "B" in content


def test_load_unsupported(tmp_path):
    p = tmp_path / "z.txt"
    p.write_text("hi")
    with pytest.raises(ValueError):
        mod.load_file_content(str(p))


# -------------------------------------------------------------------
# Test ai_extract_all
# -------------------------------------------------------------------
class FakeLLM:
    def __init__(self, return_text):
        self.return_text = return_text
        self.calls = []

    def invoke(self, payload):
        self.calls.append(payload)
        return SimpleNamespace(content=self.return_text)


def test_ai_extract_all_valid(monkeypatch):
    monkeypatch.setattr(mod, "load_file_content", lambda p: ("pdf", b"PDF"))
    monkeypatch.setattr(mod, "create_gemini_llm", lambda key: FakeLLM(json.dumps({
        "balance_sheet": [],
        "pl_sheet": [],
        "summary": {"pros": [], "cons": [], "financial_health_summary": ""},
        "ratios": []
    })))

    out = mod.ai_extract_all("file.pdf", "KEY")
    assert "balance_sheet" in out


def test_ai_extract_all_fenced_json(monkeypatch):
    monkeypatch.setattr(mod, "load_file_content", lambda p: ("excel", "DATA"))
    fenced = """```json
    {"balance_sheet": [], "pl_sheet": [], "summary": {}, "ratios": []}
    ```"""
    monkeypatch.setattr(mod, "create_gemini_llm", lambda key: FakeLLM(fenced))
    out = mod.ai_extract_all("file.xlsx", "K")
    assert "ratios" in out


def test_ai_extract_all_bad_json(monkeypatch):
    monkeypatch.setattr(mod, "load_file_content", lambda p: ("excel", "DATA"))
    monkeypatch.setattr(mod, "create_gemini_llm", lambda key: FakeLLM("NOT JSON"))
    out = mod.ai_extract_all("file.xlsx", "K")
    assert out == {"balance_sheet": [], "pl_sheet": [], "summary": {}, "ratios": []}


# -------------------------------------------------------------------
# Test process_financial_statements
# -------------------------------------------------------------------
def test_process_financial_statements(monkeypatch, tmp_path):
    monkeypatch.setattr(mod, "ai_extract_all", lambda p, k: {
        "balance_sheet": [{"particulars": "Cash", "current_year": 1, "previous_year": 0}],
        "pl_sheet": [{"particulars": "Rev", "current_year": 2, "previous_year": 1}],
        "summary": {},
        "ratios": []
    })
    mod.perform_comparative_analysis = lambda x: {"ok": True, "rows": x}
    mod.generate_comparative_pls = lambda x: {"ok": True, "rows": x}

    f = tmp_path / "xx.pdf"
    f.write_bytes(b"%PDF")

    out = mod.process_financial_statements(str(f), "KEY")
    assert out["success"]
    assert out["balance_sheet"]["ok"]
    assert out["pl_sheet"]["ok"]
