import os
import json
import re
import uuid
import traceback
import concurrent.futures
from typing import List, Optional, Dict, Any
from functools import partial

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from pydantic import BaseModel, Field

from langchain_core.documents import Document
from langchain_groq import ChatGroq

# FIXED: Import from services instead of views
from apps.dataprocessor.services import (
    extract_raw_financial_data,
    load_financial_document,
    prepare_context_smart,
    create_groq_llm
)

# ------------------------------
# 🔹 Pydantic Models
# ------------------------------

class FinancialTrendItem(BaseModel):
    metric: str = Field(..., description="Name of the financial metric")
    yearly_values: Dict[str, float] = Field(..., description="Dictionary mapping year -> value")
    growth_rate: Optional[float] = Field(None, description="Average annual growth rate (%)")
    interpretation: str = Field(..., description="Short interpretation of the trend")
    indication: str = Field(..., description="What the trend indicates about the company's financial health")
    trend_direction: str = Field(..., description="Trend direction: increasing, decreasing, or stable")
    importance_score: int = Field(..., description="Score from 1-100 indicating importance")
    data_quality: str = Field(..., description="Quality of data: excellent, good, estimated, poor")

class FinancialTrends(BaseModel):
    financial_trends: List[FinancialTrendItem] = Field(..., description="List of trend analyses")

# ------------------------------
# 🔹 Parallel Processing Functions
# ------------------------------

def process_single_file(uploaded_file, api_key, media_root):
    """Process a single file independently - designed for parallel execution."""
    try:
        unique_name = str(uuid.uuid4())
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        file_name = uploaded_file.name

        if ext not in ['.pdf', '.xlsx', '.xls']:
            return None

        # Extract year from filename
        year_match = re.search(r'(20\d{2})', file_name)
        year = year_match.group(1) if year_match else f"Year_{uuid.uuid4().hex[:4]}"

        file_path = os.path.join(media_root, f"{unique_name}{ext}")
        
        # Save file
        with open(file_path, 'wb+') as dest:
            for chunk in uploaded_file.chunks():
                dest.write(chunk)

        print(f"Processing {file_name} (year: {year}) in parallel...")

        # Process document
        documents = load_financial_document(file_path)
        if not documents:
            print(f"Failed to load document: {file_name}")
            if os.path.exists(file_path):
                os.remove(file_path)
            return None

        context_text = prepare_context_smart(documents)
        if len(context_text.strip()) < 100:
            print(f"Insufficient context extracted from: {file_name}")
            if os.path.exists(file_path):
                os.remove(file_path)
            return None

        extraction = extract_raw_financial_data(context_text, api_key)
        if not extraction.get("success"):
            print(f"Data extraction failed for: {file_name}")
            if os.path.exists(file_path):
                os.remove(file_path)
            return None

        # Extract ALL years data
        yearly_data = extract_all_years_data(extraction, year)
        
        result = {
            "filename": file_name,
            "year": year,
            "company_name": extraction.get("company_name"),
            "ticker_symbol": extraction.get("ticker_symbol"),
            "items_extracted": len(extraction.get("financial_items", [])),
            "years_found": len(yearly_data),
            "yearly_data": yearly_data
        }

        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)

        print(f"Successfully processed {file_name}")
        return result

    except Exception as e:
        print(f"Error processing {uploaded_file.name}: {str(e)}")
        # Cleanup on error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        return None

def process_files_parallel(uploaded_files, api_keys, media_root, max_workers=None):
    """Process multiple files in parallel using ThreadPoolExecutor with multiple API keys."""
    if max_workers is None:
        # Use optimal number of workers based on file count and CPU cores
        max_workers = min(len(uploaded_files), os.cpu_count() or 4, 8)  # Cap at 8 workers
    
    # Ensure we have enough API keys
    if len(api_keys) < max_workers:
        print(f"Warning: Only {len(api_keys)} API keys provided for {max_workers} workers")
        # Cycle through available keys if we have fewer keys than workers
        api_keys = [api_keys[i % len(api_keys)] for i in range(max_workers)]
    
    print(f"Starting parallel processing of {len(uploaded_files)} files with {max_workers} workers using {len(set(api_keys))} API keys...")
    
    # Create a list of (file, api_key) pairs for each worker
    file_key_pairs = []
    for i, uploaded_file in enumerate(uploaded_files):
        # Assign API key in round-robin fashion
        api_key = api_keys[i % len(api_keys)]
        file_key_pairs.append((uploaded_file, api_key))
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks with their assigned API keys
        future_to_file = {
            executor.submit(process_single_file, uploaded_file, api_key, media_root): uploaded_file 
            for uploaded_file, api_key in file_key_pairs
        }
        
        # Collect results as they complete
        results = []
        for future in concurrent.futures.as_completed(future_to_file):
            uploaded_file = future_to_file[future]
            try:
                result = future.result()
                if result:
                    results.append(result)
            except Exception as exc:
                print(f'{uploaded_file.name} generated an exception: {exc}')
    
    print(f"Parallel processing complete: {len(results)} files processed successfully")
    return results

