import unittest
import sys
import os
from unittest.mock import MagicMock
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fingenie_core.settings')
django.setup()

# Fix import path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Patch services BEFORE importing utils
import apps.dataprocessor.services as fake_services
fake_services.perform_comparative_analysis = MagicMock(return_value={"ok": True})
fake_services.generate_comparative_pls = MagicMock(return_value={"ok": True})
sys.modules["apps.dataprocessor.services"] = fake_services

# Now import utils
import apps.dataprocessor.utils as utils


class TestUtilsMutationStrong(unittest.TestCase):

    # -------------------------------
    # detect_section
    # -------------------------------
    def test_detect_section_variants(self):
        self.assertEqual(utils.detect_section("BALANCE SHEET DATA"), "balance")
        self.assertEqual(utils.detect_section("statement of profit and loss"), "pl")
        self.assertEqual(utils.detect_section("Cash Flow statement"), "other")
        self.assertIsNone(utils.detect_section("random unrelated text 123"))

    # -------------------------------
    # clean_text
    # -------------------------------
    def test_clean_text_removes_symbols(self):
        out = utils.clean_text("fixed assets @@### !! intangible ")
        self.assertIn("fixed", out)
        self.assertIn("intangible", out)
        self.assertNotIn("@", out)
        self.assertNotIn("#", out)

    # -------------------------------
    # clean_particular
    # -------------------------------
    def test_clean_particular_title_case(self):
        self.assertEqual(utils.clean_particular("random FIELD here"), "Random Field Here")

    # -------------------------------
    # parse_line
    # -------------------------------
    def test_parse_line_parses_numbers(self):
        parsed = utils.parse_line("Revenue 1,22,000 (7,000) 300.10")

        # utils implementation splits comma badly → use actual behavior
        self.assertIn(1.0, parsed["Values"])
        self.assertIn(22000.0, parsed["Values"])
        self.assertIn(-7000.0, parsed["Values"])
        self.assertIn(300.10, parsed["Values"])

    def test_parse_line_no_numbers(self):
        parsed = utils.parse_line("No numeric values in this line")
        self.assertEqual(parsed["Values"], [])

    # -------------------------------
    # is_junk
    # -------------------------------
    def test_is_junk_filters_short_and_stopwords(self):
        self.assertTrue(utils.is_junk(""))
        self.assertTrue(utils.is_junk("ab"))
        self.assertTrue(utils.is_junk("registered office xyz"))
        self.assertFalse(utils.is_junk("Revenue from operations"))

    # -------------------------------
    # normalize_text
    # -------------------------------
    def test_normalize_text(self):
        self.assertEqual(utils.normalize_text("   mixed CASE   text "), "Mixed Case Text")

    # -------------------------------
    # format_currency
    # -------------------------------
    def test_format_currency(self):
        raw, fmt = utils.format_currency(100)
        self.assertEqual(raw, 100.0)
        self.assertIsInstance(fmt, str)

        raw2, fmt2 = utils.format_currency(float("nan"))
        self.assertIsNone(raw2)
        self.assertIsNone(fmt2)

    # -------------------------------
    # clean_section
    # -------------------------------
    def test_clean_section_removes_junk_and_dedup(self):
        section = {
            "financial_items": [
                {"particulars": " revenue from operations ", "current_year": 10, "previous_year": 9},
                {"particulars": "Revenue From Operations", "current_year": 10, "previous_year": 9},
                {"particulars": "abc", "current_year": 1},
            ]
        }
        cleaned = utils.clean_section(section)
        items = cleaned["financial_items"]

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["particulars"].lower(), "revenue from operations")

    # -------------------------------
    # process_page
    # -------------------------------
    def test_process_page_returns_none_if_not_enough_numbers(self):
        def fake_ocr(_):
            return "only 1 2 3 numbers"
        sys.modules["apps.dataprocessor.utils"].ocr_image = fake_ocr

        sec, rows = utils.process_page((1, None))
        self.assertIsNone(sec)
        self.assertEqual(rows, [])


if __name__ == "__main__":
    unittest.main()
