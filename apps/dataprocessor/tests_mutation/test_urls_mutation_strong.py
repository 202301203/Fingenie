# apps/dataprocessor/tests_mutation/test_urls_mutation_strong.py

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fingenie_core.settings")
django.setup()

import pytest
from django.test import SimpleTestCase
from django.urls import resolve, reverse, Resolver404

from apps.dataprocessor import views


class TestURLsMutationStrong(SimpleTestCase):

    # ----------------------------------------------------------------------
    #  HELPERS
    # ----------------------------------------------------------------------
    def _resolve_from_reverse(self, name, **kwargs):
        """Helper → reverse() then resolve()"""
        url = reverse(name, kwargs=kwargs or None)
        match = resolve(url)
        return url, match

    # ----------------------------------------------------------------------
    #  PROCESS API
    # ----------------------------------------------------------------------
    def test_process_financial_statements_resolves(self):
        url, match = self._resolve_from_reverse("process_financial_statements")
        assert match.func is views.process_financial_statements_api

    # ----------------------------------------------------------------------
    #  REPORT BY ID
    # ----------------------------------------------------------------------
    def test_report_by_id_resolves_with_str_id(self):
        url, match = self._resolve_from_reverse(
            "get_report_by_id_api",
            report_id="abc-123",
        )
        assert match.func is views.get_report_by_id_api
        assert match.kwargs["report_id"] == "abc-123"

    # ----------------------------------------------------------------------
    #  LATEST REPORT
    # ----------------------------------------------------------------------
    def test_latest_report_resolves(self):
        url, match = self._resolve_from_reverse("get_latest_report_api")
        assert match.func is views.get_latest_report_api

    # ----------------------------------------------------------------------
    #  USER SUMMARY HISTORY
    # ----------------------------------------------------------------------
    def test_user_summary_history_resolves(self):
        url, match = self._resolve_from_reverse("user_summary_history")
        assert match.func is views.user_summary_history

    def test_recent_analyses_resolves(self):
        url, match = self._resolve_from_reverse("recent_analyses")
        assert match.func is views.get_recent_analyses

    # ----------------------------------------------------------------------
    #  DELETE REPORT
    # ----------------------------------------------------------------------
    def test_delete_report_resolves(self):
        url, match = self._resolve_from_reverse(
            "delete_report_api",
            report_id="xyz-789",
        )
        assert match.func is views.delete_report_api
        assert match.kwargs["report_id"] == "xyz-789"

    # ----------------------------------------------------------------------
    #  STOCK DATA — NO PERIOD
    # ----------------------------------------------------------------------
    def test_stock_data_without_period_resolves(self):
        url, match = self._resolve_from_reverse(
            "get_stock_data_api",
            ticker_symbol="TCS.NS",
        )
        assert match.func is views.get_stock_data_api
        assert match.kwargs["ticker_symbol"] == "TCS.NS"
        assert "period" not in match.kwargs

    # ----------------------------------------------------------------------
    #  STOCK DATA — WITH PERIOD
    # ----------------------------------------------------------------------
    def test_stock_data_with_period_resolves(self):
        url, match = self._resolve_from_reverse(
            "get_stock_data_with_period",
            ticker_symbol="RELIANCE.NS",
            period="6M",
        )
        assert match.func is views.get_stock_data_api
        assert match.kwargs["ticker_symbol"] == "RELIANCE.NS"
        assert match.kwargs["period"] == "6M"

    # ----------------------------------------------------------------------
    # NEGATIVE CASES
    # ----------------------------------------------------------------------
    def test_missing_segments_do_not_resolve(self):
        with pytest.raises(Resolver404):
            resolve("/api/stock-data/")          # too short
        with pytest.raises(Resolver404):
            resolve("/api/reports/delete/")      # malformed

    # ----------------------------------------------------------------------
    #  COLLISION SAFETY CHECKS
    # ----------------------------------------------------------------------
    def test_stock_routes_do_not_shadow_each_other(self):
        # → with-period route: 2 segments
        url = reverse(
            "get_stock_data_with_period",
            kwargs={"ticker_symbol": "ITC.NS", "period": "3M"},
        )
        match = resolve(url)
        assert match.func is views.get_stock_data_api
        assert match.kwargs["ticker_symbol"] == "ITC.NS"
        assert match.kwargs["period"] == "3M"

        # → without-period route: 1 segment
        url = reverse(
            "get_stock_data_api",
            kwargs={"ticker_symbol": "ITC.NS"},
        )
        match = resolve(url)
        assert match.func is views.get_stock_data_api
        assert match.kwargs["ticker_symbol"] == "ITC.NS"
        assert "period" not in match.kwargs