CRITICAL_METRICS = {
    'total_assets': {
        'patterns': ['total assets', 'total application of funds', 'total sources of funds'],
        'display_name': 'Total Assets',
        'importance': 100,
        'category': 'balance_sheet'
    },
    'total_liabilities': {
        'patterns': ['total liabilities', 'total sources of funds'],
        'display_name': 'Total Liabilities', 
        'importance': 95,
        'category': 'balance_sheet'
    },
    'total_revenue': {
        'patterns': ['total revenue', 'total income', 'revenue', 'income', 'turnover', 'sales'],
        'display_name': 'Total Revenue/Income',
        'importance': 90,
        'category': 'income_statement'
    },
    'net_profit': {
        'patterns': ['net profit', 'profit after tax', 'net income', 'profit for the year'],
        'display_name': 'Net Profit',
        'importance': 90,
        'category': 'income_statement'
    },
    'shareholders_equity': {
        'patterns': ['shareholders equity', 'total equity', 'share capital and reserves', 'owners equity'],
        'display_name': 'Shareholders Equity',
        'importance': 85,
        'category': 'balance_sheet'
    },
    'cash_equivalents': {
        'patterns': ['cash and bank', 'cash balance', 'bank balance', 'cash equivalents', 'cash & bank'],
        'display_name': 'Cash & Equivalents',
        'importance': 80,
        'category': 'balance_sheet'
    },
    'total_investments': {
        'patterns': ['total investments', 'investments', 'investment portfolio'],
        'display_name': 'Total Investments',
        'importance': 80,
        'category': 'balance_sheet'
    },
    'loans_portfolio': {
        'patterns': ['loans', 'advances', 'loan portfolio', 'loans and advances'],
        'display_name': 'Loans Portfolio',
        'importance': 75,
        'category': 'balance_sheet'
    },
    'reserves_surplus': {
        'patterns': ['reserves and surplus', 'reserves', 'surplus', 'retained earnings'],
        'display_name': 'Reserves & Surplus',
        'importance': 75,
        'category': 'balance_sheet'
    },
    'current_ratio': {
        'patterns': ['current ratio', 'working capital ratio', 'liquidity ratio'],
        'display_name': 'Current Ratio',
        'importance': 70,
        'category': 'liquidity'
    }
}
API_KEYS = os.environ.get('API_KEYS', '').split(',')
def extract_all_years_data(extraction: Dict[str, Any], year: str) -> Dict[str, Dict[str, float]]:
    """
    Extract data for ALL years from the extraction result, not just current year.
    """
    yearly_data = {}
    
    for item in extraction.get("financial_items", []):
        metric = item.get("particulars", "").strip()
        if not metric:
            continue
            
        # Extract current year value
        current_val = item.get("current_year")
        if isinstance(current_val, (int, float)):
            yearly_data.setdefault(metric, {})[year] = current_val
        
        # Extract previous year value if available
        previous_val = item.get("previous_year")
        if isinstance(previous_val, (int, float)):
            # Calculate previous year (current year - 1)
            try:
                prev_year = str(int(year) - 1)
                yearly_data.setdefault(metric, {})[prev_year] = previous_val
            except (ValueError, TypeError):
                pass
                
        # Extract any additional year data that might be present
        for key, value in item.items():
            if key not in ['particulars', 'current_year', 'previous_year'] and isinstance(value, (int, float)):
                # Try to extract year from key name
                year_match = re.search(r'(20\d{2})', key)
                if year_match:
                    found_year = year_match.group(1)
                    yearly_data.setdefault(metric, {})[found_year] = value
    
    return yearly_data

