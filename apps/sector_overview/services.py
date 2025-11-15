from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import pandas as pd
import yfinance as yf
from django.core.cache import cache
import concurrent.futures
import threading
import time
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Use simpler, more reliable stock symbols (without .NS for better compatibility)
SECTORS = {
    "Technology": ["TCS", "INFY", "WIPRO", "HCLTECH"],
    "Banking": ["HDFCBANK", "ICICIBANK", "KOTAKBANK", "AXISBANK"],
    "Pharma": ["DRREDDY", "SUNPHARMA", "CIPLA", "DIVISLAB"],
    "Energy": ["RELIANCE", "ONGC", "NTPC", "TATAPOWER"],
}

# Global variable to track data fetching status
data_fetching_status = {
    'is_fetching': False,
    'last_fetch_time': None,
    'cached_data': None,
    'error_count': 0
}

def get_ticker_symbol(ticker):
    """Convert ticker to proper format for yfinance"""
    # Try with .NS suffix first, then without
    return f"{ticker}.NS"

def fetch_stock_data_simple(ticker):
    """Simplified stock data fetching with robust error handling"""
    max_retries = 2
    for attempt in range(max_retries):
        try:
            # Try with .NS suffix
            ticker_symbol = get_ticker_symbol(ticker)
            stock = yf.Ticker(ticker_symbol)
            
            # Get basic info quickly
            info = stock.info
            hist = stock.history(period="1d", interval="1m")
            
            if hist.empty:
                # Try without .NS suffix as fallback
                if attempt == 0 and ticker_symbol.endswith('.NS'):
                    ticker_symbol = ticker
                    stock = yf.Ticker(ticker_symbol)
                    info = stock.info
                    hist = stock.history(period="1d", interval="1m")
                
                if hist.empty:
                    logger.warning(f"No price data found for {ticker_symbol}")
                    return None
            
            current_price = hist['Close'].iloc[-1]
            prev_close = info.get('previousClose', current_price)
            
            # Calculate percentage change safely
            if prev_close and prev_close > 0:
                change_percent = ((current_price - prev_close) / prev_close) * 100
            else:
                change_percent = 0
            
            return {
                "symbol": ticker,
                "change_pct": round(change_percent, 2),
                "price": round(current_price, 2)
            }
            
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1} failed for {ticker}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(1)  # Wait before retry
                continue
            logger.error(f"Failed to fetch data for {ticker} after {max_retries} attempts: {str(e)}")
            return None

def fetch_all_sector_data():
    """Fetch all sector data with comprehensive error handling"""
    global data_fetching_status
    
    logger.info("Starting sector data fetch...")
    data_fetching_status['is_fetching'] = True
    data_fetching_status['error_count'] = 0
    
    try:
        sector_data = {}
        start_time = time.time()
        successful_fetches = 0
        total_stocks = sum(len(tickers) for tickers in SECTORS.values())
        
        # Process sectors sequentially to avoid overwhelming the API
        for sector_name, tickers in SECTORS.items():
            logger.info(f"Processing sector: {sector_name}")
            stocks_data = []
            sector_prices = []
            sector_changes = []
            
            # Process stocks in parallel but with limited workers
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                future_to_ticker = {
                    executor.submit(fetch_stock_data_simple, ticker): ticker 
                    for ticker in tickers
                }
                
                for future in concurrent.futures.as_completed(future_to_ticker):
                    ticker = future_to_ticker[future]
                    try:
                        stock_data = future.result(timeout=15)  # 15 second timeout per stock
                        if stock_data:
                            stocks_data.append(stock_data)
                            sector_prices.append(stock_data['price'])
                            sector_changes.append(stock_data['change_pct'])
                            successful_fetches += 1
                            logger.info(f"✓ Successfully fetched {ticker}")
                        else:
                            data_fetching_status['error_count'] += 1
                            logger.warning(f"✗ Failed to fetch {ticker}")
                    except concurrent.futures.TimeoutError:
                        data_fetching_status['error_count'] += 1
                        logger.warning(f"✗ Timeout fetching {ticker}")
                    except Exception as e:
                        data_fetching_status['error_count'] += 1
                        logger.error(f"✗ Error processing {ticker}: {str(e)}")
            
            # Calculate sector averages if we have data
            if stocks_data:
                avg_price = sum(sector_prices) / len(sector_prices)
                avg_change = sum(sector_changes) / len(sector_changes)
                
                sector_data[sector_name] = {
                    "avg_price": round(avg_price, 2),
                    "avg_change_pct": round(avg_change, 2),
                    "stocks": stocks_data,
                    "companies_count": len(stocks_data)
                }
            else:
                # Create empty sector data
                sector_data[sector_name] = {
                    "avg_price": 0,
                    "avg_change_pct": 0,
                    "stocks": [],
                    "companies_count": 0
                }
        
        # Cache the result for 5 minutes
        cache.set("sector_overview_data", sector_data, 300)
        data_fetching_status['cached_data'] = sector_data
        data_fetching_status['is_fetching'] = False
        data_fetching_status['last_fetch_time'] = time.time()
        
        elapsed_time = time.time() - start_time
        success_rate = (successful_fetches / total_stocks) * 100
        
        logger.info(f"Sector data fetch completed in {elapsed_time:.2f} seconds")
        logger.info(f"Success rate: {success_rate:.1f}% ({successful_fetches}/{total_stocks} stocks)")
        
        return sector_data
        
    except Exception as e:
        logger.error(f"Critical error in fetch_all_sector_data: {str(e)}")
        data_fetching_status['is_fetching'] = False
        data_fetching_status['error_count'] += 1
        return {}

