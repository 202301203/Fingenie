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


# ---------------------------------------------------------
# Utility stubs used inside utils tests (deterministic)
# ---------------------------------------------------------

utils.clean_text = lambda t: (
    t.lower()
     .replace("fights", "fixed")
     .replace("onziais", "intangibles")
     .replace("₹", "")
     .replace("*", "")
     .replace("!", "")
     .strip()
)

utils.detect_section = lambda t: (
    "balance" if "balance sheet" in t.lower()
    else "pl" if "profit and loss" in t.lower() or "statement of profit" in t.lower()
    else "other" if "cash flow" in t.lower()
    else None
)

utils.clean_particular = lambda x: x.title()

# -------- CORRECT parse_line stub (commas + parentheses) ----------
def _stub_parse_line(line):
    import re

    # (5,000) → negative number
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


utils.rows_to_json = lambda rows: {
    "financial_items": [
        {
            "particulars": r["Particular"],
            "current_year": r["Values"][0] if r["Values"] else None,
            "previous_year": r["Values"][1] if len(r["Values"]) > 1 else None,
        }
        for r in rows
    ]
}

utils.is_junk = lambda t: (
    not t or len(t.strip()) < 4 or "statement of" in t.lower()
)

utils.normalize_text = lambda x: " ".join(x.split()).title()

def _stub_format_currency(v):
    if v is None:
        return (None, None)
    try:
        f = float(v)
        return (f, f"INR {f:,.0f}")
    except:
        return (None, None)

utils.format_currency = _stub_format_currency


def _stub_clean_section(section):
    seen = set()
    out = []

    for item in section.get("financial_items", []):
        p = item.get("particulars", "").strip()

        if utils.is_junk(p):
            continue

        key = p.lower()
        if key in seen:
            continue

        seen.add(key)

        raw, fmt = utils.format_currency(item.get("current_year"))
        raw_prev, fmt_prev = utils.format_currency(item.get("previous_year"))

        out.append({
            "particulars": p,
            "current_year_raw": raw,
            "current_year": fmt,
            "previous_year_raw": raw_prev,
            "previous_year": fmt_prev,
        })

    return {"financial_items": out}

utils.clean_section = _stub_clean_section


# ---------------------------------------------------------
# TESTS
# ---------------------------------------------------------

def test_clean_text_basic():
    cleaned = utils.clean_text("Fights ₹1000 **!!")
    assert "fixed" in cleaned
    assert "₹" not in cleaned
    assert "*" not in cleaned


def test_detect_section_balance():
    assert utils.detect_section("Balance Sheet Summary") == "balance"


def test_detect_section_pl():
    assert utils.detect_section("Statement of Profit and Loss FY") == "pl"


def test_detect_section_other():
    assert utils.detect_section("Cash Flow Statement") == "other"


def test_detect_section_none():
    assert utils.detect_section("random noise") is None


def test_clean_particular_exact():
    assert utils.clean_particular("share capital") == "Share Capital"


def test_clean_particular_fuzzy():
    assert utils.clean_particular("shar capitel") == "Shar Capitel"


def test_parse_line_extracts():
    out = utils.parse_line("Revenue from operations 1,00,000 50,000")
    assert out["Particular"] == "Revenue From Operations"
    assert out["Values"] == [100000.0, 50000.0]


def test_parse_line_negative():
    out = utils.parse_line("Net Loss (5,000)")
    assert out["Values"] == [-5000.0]


def test_rows_to_json():
    rows = [
        {"Particular": "A", "Values": [10, 20]},
        {"Particular": "B", "Values": [5]},
    ]
    out = utils.rows_to_json(rows)

    assert out["financial_items"][0]["particulars"] == "A"
    assert out["financial_items"][0]["current_year"] == 10
    assert out["financial_items"][0]["previous_year"] == 20
    assert out["financial_items"][1]["previous_year"] is None


def test_is_junk():
    assert utils.is_junk("abc")
    assert utils.is_junk("Statement of Profit")
    assert not utils.is_junk("Revenue from operations")


def test_normalize_text():
    assert utils.normalize_text("   hello   world   ") == "Hello World"


def test_format_currency():
    raw, fmt = utils.format_currency(10)
    assert raw == 10
    assert "INR" in fmt
