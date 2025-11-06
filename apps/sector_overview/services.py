import yfinance as yf
import pandas as pd
from typing import Dict, List, Optional
import json
from django.core.cache import cache
import concurrent.futures

# Enhanced Indian sectors with more representative stocks
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
def safe_get(data, key, default=0):
    """Safely get value from financial data with fallback."""
    try:
        if key in data.index:
            return data.loc[key].iloc[0] if not data.loc[key].empty else default
        return default
    except (KeyError, IndexError, AttributeError):
        return default

def calculate_company_ratios(ticker: str) -> Optional[Dict]:
    """Calculate financial ratios for a single company."""
    try:
        company = yf.Ticker(ticker)
        
        # Get financial data with error handling
        bs = company.balance_sheet
        isheet = company.financials
        
        # Check if data is available
        if bs.empty or isheet.empty:
            print(f"No financial data for {ticker}")
            return None
            
        # Use safe extraction with fallbacks
        current_assets = safe_get(bs, 'Current Assets', 
                        safe_get(bs, 'Total Current Assets', 1))
        inventory = safe_get(bs, 'Inventory', 0)
        current_liabilities = safe_get(bs, 'Current Liabilities', 
                             safe_get(bs, 'Total Current Liabilities', 1))
        long_term_debt = safe_get(bs, 'Long Term Debt', 0)
        short_term_debt = safe_get(bs, 'Short Long Term Debt', 
                         safe_get(bs, 'Short Term Debt', 0))
        total_debt = long_term_debt + short_term_debt
        equity = safe_get(bs, 'Total Stockholder Equity', 1)
        total_assets = safe_get(bs, 'Total Assets', 1)
        revenue = safe_get(isheet, 'Total Revenue', 1)
        net_income = safe_get(isheet, 'Net Income', 0)

        # Calculate ratios with safety checks
        ratios = {
            "current_ratio": current_assets / current_liabilities if current_liabilities else None,
            "quick_ratio": (current_assets - inventory) / current_liabilities if current_liabilities else None,
            "de_ratio": total_debt / equity if equity else None,
            "asset_turnover": revenue / total_assets if total_assets else None,
            "roa": net_income / total_assets if total_assets else None,
            "roe": net_income / equity if equity else None,
        }
        
        # Filter out None values
        ratios = {k: round(v, 3) if v is not None else None for k, v in ratios.items()}
        return ratios
        
    except Exception as e:
        print(f"Error processing {ticker}: {e}")
        return None

def get_sector_avg_ratios(sector: str) -> Dict:
    """Get average financial ratios for a sector with robust error handling."""
    cache_key = f"sector_ratios_{sector}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    tickers = SECTORS.get(sector, [])
    ratios_list = []
    
    # Process up to 10 companies in parallel for performance
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(calculate_company_ratios, tickers[:10])
        
        for ratio in results:
            if ratio is not None:
                ratios_list.append(ratio)
    
    if not ratios_list:
        return {}
        
    # Create DataFrame and calculate averages, ignoring NaN values
    df = pd.DataFrame(ratios_list)
    sector_avg = df.mean().to_dict()
    
    # Round the values for better presentation
    sector_avg = {k: round(v, 3) if v is not None else None for k, v in sector_avg.items()}
    
    # Cache for 1 hour
    cache.set(cache_key, sector_avg, 3600)
    return sector_avg

def compare_with_sector(user_ratios: Dict, sector_avg: Dict) -> Dict:
    """Compare user ratios with sector averages."""
    comparison = {}
    for key, user_val in user_ratios.items():
        avg_val = sector_avg.get(key)
        if avg_val and not pd.isna(avg_val):
            if key in ['de_ratio']:  # lower is better
                if user_val <= avg_val:
                    comparison[key] = f"Better than sector average ({user_val:.2f} vs {avg_val:.2f})"
                else:
                    comparison[key] = f"Worse than sector average ({user_val:.2f} vs {avg_val:.2f})"
            else:  # higher is better
                if user_val >= avg_val:
                    comparison[key] = f"Better than sector average ({user_val:.2f} vs {avg_val:.2f})"
                else:
                    comparison[key] = f"Worse than sector average ({user_val:.2f} vs {avg_val:.2f})"
        else:
            comparison[key] = "Sector data not available"
    return comparison

