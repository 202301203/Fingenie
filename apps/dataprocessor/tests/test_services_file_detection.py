# apps/dataprocessor/tests/test_services_file_detection.py
import os
import pytest
from apps.dataprocessor import services


def test_detect_file_type_pdf(tmp_path):
    fp = tmp_path / "x.pdf"
    fp.write_bytes(b"pdf")
    assert services.detect_file_type(str(fp)) == "pdf"


def test_detect_file_type_excel_xlsx(tmp_path):
    fp = tmp_path / "x.xlsx"
    fp.write_bytes(b"excel")
    assert services.detect_file_type(str(fp)) == "excel"


def test_detect_file_type_excel_csv(tmp_path):
    fp = tmp_path / "x.csv"
    fp.write_bytes(b"excel")
    assert services.detect_file_type(str(fp)) == "excel"


def test_detect_file_type_unsupported(tmp_path):
    fp = tmp_path / "x.docx"
    fp.write_bytes(b"word")
    with pytest.raises(ValueError):
        services.detect_file_type(str(fp))
