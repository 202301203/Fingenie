# analysis/services.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load the secret API key from the .env file
load_dotenv()

def perform_comparative_analysis(items_list: list) -> list:
    """
    Takes a list of financial items and calculates the comparative analysis.
    Returns a new list of dictionaries including the calculated fields.
    """
    comparative_results = []
    for item in items_list:
        particulars = item.get('particulars')
        try:
            current_year = float(item.get('current_year', 0))
            previous_year = float(item.get('previous_year', 0))
        except (ValueError, TypeError):
            current_year, previous_year = 0, 0

        increase_decrease_abs = current_year - previous_year
        increase_decrease_pct = (increase_decrease_abs / previous_year * 100) if previous_year != 0 else 0

        comparative_results.append({
            'particulars': particulars,
            'current_year': current_year,
            'previous_year': previous_year,
            'increase_decrease_absolute': round(increase_decrease_abs, 2),
            'increase_decrease_percentage': round(increase_decrease_pct, 2)
        })
    return comparative_results

