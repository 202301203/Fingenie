# apps/dataprocessor/tests_mutation/test_views_mutation_strong.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fingenie_core.settings")
django.setup()

import io
import json
import pytest
import uuid
from unittest.mock import patch, MagicMock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
from django.urls import reverse

from apps.dataprocessor.models import FinancialReport


@pytest.mark.django_db
class TestViewsMutationStrong:

    # ------------------------------------------------------------
    #  PROCESS API
    # ------------------------------------------------------------
    def test_process_rejects_get(self):
        client = Client()
        resp = client.get("/api/process/")
        assert resp.status_code == 405

    def test_process_missing_file(self):
        client = Client()
        resp = client.post("/api/process/", {"api_key": "ABC"})
        data = resp.json()
        assert resp.status_code == 400
        assert data["error"] == "No file uploaded"

    def test_process_missing_api_key(self):
        client = Client()
        dummy = SimpleUploadedFile("x.pdf", b"abc", content_type="application/pdf")
        resp = client.post("/api/process/", {"file": dummy})
        assert resp.status_code == 500

    @patch("apps.dataprocessor.views.load_pdf_robust")
    @patch("apps.dataprocessor.views.prepare_context_smart")
    @patch("apps.dataprocessor.views.extract_raw_financial_data")
    @patch("apps.dataprocessor.views.generate_summary_from_data")
    @patch("apps.dataprocessor.views.generate_ratios_from_data")
    def test_process_happy_path(
        self,
        mock_ratios,
        mock_summary,
        mock_extract,
        mock_context,
        mock_load,
    ):
        client = Client()

        # PDF load → one document
        mock_load.return_value = [MagicMock(page_content="BALANCE SHEET DATA")]

        # Context OK
        mock_context.return_value = "valid financial text..." * 5

        # Extraction success
        mock_extract.return_value = {
            "success": True,
            "company_name": "TCS",
            "ticker_symbol": "TCS.NS",
            "financial_items": [{"particulars": "Revenue", "current_year": 100}],
        }

        # Summary success
        mock_summary.return_value = {
            "success": True,
            "pros": ["Strong revenue"],
            "cons": [],
            "financial_health_summary": "Healthy",
        }

        # Ratios success
        mock_ratios.return_value = {
            "success": True,
            "financial_ratios": [
                {"ratio_name": "ROA", "formula": "NI/TA", "calculation": "10/100", "result": 0.1, "interpretation": "OK"}
            ]
        }

        dummy = SimpleUploadedFile("x.pdf", b"abc", content_type="application/pdf")
        resp = client.post("/api/process/", {"file": dummy, "api_key": "KEY"})

        assert resp.status_code == 200
        data = resp.json()

        assert data["success"] is True
        assert data["company_name"] == "TCS"
        assert data["ticker_symbol"] == "TCS.NS"
        assert len(FinancialReport.objects.all()) == 1

    @patch("apps.dataprocessor.views.load_pdf_robust", return_value=[MagicMock(page_content="A")])
    @patch("apps.dataprocessor.views.prepare_context_smart", return_value="short")
    def test_process_fails_short_context(self, a, b):
        client = Client()
        dummy = SimpleUploadedFile("x.pdf", b"abc", content_type="application/pdf")
        resp = client.post("/api/process/", {"file": dummy, "api_key": "KEY"})
        assert resp.status_code == 400
        assert "Insufficient financial content" in resp.json()["error"]

    @patch("apps.dataprocessor.views.load_pdf_robust", return_value=[MagicMock(page_content="BAL")])
    @patch("apps.dataprocessor.views.prepare_context_smart", return_value=("valid " * 30))
    @patch("apps.dataprocessor.views.extract_raw_financial_data", return_value={"success": False, "error": "boom"})
    def test_process_fails_extraction(self, a, b, c):
        client = Client()
        dummy = SimpleUploadedFile("x.pdf", b"abc", content_type="application/pdf")
        resp = client.post("/api/process/", {"file": dummy, "api_key": "KEY"})
        assert resp.status_code == 400
        assert resp.json()["success"] is False

    # ------------------------------------------------------------
    #  GET REPORT BY ID
    # ------------------------------------------------------------
    @pytest.mark.django_db
    def test_get_report_by_id_happy(self):
        # create report
        rpt = FinancialReport.objects.create(
            company_name="ABC",
            ticker_symbol="ABC.NS",
            summary={"pros": ["solid"], "cons": [], "financial_health_summary": "ok"},
            ratios=[],
        )

        client = Client()
        resp = client.get(f"/api/reports/{rpt.report_id}/")
        data = resp.json()

        assert data["success"] is True
        assert data["company_name"] == "ABC"
        assert data["summary"]["pros"] == ["solid"]

    def test_get_report_by_id_not_found(self):
        client = Client()
        fake_id = uuid.uuid4()
        resp = client.get(f"/api/reports/{fake_id}/")
        assert resp.status_code == 404

    # ------------------------------------------------------------
    #  GET LATEST REPORT
    # ------------------------------------------------------------
    def test_get_latest_report_none(self):
        client = Client()
        resp = client.get("/api/latest-report/")
        assert resp.status_code == 404

    def test_get_latest_report_success(self):
        rpt = FinancialReport.objects.create(company_name="XYZ")
        client = Client()
        resp = client.get("/api/latest-report/")
        assert resp.status_code == 200
        assert resp.json()["company_name"] == "XYZ"

    # ------------------------------------------------------------
    # DELETE REPORT
    # ------------------------------------------------------------
    def test_delete_report_success(self):
        rpt = FinancialReport.objects.create(company_name="DEL")
        client = Client()
        resp = client.post(f"/api/reports/{rpt.report_id}/delete/")
        assert resp.status_code == 200
        assert FinancialReport.objects.count() == 0

    def test_delete_report_not_found(self):
        client = Client()
        fake = uuid.uuid4()
        resp = client.post(f"/api/reports/{fake}/delete/")
        assert resp.status_code == 404

    # ------------------------------------------------------------
    # RECENT ANALYSES
    # ------------------------------------------------------------
    def test_recent_analyses_list(self):
        FinancialReport.objects.create(company_name="A")
        FinancialReport.objects.create(company_name="B")
        client = Client()
        resp = client.get("/api/profile/recent-analyses/?limit=1")
        data = resp.json()
        assert data["success"] is True
        assert len(data["analyses"]) == 1

    # ------------------------------------------------------------
    # STOCK DATA API
    # ------------------------------------------------------------
    @patch("apps.dataprocessor.views.yf.download")
    def test_stock_data_success(self, mock_dl):
        import pandas as pd
        from datetime import datetime

        mock_dl.return_value = pd.DataFrame({
            "Close": [100, 105],
        }, index=[pd.Timestamp("2024-01-01"), pd.Timestamp("2024-01-02")])

        client = Client()
        resp = client.get("/api/stock-data/TCS.NS/1M/")
        data = resp.json()

        assert data["success"] is True
        assert data["ticker"] == "TCS.NS"
        assert len(data["data"]) == 2

    @patch("apps.dataprocessor.views.yf.download", side_effect=Exception("network fail"))
    @patch("apps.dataprocessor.views.yf.Ticker")
    def test_stock_data_fallback(self, mock_tk, _):
        # fallback history works
        import pandas as pd

        dummy = MagicMock()
        dummy.history.return_value = pd.DataFrame({
            "Close": [90],
        }, index=[pd.Timestamp("2024-01-01")])

        mock_tk.return_value = dummy

        client = Client()
        resp = client.get("/api/stock-data/RELIANCE.NS/1M/")
        data = resp.json()

        assert data["success"] is True
        assert len(data["data"]) == 1

    @patch("apps.dataprocessor.views.yf.download", return_value=None)
    @patch("apps.dataprocessor.views.yf.Ticker")
    def test_stock_data_no_data(self, mock_tk, _):
        dummy = MagicMock()
        dummy.history.return_value = None
        mock_tk.return_value = dummy

        client = Client()
        resp = client.get("/api/stock-data/RELIANCE.NS/1M/")
        data = resp.json()

        assert data["success"] is True
        assert data["data"] == []
