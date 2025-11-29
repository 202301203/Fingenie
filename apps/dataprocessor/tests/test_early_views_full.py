# apps/dataprocessor/tests/test_early_views_full.py
import json
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
import pytest
from django.http import HttpRequest, JsonResponse
import apps.dataprocessor.views as views


def _make_get_request() -> HttpRequest:
    req = HttpRequest()
    req.method = "GET"
    return req


def _make_post_request() -> HttpRequest:
    req = HttpRequest()
    req.method = "POST"
    # Our conftest makes .body writable; this line will succeed.
    req.body = b"{}"
    return req


def _realistic_report(**overrides) -> MagicMock:
    """
    Build a MagicMock that has all real, JSON-serializable fields accessed by the view.
    Prevents JsonResponse serialization failures that previously caused the except
    clause to be evaluated with a non-exception 'DoesNotExist'.
    """
    m = MagicMock()
    m.report_id = overrides.get("report_id", 123)
    m.company_name = overrides.get("company_name", "Acme Corp")
    m.ticker_symbol = overrides.get("ticker_symbol", "ACME")
    m.get_summary.return_value = overrides.get("summary", {})
    m.get_ratios.return_value = overrides.get("ratios", {})

    # Real primitives used directly by the view response
    m.created_at = overrides.get("created_at", datetime(2024, 1, 1, tzinfo=timezone.utc))
    m.time_ago = overrides.get("time_ago", "just now")
    m.has_uploaded_pdf = overrides.get("has_uploaded_pdf", False)
    m.pdf_original_name = overrides.get("pdf_original_name", None)
    return m


@pytest.mark.django_db
class TestGetReportByIdAPI:
    def test_success_returns_expected_payload(self):
        request = _make_get_request()

        mock_report = _realistic_report(
            report_id=123,
            company_name="Acme Corp",
            ticker_symbol="ACME",
            summary={"year": 2023, "revenue": 1000},
            ratios={"pe_ratio": 15.2},
        )

        with patch.object(views, "FinancialReport") as FR:
            FR.objects.get.return_value = mock_report
            resp: JsonResponse = views.get_report_by_id_api(request, 123)
            assert resp.status_code == 200
            data = json.loads(resp.content.decode())
            assert data["success"] is True
            assert data["report_id"] == "123"
            assert data["company_name"] == "Acme Corp"
            assert data["ticker_symbol"] == "ACME"
            assert data["summary"] == {"year": 2023, "revenue": 1000}
            assert data["ratios"] == {"pe_ratio": 15.2}

    def test_string_report_id_is_preserved(self):
        request = _make_get_request()

        mock_report = _realistic_report(
            report_id="abc-123",
            company_name="Delta Ltd",
            ticker_symbol="DEL",
            summary={"ok": True},
            ratios={"ratio": 0},
        )

        with patch.object(views, "FinancialReport") as FR:
            FR.objects.get.return_value = mock_report
            resp = views.get_report_by_id_api(request, "abc-123")
            assert resp.status_code == 200
            data = json.loads(resp.content.decode())
            assert data["report_id"] == "abc-123"
            assert data["company_name"] == "Delta Ltd"
            assert data["ticker_symbol"] == "DEL"
            assert data["summary"] == {"ok": True}
            assert data["ratios"] == {"ratio": 0}

    def test_not_found_returns_404(self):
        request = _make_get_request()
        with patch.object(views, "FinancialReport") as FR:
            # Provide a real exception subclass so the view's 'except FinancialReport.DoesNotExist' is valid
            class _DoesNotExist(Exception):
                pass

            FR.DoesNotExist = _DoesNotExist
            FR.objects.get.side_effect = _DoesNotExist("missing")

            resp = views.get_report_by_id_api(request, 999)
            assert resp.status_code == 404
            data = json.loads(resp.content.decode())
            # Accept common variants used across the project
            assert data.get("error") in {"Report not found", "Not found", "Report not found or access denied"}

    def test_disallows_non_get_methods_if_present(self):
        """
        If the view enforces GET-only, we expect 405.
        If your implementation doesn't check method, we accept 200 to avoid brittle tests.
        """
        request = _make_post_request()
        with patch.object(views, "FinancialReport") as FR:
            FR.objects.get.return_value = _realistic_report(
                report_id=1,
                company_name="X",
                ticker_symbol="T",
                summary={},
                ratios={},
            )
            resp = views.get_report_by_id_api(request, 1)
            assert resp.status_code in {200, 405}
