# test_views.py

import pytest
from unittest.mock import patch, MagicMock
from django.http import HttpRequest
from dataprocessor.views import get_report_by_id_api

@pytest.mark.django_db
class TestGetReportByIdApi:
    """
    Unit tests for the get_report_by_id_api function in dataprocessor.views.
    """

    @pytest.fixture
    def mock_request(self):
        """Fixture to create a mock GET request."""
        request = HttpRequest()
        request.method = 'GET'
        return request

    @pytest.mark.happy_path
    def test_returns_report_successfully(self, mock_request):
        """
        Test that a valid report_id returns the correct JSON response with all expected fields.
        """
        mock_report = MagicMock()
        mock_report.report_id = 123
        mock_report.company_name = "Acme Corp"
        mock_report.ticker_symbol = "ACME"
        mock_report.get_summary.return_value = {"year": 2023, "revenue": 1000}
        mock_report.get_ratios.return_value = {"pe_ratio": 15.2}

        with patch('dataprocessor.views.FinancialReport.objects.get', return_value=mock_report):
            response = get_report_by_id_api(mock_request, 123)
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
            assert data['report_id'] == "123"
            assert data['company_name'] == "Acme Corp"
            assert data['ticker_symbol'] == "ACME"
            assert data['summary'] == {"year": 2023, "revenue": 1000}
            assert data['ratios'] == {"pe_ratio": 15.2}

    @pytest.mark.happy_path
    def test_returns_report_with_empty_summary_and_ratios(self, mock_request):
        """
        Test that a report with empty summary and ratios returns those fields as empty dicts.
        """
        mock_report = MagicMock()
        mock_report.report_id = 456
        mock_report.company_name = "Beta Inc"
        mock_report.ticker_symbol = "BETA"
        mock_report.get_summary.return_value = {}
        mock_report.get_ratios.return_value = {}

        with patch('dataprocessor.views.FinancialReport.objects.get', return_value=mock_report):
            response = get_report_by_id_api(mock_request, 456)
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
            assert data['report_id'] == "456"
            assert data['company_name'] == "Beta Inc"
            assert data['ticker_symbol'] == "BETA"
            assert data['summary'] == {}
            assert data['ratios'] == {}

    @pytest.mark.happy_path
    def test_report_id_is_stringified(self, mock_request):
        """
        Test that the report_id is always returned as a string, even if originally an int.
        """
        mock_report = MagicMock()
        mock_report.report_id = 789
        mock_report.company_name = "Gamma LLC"
        mock_report.ticker_symbol = "GAM"
        mock_report.get_summary.return_value = {"foo": "bar"}
        mock_report.get_ratios.return_value = {"baz": 1}

        with patch('dataprocessor.views.FinancialReport.objects.get', return_value=mock_report):
            response = get_report_by_id_api(mock_request, 789)
            data = response.json()
            assert isinstance(data['report_id'], str)
            assert data['report_id'] == "789"

    @pytest.mark.edge_case
    def test_report_not_found_returns_404(self, mock_request):
        """
        Test that requesting a non-existent report_id returns a 404 with appropriate error message.
        """
        with patch('dataprocessor.views.FinancialReport.objects.get', side_effect=type('DoesNotExist', (), {})()):
            # Patch the DoesNotExist exception to simulate the real one
            with patch('dataprocessor.views.FinancialReport.DoesNotExist', new=Exception):
                with patch('dataprocessor.views.FinancialReport.objects.get', side_effect=Exception):
                    response = get_report_by_id_api(mock_request, 999)
                    assert response.status_code == 404
                    data = response.json()
                    assert data['error'] == 'Report not found'

    @pytest.mark.edge_case
    def test_internal_server_error_returns_500(self, mock_request):
        """
        Test that an unexpected exception in the view returns a 500 with an appropriate error message.
        """
        with patch('dataprocessor.views.FinancialReport.objects.get', side_effect=ValueError("DB error")):
            # Patch DoesNotExist to something else so ValueError is not caught as DoesNotExist
            with patch('dataprocessor.views.FinancialReport.DoesNotExist', new=KeyError):
                response = get_report_by_id_api(mock_request, 123)
                assert response.status_code == 500
                data = response.json()
                assert data['error'].startswith('Internal server error:')

    @pytest.mark.edge_case
    def test_report_id_with_unusual_type(self, mock_request):
        """
        Test that the function can handle a report_id that is a string (if the model allows).
        """
        mock_report = MagicMock()
        mock_report.report_id = "abc-123"
        mock_report.company_name = "Delta Ltd"
        mock_report.ticker_symbol = "DEL"
        mock_report.get_summary.return_value = {"ok": True}
        mock_report.get_ratios.return_value = {"ratio": 0}

        with patch('dataprocessor.views.FinancialReport.objects.get', return_value=mock_report):
            response = get_report_by_id_api(mock_request, "abc-123")
            assert response.status_code == 200
            data = response.json()
            assert data['report_id'] == "abc-123"
            assert data['company_name'] == "Delta Ltd"
            assert data['ticker_symbol'] == "DEL"
            assert data['summary'] == {"ok": True}
            assert data['ratios'] == {"ratio": 0}
