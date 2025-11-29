# apps/dataprocessor/tests/test_views_api.py

import io
import json
import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.dataprocessor.models import FinancialReport
from datetime import datetime


@pytest.mark.django_db
def test_process_financial_statements_api_success(client):
    url = reverse("process_financial_statements")

    dummy_pdf = SimpleUploadedFile("test.pdf", b"%PDF-FAKE%", content_type="application/pdf")

    with (
        patch("apps.dataprocessor.views.load_pdf_robust") as mock_load,
        patch("apps.dataprocessor.views.prepare_context_smart") as mock_ctx,
        patch("apps.dataprocessor.views.extract_raw_financial_data") as mock_extract,
        patch("apps.dataprocessor.views.generate_summary_from_data") as mock_summary,
        patch("apps.dataprocessor.views.generate_ratios_from_data") as mock_ratios,
    ):
        mock_load.return_value = ["page1"]
        mock_ctx.return_value = "a" * 400
        mock_extract.return_value = {
            "success": True,
            "financial_items": [],
            "company_name": "TestCo",
            "ticker_symbol": "TCO",
        }
        mock_summary.return_value = {
            "success": True,
            "pros": ["Good"],
            "cons": ["Bad"],
            "financial_health_summary": "Fine",
        }
        mock_ratios.return_value = {
            "success": True,
            "financial_ratios": [{"ratio_name": "R1"}]
        }

        response = client.post(
            url,
            {"file": dummy_pdf, "api_key": "ABC123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["company_name"] == "TestCo"
    assert FinancialReport.objects.count() == 1


@pytest.mark.django_db
def test_process_financial_statements_api_missing_file(client):
    url = reverse("process_financial_statements")
    response = client.post(url, {"api_key": "123"})
    assert response.status_code == 400


@pytest.mark.django_db
def test_process_financial_statements_api_wrong_method(client):
    url = reverse("process_financial_statements")
    response = client.get(url)
    assert response.status_code == 405


# =====================================================================
# GET REPORT BY ID
# =====================================================================

@pytest.mark.django_db
def test_get_report_by_id_api_success(client):
    report = FinancialReport.objects.create(
        company_name="Test Co",
        ticker_symbol="TC"
    )

    url = reverse("get_report_by_id_api", args=[str(report.report_id)])
    response = client.get(url)

    assert response.status_code == 200
    assert response.json()["company_name"] == "Test Co"


@pytest.mark.django_db
def test_get_report_by_id_api_not_found(client):
    url = reverse("get_report_by_id_api", args=["11111111-1111-1111-1111-111111111111"])
    response = client.get(url)
    assert response.status_code == 404


# =====================================================================
# GET LATEST REPORT
# =====================================================================

@pytest.mark.django_db
def test_get_latest_report_api_success(client):
    r = FinancialReport.objects.create(company_name="Latest", ticker_symbol="LCO")
    url = reverse("get_latest_report_api")

    response = client.get(url)
    assert response.status_code == 200
    assert response.json()["company_name"] == "Latest"


@pytest.mark.django_db
def test_get_latest_report_api_no_reports(client):
    url = reverse("get_latest_report_api")
    response = client.get(url)
    assert response.status_code == 404


# =====================================================================
# USER SUMMARY HISTORY
# =====================================================================

@pytest.mark.django_db
def test_user_summary_history(client):
    FinancialReport.objects.create(company_name="A")
    FinancialReport.objects.create(company_name="B")

    url = reverse("user_summary_history")
    response = client.get(url)
    data = response.json()

    assert response.status_code == 200
    assert data["success"] is True
    assert data["total_reports"] == 2


# =====================================================================
# RECENT ANALYSES
# =====================================================================

@pytest.mark.django_db
def test_recent_analyses(client):
    FinancialReport.objects.create(company_name="A")
    FinancialReport.objects.create(company_name="B")

    url = reverse("recent_analyses")
    response = client.get(url)
    assert response.status_code == 200
    assert response.json()["success"] is True


# =====================================================================
# DELETE REPORT
# =====================================================================

@pytest.mark.django_db
def test_delete_report_api_success(client):
    r = FinancialReport.objects.create(company_name="ToDelete")
    url = reverse("delete_report_api", args=[str(r.report_id)])

    response = client.post(url)
    assert response.status_code == 200
    assert FinancialReport.objects.count() == 0


@pytest.mark.django_db
def test_delete_report_api_not_found(client):
    url = reverse("delete_report_api", args=["00000000-0000-0000-0000-000000000000"])
    response = client.post(url)
    assert response.status_code == 404


@pytest.mark.django_db
def test_delete_report_api_wrong_method(client):
    r = FinancialReport.objects.create(company_name="WrongMethod")
    url = reverse("delete_report_api", args=[str(r.report_id)])

    response = client.get(url)
    assert response.status_code == 405


# =====================================================================
# STOCK DATA API
# =====================================================================

@pytest.mark.django_db
@patch("apps.dataprocessor.views.yf")
def test_get_stock_data_success(mock_yf, client):
    df_mock = MagicMock()
    df_mock.empty = False
    df_mock.iterrows.return_value = [
        (datetime(2024, 1, 1), {"Close": 100})
    ]

    mock_yf.download.return_value = df_mock
    mock_yf.Ticker.return_value.history.return_value = df_mock

    url = reverse("get_stock_data_api", args=["AAPL"])
    response = client.get(url)

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["point_count"] == 1


@pytest.mark.django_db
@patch("apps.dataprocessor.views.yf")
def test_get_stock_data_no_data(mock_yf, client):
    df_mock = MagicMock()
    df_mock.empty = True
    mock_yf.download.return_value = df_mock
    mock_yf.Ticker.return_value.history.return_value = df_mock

    url = reverse("get_stock_data_api", args=["AAPL"])
    response = client.get(url)

    assert response.status_code == 200
    assert response.json()["data"] == []
