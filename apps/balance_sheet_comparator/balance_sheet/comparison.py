from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ValidationError


class BalanceSheetModel(BaseModel):
    cash_and_cash_equivalents: Optional[float] = None
    inventory: Optional[float] = None
    accounts_receivable: Optional[float] = None
    total_current_assets: Optional[float] = None
    total_current_liabilities: Optional[float] = None
    total_assets: Optional[float] = None
    total_liabilities: Optional[float] = None
    share_capital: Optional[float] = None
    reserves_and_surplus: Optional[float] = None
    long_term_debt: Optional[float] = None
    intangible_assets: Optional[float] = None
    fixed_assets: Optional[float] = None
    no_of_shares_outstanding: Optional[float] = None


class CompanyModel(BaseModel):
    company_name: Optional[str] = None
    fiscal_year_end: Optional[str] = None
    currency: Optional[str] = None
    units: Optional[str] = None
    # Balance sheet entries may contain mixed types (strings or numbers), so accept Any
    balance_sheet: Optional[Dict[str, Any]] = Field(default_factory=dict)
    ratios: Optional[Dict[str, Optional[float]]] = Field(default_factory=dict)


class ComparisonEntry(BaseModel):
    metric: str
    preference: Optional[str] = None
    company1_value: Optional[float] = None
    company2_value: Optional[float] = None
    winner: Optional[str] = None
    result: Optional[str] = None


class ComparisonModel(BaseModel):
    verdict: str
    score: Dict[str, int]
    summary: str
    comparisons: List[ComparisonEntry]
    available_metrics: int
    ties: int
    labels: Dict[str, str]


class FullComparisonSchema(BaseModel):
    company1: CompanyModel
    comparison: ComparisonModel
    company2: CompanyModel





METRIC_PREFERENCES = {
    "total_assets": "higher",
    "cash_and_cash_equivalents": "higher",
    "working_capital": "higher",
    "current_ratio": "higher",
    "quick_ratio": "higher",
    "cash_ratio": "higher",
    "debt_ratio": "lower",
    "debt_to_equity": "lower",
    "book_value_per_share": "higher",
    "fixed_asset_ratio": "higher",
    "intangibles_percent": "lower",
}


def _compare_metric(value1: Optional[float], value2: Optional[float], preference: str) -> Optional[int]:
    """Compare metric values based on preference. Returns 1 if company1 wins, -1 if company2 wins, 0 for tie, None if comparison not possible."""
    if value1 is None or value2 is None:
        return None

    if value1 == value2:
        return 0

    if preference == "higher":
        return 1 if value1 > value2 else -1
    else:
        return 1 if value1 < value2 else -1


def evaluate_comparison(company1: Dict[str, Any], company2: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate which company outperformed the other."""
    if not company1 or not company2:
        return {}

    name1 = company1.get("company_name") or "Company 1"
    name2 = company2.get("company_name") or "Company 2"

    display_name1 = name1
    display_name2 = name2
    if display_name1 == display_name2:
        display_name1 = f"{name1} (Company 1)"
        display_name2 = f"{name2} (Company 2)"

    ratios1 = company1.get("ratios", {})
    ratios2 = company2.get("ratios", {})
    balance1 = company1.get("balance_sheet", {})
    balance2 = company2.get("balance_sheet", {})

    score1 = 0
    score2 = 0
    comparisons: List[Dict[str, Any]] = []

    for metric, preference in METRIC_PREFERENCES.items():
        # Try ratios first, then balance sheet
        value1 = ratios1.get(metric) if ratios1.get(metric) is not None else balance1.get(metric)
        value2 = ratios2.get(metric) if ratios2.get(metric) is not None else balance2.get(metric)

        result = _compare_metric(value1, value2, preference)
        
        outcome = "not_available"
        if result == 1:
            score1 += 1
            outcome = display_name1
        elif result == -1:
            score2 += 1
            outcome = display_name2
        elif result == 0:
            outcome = "tie"

        comparisons.append({
            "metric": metric,
            "winner": outcome if result is not None else "not_available",
            "result": "available" if result is not None else "not_available",
            "preference": preference,
            "company1_value": value1,
            "company2_value": value2,
        })

    # Calculate summary stats
    valid_comparisons = [c for c in comparisons if c["winner"] != "not_available"]
    available_metrics = len(valid_comparisons)
    ties = len([c for c in valid_comparisons if c["winner"] == "tie"])

    if score1 > score2:
        verdict = display_name1
        summary = f"{display_name1} outperformed {display_name2} on {score1} of {available_metrics} comparable metrics (ties: {ties})."
    elif score2 > score1:
        verdict = display_name2
        summary = f"{display_name2} outperformed {display_name1} on {score2} of {available_metrics} comparable metrics (ties: {ties})."
    else:
        verdict = "tie"
        if available_metrics == 0:
            summary = "Insufficient comparable metrics to determine a winner."
        else:
            summary = f"Both companies performed similarly across {available_metrics} comparable metrics ({ties} ties)."

    return {
        "verdict": verdict,
        "score": {
            display_name1: score1,
            display_name2: score2,
        },
        "summary": summary,
        "comparisons": comparisons,
        "available_metrics": available_metrics,
        "ties": ties,
        "labels": {
            "company1": display_name1,
            "company2": display_name2,
        },
    }
