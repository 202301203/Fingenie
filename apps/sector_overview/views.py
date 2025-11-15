from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import yfinance as yf
import pandas as pd
import time
import logging
import requests
from datetime import datetime
import concurrent.futures
from threading import Lock

logger = logging.getLogger(__name__)

# Your complete sectors
SECTORS = {
    "Technology": [
        "TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "LT.NS",
        "TECHM.NS", "MINDTREE.NS", "MPHASIS.NS", "COFORGE.NS", "PERSISTENT.NS",
        "HEXAWARE.NS", "NIITTECH.NS", "CYIENT.NS", "MINDTREE.NS", "LTTS.NS",
        "OFSS.NS", "REDINGTON.NS", "SONATSOFTW.NS", "ZENSARTECH.NS", "KPITTECH.NS"
    ],
    "Banking": [
        "HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS", "SBIN.NS",
        "INDUSINDBK.NS", "BANDHANBNK.NS", "FEDERALBNK.NS", "IDFCFIRSTB.NS", "AUBANK.NS",
        "RBLBANK.NS", "YESBANK.NS", "PNB.NS", "BANKBARODA.NS", "CANBK.NS",
        "UNIONBANK.NS", "IOB.NS", "UCOBANK.NS", "CENTRALBK.NS", "MAHABANK.NS"
    ],
    "Pharma": [
        "DRREDDY.NS", "SUNPHARMA.NS", "CIPLA.NS", "DIVISLAB.NS", "BIOCON.NS",
        "LUPIN.NS", "CADILAHC.NS", "AUROPHARMA.NS", "TORNTPHARM.NS", "ALKEM.NS",
        "GLENMARK.NS", "LALPATHLAB.NS", "FORTIS.NS", "APOLLOHOSP.NS", "NATCOPHARM.NS",
        "GRANULES.NS", "LAURUSLABS.NS", "AJANTPHARM.NS", "STAR.NS", "JBCHEPHARM.NS"
    ],
    "Energy": [
        "RELIANCE.NS", "IOC.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS",
        "TATAPOWER.NS", "ADANIGREEN.NS", "ADANITRANS.NS", "TATAPOWER.NS", "GAIL.NS",
        "BPCL.NS", "HPCL.NS", "PETRONET.NS", "IGL.NS", "MGL.NS",
        "GUJGASLTD.NS", "TORNTPOWER.NS", "JSWENERGY.NS", "NHPC.NS", "SJVN.NS"
    ],
    "Consumer Goods": [
        "HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "TITAN.NS",
        "DABUR.NS", "GODREJCP.NS", "MARICO.NS", "COLPAL.NS", "EMAMILTD.NS",
        "BAJAJCON.NS", "VBL.NS", "MCDOWELL-N.NS", "RADICO.NS", "UNITEDSPIRIT.NS",
        "JUBLFOOD.NS", "WESTLIFE.NS", "BATAINDIA.NS", "V-MART.NS", "TRENT.NS"
    ],
    "Automobile": [
        "MARUTI.NS", "TATAMOTORS.NS", "M&M.NS", "BAJAJ-AUTO.NS", "HEROMOTOCO.NS",
        "EICHERMOT.NS", "ASHOKLEY.NS", "TVSMOTOR.NS", "BALKRISIND.NS", "EXIDEIND.NS",
        "AMARAJABAT.NS", "MOTHERSON.NS", "BHARATFORG.NS", "BOSCHLTD.NS", "MRF.NS",
        "APOLLOTYRE.NS", "CEATLTD.NS", "MAHINDRA.NS", "FORCEMOT.NS", "SONACOMS.NS"
    ],
    "Infrastructure": [
        "LARSEN.NS", "ADANIPORTS.NS", "ADANIENT.NS", "ULTRACEMCO.NS", "ACC.NS",
        "AMBUJACEM.NS", "SHREECEM.NS", "RAMCOCEM.NS", "JKCEMENT.NS", "GRASIM.NS",
        "JSWSTEEL.NS", "TATASTEEL.NS", "SAIL.NS", "HINDALCO.NS", "VEDL.NS",
        "NATIONALUM.NS", "HINDZINC.NS", "APLAPOLLO.NS", "KALYANKJIL.NS", "ASTRAZEN.NS"
    ],
    "Financial Services": [
        "HDFC.NS", "ICICIPRULI.NS", "SBILIFE.NS", "HDFCLIFE.NS", "BAJFINANCE.NS",
        "BAJAJFINSV.NS", "CHOLAFIN.NS", "SRTRANSFIN.NS", "MUTHOOTFIN.NS", "MANAPPURAM.NS",
        "RECLTD.NS", "PFC.NS", "HUDCO.NS", "IRFC.NS", "SBICARD.NS",
        "ICICIGI.NS", "NIACL.NS", "GICRE.NS", "BERGEPAINT.NS", "ASIANPAINT.NS"
    ],
    "Real Estate": [
        "DLF.NS", "PRESTIGE.NS", "SOBHA.NS", "BRIGADE.NS", "GODREJPROP.NS",
        "OBEROIRLTY.NS", "PHOENIXLTD.NS", "MOTHERSON.NS", "INDIGO.NS", "SPICEJET.NS"
    ],
    "Telecom": [
        "BHARTIARTL.NS", "RELIANCE.NS", "IDEA.NS", "MTNL.NS", "TATACOMM.NS"
    ],
    "Metals & Mining": [
        "TATASTEEL.NS", "HINDALCO.NS", "VEDL.NS", "JSWSTEEL.NS", "NATIONALUM.NS",
        "HINDZINC.NS", "MOIL.NS", "NMDC.NS", "COALINDIA.NS", "SAIL.NS"
    ],
    "Chemicals": [
        "PIDILITIND.NS", "BASF.NS", "PIIND.NS", "SRF.NS", "TATACHEM.NS",
        "UPL.NS", "COROMANDEL.NS", "RALLIS.NS", "DEEPAKNTR.NS", "GSFC.NS"
    ]
}

