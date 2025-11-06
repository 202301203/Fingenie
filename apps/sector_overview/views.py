# apps/sector_overview/views.py
from django.http import JsonResponse
from django.shortcuts import render
import yfinance as yf
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
import json
from django.core.cache import cache
import concurrent.futures
from typing import Dict, List, Optional
from .services import calculate_company_ratios,get_sector_avg_ratios,compare_with_sector,interpret_ratios,get_overall_assessment

# --- Enhanced Indian sectors with more representative stocks ---
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
def dashboard_view(request):
    """Render the sector overview dashboard page."""
    return render(request, "sector_overview/dashboard.html")

@csrf_exempt
def sector_overview_api(request):
    """API endpoint: Returns real-time sector overview using yfinance for India only."""
    sector_data = {}
    max_stocks_per_sector = 10  # Limit for performance

    for sector, tickers in SECTORS.items():
        try:
            # Use first N stocks for real-time performance
            selected_tickers = tickers[:max_stocks_per_sector]
            
            # Fetch all tickers in the sector at once (faster than looping individually)
            df = yf.download(
                tickers=selected_tickers,
                period="2d",         # Last 2 days to get previous close
                interval="1d",
                group_by='ticker',
                progress=False,
                threads=True,
                auto_adjust=False
            )
            
            # Check if data is empty
            if df.empty:
                sector_data[sector] = {"error": "No data available"}
                continue
                
        except Exception as e:
            sector_data[sector] = {"error": f"Download failed: {str(e)}"}
            continue

        total_change = 0
        total_price = 0
        count = 0
        stocks = []

        for ticker in selected_tickers:
            try:
                # Handle case when only one ticker is downloaded
                if len(selected_tickers) > 1:
                    if ticker not in df:
                        continue
                    data = df[ticker]
                else:
                    data = df

                # Check if we have enough data points
                if len(data) < 2:
                    continue
                    
                # Handle potential NaN values
                current = data["Close"].iloc[-1]
                prev_close = data["Close"].iloc[-2]
                
                if pd.isna(current) or pd.isna(prev_close):
                    continue
                    
                current = float(current)
                prev_close = float(prev_close)
                change_pct = ((current - prev_close) / prev_close) * 100

                stocks.append({
                    "symbol": ticker,
                    "current": round(current, 2),
                    "prev_close": round(prev_close, 2),
                    "change_pct": round(change_pct, 2),
                })

                total_change += change_pct
                total_price += current
                count += 1
                
            except (KeyError, IndexError, ValueError) as e:
                print(f"Error processing {ticker}: {e}")
                continue

        if count > 0:
            sector_data[sector] = {
                "avg_price": round(total_price / count, 2),
                "avg_change_pct": round(total_change / count, 2),
                "stocks": stocks,
                "stocks_count": f"{count}/{len(selected_tickers)}"
            }
        else:
            sector_data[sector] = {"error": "No valid stock data"}

    return JsonResponse(sector_data)


@csrf_exempt
def compare_ratios_api(request):
    """API endpoint for comparing company ratios with sector averages."""
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)

    try:
        data = json.loads(request.body)
        user_ratios = data.get("company_ratios")
        sector = data.get("sector")
        
        if not user_ratios or not sector:
            return JsonResponse({"error": "Missing required fields: company_ratios and sector"}, status=400)
            
        if sector not in SECTORS:
            return JsonResponse({"error": f"Invalid sector. Available sectors: {', '.join(SECTORS.keys())}"}, status=400)

        # Get sector averages
        sector_avg = get_sector_avg_ratios(sector)
        
        if not sector_avg:
            return JsonResponse({"error": f"No financial data available for sector: {sector}"}, status=404)

        # Perform comparison and interpretation
        comparison = compare_with_sector(user_ratios, sector_avg)
        interpretation = interpret_ratios(user_ratios, sector_avg)
        overall_assessment = get_overall_assessment(comparison, interpretation)

        return JsonResponse({
            "sector": sector,
            "sector_avg_ratios": sector_avg,
            "comparison": comparison,
            "interpretation": interpretation,
            "overall_assessment": overall_assessment,
            "analysis_timestamp": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)



@csrf_exempt
def sector_comparison_api(request):
    """
    Separate API: Compares already-extracted company ratios with sector averages
    Requires: company_ratios and sector in POST data
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'}, status=405)

    try:
        # Get data from request
        data = json.loads(request.body)
        company_ratios = data.get('company_ratios')
        sector = data.get('sector')
        
        # Validate inputs
        if not company_ratios:
            return JsonResponse({'error': 'company_ratios are required'}, status=400)
            
        if not sector:
            return JsonResponse({'error': 'sector is required'}, status=400)
            
        if sector not in SECTORS:
            return JsonResponse({
                'error': f'Invalid sector. Available sectors: {", ".join(SECTORS.keys())}'
            }, status=400)

        # Get sector averages
        sector_avg = get_sector_avg_ratios(sector)
        
        if not sector_avg:
            return JsonResponse({
                'error': f'No financial data available for sector: {sector}'
            }, status=404)

        # Perform the comparison analysis
        comparison = compare_with_sector(company_ratios, sector_avg)
        interpretation = interpret_ratios(company_ratios, sector_avg)
        overall_assessment = get_overall_assessment(comparison, interpretation)

        # Return comprehensive comparison results
        return JsonResponse({
            'success': True,
            'sector': sector,
            'company_ratios': company_ratios,
            'sector_avg_ratios': sector_avg,
            'comparison': comparison,  # Detailed ratio-by-ratio comparison
            'interpretation': interpretation,  # Insights for each ratio
            'overall_assessment': overall_assessment,  # Summary verdict
            'analysis_timestamp': pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f'An error occurred during sector comparison: {str(e)}'}, status=500)