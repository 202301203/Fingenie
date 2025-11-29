import unittest
import apps.dataprocessor.utils as utils

class TestUtilsMutation(unittest.TestCase):

    def test_detect_section(self):
        self.assertEqual(utils.detect_section("BALANCE SHEET wow"), "balance")
        self.assertEqual(utils.detect_section("Statement of Profit"), "pl")
        self.assertEqual(utils.detect_section("Cash Flow summary"), "other")
        self.assertIsNone(utils.detect_section("random text"))

    def test_clean_text(self):
        out = utils.clean_text("onziais fights ###@@")
        self.assertIn("intangibles", out)
        self.assertIn("fixed", out)

    def test_clean_particular(self):
        result = utils.clean_particular("share capitel")
        self.assertIn(result, ["Share capital", "Share Capitel"])