def start_data_fetch_if_needed():
    """Start data fetch if not already in progress"""
    global data_fetching_status
    
    # Return cached data if available and recent (less than 5 minutes old)
    cached_data = cache.get("sector_overview_data")
    if cached_data and data_fetching_status['last_fetch_time']:
        time_since_last_fetch = time.time() - data_fetching_status['last_fetch_time']
        if time_since_last_fetch < 300:  # 5 minutes
            data_fetching_status['cached_data'] = cached_data
            return cached_data
    
    # Start new fetch if not already fetching
    if not data_fetching_status['is_fetching']:
        thread = threading.Thread(target=fetch_all_sector_data)
        thread.daemon = True
        thread.start()
    
    return None

# CORS decorator
def cors_allow_all(view_func):
    def wrapped_view(request, *args, **kwargs):
        if request.method == "OPTIONS":
            response = JsonResponse({"status": "ok"})
        else:
            response = view_func(request, *args, **kwargs)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    return wrapped_view

@csrf_exempt
@cors_allow_all
@require_http_methods(["GET", "OPTIONS"])
def sector_overview_api(request):
    """
    Main sector overview API
    """
    if request.method == "OPTIONS":
        return JsonResponse({"status": "ok"})
    
    try:
        # Check if we have recent cached data
        cached_data = start_data_fetch_if_needed()
        
        if cached_data:
            return JsonResponse(cached_data)
        
        # If data is being fetched, wait for it
        max_wait_time = 45  # 45 seconds max
        poll_interval = 3   # Check every 3 seconds
        
        for i in range(max_wait_time // poll_interval):
            time.sleep(poll_interval)
            
            # Check if data is now available
            if (data_fetching_status['cached_data'] and 
                not data_fetching_status['is_fetching']):
                return JsonResponse(data_fetching_status['cached_data'])
            
            # Check if fetching failed
            if (not data_fetching_status['is_fetching'] and 
                not data_fetching_status['cached_data']):
                break
        
        # Return whatever we have or empty data
        final_data = data_fetching_status['cached_data'] or {}
        return JsonResponse(final_data)
        
    except Exception as e:
        logger.error(f"Error in sector_overview_api: {str(e)}")
        return JsonResponse({
            "error": "Unable to fetch sector data at this time",
            "sectors": {}
        }, status=500)

@csrf_exempt
@cors_allow_all
@require_http_methods(["GET", "OPTIONS"])
def sector_status_api(request):
    """API to check current data fetching status"""
    global data_fetching_status
    
    cached_data = cache.get("sector_overview_data")
    has_cached_data = cached_data is not None and bool(cached_data)
    
    # Calculate progress
    total_stocks = sum(len(tickers) for tickers in SECTORS.values())
    fetched_stocks = 0
    if data_fetching_status['cached_data']:
        for sector_data in data_fetching_status['cached_data'].values():
            fetched_stocks += len(sector_data.get('stocks', []))
    
    progress = (fetched_stocks / total_stocks * 100) if total_stocks > 0 else 0
    
    return JsonResponse({
        "is_fetching": data_fetching_status['is_fetching'],
        "has_cached_data": has_cached_data,
        "progress": round(progress),
        "fetched_stocks": fetched_stocks,
        "total_stocks": total_stocks,
        "error_count": data_fetching_status['error_count'],
        "sectors_ready": list(data_fetching_status['cached_data'].keys()) if data_fetching_status['cached_data'] else [],
        "timestamp": datetime.now().isoformat()
    })

@csrf_exempt
@cors_allow_all
@require_http_methods(["GET", "OPTIONS"])
def available_sectors_api(request):
    """API endpoint to get list of available sectors"""
    return JsonResponse({
        "success": True,
        "sectors": list(SECTORS.keys()),
        "total_stocks": sum(len(tickers) for tickers in SECTORS.values()),
        "timestamp": datetime.now().isoformat()
    })

@csrf_exempt
@cors_allow_all
@require_http_methods(["GET", "OPTIONS"])
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        "status": "healthy", 
        "message": "Backend is running",
        "sectors_configured": len(SECTORS),
        "timestamp": datetime.now().isoformat()
    })

@csrf_exempt
@cors_allow_all
@require_http_methods(["GET", "POST", "OPTIONS"])
def force_refresh_api(request):
    """Force refresh of sector data"""
    global data_fetching_status
    
    # Clear cache and start new fetch
    cache.delete("sector_overview_data")
    data_fetching_status['is_fetching'] = False
    data_fetching_status['cached_data'] = None
    data_fetching_status['error_count'] = 0
    
    # Start new fetch
    start_data_fetch_if_needed()
    
    return JsonResponse({
        "status": "refresh_started",
        "message": "Data refresh initiated",
        "timestamp": datetime.now().isoformat()
    })