# apps/dataprocessor/tests/test_stock_api.py
import json
import pytest
from unittest.mock import patch
from datetime import datetime, timedelta
from types import SimpleNamespace


class _FakeDF:
    """Minimal fake DataFrame for iterrows and .empty"""
    def __init__(self, rows):
        self._rows = rows

    @property
    def empty(self):
        return len(self._rows) == 0

    def iterrows(self):
        for ts, row in self._rows:
            yield ts, row


@pytest.mark.django_db
@patch("apps.dataprocessor.views.yf")   # <-- FIXED
def test_get_stock_data_api_success(mock_yf, client):
    now = datetime.utcnow()
    rows = [
        (now, {"Close": 100.0}),
        (now + timedelta(days=1), {"Close": 101.5}),
        (now + timedelta(days=2), {"Close": 99.2}),
    ]

    fake_df = _FakeDF(rows)

    mock_yf.download.return_value = fake_df

    fake_ticker = SimpleNamespace()
    fake_ticker.history = lambda period, interval: None
    mock_yf.Ticker.return_value = fake_ticker

    res = client.get(f"/dataprocessor/api/stock-data/TCS.NS/?period=1M")


    assert res.status_code == 200
    data = json.loads(res.content)

    assert data["success"] is True
    assert data["ticker"] == "TCS.NS"
    assert data["point_count"] == 3
    assert len(data["data"]) == 3
    assert "price" in data["data"][0]


@pytest.mark.django_db
@patch("apps.dataprocessor.views.yf")  # <-- FIXED
def test_get_stock_data_api_empty_provider(mock_yf, client):
    mock_yf.download.return_value = _FakeDF([])

    fake_ticker = SimpleNamespace()
    fake_ticker.history = lambda period, interval: None
    mock_yf.Ticker.return_value = fake_ticker

    res = client.get("/dataprocessor/api/stock-data/XYZ/?period=1M")  # <-- FIXED URL

    assert res.status_code == 200
    data = json.loads(res.content)

    assert data["success"] is True
    assert data["data"] == []
