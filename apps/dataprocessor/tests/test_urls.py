import pytest
from django.urls import reverse, resolve
from apps.dataprocessor import views


BASE = "/dataprocessor"   # your project-level prefix


def test_url_process_financial_statements():
    path = reverse("process_financial_statements")
    assert resolve(path).func == views.process_financial_statements_api
    assert path == f"{BASE}/api/process/"


def test_url_get_report_by_id():
    path = reverse("get_report_by_id_api", kwargs={"report_id": "ABC"})
    assert resolve(path).func == views.get_report_by_id_api
    assert path == f"{BASE}/api/reports/ABC/"


def test_url_latest_report():
    path = reverse("get_latest_report_api")
    assert resolve(path).func == views.get_latest_report_api
    assert path == f"{BASE}/api/latest-report/"


def test_url_summary_history():
    path = reverse("user_summary_history")
    assert resolve(path).func == views.user_summary_history
    assert path == f"{BASE}/api/profile/summary-history/"


def test_url_recent_analyses():
    path = reverse("recent_analyses")
    assert resolve(path).func == views.get_recent_analyses
    assert path == f"{BASE}/api/profile/recent-analyses/"


def test_url_delete_report():
    path = reverse("delete_report_api", kwargs={"report_id": "X1"})
    assert resolve(path).func == views.delete_report_api
    assert path == f"{BASE}/api/reports/X1/delete/"


def test_url_stock_data_default():
    path = reverse("get_stock_data_api", kwargs={"ticker_symbol": "TCS"})
    assert resolve(path).func == views.get_stock_data_api
    assert path == f"{BASE}/api/stock-data/TCS/"


def test_url_stock_data_with_period():
    path = reverse("get_stock_data_with_period", kwargs={"ticker_symbol": "TCS", "period": "1M"})
    assert resolve(path).func == views.get_stock_data_api
    assert path == f"{BASE}/api/stock-data/TCS/1M/"
