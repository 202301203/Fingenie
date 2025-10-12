# utils.py
import pytesseract
import cv2
import unicodedata
import re
import json
import numpy as np
import pandas as pd
from pdf2image import convert_from_bytes
from concurrent.futures import ThreadPoolExecutor
from rapidfuzz import process, fuzz
from apps.dataprocessor.services import perform_comparative_analysis,generate_comparative_pls

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

BALANCE_KEYWORDS = ["balance sheet", "equity", "assets", "liabilities", "reserves"]
PL_KEYWORDS = ["profit and loss", "statement of profit", "revenue", "expenses", "income", "eps", "earning"]
OTHER_KEYWORDS = ["cash flow", "fund flow"]
KEEP_KEYWORDS = BALANCE_KEYWORDS + PL_KEYWORDS + OTHER_KEYWORDS

CANONICAL_TERMS = [
    "Share capital", "Reserves and surplus", "Money received against share warrants",
    "Share application money pending allotment", "Long-term borrowings",
    "Deferred tax liabilities (net)", "Other long-term liabilities", "Long-term provisions",
    "Short-term borrowings", "Trade payables", "Other current liabilities", "Short-term provisions",
    "Total equity and liabilities", "Total liabilities", "Total assets", "Fixed assets",
    "Property, plant and equipment", "Tangible assets", "Intangible assets",
    "Capital work in progress", "Non-current investments", "Deferred tax assets (net)",
    "Long-term loans and advances", "Other non-current assets", "Inventories",
    "Trade receivables", "Cash and cash equivalents", "Bank balances",
    "Current investments", "Other current assets", "Revenue from operations",
    "Other income", "Total revenue", "Cost of materials consumed",
    "Employee benefit expense", "Finance costs", "Depreciation and amortisation expense",
    "Other expenses", "Total expenses", "Profit before tax", "Tax expense",
    "Profit for the period", "Earnings per equity share - Basic", "Earnings per equity share - Diluted"
]

REPLACEMENTS = {
    "fights": "fixed", "onziais": "intangibles", "atnbutable": "attributable",
    "owneinr": "owner", "franca": "financial", "nor-": "non-",
    "curert": "current", "curent": "current", "come tac": "deferred tax",
    "tac": "tax", "dhi": "dividend", "dividenddend": "dividend",
    "purchose": "purchase", "eens ad nengie": "assets and intangible",
    "itaogble": "intangible", "fnaneal": "financial", "noe": "non"
}

STOPWORDS = [
    "cin", "registered office", "committee", "approved", "statement of",
    "audited", "unaudited", "balance sheet as of", "profit and loss",
    "cash flow", "quarter ended", "march", "january", "may", "date"
]

UNIT = "crore"
SCALE_MAP = {"crore": 1e7, "lakh": 1e5, "million": 1e6, "unit": 1.0}

# ===========================
# UTILS FUNCTIONS
# ===========================
def detect_section(text):
    t = text.lower()
    if any(k in t for k in BALANCE_KEYWORDS):
        return "balance"
    if any(k in t for k in PL_KEYWORDS):
        return "pl"
    if any(k in t for k in OTHER_KEYWORDS):
        return "other"
    return None

def clean_text(text):
    text = unicodedata.normalize("NFKD", text)
    for k, v in REPLACEMENTS.items():
        text = text.replace(k, v)
    text = re.sub(r"[^A-Za-z0-9.,()%\-\/ ]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def ocr_image(page):
    cv_img = np.array(page)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    return pytesseract.image_to_string(thresh, lang="eng")

def clean_particular(text):
    text = text.lower()
    for wrong, right in REPLACEMENTS.items():
        if wrong in text:
            text = text.replace(wrong, right)
    result = process.extractOne(text, CANONICAL_TERMS, scorer=fuzz.token_sort_ratio)
    if result:
        match, score, _ = result
        if score > 80:
            return match
    return text.title()

def parse_line(line):
    line = clean_text(line)
    numbers = re.findall(r"\(?-?\d{1,3}(?:,\d{3})*(?:\.\d+)?\)?", line)
    cleaned_nums = []
    for num in numbers:
        num = num.replace(",", "")
        if num.startswith("(") and num.endswith(")"):
            num = "-" + num[1:-1]
        try:
            cleaned_nums.append(float(num))
        except:
            continue
    label = re.split(r"\(?-?\d{1,3}(?:,\d{3})*(?:\.\d+)?\)?", line, 1)[0].strip()
    return {"Particular": clean_particular(label), "Values": cleaned_nums}

def process_page(args):
    page_num, page = args
    text = ocr_image(page)
    num_count = len(re.findall(r"[-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?", text))
    if num_count < 10:
        return None, []
    section = detect_section(text)
    if not section:
        return None, []
    rows = []
    for line in text.split("\n"):
        if line.strip():
            parsed = parse_line(line)
            if parsed["Values"]:
                rows.append(parsed)
    return section, rows

def rows_to_json(rows):
    items = []
    for r in rows:
        values = r["Values"]
        current = values[0] if len(values) > 0 else None
        previous = values[1] if len(values) > 1 else None
        items.append({
            "particulars": r["Particular"],
            "current_year": current,
            "previous_year": previous
        })
    return {"financial_items": items}

def is_junk(particular):
    if not particular or len(particular.strip()) < 4:
        return True
    low = particular.lower()
    return any(sw in low for sw in STOPWORDS)

def normalize_text(text):
    text = re.sub(r"\s+", " ", text).strip()
    return text.title()

def format_currency(value, scale=SCALE_MAP[UNIT]):
    if value is None or (isinstance(value, float) and (value != value)):
        return None, None
    try:
        raw_val = float(value)
        scaled_val = raw_val * scale
        return raw_val, f"INR {scaled_val:,.0f}"
    except:
        return None, None

def clean_section(section):
    seen = set()
    cleaned = []
    for item in section.get("financial_items", []):
        p = item.get("particulars", "").strip()
        if is_junk(p):
            continue
        p_norm = normalize_text(p)
        if p_norm.lower() in seen:
            continue
        seen.add(p_norm.lower())
        cy_raw, cy_fmt = format_currency(item.get("current_year"))
        py_raw, py_fmt = format_currency(item.get("previous_year"))
        cleaned.append({
            "particulars": p_norm,
            "current_year_raw": cy_raw,
            "current_year": cy_fmt,
            "previous_year_raw": py_raw,
            "previous_year": py_fmt
        })
    return {"financial_items": cleaned}

# MAIN FUNCTION
def process_financial_file(file):
    """
    Accepts a file (PDF), processes OCR, parses financial data,
    returns cleaned JSON ready for frontend
    """
    # Convert PDF to images in memory
    pages = convert_from_bytes(file.read(), dpi=200)
    
    balance_rows, pl_rows, other_rows = [], [], []

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(process_page, enumerate(pages, start=1)))

    for section, rows in results:
        if section == "balance":
            balance_rows.extend(rows)
        elif section == "pl":
            pl_rows.extend(rows)
        elif section == "other":
            other_rows.extend(rows)

    balance_sheet = clean_section(rows_to_json(balance_rows))
    pl_sheet = clean_section(rows_to_json(pl_rows))
    
    result1 = perform_comparative_analysis(
        balance_sheet.get("financial_items",[])
    )

    result = generate_comparative_pls(
        pl_sheet.get("financial_items",[])
    )

    return {"comparative_analysis_bs": result1, "comparative_analysis_pl" : result}
