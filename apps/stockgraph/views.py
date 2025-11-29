from django.http import JsonResponse
import yfinance as yf
from datetime import datetime, timedelta

def get_stock_data_api(request, ticker, period):
    """
    API view to fetch stock data for a given ticker and period.
    """
    try:
        stock = yf.Ticker(ticker)

        # 1. Define parameters for yfinance based on the requested period
        params = {}
        if period == '1D':
            # Fetch last 2 days of data with 5-minute interval for a 1-day view
            params = {"period": "2d", "interval": "5m"}
        elif period == '5D':
            params = {"period": "5d", "interval": "30m"}
        elif period == '1M':
            params = {"period": "1mo", "interval": "1d"}
        elif period == '6M':
            params = {"period": "6mo", "interval": "1d"}
        elif period == '1Y':
            params = {"period": "1y", "interval": "1d"}
        elif period == '5Y':
            params = {"period": "5y", "interval": "1wk"}
        else:
            return JsonResponse({'error': 'Invalid period specified'}, status=400)

        # 2. Fetch historical data
        hist = stock.history(**params)
        
        # --- MODIFICATION 1: Check for historical data immediately ---
        if hist.empty:
            # Check if yfinance logged a failure reason
            error_msg = f'No historical data found for ticker {ticker} for period {period}.'
            if stock.info is None or not stock.info:
                 error_msg += " Ticker information also failed to load (possibly invalid symbol or data source issue)."
            
            # Use 404 for 'No data found'
            return JsonResponse({'error': error_msg}, status=404)

        # 3. Format historical data for candlestick/bar charts (OHLC format)
        chart_data = []
        for index, row in hist.iterrows():
            chart_data.append({
                'x': int(index.timestamp() * 1000), # Timestamp in milliseconds
                'y': [row['Open'], row['High'], row['Low'], row['Close']]
            })

        # 4. Fetch current price information
        info = stock.info
        
        # --- MODIFICATION 2: Handle cases where 'info' might be incomplete or missing ---
        if not info:
            # If info failed, use the last available close price from the historical data
            last_close = hist['Close'].iloc[-1]
            current_price = last_close
            price_diff = 0.0
            percent_diff = 0.0
            currency = 'N/A'
        else:
            last_close = info.get('previousClose', hist['Close'].iloc[-1] if not hist.empty else 0)
            current_price = info.get('currentPrice', hist['Close'].iloc[-1])
            
            price_diff = current_price - last_close
            percent_diff = (price_diff / last_close * 100) if last_close != 0 else 0
            currency = info.get('currency', 'USD')
        
        # 5. Build the final JSON response
        response_data = {
            'ticker': ticker,
            'currency': currency,
            'latestPrice': f"{current_price:.2f}",
            'priceDifference': f"{price_diff:+.2f}",
            'percentDifference': f"{percent_diff:+.2f}%",
            'chartData': chart_data
        }

        return JsonResponse(response_data, status=200)

    except Exception as e:
        # Catch any unexpected errors during processing
        return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)