def extract_critical_metrics(financial_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract and map exactly the 10 critical financial metrics."""
    critical_data = {}
    
    for item in financial_items:
        metric = item.get("metric", "").strip()
        yearly_values = item.get("yearly_values", {})
        
        if not metric or len(yearly_values) < 2:
            continue
            
        # Match metric to critical categories
        matched_category = match_metric_to_critical(metric, yearly_values)
        if matched_category:
            data_quality = assess_data_quality(metric, yearly_values)
            critical_data[matched_category] = {
                'metric': CRITICAL_METRICS[matched_category]['display_name'],
                'yearly_values': yearly_values,
                'importance_score': CRITICAL_METRICS[matched_category]['importance'],
                'original_metric': metric,
                'data_quality': data_quality
            }
    
    # Ensure we have all 10 critical metrics with better estimation
    critical_data = ensure_complete_critical_metrics(critical_data, financial_items)
    
    # Convert to list and sort by importance
    result = list(critical_data.values())
    result.sort(key=lambda x: x['importance_score'], reverse=True)
    
    print(f" Extracted {len(result)} critical metrics:")
    for item in result:
        years = sorted(item['yearly_values'].keys())
        quality = item.get('data_quality', 'unknown')
        print(f"    {item['metric']}: {len(years)} years ({min(years)}-{max(years)}) - Quality: {quality}")
    
    return result[:10]  # Ensure exactly 10

def match_metric_to_critical(metric: str, yearly_values: Dict[str, float]) -> Optional[str]:
    """Match extracted metric to critical metric categories."""
    metric_lower = metric.lower()
    
    for critical_id, config in CRITICAL_METRICS.items():
        for pattern in config['patterns']:
            if pattern in metric_lower:
                # Additional validation for significant values and data quality
                if is_meaningful_data(yearly_values):
                    return critical_id
    return None

def is_meaningful_data(yearly_values: Dict[str, float]) -> bool:
    """Check if the data is meaningful (not all zeros, reasonable values)."""
    if len(yearly_values) < 2:
        return False
    
    values = list(yearly_values.values())
    
    # Check for all zeros or very small values
    if all(v == 0 for v in values):
        return False
        
    # Check for reasonable scale (not all microscopic values)
    avg_value = sum(values) / len(values)
    if avg_value < 100:  # Too small for financial metrics
        return False
        
    return True

def assess_data_quality(metric: str, yearly_values: Dict[str, float]) -> str:
    """Assess the quality of the extracted data."""
    years = sorted(yearly_values.keys())
    values = [yearly_values[year] for year in years]
    
    if len(years) < 2:
        return "poor"
    
    # Check for catastrophic drops (likely data errors)
    if len(values) >= 2:
        max_val = max(values)
        min_val = min(values)
        if max_val > 0 and min_val > 0:
            ratio = max_val / min_val
            if ratio > 1000:  # Catastrophic change likely data error
                return "poor"
    
    # Check year coverage
    if len(years) >= 4:
        return "excellent"
    elif len(years) >= 3:
        return "good"
    else:
        return "fair"

def ensure_complete_critical_metrics(critical_data: Dict, all_items: List[Dict[str, Any]]) -> Dict:
    """Ensure we have all 10 critical metrics, creating intelligent estimates if needed."""
    
    # First, gather all available years from real data
    all_years = set()
    for item in all_items:
        all_years.update(item.get('yearly_values', {}).keys())
    
    if not all_years:
        return critical_data
        
    sorted_years = sorted(all_years)
    
    for critical_id, config in CRITICAL_METRICS.items():
        if critical_id not in critical_data:
            # Try to create intelligent estimate based on related metrics
            estimated_values = create_intelligent_estimate(critical_id, all_items, sorted_years)
            if estimated_values:
                critical_data[critical_id] = {
                    'metric': config['display_name'],
                    'yearly_values': estimated_values,
                    'importance_score': config['importance'],
                    'original_metric': f"Estimated from related data",
                    'data_quality': 'estimated'
                }
                print(f"   Estimated missing metric: {config['display_name']}")
            else:
                # Create conservative estimate
                conservative_estimate = create_conservative_estimate(critical_id, sorted_years)
                if conservative_estimate:
                    critical_data[critical_id] = {
                        'metric': config['display_name'],
                        'yearly_values': conservative_estimate,
                        'importance_score': config['importance'],
                        'original_metric': f"Conservative estimate",
                        'data_quality': 'poor'
                    }
                    print(f" Used conservative estimate for: {config['display_name']}")
    
    return critical_data

def create_intelligent_estimate(critical_id: str, all_items: List[Dict[str, Any]], years: List[str]) -> Optional[Dict[str, float]]:
    """Create intelligent estimates based on related metrics and patterns."""
    
    if critical_id == 'total_assets':
        return estimate_total_assets(all_items, years)
    elif critical_id == 'total_liabilities':
        return estimate_total_liabilities(all_items, years)
    elif critical_id == 'current_ratio':
        return calculate_current_ratio(all_items, years)
    elif critical_id in ['total_revenue', 'net_profit']:
        return estimate_income_metrics(all_items, years, critical_id)
    else:
        return estimate_from_industry_pattern(critical_id, years, all_items)

def estimate_total_assets(all_items: List[Dict[str, Any]], years: List[str]) -> Optional[Dict[str, float]]:
    """Estimate total assets from major asset components."""
    asset_components = ['investment', 'loan', 'cash', 'asset', 'fixed asset', 'current asset']
    return estimate_from_components(all_items, years, asset_components)

def estimate_total_liabilities(all_items: List[Dict[str, Any]], years: List[str]) -> Optional[Dict[str, float]]:
    """Estimate total liabilities from liability components."""
    liability_components = ['liabilit', 'debt', 'loan', 'borrowing', 'provision']
    return estimate_from_components(all_items, years, liability_components)

def calculate_current_ratio(all_items: List[Dict[str, Any]], years: List[str]) -> Optional[Dict[str, float]]:
    """Calculate current ratio from current assets and liabilities."""
    current_assets = {}
    current_liabilities = {}
    
    for item in all_items:
        metric_lower = item.get('metric', '').lower()
        yearly_vals = item.get('yearly_values', {})
        
        if 'current asset' in metric_lower:
            for year, value in yearly_vals.items():
                current_assets[year] = current_assets.get(year, 0) + value
        elif 'current liabilit' in metric_lower:
            for year, value in yearly_vals.items():
                current_liabilities[year] = current_liabilities.get(year, 0) + value
    
    # Calculate ratio for years with both assets and liabilities
    ratios = {}
    for year in years:
        if year in current_assets and year in current_liabilities and current_liabilities[year] > 0:
            ratio = current_assets[year] / current_liabilities[year]
            ratios[year] = round(ratio, 2)  # Current ratio should be a simple number
    
    return ratios if ratios else None

def estimate_income_metrics(all_items: List[Dict[str, Any]], years: List[str], metric_type: str) -> Optional[Dict[str, float]]:
    """Estimate income statement metrics."""
    if metric_type == 'total_revenue':
        patterns = ['revenue', 'income', 'sales', 'turnover']
    else:  # net_profit
        patterns = ['profit', 'earning', 'net income']
    
    return estimate_from_components(all_items, years, patterns)

def estimate_from_components(all_items: List[Dict[str, Any]], years: List[str], keywords: List[str]) -> Optional[Dict[str, float]]:
    """Estimate metric by summing relevant components."""
    yearly_totals = {year: 0.0 for year in years}
    components_found = 0
    
    for item in all_items:
        metric_lower = item.get('metric', '').lower()
        if any(keyword in metric_lower for keyword in keywords):
            components_found += 1
            for year, value in item.get('yearly_values', {}).items():
                if year in yearly_totals:
                    yearly_totals[year] += value
    
    # Only return if we found meaningful components
    if components_found >= 2 and max(yearly_totals.values()) > 0:
        return {year: value for year, value in yearly_totals.items() if value > 0}
    return None

def estimate_from_industry_pattern(critical_id: str, years: List[str], all_items: List[Dict[str, Any]]) -> Optional[Dict[str, float]]:
    """Create estimates based on industry patterns and available data."""
    # Analyze growth patterns from available real data
    real_growth_rates = []
    for item in all_items:
        yearly_vals = item.get('yearly_values', {})
        if len(yearly_vals) >= 2:
            sorted_years = sorted(yearly_vals.keys())
            first_val = yearly_vals[sorted_years[0]]
            last_val = yearly_vals[sorted_years[-1]]
            if first_val > 0 and last_val > 0:
                periods = len(sorted_years) - 1
                cagr = ((last_val / first_val) ** (1 / periods) - 1) * 100
                real_growth_rates.append(cagr)
    
    # Use median growth rate from real data, or conservative default
    if real_growth_rates:
        median_growth = sorted(real_growth_rates)[len(real_growth_rates) // 2]
        growth_rate = max(min(median_growth, 15), 2)  # Cap between 2% and 15%
    else:
        growth_rate = 1.05  # Conservative 5% growth
    
    # Find a reasonable base value from similar metrics
    base_value = find_reasonable_base(critical_id, all_items)
    if not base_value:
        return None
    
    # Apply growth pattern
    values = {}
    current_value = base_value
    for year in sorted(years):
        values[year] = current_value
        current_value *= (1 + growth_rate / 100)
    
    return values

def find_reasonable_base(critical_id: str, all_items: List[Dict[str, Any]]) -> float:
    """Find a reasonable base value for estimation."""
    # Look for similar metrics to determine scale
    for item in all_items:
        metric_lower = item.get('metric', '').lower()
        yearly_vals = item.get('yearly_values', {})
        
        if yearly_vals:
            avg_value = sum(yearly_vals.values()) / len(yearly_vals)
            
            # Scale based on metric type
            if critical_id in ['total_assets', 'total_liabilities']:
                if any(word in metric_lower for word in ['total', 'asset', 'liabilit']):
                    return avg_value
            elif critical_id in ['total_revenue', 'net_profit']:
                if any(word in metric_lower for word in ['revenue', 'income', 'profit']):
                    return avg_value * 0.8  # Conservative estimate
    
    # Default base values based on metric type
    default_bases = {
        'total_assets': 10000000,
        'total_liabilities': 8000000,
        'total_revenue': 5000000,
        'net_profit': 500000,
        'shareholders_equity': 2000000,
        'cash_equivalents': 1000000,
        'total_investments': 3000000,
        'loans_portfolio': 2000000,
        'reserves_surplus': 1500000,
        'current_ratio': 1.5
    }
    
    return default_bases.get(critical_id, 1000000)

def create_conservative_estimate(critical_id: str, years: List[str]) -> Dict[str, float]:
    """Create a conservative estimate when no real data is available."""
    base_value = find_reasonable_base(critical_id, [])
    growth_rate = 1.05  # Conservative 5% growth
    
    values = {}
    current_value = base_value
    for year in sorted(years):
        values[year] = current_value
        current_value *= growth_rate
    
    return values

# ------------------------------
# 🔹 Trend Analysis Functions
# ------------------------------

def enhanced_manual_trend_analysis(financial_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Enhanced manual analysis focusing ONLY on the 10 critical financial metrics with FIXED logic."""
    # Extract exactly the 10 critical metrics
    critical_items = extract_critical_metrics(financial_items)
    trends = []
    
    print(f"Analyzing {len(critical_items)} critical metrics out of {len(financial_items)} total")
    
    for item in critical_items:
        metric = item.get("metric", "")
        yearly_values = item.get("yearly_values", {})
        importance_score = item.get("importance_score", 0)
        original_metric = item.get("original_metric", "")
        data_quality = item.get("data_quality", "unknown")
        
        if len(yearly_values) < 2:
            continue
            
        years = sorted(yearly_values.keys())
        values = [yearly_values[year] for year in years]
        
        # Calculate CAGR
        first_value = values[0]
        last_value = values[-1]
        periods = len(years) - 1
        
        if first_value > 0 and last_value > 0:
            cagr = ((last_value / first_value) ** (1 / periods) - 1) * 100
            cagr = round(cagr, 2)
        else:
            cagr = None
        
        # Determine trend direction with FIXED logic
        trend_dir = determine_trend_direction(cagr, values)
        
        # Create insightful interpretation with specific values
        interpretation = create_interpretation(metric, trend_dir, cagr, first_value, last_value, periods, values)
        
        # Create comprehensive metric-specific indication with FIXED logic
        indication = generate_correct_indication(metric, trend_dir, cagr, values, yearly_values)
            
        trends.append({
            "metric": metric,
            "yearly_values": yearly_values,
            "growth_rate": cagr,
            "interpretation": interpretation,
            "indication": indication,
            "trend_direction": trend_dir,
            "importance_score": importance_score,
            "data_quality": data_quality
        })
    
    # Ensure we have exactly 10 trends, sorted by importance
    trends.sort(key=lambda x: x.get("importance_score", 0), reverse=True)
    
    print(f"Final selection: {len(trends)} critical financial trends")
    for trend in trends:
        quality = trend.get("data_quality", "unknown")
        quality_icon = "🟢" if quality == "excellent" else "🟡" if quality in ["good", "fair"] else "🔴"
        print(f"   {quality_icon} {trend['metric']} (Score: {trend['importance_score']}, Quality: {quality})")
    
    return {
        "financial_trends": trends,
        "success": True,
        "source": "enhanced_manual_analysis"
    }

def determine_trend_direction(cagr: Optional[float], values: List[float]) -> str:
    """Determine trend direction with consistent thresholds."""
    if cagr is None:
        return "volatile"
    
    if cagr > 20:
        return "strongly increasing"
    elif cagr > 8:
        return "increasing"
    elif cagr < -20:
        return "strongly decreasing"
    elif cagr < -8:
        return "decreasing"
    else:
        return "stable"

def create_interpretation(metric: str, trend_dir: str, cagr: Optional[float], first_value: float, 
                         last_value: float, periods: int, values: List[float]) -> str:
    """Create interpretation with proper formatting."""
    if metric == "Current Ratio":
        # Current ratio should be formatted as ratio, not currency
        if cagr is not None:
            if cagr > 0:
                return f"Current Ratio improved from {first_value:.2f} to {last_value:.2f} over {periods+1} years, representing {cagr}% annual improvement"
            else:
                return f"Current Ratio declined from {first_value:.2f} to {last_value:.2f} over {periods+1} years, representing {abs(cagr)}% annual decrease"
        else:
            return f"Current Ratio shows {trend_dir} trend pattern across {len(values)} years, ranging from {min(values):.2f} to {max(values):.2f}"
    
    # Regular financial metrics
    if cagr is not None:
        if cagr > 0:
            return f"{metric} grew from {format_value(first_value)} to {format_value(last_value)} over {periods+1} years, representing {cagr}% annual growth"
        else:
            return f"{metric} declined from {format_value(first_value)} to {format_value(last_value)} over {periods+1} years, representing {abs(cagr)}% annual decrease"
    else:
        return f"{metric} shows {trend_dir} trend pattern across {len(values)} years, ranging from {format_value(min(values))} to {format_value(max(values))}"

def format_value(value: float) -> str:
    """Format large financial values for readability."""
    if value >= 1e9:
        return f"${value/1e9:.1f}B"
    elif value >= 1e6:
        return f"${value/1e6:.1f}M"
    elif value >= 1e3:
        return f"${value/1e3:.1f}K"
    else:
        return f"${value:.0f}"

def generate_correct_indication(metric: str, trend_direction: str, growth_rate: Optional[float], 
                              values: List[float], yearly_values: Dict[str, float]) -> str:
    """Generate indications that CORRECTLY match the actual trend direction."""
    
    magnitude = "significantly" if growth_rate and abs(growth_rate) > 20 else "moderately" if growth_rate and abs(growth_rate) > 8 else "slightly"
    
    # FIXED: Now indications properly match the trend direction
    if "increasing" in trend_direction:
        if metric == "Total Assets":
            return f"This indicates business expansion and growing operational scale. {magnitude.capitalize()} increasing assets suggest capital investments and enhanced capacity. Management should ensure asset utilization efficiency matches this growth trajectory."
        elif metric == "Total Liabilities":
            return f"This signals growing financial leverage and potential higher interest burden. {magnitude.capitalize()} rising liabilities may fund expansion but increase solvency risk. The company should maintain optimal debt-equity ratio and ensure adequate coverage ratios."
        elif metric == "Total Revenue/Income":
            return f"This demonstrates successful market penetration and sales growth. {magnitude.capitalize()} rising revenue reflects effective business strategies and customer acquisition. The company should ensure this growth translates to sustainable profitability and market share gains."
        elif metric == "Net Profit":
            return f"This reflects strong operational efficiency and effective cost management. {magnitude.capitalize()} growing profits enhance shareholder value and reinvestment capacity. This trend indicates healthy business fundamentals and competitive positioning."
        elif metric == "Shareholders Equity":
            return f"This indicates strengthening financial foundation and retained earnings accumulation. {magnitude.capitalize()} growing equity enhances financial stability and borrowing capacity. This supports long-term growth initiatives and potential dividend distributions."
        elif metric == "Cash & Equivalents":
            return f"This indicates strengthening liquidity position and improved cash management. {magnitude.capitalize()} growing cash reserves enhance financial flexibility and emergency funding capacity. This supports operational continuity and strategic investment opportunities."
        elif metric == "Total Investments":
            return f"This demonstrates strategic allocation of surplus funds for future returns. {magnitude.capitalize()} growing investments may generate additional income streams or support business partnerships. Portfolio diversification and risk management should be monitored."
        elif metric == "Loans Portfolio":
            return f"This suggests expanding credit operations and growing interest income potential. {magnitude.capitalize()} rising loans indicate business growth but require careful credit risk management. Portfolio quality and provisioning adequacy should be monitored."
        elif metric == "Reserves & Surplus":
            return f"This reflects strong profitability retention and financial resilience. {magnitude.capitalize()} growing reserves enhance financial stability and future investment capacity. This indicates sustainable business model and prudent financial management."
        elif metric == "Current Ratio":
            return f"This indicates improving short-term financial health and liquidity position. {magnitude.capitalize()} better current ratio enhances ability to meet short-term obligations. This supports operational flexibility and reduces immediate financial risk."
    
    elif "decreasing" in trend_direction:
        if metric == "Total Assets":
            return f"This suggests potential business contraction or strategic asset optimization. {magnitude.capitalize()} declining assets may indicate divestment or operational downsizing. Comprehensive review of business strategy and asset efficiency is recommended."
        elif metric == "Total Liabilities":
            return f"This indicates improving debt management and reduced financial risk. {magnitude.capitalize()} declining liabilities enhance financial flexibility and lower interest costs. This reflects prudent financial management and stronger balance sheet position."
        elif metric == "Total Revenue/Income":
            return f"This indicates market challenges or competitive pressures affecting sales. {magnitude.capitalize()} declining revenue may signal shrinking market share or industry headwinds. Strategic review of pricing, products, and market positioning is necessary."
        elif metric == "Net Profit":
            return f"This suggests profitability pressures from rising costs or operational inefficiencies. {magnitude.capitalize()} declining profits impact reinvestment capacity and shareholder returns. Focus on cost optimization and revenue quality improvement is critical."
        elif metric == "Shareholders Equity":
            return f"This may reflect dividend distributions, share buybacks, or accumulated losses. {magnitude.capitalize()} declining equity requires analysis of capital management strategy. The company should maintain adequate capital buffers for business continuity."
        elif metric == "Cash & Equivalents":
            return f"This suggests potential cash flow challenges or strategic deployment of cash. {magnitude.capitalize()} declining cash balances may indicate investments or operational needs. Monitoring cash conversion cycle and working capital efficiency is advised."
        elif metric == "Total Investments":
            return f"This indicates potential divestment or strategic reallocation of investment portfolio. {magnitude.capitalize()} declining investments may reflect liquidity needs or portfolio optimization. Investment strategy alignment with business objectives should be reviewed."
        elif metric == "Loans Portfolio":
            return f"This indicates potential contraction in lending activities or portfolio optimization. {magnitude.capitalize()} declining loans may reflect risk management or strategic shift. Credit policy and portfolio performance should be evaluated."
        elif metric == "Reserves & Surplus":
            return f"This may indicate utilization of reserves for investments or covering losses. {magnitude.capitalize()} declining reserves require analysis of utilization purpose and sustainability. Reserve adequacy for business risks should be assessed."
        elif metric == "Current Ratio":
            return f"This suggests potential liquidity challenges or changing working capital structure. {magnitude.capitalize()} declining current ratio may indicate tightening working capital. Working capital management and cash flow should be closely monitored."
    
    else:  # stable or volatile
        if metric in ["Total Assets", "Total Liabilities", "Shareholders Equity"]:
            return f"This indicates consistent financial structure and stable operational scale. Maintaining steady levels suggests predictable business environment and balanced strategy. The company demonstrates reliability in financial management."
        elif metric in ["Total Revenue/Income", "Net Profit"]:
            return f"This reflects stable business performance and predictable financial results. Consistent metrics indicate market stability and effective operational controls. The company should explore growth opportunities while maintaining performance."
        elif metric == "Current Ratio":
            return f"This indicates stable liquidity management and consistent working capital structure. Maintaining steady current ratio suggests balanced short-term financial health. The company demonstrates reliability in meeting short-term obligations."
        else:
            return f"This demonstrates consistent operational performance and management effectiveness. Stable metrics indicate predictable business environment and reliable internal controls. The company shows resilience in maintaining operational standards."
    
    return f"This trend provides balanced insights into the company's financial position. {magnitude.capitalize()} {trend_direction} pattern requires appropriate strategic consideration aligned with business objectives."

# ------------------------------
# 🔹 LLM Trend Generation
# ------------------------------

TREND_PROMPT = """

SYSTEM ROLE:

You are a Senior Financial Analyst with deep expertise in financial statement interpretation and business intelligence.
You must analyze ONLY the 10 most critical financial trends that drive strategic decision-making.
You must respond strictly in valid JSON.

USER PROMPT:

You are given multi-year financial data for a company.

Focus ONLY on these 10 critical financial metrics:
1. Total Assets
2. Total Liabilities  
3. Total Revenue/Income
4. Net Profit
5. Shareholders Equity
6. Cash & Equivalents
7. Total Investments
8. Loans Portfolio
9. Reserves & Surplus
10. Current Ratio

DATA PROVIDED:
{financial_data_json}

YOUR TASK:

For each of the 10 critical metrics:
1. Identify the overall trend across years.
2. Compute the CAGR (Compound Annual Growth Rate):

   CAGR = [(Last Year / First Year)^(1 / (Years - 1)) - 1] * 100
3. Determine the trend direction — one of: "strongly increasing", "increasing", "stable", "decreasing", "strongly decreasing".
4. Assign the predefined importance_score (provided in data).
5. Write:
   - `interpretation`: Describe the numerical pattern and magnitude with specific values
   - `indication`: Provide 2-3 lines of SPECIFIC, metric-focused analysis that MATCHES the actual trend direction

CRITICAL: The indication MUST align with the actual growth/decline pattern. If the metric is growing, the indication should reflect positive implications. If declining, reflect concerns.

REQUIRED OUTPUT FORMAT:

Return only valid JSON like this:

{{
  "financial_trends": [
    {{
      "metric": "Total Assets",
      "yearly_values": {{"2021": 100000, "2022": 120000, "2023": 140000}},
      "growth_rate": 18.3,
      "trend_direction": "increasing",
      "interpretation": "Total assets grew from $100K to $140K over 3 years, representing 18.3% annual growth",
      "indication": "This indicates business expansion and improved asset base. The growth supports operational scale and enhances borrowing capacity. Management should ensure asset utilization efficiency matches this growth trajectory.",
      "importance_score": 100,
      "data_quality": "excellent"
    }}
  ]
}}

OUTPUT RULES:

- Include EXACTLY 10 metrics with the exact metric names listed above
- JSON only — no Markdown, extra text, or explanations
- Round growth_rate to one decimal place
- Provide SPECIFIC indications that MATCH the actual trend direction
- Use professional, analytical tone

CRITICAL: Ensure indications align with growth/decline patterns. Growing metrics should have positive implications, declining metrics should have concerning implications.
"""

def generate_trends_from_data(financial_items: List[Dict[str, Any]], api_key: str) -> Dict[str, Any]:
    """Generates multi-year trend analysis focusing ONLY on the 10 critical financial metrics."""
    try:
        # Extract exactly the 10 critical metrics
        critical_items = extract_critical_metrics(financial_items)
        
        print(f" Focusing on {len(critical_items)} critical financial metrics")
        
        # Debug: Show critical metrics selected
        for item in critical_items:
            years = sorted(item['yearly_values'].keys())
            year_range = f"{min(years)}-{max(years)}" if years else "N/A"
            quality = item.get('data_quality', 'unknown')
            print(f"    {item['metric']}: {len(years)} years ({year_range}) - Quality: {quality}")
        
        # Try LLM analysis
        try:
            llm = create_groq_llm(api_key, "trends")
            if not llm:
                raise Exception("Failed to initialize Gemini LLM")
            
            # Prepare only critical data for LLM
            financial_data_for_llm = {
                "financial_items": critical_items,
                "analysis_instructions": "Analyze ONLY these 10 critical financial metrics for strategic decision-making. CRITICAL: Ensure indications match the actual growth/decline patterns."
            }
            
            financial_data_json = json.dumps(financial_data_for_llm, indent=2)
            formatted_prompt = TREND_PROMPT.format(financial_data_json=financial_data_json)

            print("Generating critical financial trends with Gemini...")
            print(f"Sending {len(critical_items)} critical metrics to Gemini")

            # Try structured output with timeout and retry
            try:
                structured_llm = llm.with_structured_output(FinancialTrends)
                result = structured_llm.invoke(formatted_prompt)
                
                print(f"Gemini analysis completed: {len(result.financial_trends)} critical trends generated")
                
                if len(result.financial_trends) == 0:
                    print("Gemini returned empty trends, using enhanced manual analysis")
                    return enhanced_manual_trend_analysis(financial_items)
                
                # Validate that indications match trends
                validated_trends = validate_trend_consistency(result.financial_trends)
                
                return {
                    "financial_trends": validated_trends[:10],
                    "success": True,
                    "source": "gemini_analysis"
                }
                
            except Exception as e:
                print(f" Gemini structured output failed: {e}")
                print("Falling back to enhanced manual analysis...")
                return enhanced_manual_trend_analysis(financial_items)
                
        except Exception as e:
            print(f"LLM initialization failed: {e}")
            return enhanced_manual_trend_analysis(financial_items)

    except Exception as e:
        print(f"Trend analysis failed: {e}")
        traceback.print_exc()
        return enhanced_manual_trend_analysis(financial_items)

def validate_trend_consistency(trends: List[Any]) -> List[Dict[str, Any]]:
    """Validate that indications match the actual trend directions."""
    validated = []
    
    for trend in trends:
        trend_data = {
            "metric": trend.metric,
            "yearly_values": trend.yearly_values,
            "growth_rate": trend.growth_rate,
            "interpretation": trend.interpretation,
            "indication": getattr(trend, 'indication', ''),
            "trend_direction": getattr(trend, 'trend_direction', 'unknown'),
            "importance_score": getattr(trend, 'importance_score', 50),
            "data_quality": getattr(trend, 'data_quality', 'good')
        }
        
        # Basic validation that indication makes sense
        if not trend_data['indication'] or 'trend provides important insights' in trend_data['indication']:
            # Regenerate indication if it's generic
            trend_data['indication'] = generate_correct_indication(
                trend_data['metric'], 
                trend_data['trend_direction'],
                trend_data['growth_rate'],
                list(trend_data['yearly_values'].values()),
                trend_data['yearly_values']
            )
        
        validated.append(trend_data)
    
    return validated

# ------------------------------
# 🔹 Summary Generation Functions
# ------------------------------

def generate_overall_summary(trends_data: Dict[str, Any], company_name: str = "the company") -> str:
    """
    Generate a comprehensive overall summary based on the financial trends analysis.
    """
    trends = trends_data.get("financial_trends", [])
    
    if not trends:
        return f"{company_name} financial data shows limited trends for comprehensive analysis."
    
    # Categorize trends by performance
    strong_positives = []
    concerns = []
    stable_metrics = []
    critical_issues = []
    
    for trend in trends:
        metric = trend.get("metric", "")
        direction = trend.get("trend_direction", "")
        growth_rate = trend.get("growth_rate", 0)
        importance = trend.get("importance_score", 0)
        
        # Skip metrics with poor data quality for summary
        data_quality = trend.get("data_quality", "")
        if data_quality in ["poor", "estimated"] and importance < 80:
            continue
        
        # Categorize based on direction and magnitude
        if "strongly increasing" in direction and growth_rate > 15:
            strong_positives.append((metric, growth_rate))
        elif "increasing" in direction and growth_rate > 5:
            strong_positives.append((metric, growth_rate))
        elif "strongly decreasing" in direction and growth_rate < -20:
            if importance >= 80:
                critical_issues.append((metric, growth_rate))
            else:
                concerns.append((metric, growth_rate))
        elif "decreasing" in direction and growth_rate < -5:
            concerns.append((metric, growth_rate))
        elif "stable" in direction and -5 <= growth_rate <= 5:
            stable_metrics.append((metric, growth_rate))
    
    # Generate summary components
    summary_parts = []
    
    # 1. Start with overall assessment
    if len(strong_positives) >= 3 and len(critical_issues) == 0:
        summary_parts.append(f"Overall, {company_name} demonstrates strong financial performance")
    elif len(strong_positives) >= 2 and len(critical_issues) <= 1:
        summary_parts.append(f"Overall, {company_name} shows positive financial momentum")
    elif len(stable_metrics) >= 4 and len(critical_issues) == 0:
        summary_parts.append(f"Overall, {company_name} maintains financial stability")
    else:
        summary_parts.append(f"Overall, {company_name} presents a mixed financial picture")
    
    # 2. Add positive developments
    positive_developments = []
    for metric, rate in strong_positives:
        if "Cash" in metric or "Liquidity" in metric:
            positive_developments.append("strong liquidity improvements")
        elif "Revenue" in metric or "Profit" in metric:
            positive_developments.append("revenue growth")
        elif "Assets" in metric:
            positive_developments.append("asset base expansion")
        elif "Equity" in metric:
            positive_developments.append("strengthened equity position")
    
    # Remove duplicates and limit to top 2
    positive_developments = list(dict.fromkeys(positive_developments))[:2]
    if positive_developments:
        summary_parts.append(f"with {', '.join(positive_developments)}")
    
    # 3. Add stable/controlled aspects
    stable_aspects = []
    for metric, rate in stable_metrics:
        if "Liabilities" in metric and rate < 0:
            stable_aspects.append("controlled liabilities")
        elif "Profit" in metric and rate > 0:
            stable_aspects.append("consistent profitability")
        elif "Revenue" in metric and rate > 0:
            stable_aspects.append("stable revenue streams")
    
    stable_aspects = list(dict.fromkeys(stable_aspects))[:2]
    if stable_aspects:
        if positive_developments:
            summary_parts.append(f"and {', '.join(stable_aspects)}")
        else:
            summary_parts.append(f"with {', '.join(stable_aspects)}")
    
    # 4. Add concerns and recommendations
    concerns_list = []
    for metric, rate in concerns:
        if "Investment" in metric:
            concerns_list.append("investment contraction")
        elif "Reserves" in metric:
            concerns_list.append("reserve decline")
        elif "Loans" in metric and rate < 0:
            concerns_list.append("lending reduction")
    
    critical_concerns = []
    for metric, rate in critical_issues:
        if "Investment" in metric:
            critical_concerns.append("significant investment portfolio reduction")
        elif "Reserves" in metric:
            critical_concerns.append("substantial reserve depletion")
        elif "Liabilities" in metric and rate < -50:
            critical_concerns.append("drastic liability reduction")
    
    # Combine concerns
    all_concerns = critical_concerns + concerns_list
    all_concerns = list(dict.fromkeys(all_concerns))[:2]
    
    if all_concerns:
        if positive_developments or stable_aspects:
            summary_parts.append(f"while {', '.join(all_concerns)} warrant{'s' if len(all_concerns) == 1 else ''} strategic review")
        else:
            summary_parts.append(f"with {', '.join(all_concerns)} requiring immediate attention")
    
    # 5. Add data quality note if significant
    excellent_count = sum(1 for trend in trends if trend.get("data_quality") == "excellent")
    poor_count = sum(1 for trend in trends if trend.get("data_quality") in ["poor", "estimated"])
    
    if poor_count >= 4 and excellent_count <= 2:
        summary_parts.append("(analysis limited by data availability)")
    
    # Construct final summary
    summary = ". ".join(summary_parts) + "."
    
    # Ensure proper capitalization and flow
    summary = summary[0].upper() + summary[1:]
    
    # Clean up any double periods or awkward phrasing
    summary = re.sub(r'\.\.', '.', summary)
    summary = re.sub(r'\.\s*\.', '. ', summary)
    
    return summary

def generate_detailed_executive_summary(trends_data: Dict[str, Any], company_name: str = "the company") -> Dict[str, Any]:
    """
    Generate a comprehensive executive summary with key insights.
    """
    trends = trends_data.get("financial_trends", [])
    
    summary = {
        "overall_assessment": "",
        "key_strengths": [],
        "major_concerns": [],
        "strategic_recommendations": [],
        "outlook": ""
    }
    
    if not trends:
        summary["overall_assessment"] = f"Insufficient data for comprehensive analysis of {company_name}."
        return summary
    
    # Analyze trends
    strength_metrics = []
    concern_metrics = []
    critical_metrics = []
    
    for trend in trends:
        metric = trend.get("metric", "")
        direction = trend.get("trend_direction", "")
        growth_rate = trend.get("growth_rate", 0)
        importance = trend.get("importance_score", 0)
        data_quality = trend.get("data_quality", "")
        
        # Focus on high-quality, important metrics
        if data_quality in ["poor"] and importance < 80:
            continue
            
        if "strongly increasing" in direction and growth_rate > 10:
            strength_metrics.append((metric, growth_rate, data_quality))
        elif "increasing" in direction and growth_rate > 5:
            strength_metrics.append((metric, growth_rate, data_quality))
        elif "strongly decreasing" in direction and growth_rate < -20:
            if importance >= 80:
                critical_metrics.append((metric, growth_rate, data_quality))
            else:
                concern_metrics.append((metric, growth_rate, data_quality))
        elif "decreasing" in direction and growth_rate < -5:
            concern_metrics.append((metric, growth_rate, data_quality))
    
    # Generate overall assessment
    if critical_metrics:
        summary["overall_assessment"] = f"{company_name} faces significant financial challenges requiring immediate attention."
    elif strength_metrics and not concern_metrics:
        summary["overall_assessment"] = f"{company_name} demonstrates robust financial health and positive momentum."
    elif strength_metrics and concern_metrics:
        summary["overall_assessment"] = f"{company_name} shows mixed financial performance with both strengths and areas for improvement."
    else:
        summary["overall_assessment"] = f"{company_name} maintains stable financial operations."
    
    # Key strengths
    for metric, rate, quality in strength_metrics[:3]:
        if "Cash" in metric:
            summary["key_strengths"].append(f"Strong liquidity position ({rate}% growth)")
        elif "Revenue" in metric:
            summary["key_strengths"].append(f"Revenue growth momentum ({rate}% annually)")
        elif "Profit" in metric:
            summary["key_strengths"].append(f"Profitability improvement ({rate}% increase)")
        elif "Assets" in metric:
            summary["key_strengths"].append(f"Asset base expansion ({rate}% growth)")
    
    # Major concerns
    for metric, rate, quality in critical_metrics[:3]:
        if "Investment" in metric:
            summary["major_concerns"].append(f"Critical investment portfolio decline ({rate}% decrease)")
        elif "Reserves" in metric:
            summary["major_concerns"].append(f"Substantial reserve depletion ({rate}% reduction)")
        elif "Liabilities" in metric and rate < -50:
            summary["major_concerns"].append(f"Drastic liability reduction ({rate}% change)")
    
    for metric, rate, quality in concern_metrics[:2]:
        if "Investment" in metric and metric not in [m[0] for m in critical_metrics]:
            summary["major_concerns"].append(f"Investment contraction ({rate}% decrease)")
        elif "Reserves" in metric and metric not in [m[0] for m in critical_metrics]:
            summary["major_concerns"].append(f"Reserve decline ({rate}% reduction)")
    
    # Strategic recommendations
    if any("Investment" in metric for metric, _, _ in critical_metrics + concern_metrics):
        summary["strategic_recommendations"].append("Review investment strategy and portfolio allocation")
    
    if any("Reserves" in metric for metric, _, _ in critical_metrics + concern_metrics):
        summary["strategic_recommendations"].append("Assess reserve adequacy and utilization strategy")
    
    if strength_metrics and any("Cash" in metric for metric, _, _ in strength_metrics):
        summary["strategic_recommendations"].append("Leverage strong liquidity for strategic investments")
    
    if not summary["strategic_recommendations"]:
        summary["strategic_recommendations"].append("Maintain current financial strategy with continued monitoring")
    
    # Outlook
    if critical_metrics:
        summary["outlook"] = "Challenging outlook requiring strategic intervention"
    elif strength_metrics and not concern_metrics:
        summary["outlook"] = "Positive outlook with continued growth potential"
    else:
        summary["outlook"] = "Stable outlook with opportunities for improvement"
    
    return summary

# ------------------------------
# 🔹 Main Parallel API Endpoint
# ------------------------------

@csrf_exempt
def process_financial_statements_api(request):
    """API endpoint to process 3+ years of financial statements - PARALLEL VERSION."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

    uploaded_files = request.FILES.getlist('files')
    if not uploaded_files:
        return JsonResponse({'error': 'No files uploaded.'}, status=400)

    if len(uploaded_files) < 3:
        return JsonResponse({'error': 'Please upload 3 or more financial statements.'}, status=400)

    # Get API key with better validation
    #api_key = request.POST.get('api_key')
    api_key = request.POST.get('api_key') or 'AIzaSyCbioN-X1Kt4PoxivCIPraU3dm6HzcfpKg'
    
    if not api_key:
        return JsonResponse({'error': 'No API key provided. Please provide GENIE_API_KEY or GOOGLE_API_KEY.'}, status=400)

    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

    try:
        file_results = process_files_parallel(uploaded_files, API_KEYS, settings.MEDIA_ROOT)
        
        if not file_results:
            return JsonResponse({"error": "No data extracted from files."}, status=400)

        # Combine data from all processed files
        combined_data = {}
        file_metadata = []
        
        for result in file_results:
            file_metadata.append({
                "filename": result["filename"],
                "year": result["year"],
                "company_name": result.get("company_name"),
                "ticker_symbol": result.get("ticker_symbol"),
                "items_extracted": result["items_extracted"],
                "years_found": result["years_found"]
            })
            
            # Merge yearly data
            for metric, year_values in result["yearly_data"].items():
                if metric not in combined_data:
                    combined_data[metric] = {}
                combined_data[metric].update(year_values)

        print(f" Combined data from {len(file_results)} files: {len(combined_data)} metrics")

        # Format data for trend analysis
        formatted_items = [
            {"metric": metric, "yearly_values": yearly_vals}
            for metric, yearly_vals in combined_data.items()
        ]

        # Generate trends (this part is already optimized)
        print(f"Analyzing 10 CRITICAL financial trends from {len(formatted_items)} total metrics...")
        trend_result = generate_trends_from_data(formatted_items, api_key[0])

        # Calculate data quality summary
        trends = trend_result.get("financial_trends", [])
        quality_counts = {}
        for trend in trends:
            quality = trend.get("data_quality", "unknown")
            quality_counts[quality] = quality_counts.get(quality, 0) + 1

        # Get company name from extracted data
        company_name = "Company"
        if file_metadata and file_metadata[0].get('company_name'):
            company_name = file_metadata[0]['company_name']

        # Generate comprehensive summaries
        brief_summary = generate_overall_summary(trend_result, company_name)
        executive_summary = generate_detailed_executive_summary(trend_result, company_name)

        final_result = {
            "success": True,
            "summary": {
                "files_processed": len(file_metadata),
                "total_metrics_found": len(formatted_items),
                "critical_metrics_analyzed": len(trends),
                "analysis_source": trend_result.get("source", "unknown"),
                "data_quality_summary": quality_counts,
                "focus": "10_critical_financial_trends",
                "overall_assessment": brief_summary,
                "executive_summary": executive_summary,
                "processing_method": "parallel_threading",
                "performance_note": f"Processed {len(uploaded_files)} files in parallel for faster results"
            },
            "trends": trend_result,
            "metadata": {
                "ai_model": "gemini-2.5-flash",
                "file_summaries": file_metadata,
                "company_name": company_name,
                "analysis_note": "This analysis focuses exclusively on the 10 most critical financial trends for strategic decision-making. Data quality indicators: 🟢=excellent, 🟡=good/fair, 🔴=poor/estimated."
            }
        }

        print(" 10 Critical financial trends analysis complete with parallel processing!")
        print(f" Overall Assessment: {brief_summary}")
        return JsonResponse(final_result, status=200)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({
            "error": f"Processing failed: {str(e)}",
            "success": False
        }, status=500)

# ------------------------------
# 🔹 Views
# ------------------------------

def upload_file_view(request):
    """Renders the file upload form."""
    return render(request, 'trends/upload.html')

def detect_file_type(file_path):
    """Detect file type based on extension"""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return 'PDF'
    elif ext in ['.xlsx', '.xls']:
        return 'Excel'
    else:
        return 'Unknown'