# Test if yfinance is working
def test_yfinance_connection():
    """Test if yfinance can fetch data"""
    try:
        # Test with a simple US stock first
        test_ticker = yf.Ticker("AAPL")
        info = test_ticker.info
        if info:
            print("yfinance connection successful")
            return True
        return False
    except Exception as e:
        print(f" yfinance test failed: {e}")
        return False

def get_stock_data_bulk(tickers):
    """
    Fetch multiple stocks in bulk using yfinance's batch download
    This is much faster than individual requests
    """
    try:
        if not tickers:
            return {}
        
        print(f" Downloading {len(tickers)} stocks in bulk...")
        
        # Download all tickers at once
        data = yf.download(
            tickers=tickers,
            period="2d",
            interval="1d",
            group_by='ticker',
            progress=False,
            threads=True,
            auto_adjust=True
        )
        
        stock_data = {}
        
        for ticker in tickers:
            try:
                # Handle single ticker case
                if len(tickers) == 1:
                    stock_df = data
                else:
                    if ticker not in data:
                        continue
                    stock_df = data[ticker]
                
                if stock_df.empty or len(stock_df) < 2:
                    continue
                
                current_price = stock_df['Close'].iloc[-1]
                prev_close = stock_df['Close'].iloc[-2]
                
                if pd.isna(current_price) or pd.isna(prev_close) or prev_close == 0:
                    continue
                
                change_pct = ((current_price - prev_close) / prev_close) * 100
                
                stock_data[ticker] = {
                    "symbol": ticker.replace('.NS', ''),
                    "price": round(float(current_price), 2),
                    "change_pct": round(float(change_pct), 2),
                    "method": "bulk"
                }
                
            except Exception as e:
                print(f"Error processing {ticker} in bulk: {e}")
                continue
        
        print(f" Bulk download completed: {len(stock_data)}/{len(tickers)} stocks")
        return stock_data
        
    except Exception as e:
        print(f" Bulk download failed: {e}")
        return {}

def get_stock_data_individual(ticker):
    """Fallback method for individual stock data"""
    max_retries = 2
    
    for attempt in range(max_retries):
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period="2d", interval="1d")
            
            if hist.empty or len(hist) < 2:
                continue
            
            current_price = hist['Close'].iloc[-1]
            prev_close = hist['Close'].iloc[-2]
            
            if pd.isna(current_price) or pd.isna(prev_close) or prev_close == 0:
                continue
            
            change_pct = ((current_price - prev_close) / prev_close) * 100
            
            return {
                "symbol": ticker.replace('.NS', ''),
                "price": round(float(current_price), 2),
                "change_pct": round(float(change_pct), 2),
                "method": f"individual_{attempt+1}"
            }
            
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
    
    return None

def process_sector_parallel(sector_name, tickers):
    """Process a single sector in parallel"""
    print(f" Processing sector: {sector_name} with {len(tickers)} stocks")
    
    # First try bulk download for the entire sector
    bulk_data = get_stock_data_bulk(tickers)
    
    stocks_data = []
    missing_tickers = []
    
    # Collect data from bulk download
    for ticker in tickers:
        if ticker in bulk_data:
            stocks_data.append(bulk_data[ticker])
        else:
            missing_tickers.append(ticker)
    
    # Process missing tickers in parallel
    if missing_tickers:
        print(f"Processing {len(missing_tickers)} missing stocks individually for {sector_name}")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_ticker = {
                executor.submit(get_stock_data_individual, ticker): ticker 
                for ticker in missing_tickers
            }
            
            for future in concurrent.futures.as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                try:
                    stock_data = future.result(timeout=10)
                    if stock_data:
                        stocks_data.append(stock_data)
                        print(f"Individual fetch: {ticker}")
                    else:
                        print(f" Individual failed: {ticker}")
                except concurrent.futures.TimeoutError:
                    print(f"Timeout: {ticker}")
                except Exception as e:
                    print(f" Error processing {ticker}: {e}")
    
    # Calculate sector averages
    if stocks_data:
        total_price = sum(stock['price'] for stock in stocks_data)
        total_change = sum(stock['change_pct'] for stock in stocks_data)
        avg_price = total_price / len(stocks_data)
        avg_change = total_change / len(stocks_data)
        
        result = {
            "avg_price": round(avg_price, 2),
            "avg_change_pct": round(avg_change, 2),
            "stocks": stocks_data,
            "companies_count": len(stocks_data),
            "success_rate": f"{len(stocks_data)}/{len(tickers)}"
        }
    else:
        result = {
            "avg_price": 0,
            "avg_change_pct": 0,
            "stocks": [],
            "companies_count": 0,
            "error": "No data available"
        }
    
    print(f"Completed {sector_name}: {len(stocks_data)}/{len(tickers)} stocks")
    return sector_name, result

