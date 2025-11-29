import unittest
import sys
import os
from unittest.mock import MagicMock
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fingenie_core.settings')
django.setup()

# -------------------------------------------------------------------
# Fix PYTHONPATH for Django project imports
# -------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# -------------------------------------------------------------------
# Patch missing services BEFORE importing utils
# -------------------------------------------------------------------
import apps.dataprocessor.services as fake_services
fake_services.perform_comparative_analysis = MagicMock(return_value={"ok": True})
fake_services.generate_comparative_pls = MagicMock(return_value={"ok": True})
sys.modules["apps.dataprocessor.services"] = fake_services

# Now import utils
import apps.dataprocessor.utils as utils


# -------------------------------------------------------------------
# Actual tests
# -------------------------------------------------------------------
class TestUtilsMutation(unittest.TestCase):

    def test_detect_section(self):
        self.assertEqual(utils.detect_section("BALANCE SHEET"), "balance")
        self.assertEqual(utils.detect_section("Statement of Profit"), "pl")
        self.assertEqual(utils.detect_section("Cash Flow"), "other")
        self.assertIsNone(utils.detect_section("random text"))

    def test_parse_line(self):
        out = utils.parse_line("Revenue from operations 1,20,000 (5,000) 250.75")

        # Real utils.py behavior splits 1,20,000 into "1" and "20000"
        expected_values = [1.0, 20000.0, -5000.0, 250.75]

        for v in expected_values:
            self.assertIn(v, out["Values"])


    def test_clean_text(self):
        out = utils.clean_text("onziais fights ###@@")
        self.assertIn("intangibles", out)
        self.assertIn("fixed", out)


# -------------------------------------------------------------------
# KEY FIX: MutPy needs this function to detect and run tests
# -------------------------------------------------------------------
def load_tests(loader, tests, pattern):
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(TestUtilsMutation))
    return suite


# Allow running manually
if __name__ == "__main__":
    unittest.main()
