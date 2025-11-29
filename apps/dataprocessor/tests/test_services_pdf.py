# -*- coding: utf-8 -*-
from types import SimpleNamespace
from unittest.mock import patch

from apps.dataprocessor import services
from langchain_core.documents import Document


def test_load_pdf_robust_via_pypdfloader_success(tmp_path):
    f = tmp_path / "a.pdf"
    f.write_bytes(b"%PDF-1.4")

    # total_chars > 2000 triggers early return
    docs_out = [Document(page_content="X" * 1200), Document(page_content="Y" * 1200)]
    with patch.object(services, "PyPDFLoader", autospec=True) as m:
        m.return_value.load.return_value = docs_out
        docs = services.load_pdf_robust(str(f))

    assert isinstance(docs, list)
    assert docs and len(docs) == 2
    assert docs[0].page_content.startswith("X")


def test_load_pdf_robust_pdfplumber_fallback(tmp_path):
    f = tmp_path / "b.pdf"
    f.write_bytes(b"%PDF-1.4")

    # Force PyPDFLoader failure → fallback to pdfplumber
    with patch.object(services, "PyPDFLoader", side_effect=Exception("boom")), \
         patch.object(services, "pdfplumber", autospec=True) as mock_pp:
        fake_page = SimpleNamespace(extract_text=lambda: "Hello from PDF")
        fake_pdf = SimpleNamespace(pages=[fake_page])
        mock_pp.open.return_value.__enter__.return_value = fake_pdf

        docs = services.load_pdf_robust(str(f))

    assert isinstance(docs, list) and docs
    assert "Hello from PDF" in docs[0].page_content
