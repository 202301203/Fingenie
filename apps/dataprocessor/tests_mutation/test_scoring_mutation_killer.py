import os
import math
import unittest

# Use a non-GUI backend for matplotlib before pyplot is imported by the SUT
os.environ.setdefault("MPLBACKEND", "Agg")

import numpy as np
from unittest.mock import patch

from apps.dataprocessor import scoring as S

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fingenie_core.settings')
django.setup()

# -----------------------------
# Helpers: reference oracles
# -----------------------------
def normalize_ref(value, mean, std, invert=False, clip=(0, 100)):
    """
    Reference implementation (independent of S.normalize)
    used to compute exact numeric oracles.
    """
    if value is None:
        return 50
    try:
        if math.isnan(value):
            return 50
    except TypeError:
        pass  # not a float

    score = 50 + 15 * ((value - mean) / std)
    score = max(clip[0], min(clip[1], score))

    if invert:
        score = 100 - score

    return score


def almost_equal(a, b, tol=1e-6):
    return abs(a - b) <= tol


class TestScoringMutationKiller(unittest.TestCase):
    # -----------
    # normalize()
    # -----------
    def test_normalize_center_and_clip_and_invert(self):
        # center
        self.assertTrue(almost_equal(S.normalize(1.5, mean=1.5, std=0.75), 50.0))
        # above mean
        self.assertTrue(almost_equal(S.normalize(2.25, mean=1.5, std=0.75), 65.0))
        # below mean
        self.assertTrue(almost_equal(S.normalize(0.75, mean=1.5, std=0.75), 35.0))

        # invert=True flips around 50
        self.assertTrue(almost_equal(S.normalize(2.25, 1.5, 0.75, invert=True), 35.0))

        # clip upper
        self.assertEqual(S.normalize(1e9, 1.5, 0.75), 100)
        # clip lower
        self.assertEqual(S.normalize(-1e9, 1.5, 0.75), 0)

        # None → 50
        self.assertEqual(S.normalize(None, 1.5, 0.75), 50)

        # NaN → 50
        self.assertEqual(S.normalize(float("nan"), 1.5, 0.75), 50)

        # Cross-check against reference oracle
        for val in [None, float("nan"), -5, 0, 0.75, 1.5, 2.25, 10]:
            self.assertTrue(
                almost_equal(
                    S.normalize(val, 1.5, 0.75, invert=False),
                    normalize_ref(val, 1.5, 0.75, invert=False),
                )
            )
            self.assertTrue(
                almost_equal(
                    S.normalize(val, 1.5, 0.75, invert=True),
                    normalize_ref(val, 1.5, 0.75, invert=True),
                )
            )

    # ---------------------
    # compute_subscores()
    # ---------------------
    def test_compute_subscores_exact_oracles(self):
        """
        Exact numeric oracles for every subscore and the final weighted overall.
        These kill operator/weight mutations.
        """
        data = {
            "balance_sheet": {
                "current_assets": 200.0,
                "current_liabilities": 100.0,
                "inventory": 20.0,
                "total_liabilities": 150.0,
                "equity": 100.0,
                "retained_earnings": 50.0,
                "total_assets": 250.0,
            },
            "income_statement": {
                "ebit": 80.0,
                "interest_expense": 10.0,
                "net_income": 50.0,
                "revenue": 300.0,
            },
            "cash_flow": {"operating_cash_flow": 40.0},
            "previous_year": {"revenue": 200.0},
            # transparency metrics use defaults if not provided
        }

        # Ratios (ground truth)
        current_ratio = 200.0 / 100.0  # 2.0
        quick_ratio = (200.0 - 20.0) / 100.0  # 1.8
        debt_to_equity = 150.0 / 100.0  # 1.5
        interest_cover = 80.0 / 10.0  # 8.0
        retained_ratio = 50.0 / 250.0  # 0.2
        roa = 50.0 / 250.0  # 0.2
        roe = 50.0 / 100.0  # 0.5
        net_margin = 50.0 / 300.0  # 0.166666...
        asset_turnover = 300.0 / 250.0  # 1.2
        op_cf_ratio = 40.0 / 250.0  # 0.16
        revenue_growth = (300.0 - 200.0) / 200.0  # 0.5
        m_score = -2.0  # default
        z_score = 3.0  # default

        # Subscores via reference normalize
        liquidity_ref = (
            0.6 * normalize_ref(current_ratio, 1.5, 0.75)
            + 0.4 * normalize_ref(quick_ratio, 1.0, 0.5)
        )

        stability_ref = (
            0.4 * normalize_ref(debt_to_equity, 1.5, 1.0, invert=True)
            + 0.4 * normalize_ref(interest_cover, 4.0, 2.0)
            + 0.2 * normalize_ref(retained_ratio, 0.3, 0.15)
        )

        profitability_ref = (
            0.4 * normalize_ref(roa, 0.08, 0.05)
            + 0.3 * normalize_ref(roe, 0.12, 0.08)
            + 0.3 * normalize_ref(net_margin, 0.10, 0.05)
        )

        efficiency_ref = (
            0.4 * normalize_ref(asset_turnover, 1.0, 0.4)
            + 0.3 * normalize_ref(op_cf_ratio, 0.1, 0.08)
            + 0.3 * normalize_ref(revenue_growth, 0.1, 0.15)
        )

        transparency_ref = (
            0.6 * normalize_ref(m_score, -2.2, 0.4, invert=True)
            + 0.4 * normalize_ref(z_score, 3.0, 1.0)
        )

        overall_ref = (
            0.15 * liquidity_ref
            + 0.20 * stability_ref
            + 0.25 * profitability_ref
            + 0.20 * efficiency_ref
            + 0.20 * transparency_ref
        )

        out = S.compute_subscores(data)

        self.assertTrue(almost_equal(out["Liquidity"], liquidity_ref))
        self.assertTrue(almost_equal(out["Stability"], stability_ref))
        self.assertTrue(almost_equal(out["Profitability"], profitability_ref))
        self.assertTrue(almost_equal(out["Efficiency"], efficiency_ref))
        self.assertTrue(almost_equal(out["Transparency"], transparency_ref))
        self.assertTrue(almost_equal(out["Overall"], overall_ref))

    def test_prev_year_missing_makes_revenue_growth_zero(self):
        """
        If previous_year is missing, revenue_growth should be 0 and
        efficiency must reflect that exact path.
        """
        data = {
            "balance_sheet": {
                "current_assets": 120.0,
                "current_liabilities": 60.0,
                "inventory": 10.0,
                "total_liabilities": 90.0,
                "equity": 80.0,
                "retained_earnings": 25.0,
                "total_assets": 200.0,
            },
            "income_statement": {
                "ebit": 40.0,
                "interest_expense": 5.0,
                "net_income": 30.0,
                "revenue": 150.0,
            },
            "cash_flow": {"operating_cash_flow": 20.0},
            # no previous_year key → revenue_growth path falls to zero by design
        }

        asset_turnover = 150.0 / 200.0  # 0.75
        op_cf_ratio = 20.0 / 200.0  # 0.10
        revenue_growth = 0.0  # by spec

        efficiency_ref = (
            0.4 * normalize_ref(asset_turnover, 1.0, 0.4)
            + 0.3 * normalize_ref(op_cf_ratio, 0.1, 0.08)
            + 0.3 * normalize_ref(revenue_growth, 0.1, 0.15)
        )

        out = S.compute_subscores(data)
        self.assertTrue(almost_equal(out["Efficiency"], efficiency_ref))

    def test_liquidity_worse_when_liabilities_higher(self):
        """
        Mutations that flip / * or weights should be caught here.
        """
        base = {
            "balance_sheet": {
                "current_assets": 200.0,
                "current_liabilities": 100.0,  # scenario A
                "inventory": 20.0,
                "total_liabilities": 150.0,
                "equity": 100.0,
                "retained_earnings": 50.0,
                "total_assets": 250.0,
            },
            "income_statement": {
                "ebit": 80.0,
                "interest_expense": 10.0,
                "net_income": 50.0,
                "revenue": 300.0,
            },
            "cash_flow": {"operating_cash_flow": 40.0},
            "previous_year": {"revenue": 200.0},
        }

        worse = {
            **base,
            "balance_sheet": {
                **base["balance_sheet"],
                "current_liabilities": 200.0,  # liabilities doubled → liquidity should drop
            },
        }

        A = S.compute_subscores(base)["Liquidity"]
        B = S.compute_subscores(worse)["Liquidity"]
        self.assertLess(B, A)

    def test_transparency_inversion_effect(self):
        """
        Larger (worse) Beneish M-score should reduce transparency due to invert=True.
        """
        good = {
            "balance_sheet": {
                "current_assets": 100.0, "current_liabilities": 50.0, "total_assets": 200.0,
                "total_liabilities": 80.0, "equity": 120.0, "retained_earnings": 20.0, "inventory": 10.0
            },
            "income_statement": {
                "ebit": 30.0, "interest_expense": 5.0, "net_income": 20.0, "revenue": 100.0
            },
            "cash_flow": {"operating_cash_flow": 15.0},
            "beneish_m_score": -2.6,  # better (more negative)
            "altman_z_score": 3.5,
        }
        bad = {**good, "beneish_m_score": -1.4}  # worse (less negative)

        t_good = S.compute_subscores(good)["Transparency"]
        t_bad = S.compute_subscores(bad)["Transparency"]
        self.assertGreater(t_good, t_bad)

    # -----------------------------
    # draw_single_gauge() coverage
    # -----------------------------
    def test_draw_single_gauge_no_gui_and_closes(self):
        with patch("matplotlib.pyplot.show", return_value=None) as _:
            # Ensure this does not raise and does not leave open figures
            S.draw_single_gauge(75.0, "Liquidity", "Current assets vs liabilities", "Healthy liquidity.")
        # Close any figures just in case
        import matplotlib.pyplot as plt
        plt.close("all")


if __name__ == "__main__":
    unittest.main()