@csrf_exempt
def sector_overview_api(request):
    """
    Real-time sector overview with parallel processing
    """
    try:
        start_time = time.time()
        
        # Test connection first
        if not test_yfinance_connection():
            return JsonResponse({
                "error": "yfinance connection failed. Please check your network connection.",
                "sectors": {}
            }, status=503)
        
        total_stocks = sum(len(tickers) for tickers in SECTORS.values())
        print(f" Starting parallel processing for {len(SECTORS)} sectors, {total_stocks} stocks...")
        
        sector_data = {}
        successful_sectors = 0
        
        # Process all sectors in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            # Submit all sectors for processing
            future_to_sector = {
                executor.submit(process_sector_parallel, sector_name, tickers[:10]): sector_name 
                for sector_name, tickers in SECTORS.items()
            }
            
            # Collect results as they complete
            for future in concurrent.futures.as_completed(future_to_sector):
                sector_name = future_to_sector[future]
                try:
                    sector_name, result = future.result(timeout=60)  # 60 second timeout per sector
                    sector_data[sector_name] = result
                    if result['companies_count'] > 0:
                        successful_sectors += 1
                    print(f"Sector completed: {sector_name}")
                except concurrent.futures.TimeoutError:
                    print(f" Timeout processing sector: {sector_name}")
                    sector_data[sector_name] = {
                        "avg_price": 0,
                        "avg_change_pct": 0,
                        "stocks": [],
                        "companies_count": 0,
                        "error": "Processing timeout"
                    }
                except Exception as e:
                    print(f" Error processing sector {sector_name}: {e}")
                    sector_data[sector_name] = {
                        "avg_price": 0,
                        "avg_change_pct": 0,
                        "stocks": [],
                        "companies_count": 0,
                        "error": str(e)
                    }
        
        # Calculate overall statistics
        total_fetched_stocks = sum(sector['companies_count'] for sector in sector_data.values())
        success_rate = (total_fetched_stocks / total_stocks) * 100
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"\n PARALLEL PROCESSING COMPLETE")
        print(f" Total time: {processing_time:.2f} seconds")
        print(f" Successful sectors: {successful_sectors}/{len(SECTORS)}")
        print(f" Stocks fetched: {total_fetched_stocks}/{total_stocks} ({success_rate:.1f}%)")
        print(f" Performance: {total_stocks/processing_time:.2f} stocks/second")
        
        if total_fetched_stocks == 0:
            return JsonResponse({
                "error": "Unable to fetch any stock data. Please try again later.",
                "sectors": {}
            }, status=503)
        
        # Add performance metrics to response
        response_data = sector_data.copy()
        response_data["_metadata"] = {
            "processing_time_seconds": round(processing_time, 2),
            "total_sectors": len(SECTORS),
            "total_stocks_requested": total_stocks,
            "total_stocks_fetched": total_fetched_stocks,
            "success_rate_percent": round(success_rate, 1),
            "timestamp": datetime.now().isoformat()
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        logger.error(f"Critical error in sector_overview_api: {str(e)}")
        return JsonResponse({
            "error": f"Failed to fetch sector data: {str(e)}",
            "sectors": {}
        }, status=500)

@csrf_exempt
def health_check(request):
    """Enhanced health check that tests yfinance"""
    try:
        # Test yfinance connection
        test_result = test_yfinance_connection()
        
        return JsonResponse({
            "status": "healthy" if test_result else "degraded",
            "message": "Backend is running" if test_result else "Backend running but yfinance connection failed",
            "yfinance_connected": test_result,
            "timestamp": datetime.now().isoformat(),
            "sectors_configured": len(SECTORS),
            "total_stocks": sum(len(tickers) for tickers in SECTORS.values())
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "unhealthy",
            "message": f"Health check failed: {str(e)}",
            "yfinance_connected": False,
            "timestamp": datetime.now().isoformat()
        }, status=503)

@csrf_exempt
def available_sectors_api(request):
    """Get available sectors"""
    return JsonResponse({
        "sectors": list(SECTORS.keys()),
        "total_stocks": sum(len(tickers) for tickers in SECTORS.values()),
        "data_source": "yfinance Real-time Data",
        "processing": "parallel_optimized"
    })

# CORS middleware
def cors_middleware(get_response):
    def middleware(request):
        response = get_response(request)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    return middleware

# Apply CORS
sector_overview_api = cors_middleware(sector_overview_api)
health_check = cors_middleware(health_check)
available_sectors_api = cors_middleware(available_sectors_api)