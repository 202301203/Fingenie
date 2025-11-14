from typing import Dict, Any, Optional


def calculate_ratios(canonical_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate all required financial ratios from canonical balance sheet data.
    """
    ratios = {}
    
    # Get values with defaults
    cash = canonical_data.get('cash_and_cash_equivalents') or 0
    inventory = canonical_data.get('inventory') or 0
    accounts_receivable = canonical_data.get('accounts_receivable') or 0
    current_assets = canonical_data.get('total_current_assets') or 0
    current_liabilities = canonical_data.get('total_current_liabilities') or 0
    total_assets = canonical_data.get('total_assets') or 0
    total_liabilities = canonical_data.get('total_liabilities') or 0
    share_capital = canonical_data.get('share_capital') or 0
    reserves = canonical_data.get('reserves_and_surplus') or 0
    long_term_debt = canonical_data.get('long_term_debt') or 0
    fixed_assets = canonical_data.get('fixed_assets') or 0
    intangible_assets = canonical_data.get('intangible_assets') or 0
    shares_outstanding = canonical_data.get('no_of_shares_outstanding')
    
    # Current Ratio = Current Assets / Current Liabilities
    if current_liabilities != 0:
        ratios['current_ratio'] = current_assets / current_liabilities
    else:
        ratios['current_ratio'] = None
    
    # Quick Ratio = (Current Assets - Inventory) / Current Liabilities
    if current_liabilities != 0:
        ratios['quick_ratio'] = (current_assets - inventory) / current_liabilities
    else:
        ratios['quick_ratio'] = None
    
    # Cash Ratio = Cash / Current Liabilities
    if current_liabilities != 0:
        ratios['cash_ratio'] = cash / current_liabilities
    else:
        ratios['cash_ratio'] = None
    
    # Debt to Equity = (Long-term Debt + Current Liabilities) / (Share Capital + Reserves)
    total_debt = long_term_debt + current_liabilities
    total_equity = share_capital + reserves
    if total_equity != 0:
        ratios['debt_to_equity'] = total_debt / total_equity
    else:
        ratios['debt_to_equity'] = None
    
    # Debt Ratio = Total Liabilities / Total Assets
    if total_assets != 0:
        ratios['debt_ratio'] = total_liabilities / total_assets
    else:
        ratios['debt_ratio'] = None
    
    # Working Capital = Current Assets - Current Liabilities
    ratios['working_capital'] = current_assets - current_liabilities
    
    # Fixed Asset Ratio = Fixed Assets / Total Assets
    if total_assets != 0:
        ratios['fixed_asset_ratio'] = fixed_assets / total_assets
    else:
        ratios['fixed_asset_ratio'] = None
    
    # Intangibles Percent = Intangible Assets / Total Assets
    if total_assets != 0:
        ratios['intangibles_percent'] = intangible_assets / total_assets
    else:
        ratios['intangibles_percent'] = None
    
    # Book Value per Share = (Share Capital + Reserves) / Shares Outstanding
    if shares_outstanding and shares_outstanding != 0:
        ratios['book_value_per_share'] = total_equity / shares_outstanding
    else:
        ratios['book_value_per_share'] = None
    
    return ratios

