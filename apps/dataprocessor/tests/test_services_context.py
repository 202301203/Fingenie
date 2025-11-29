# -*- coding: utf-8 -*-
from langchain_core.documents import Document
from apps.dataprocessor import services


def test_prepare_context_smart_concat_basic():
    docs = [
        Document(page_content="random line 1"),
        Document(page_content="Balance Sheet: Assets 1000"),
        Document(page_content="Revenue increased by 10%"),
    ]
    out = services.prepare_context_smart(docs)
    assert "Balance Sheet" in out
    assert "Revenue increased" in out
