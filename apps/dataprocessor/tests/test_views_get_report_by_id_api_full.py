# apps/dataprocessor/tests/test_views_get_report_by_id_api_full.py
import datetime as _dt
import json
from unittest.mock import patch

import pytest
from django.http import HttpRequest, JsonResponse

# Import the real function we want to exercise
from apps.dataprocessor import views


def _make_get_request() -> HttpRequest:
    req = HttpRequest()
    req.method = "GET"
    return req


class _DummyReport:
    """Tiny object with exactly what views.get_report_by_id_api expects."""
    def __init__(self, report_id):
        self.report_id = report_id
        self.company_name = "Acme Corp"
        self.ticker_symbol = "ACME"
        self.created_at = _dt.datetime(2024, 1, 1, 12, 0, 0)
        self.time_ago = "just now"
        self.has_uploaded_pdf = True
        self.pdf_original_name = "acme.pdf"

        # Attributes that views prints for debug
        self.summary = {
            "pros": ["Strong revenue growth"],
            "cons": ["Rising costs"],
            "financial_health_summary": "Solid with some risks.",
        }
        self.ratios = [
            {"ratio_name": "Current Ratio", "result": 1.5},
            {"ratio_name": "Debt/Equity", "result": 0.4},
        ]

    # views.py calls these to ensure proper structure
    def get_summary(self):
        return self.summary

    def get_ratios(self):
        return self.ratios


@pytest.mark.django_db
class TestGetReportByIdAPI:
    def test_success_returns_expected_payload(self):
        req = _make_get_request()

        with patch.object(views, "FinancialReport") as FR:
            FR.objects.get.return_value = _DummyReport(123)
            resp: JsonResponse = views.get_report_by_id_api(req, 123)
            assert resp.status_code == 200
            data = json.loads(resp.content.decode())
            assert data["success"] is True
            assert data["report_id"] == "123"
            assert data["company_name"] == "Acme Corp"
            assert data["ticker_symbol"] == "ACME"
            # created_at was a real datetime -> JSON string
            assert isinstance(data["created_at"], str)
            assert data["time_ago"] == "just now"
            assert data["has_uploaded_pdf"] is True
            assert data["uploaded_pdf_name"] == "acme.pdf"
            # structure from getters
            assert "pros" in data["summary"]
            assert "cons" in data["summary"]
            assert isinstance(data["ratios"], list) and len(data["ratios"]) == 2

    def test_string_report_id_is_preserved(self):
        req = _make_get_request()
        with patch.object(views, "FinancialReport") as FR:
            FR.objects.get.return_value = _DummyReport("abc-123")
            resp = views.get_report_by_id_api(req, "abc-123")
            assert resp.status_code == 200
            data = json.loads(resp.content.decode())
            assert data["report_id"] == "abc-123"

    def test_not_found_404(self):
        req = _make_get_request()
        with patch.object(views, "FinancialReport") as FR:
            class _DoesNotExist(Exception):
                pass
            FR.DoesNotExist = _DoesNotExist
            FR.objects.get.side_effect = _DoesNotExist("missing")

            resp = views.get_report_by_id_api(req, 999)
            assert resp.status_code == 404
            data = json.loads(resp.content.decode())
            # Accept either of the common messages used across the project
            assert data.get("error") in {
                "Report not found or access denied",
                "Report not found",
                "Not found",
            }

    def test_unexpected_exception_500(self):
        req = _make_get_request()
        with patch.object(views, "FinancialReport") as FR:
            # Any non-DoesNotExist exception should be treated as 500
            FR.DoesNotExist = type("DoesNotExist", (Exception,), {})
            FR.objects.get.side_effect = ValueError("DB error")

            resp = views.get_report_by_id_api(req, 1)
            assert resp.status_code == 500
            data = json.loads(resp.content.decode())
            assert str(data["error"]).startswith("Internal server error:")
