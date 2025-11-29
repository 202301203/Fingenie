import pytest
from apps.balance_sheet_comparator.balance_sheet import ratio_calculator as rc


def test_calculate_ratios_precise_values():
    canonical = {
        'cash_and_cash_equivalents': 120.0,
        'inventory': 30.0,
        'total_current_assets': 500.0,
        'total_current_liabilities': 125.0,
        'total_assets': 2000.0,
        'total_liabilities': 800.0,
        'share_capital': 300.0,
        'reserves_and_surplus': 200.0,
        'long_term_debt': 150.0,
        'fixed_assets': 800.0,
        'intangible_assets': 100.0,
        'no_of_shares_outstanding': 50.0,
    }

    ratios = rc.calculate_ratios(canonical)

    # Exact arithmetic 
    assert ratios['current_ratio'] == pytest.approx(500.0 / 125.0)
    assert ratios['quick_ratio'] == pytest.approx((500.0 - 30.0) / 125.0)
    assert ratios['cash_ratio'] == pytest.approx(120.0 / 125.0)
    assert ratios['debt_to_equity'] == pytest.approx((150.0 + 125.0) / (300.0 + 200.0))
    assert ratios['debt_ratio'] == pytest.approx(800.0 / 2000.0)
    assert ratios['working_capital'] == pytest.approx(500.0 - 125.0)
    assert ratios['fixed_asset_ratio'] == pytest.approx(800.0 / 2000.0)
    assert ratios['intangibles_percent'] == pytest.approx(100.0 / 2000.0)
    assert ratios['book_value_per_share'] == pytest.approx((300.0 + 200.0) / 50.0)


def test_calculate_ratios_from_items_keyword_matching():
    items = [
        {'particulars': 'Cash and cash equivalents', 'current_year': 10.0},
        {'particulars': 'Inventory', 'current_year': 5.0},
        {'particulars': 'Total current assets', 'current_year': 100.0},
        {'particulars': 'Total current liabilities', 'current_year': 20.0},
        {'particulars': 'Total assets', 'current_year': 200.0},
        {'particulars': 'Total liabilities', 'current_year': 80.0},
        {'particulars': 'Share capital', 'current_year': 30.0},
        {'particulars': 'Reserves', 'current_year': 20.0},
        {'particulars': 'Long-term borrowings', 'current_year': 40.0},
        {'particulars': 'Fixed assets', 'current_year': 60.0},
        {'particulars': 'Intangible assets', 'current_year': 10.0},
    ]

    r = rc.calculate_ratios_from_items(items)
    assert r['current_ratio'] == pytest.approx(100.0 / 20.0)
    assert r['quick_ratio'] == pytest.approx((100.0 - 5.0) / 20.0)
    assert r['cash_ratio'] == pytest.approx(10.0 / 20.0)
    assert r['debt_to_equity'] == pytest.approx((40.0 + 20.0) / (30.0 + 20.0))
    assert r['debt_ratio'] == pytest.approx(80.0 / 200.0)
    assert r['working_capital'] == pytest.approx(100.0 - 20.0)
