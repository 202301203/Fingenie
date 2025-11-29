# -*- coding: utf-8 -*-
import types
from unittest.mock import patch
import pandas as pd

from apps.dataprocessor import services
from langchain_core.documents import Document


def test_load_excel_file_via_loader_success(tmp_path):
    f = tmp_path / "ok.xlsx"
    f.write_bytes(b"ok")

    fake_doc = Document(page_content="x" * 120, metadata={"m": 1})
    with patch.object(services, "UnstructuredExcelLoader", autospec=True) as m:
        inst = m.return_value
        inst.load.return_value = [fake_doc]
        docs = services.load_excel_file(str(f))

    assert isinstance(docs, list)
    assert docs and docs[0].page_content == fake_doc.page_content


def test_load_excel_file_loader_falls_back_to_pandas_csv(tmp_path):
    f = tmp_path / "ok.csv"
    f.write_text("A,B\n1,2\n3,4\n")

    with patch.object(services, "UnstructuredExcelLoader", side_effect=Exception("boom")), \
         patch.object(services.pd, "read_csv") as read_csv:
        read_csv.return_value = pd.DataFrame({"A": [1, 3], "B": [2, 4]})
        docs = services.load_excel_file(str(f))

    assert isinstance(docs, list) and docs
    txt = docs[0].page_content
    assert "FINANCIAL STATEMENT DATA" in txt
    assert "A:" in txt and "B:" in txt


def test_load_excel_file_pandas_fails_returns_empty_doc(tmp_path):
    f = tmp_path / "bad.xlsx"
    f.write_bytes(b"bad")

    with patch.object(services, "UnstructuredExcelLoader", side_effect=Exception("boom")), \
         patch.object(services.pd, "read_excel", side_effect=Exception("pandas bad")):
        docs = services.load_excel_file(str(f))

    assert isinstance(docs, list) and docs
    assert docs[0].page_content == ""
