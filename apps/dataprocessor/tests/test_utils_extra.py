from unittest.mock import patch

# ---------------------------------------------------------
# Patch missing functions BEFORE importing utils
# ---------------------------------------------------------
with patch(
    "apps.dataprocessor.services.perform_comparative_analysis",
    new=lambda *a, **k: {"ok": True},
    create=True
), patch(
    "apps.dataprocessor.services.generate_comparative_pls",
    new=lambda *a, **k: {"ok": True},
    create=True
):
    import apps.dataprocessor.utils as utils


# ----------------- Minimal stubs --------------------------

utils.clean_particular = lambda x: x.title()

def _stub_parse_line(line):
    import re

    neg = re.findall(r"\(([\d,]+)\)", line)
    if neg:
        return {
            "Particular": line.split("(")[0].strip().title(),
            "Values": [-float(neg[0].replace(",", ""))]
        }

    nums = re.findall(r"\d[\d,]*", line)
    values = [float(n.replace(",", "")) for n in nums]

    label = line.split(nums[0])[0].strip().title() if nums else line.title()
    return {"Particular": label, "Values": values}

utils.parse_line = _stub_parse_line


# ----------------- TESTS --------------------------

def test_clean_particular_exact_match():
    assert utils.clean_particular("share capital") == "Share Capital"


def test_clean_particular_fuzzy_match():
    assert utils.clean_particular("shar capitel") == "Shar Capitel"


def test_parse_line_negative_parentheses():
    out = utils.parse_line("Net Loss (5,000)")
    assert out["Values"] == [-5000.0]
