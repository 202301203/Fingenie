import pytest
pytest.skip("Deprecated file — skip", allow_module_level=True)
import unittest
import apps.dataprocessor.utils as utils

class TestUtilsMutation(unittest.TestCase):

    def test_detect_section(self):
        self.assertEqual(utils.detect_section("BALANCE SHEET"), "balance")
        self.assertEqual(utils.detect_section("Statement of Profit"), "pl")
        self.assertEqual(utils.detect_section("Cash Flow Data"), "other")
        self.assertIsNone(utils.detect_section("xyz lorem ipsum"))

    def test_clean_text(self):
        out = utils.clean_text("onziais fights ###@@")
        self.assertIn("intangibles", out)
        self.assertIn("fixed", out)
        self.assertNotIn("@", out)

    def test_clean_particular(self):
        r = utils.clean_particular("share capitel")
        self.assertIn(r, ("Share capital", "Share Capitel"))

    def test_parse_line(self):
        line = "Revenue from operations 1,20,000 (5,000) 250.75"
        out = utils.parse_line(line)

        self.assertEqual(out["Particular"], "Revenue From Operations")
        self.assertIn(120000.0, out["Values"])
        self.assertIn(-5000.0, out["Values"])
        self.assertIn(250.75, out["Values"])

if __name__ == "__main__":
    unittest.main()
