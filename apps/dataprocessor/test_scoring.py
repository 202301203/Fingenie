import sys, os

# ✅ Fix: only go up TWO levels instead of three
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

print("🔍 Using project root:", PROJECT_ROOT)

from apps.dataprocessor.scoring import compute_subscores, draw_single_gauge
import json

example_json = """
{
    "balance_sheet": {
        "current_assets": 120000,
        "current_liabilities": 60000,
        "retained_earnings": 40000,
        "equity": 90000,
        "total_liabilities": 180000,
        "total_assets": 270000
    },
    "income_statement": {
        "ebit": 35000,
        "net_income": 25000,
        "revenue": 300000
    },
    "cash_flow": {"operating_cash_flow": 28000},
    "previous_year": {"revenue": 250000},
    "beneish_m_score": -2.1
}
"""

data = json.loads(example_json)
scores = compute_subscores(data)

print("\n--- Financial Health Scores ---")
for k, v in scores.items():
    print(f"{k}: {v:.2f}")

# Optional: test one gauge visually
draw_single_gauge(scores["Overall"], "Overall", "Composite financial health", "Overall company performance")
