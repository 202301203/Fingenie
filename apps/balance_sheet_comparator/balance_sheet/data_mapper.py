import re
from typing import Dict, Any, Optional, List


def normalize_number(value: Any) -> Optional[float]:
    """
    Normalize numeric values from balance sheets.
    Handles commas, negatives in parentheses, currency symbols, and units.
    """
    if value is None:
        return None
    
    if isinstance(value, (int, float)):
        return float(value)
    
    if isinstance(value, str):
        # Remove Whitespace
        value = value.strip()
        
        # Handle empty strings
        if not value or value.lower() in ['na', 'n/a', '-', '--', '']:
            return None
        
        # Check for parentheses (negative)
        is_negative = False
        if '(' in value and ')' in value:
            is_negative = True
            value = value.replace('(', '').replace(')', '')
        
        # Remove currency symbols
        value = re.sub(r'[₹$€£¥]', '', value)
        
        # Remove commas
        value = value.replace(',', '')
        
        # Remove any remaining non-numeric characters except decimal point and minus
        value = re.sub(r'[^\d.\-]', '', value)
        
        try:
            num_value = float(value)
            if is_negative:
                num_value = -abs(num_value)
            return num_value
        except (ValueError, TypeError):
            return None
    
    return None


def convert_units(value: float, units: Optional[str]) -> float:
    """
    Convert values to base units based on the units specified.
    """
    if value is None or units is None:
        return value
    
    units_lower = units.lower()
    
    if 'lakh' in units_lower:
        return value * 100000
    elif 'thousand' in units_lower:
        return value * 1000
    elif 'million' in units_lower:
        return value * 1000000
    elif 'crore' in units_lower:
        return value * 10000000
    
    return value


def find_line_item(items: List[Dict[str, Any]], patterns: List[str]) -> Optional[float]:
    """
    Find a line item value by matching against multiple patterns.
    """
    for item in items:
        line_item = item.get('line_item', '').lower()
        for pattern in patterns:
            if pattern.lower() in line_item:
                value = item.get('value')
                if value is not None:
                    return normalize_number(value)
    return None


def map_to_canonical_fields(balance_sheet_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map extracted balance sheet items to canonical fields.
    """
    items = balance_sheet_data.get('balance_sheet_items', [])
    units = balance_sheet_data.get('units')
    
    # Normalize all values first
    normalized_items = []
    for item in items:
        normalized_value = normalize_number(item.get('value'))
        if normalized_value is not None and units:
            normalized_value = convert_units(normalized_value, units)
        normalized_items.append({
            'line_item': item.get('line_item', ''),
            'value': normalized_value
        })
    
    # Map to canonical fields
    canonical = {
        'cash_and_cash_equivalents': find_line_item(normalized_items, [
            'cash and cash equivalents', 'cash & cash equivalents', 'cash equivalents',
            'cash and bank balances', 'cash', 'cash at bank'
        ]),
        'inventory': find_line_item(normalized_items, [
            'inventory', 'stock', 'inventories', 'stock-in-trade'
        ]),
        'accounts_receivable': find_line_item(normalized_items, [
            'accounts receivable', 'trade receivables', 'sundry debtors',
            'debtors', 'receivables'
        ]),
        'total_current_assets': find_line_item(normalized_items, [
            'total current assets', 'current assets total', 'total of current assets'
        ]),
        'total_current_liabilities': find_line_item(normalized_items, [
            'total current liabilities', 'current liabilities total', 'total of current liabilities'
        ]),
        'total_assets': find_line_item(normalized_items, [
            'total assets', 'assets total', 'total of assets'
        ]),
        'total_liabilities': find_line_item(normalized_items, [
            'total liabilities', 'liabilities total', 'total of liabilities'
        ]),
        'share_capital': find_line_item(normalized_items, [
            'share capital', 'equity share capital', 'paid-up capital', 'issued capital'
        ]),
        'reserves_and_surplus': find_line_item(normalized_items, [
            'reserves and surplus', 'reserves & surplus', 'retained earnings',
            'reserves', 'surplus'
        ]),
        'long_term_debt': find_line_item(normalized_items, [
            'long term debt', 'long-term debt', 'non-current borrowings',
            'long term borrowings', 'term loans'
        ]),
        'intangible_assets': find_line_item(normalized_items, [
            'intangible assets', 'goodwill', 'intangible'
        ]),
        'fixed_assets': find_line_item(normalized_items, [
            'fixed assets', 'property plant and equipment', 'ppe',
            'tangible assets', 'non-current assets'
        ]),
        'no_of_shares_outstanding': find_line_item(normalized_items, [
            'shares outstanding', 'number of shares', 'outstanding shares',
            'equity shares outstanding'
        ]),
    }
    
    # Add metadata
    canonical['fiscal_year_end'] = balance_sheet_data.get('fiscal_year_end')
    canonical['currency'] = balance_sheet_data.get('currency')
    canonical['units'] = balance_sheet_data.get('units')
    canonical['company_name'] = balance_sheet_data.get('company_name')
    
    return canonical