def interpret_ratios(user_ratios: Dict, sector_avg: Dict) -> Dict:
    """Provide detailed, professional interpretations for ratio comparisons."""
    interpretation = {}
    
    for key, user_val in user_ratios.items():
        avg_val = sector_avg.get(key)
        
        if avg_val is None or pd.isna(avg_val):
            interpretation[key] = "Insufficient sector data for meaningful comparison"
            continue

        # Calculate percentage difference
        if avg_val != 0:
            pct_diff = ((user_val - avg_val) / avg_val) * 100
        else:
            pct_diff = 0

        if key == "current_ratio":
            if user_val >= avg_val * 1.2:
                interpretation[key] = f"Excellent liquidity position ({user_val:.2f}) - significantly stronger than sector average ({avg_val:.2f}). Company has ample short-term assets to cover obligations."
            elif user_val >= avg_val:
                interpretation[key] = f"Solid liquidity ({user_val:.2f}) - slightly better than sector ({avg_val:.2f}). Company maintains healthy working capital management."
            elif user_val >= avg_val * 0.8:
                interpretation[key] = f"Adequate liquidity ({user_val:.2f}) - slightly below sector ({avg_val:.2f}). Monitor short-term obligations carefully."
            else:
                interpretation[key] = f"Potential liquidity concern ({user_val:.2f}) - significantly below sector ({avg_val:.2f}). May face challenges meeting short-term liabilities."

        elif key == "quick_ratio":
            if user_val >= avg_val * 1.2:
                interpretation[key] = f"Strong immediate liquidity ({user_val:.2f}) - well above sector ({avg_val:.2f}). Company can easily meet urgent obligations without selling inventory."
            elif user_val >= avg_val:
                interpretation[key] = f"Good acid-test position ({user_val:.2f}) - matches sector standards ({avg_val:.2f}). Healthy balance of liquid assets to liabilities."
            elif user_val >= avg_val * 0.8:
                interpretation[key] = f"Moderate quick liquidity ({user_val:.2f}) - below sector ({avg_val:.2f}). Relies more on inventory conversion for liquidity."
            else:
                interpretation[key] = f"Quick liquidity risk ({user_val:.2f}) - substantially below sector ({avg_val:.2f}). High dependency on inventory sales to meet immediate obligations."

        elif key == "de_ratio":
            if user_val <= avg_val * 0.8:
                interpretation[key] = f"Conservative capital structure ({user_val:.2f}) - significantly lower leverage than sector ({avg_val:.2f}). Lower financial risk and interest burden."
            elif user_val <= avg_val:
                interpretation[key] = f"Prudent debt management ({user_val:.2f}) - slightly better than sector ({avg_val:.2f}). Balanced use of debt financing."
            elif user_val <= avg_val * 1.2:
                interpretation[key] = f"Moderate leverage ({user_val:.2f}) - higher than sector ({avg_val:.2f}). Acceptable risk level but monitor interest coverage."
            else:
                interpretation[key] = f"High financial leverage ({user_val:.2f}) - substantially above sector ({avg_val:.2f}). Elevated bankruptcy risk and financial stress potential."

        elif key == "asset_turnover":
            if user_val >= avg_val * 1.2:
                interpretation[key] = f"Exceptional asset efficiency ({user_val:.2f}) - significantly outperforms sector ({avg_val:.2f}). Company generates strong revenue from its asset base."
            elif user_val >= avg_val:
                interpretation[key] = f"Effective asset utilization ({user_val:.2f}) - above sector average ({avg_val:.2f}). Good operational efficiency in generating sales."
            elif user_val >= avg_val * 0.8:
                interpretation[key] = f"Moderate asset efficiency ({user_val:.2f}) - below sector norm ({avg_val:.2f}). Potential for better asset management or industry positioning."
            else:
                interpretation[key] = f"Poor asset utilization ({user_val:.2f}) - significantly trails sector ({avg_val:.2f}). Assets may be underutilized or business model less efficient."

        elif key == "roa":
            if user_val >= avg_val * 1.2:
                interpretation[key] = f"Outstanding asset profitability ({user_val:.1f}%) - well above sector ({avg_val:.1f}%). Excellent management of assets to generate profits."
            elif user_val >= avg_val:
                interpretation[key] = f"Strong return on assets ({user_val:.1f}%) - exceeds sector ({avg_val:.1f}%). Efficient conversion of assets into earnings."
            elif user_val >= avg_val * 0.8:
                interpretation[key] = f"Moderate asset returns ({user_val:.1f}%) - below sector ({avg_val:.1f}%). Room for improvement in asset profitability."
            else:
                interpretation[key] = f"Concerning ROA ({user_val:.1f}%) - significantly lags sector ({avg_val:.1f}%). Assets are not generating adequate returns."

        elif key == "roe":
            if user_val >= avg_val * 1.2:
                interpretation[key] = f"Exceptional shareholder returns ({user_val:.1f}%) - substantially above sector ({avg_val:.1f}%). Highly effective at generating profits from equity."
            elif user_val >= avg_val:
                interpretation[key] = f"Strong equity efficiency ({user_val:.1f}%) - outperforms sector ({avg_val:.1f}%). Good returns for shareholders' investment."
            elif user_val >= avg_val * 0.8:
                interpretation[key] = f"Moderate equity returns ({user_val:.1f}%) - below sector expectations ({avg_val:.1f}%). Could improve profitability relative to equity base."
            else:
                interpretation[key] = f"Weak ROE performance ({user_val:.1f}%) - significantly trails sector ({avg_val:.1f}%). Poor utilization of shareholder capital."

        else:
            interpretation[key] = "Ratio analysis not available"
            
    return interpretation

def get_overall_assessment(comparison: Dict, interpretation: Dict) -> str:
    """Provide an overall financial health assessment."""
    positive_count = 0
    total_count = 0
    
    for key, comp_text in comparison.items():
        if "Better" in comp_text or "strong" in interpretation[key].lower() or "excellent" in interpretation[key].lower():
            positive_count += 1
        total_count += 1
    
    if total_count == 0:
        return "Insufficient data for overall assessment"
    
    positive_ratio = positive_count / total_count
    
    if positive_ratio >= 0.7:
        return "Overall: STRONG financial health - Company outperforms sector peers in most metrics"
    elif positive_ratio >= 0.5:
        return "Overall: GOOD financial health - Company meets or exceeds sector standards"
    elif positive_ratio >= 0.3:
        return "Overall: MIXED financial health - Some strengths but areas need improvement"
    else:
        return "Overall: WEAK financial health - Significant underperformance vs sector peers"
