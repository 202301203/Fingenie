import pytest
import pandas as pd
from django.urls import reverse
from unittest.mock import MagicMock, PropertyMock

# Enable DB access (though your view doesn't use the DB, it's good practice for Django tests)
pytestmark = pytest.mark.django_db

class TestStockGraphViews:
    
    @pytest.fixture
    def mock_ticker(self, mocker):
        """
        Fixture to mock yf.Ticker so we don't hit the real Yahoo API.
        """
        mock_yf = mocker.patch("apps.stockgraph.views.yf.Ticker")
        mock_instance = mock_yf.return_value
        return mock_instance

    def get_mock_dataframe(self):
        """Helper to create a fake Pandas DataFrame like yfinance returns."""
        dates = pd.date_range(start="2023-01-01", periods=5, freq="D")
        data = {
            "Open": [100.0, 101.0, 102.0, 103.0, 104.0],
            "High": [105.0, 106.0, 107.0, 108.0, 109.0],
            "Low": [95.0, 96.0, 97.0, 98.0, 99.0],
            "Close": [102.0, 103.0, 104.0, 105.0, 106.0],
            "Volume": [1000, 1100, 1200, 1300, 1400]
        }
        return pd.DataFrame(data, index=dates)

    def test_01_get_stock_data_valid_1d(self, client, mock_ticker):
        """Test fetching 1D data successfully."""
        # 1. Setup Mock Data
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {
            'currency': 'USD',
            'currentPrice': 150.00,
            'previousClose': 145.00
        }

        # 2. Call API
        url = reverse('get_stock_data_api', kwargs={'ticker': 'AAPL', 'period': '1D'})
        response = client.get(url)

        # 3. Assertions
        assert response.status_code == 200
        data = response.json()
        
        assert data['ticker'] == 'AAPL'
        assert data['currency'] == 'USD'
        assert data['latestPrice'] == "150.00"
        assert len(data['chartData']) == 5
        # Verify yfinance was called with correct params for 1D
        mock_ticker.history.assert_called_with(period="2d", interval="5m")

    def test_02_get_stock_data_valid_1mo(self, client, mock_ticker):
        """Test fetching 1M data (verifies different params logic)."""
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {'currency': 'EUR', 'currentPrice': 100, 'previousClose': 90}

        url = reverse('get_stock_data_api', kwargs={'ticker': 'MSFT', 'period': '1M'})
        response = client.get(url)

        assert response.status_code == 200
        # Verify params for 1M
        mock_ticker.history.assert_called_with(period="1mo", interval="1d")

    def test_03_invalid_period(self, client):
        """Test that an invalid period returns 400."""
        url = reverse('get_stock_data_api', kwargs={'ticker': 'AAPL', 'period': 'INVALID'})
        response = client.get(url)

        assert response.status_code == 400
        assert response.json()['error'] == 'Invalid period specified'

    def test_04_no_historical_data_found(self, client, mock_ticker):
        """Test 404 when yfinance returns empty dataframe."""
        # Return empty DataFrame
        mock_ticker.history.return_value = pd.DataFrame()
        mock_ticker.info = {}

        url = reverse('get_stock_data_api', kwargs={'ticker': 'BAD_SYMBOL', 'period': '1D'})
        response = client.get(url)

        assert response.status_code == 404
        assert "No historical data found" in response.json()['error']

    def test_05_missing_info_fallback(self, client, mock_ticker):
        """
        Test the fallback logic: When 'stock.info' is empty, 
        it should calculate price from the DataFrame history.
        """
        # 1. Setup Mock: Valid History but Empty Info
        mock_df = self.get_mock_dataframe()
        # Last close in mock_df is 106.0
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {} # Simulate missing info

        # 2. Call API
        url = reverse('get_stock_data_api', kwargs={'ticker': 'TSLA', 'period': '1D'})
        response = client.get(url)

        # 3. Assertions
        assert response.status_code == 200
        data = response.json()
        
        # It should fall back to the last close value (106.0)
        assert data['latestPrice'] == "106.00"
        assert data['currency'] == "N/A"
        # Since last close is used as current, difference should be 0
        assert data['priceDifference'] == "+0.00"

    def test_06_chart_data_structure(self, client, mock_ticker):
        """Test that chartData is formatted correctly (x: timestamp, y: [OHLC])."""
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {'currency': 'USD'}

        url = reverse('get_stock_data_api', kwargs={'ticker': 'AAPL', 'period': '1D'})
        response = client.get(url)
        data = response.json()

        first_point = data['chartData'][0]
        
        # Check keys
        assert 'x' in first_point
        assert 'y' in first_point
        
        # Check y values match Mock [Open, High, Low, Close]
        # Open=100, High=105, Low=95, Close=102
        assert first_point['y'] == [100.0, 105.0, 95.0, 102.0]

    def test_07_unexpected_exception(self, client, mock_ticker):
        """Test that the view handles crashes gracefully (500 Error)."""
        # Make .history() raise an exception
        mock_ticker.history.side_effect = Exception("Yahoo API Down")

        url = reverse('get_stock_data_api', kwargs={'ticker': 'AAPL', 'period': '1D'})
        response = client.get(url)

        assert response.status_code == 500
        assert "An unexpected error occurred" in response.json()['error']

    def test_08_period_5d(self, client, mock_ticker):
        """Cover 5D period branch."""
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {'currency': 'USD', 'currentPrice': 110.0, 'previousClose': 100.0}
        url = reverse('get_stock_data_api', kwargs={'ticker': 'NFLX', 'period': '5D'})
        resp = client.get(url)
        assert resp.status_code == 200
        mock_ticker.history.assert_called_with(period="5d", interval="30m")

    def test_09_period_6m(self, client, mock_ticker):
        """Cover 6M period branch."""
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {'currency': 'USD', 'currentPrice': 120.0, 'previousClose': 110.0}
        url = reverse('get_stock_data_api', kwargs={'ticker': 'AMD', 'period': '6M'})
        resp = client.get(url)
        assert resp.status_code == 200
        mock_ticker.history.assert_called_with(period="6mo", interval="1d")

    def test_10_period_1y(self, client, mock_ticker):
        """Cover 1Y period branch."""
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {'currency': 'USD', 'currentPrice': 140.0, 'previousClose': 130.0}
        url = reverse('get_stock_data_api', kwargs={'ticker': 'IBM', 'period': '1Y'})
        resp = client.get(url)
        assert resp.status_code == 200
        mock_ticker.history.assert_called_with(period="1y", interval="1d")

    def test_11_period_5y(self, client, mock_ticker):
        """Cover 5Y period branch."""
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {'currency': 'USD', 'currentPrice': 200.0, 'previousClose': 190.0}
        url = reverse('get_stock_data_api', kwargs={'ticker': 'ORCL', 'period': '5Y'})
        resp = client.get(url)
        assert resp.status_code == 200
        mock_ticker.history.assert_called_with(period="5y", interval="1wk")

    def test_12_previous_close_missing(self, client, mock_ticker):
        """Fallback to hist last close when previousClose missing."""
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        # previousClose omitted
        mock_ticker.info = {'currency': 'USD', 'currentPrice': 150.0}
        url = reverse('get_stock_data_api', kwargs={'ticker': 'META', 'period': '1D'})
        resp = client.get(url)
        data = resp.json()
        assert resp.status_code == 200
        # last close from dataframe is 106.0
        assert data['priceDifference'] == f"{150.0-106.0:+.2f}"

    def test_13_previous_close_zero(self, client, mock_ticker):
        """Percent diff branch when previousClose is zero."""
        mock_df = self.get_mock_dataframe()
        mock_ticker.history.return_value = mock_df
        mock_ticker.info = {'currency': 'USD', 'currentPrice': 10.0, 'previousClose': 0.0}
        url = reverse('get_stock_data_api', kwargs={'ticker': 'ZERO', 'period': '1D'})
        resp = client.get(url)
        data = resp.json()
        assert resp.status_code == 200
        assert data['percentDifference'] == '+0.00%'

    def test_14_hist_empty_with_info(self, client, mock_ticker):
        """Empty history but info present (different error message branch)."""
        mock_ticker.history.return_value = pd.DataFrame()
        mock_ticker.info = {'currency': 'USD'}  # info not empty
        url = reverse('get_stock_data_api', kwargs={'ticker': 'EMPT', 'period': '1D'})
        resp = client.get(url)
        assert resp.status_code == 404
        err = resp.json()['error']
        assert 'No historical data found' in err
        assert 'Ticker information also failed to load' not in err