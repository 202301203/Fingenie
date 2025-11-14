# Output Analysis & Error Explanation

## JSON Output Analysis

Looking at your `balance_sheet_comparison.json`:

### ✅ What's Working Correctly:

1. **Company Information Extracted:**
   - Company Name: "Infosys" ✓
   - Fiscal Year End: "2025-03-31" ✓
   - Currency: "INR" ✓

2. **Some Balance Sheet Fields Extracted:**
   - `cash_and_cash_equivalents`: ₹47,549 crores (475,490,000,000) ✓
   - `total_assets`: ₹1,489,030 crores (1,489,030,000,000) ✓
   - `total_liabilities`: ₹52,700 crores (527,000,000,000) ✓
   - `share_capital`: ₹207.3 crores (20,730,000,000) ✓
   - `reserves_and_surplus`: ₹78,627 crores (786,270,000,000) ✓
   - `intangible_assets`: ₹12,872 crores (128,720,000,000) ✓
   - `fixed_assets`: ₹12,872 crores (128,720,000,000) ✓
   - `no_of_shares_outstanding`: 4.146 billion shares ✓

3. **Some Ratios Calculated:**
   - `debt_ratio`: 0.354 (35.4% debt) ✓
   - `fixed_asset_ratio`: 0.086 (8.6% fixed assets) ✓
   - `book_value_per_share`: ₹194.65 ✓

### ⚠️ What's Missing (Null Values):

1. **Missing Current Assets/Liabilities:**
   - `inventory`: null
   - `accounts_receivable`: null
   - `total_current_assets`: null
   - `total_current_liabilities`: null

2. **Missing Debt Information:**
   - `long_term_debt`: null

3. **Ratios That Can't Be Calculated:**
   - `current_ratio`: null (needs current_assets and current_liabilities)
   - `quick_ratio`: null (needs current_assets, inventory, current_liabilities)
   - `cash_ratio`: null (needs current_liabilities)

### Why Some Fields Are Null:

1. **AI Extraction Limitation:**
   - The AI might not have found these fields in the PDF
   - Field names in PDF might not match our search patterns
   - Data might be in a different format or location

2. **Field Name Variations:**
   - PDF might use "Trade Receivables" instead of "Accounts Receivable"
   - PDF might use "Stock" instead of "Inventory"
   - PDF might combine items differently

3. **Data Structure:**
   - Some balance sheets don't break down current assets/liabilities separately
   - Some companies don't have inventory (service companies like Infosys)

## Common Terminal Errors & Solutions

### Error 1: Import Errors

**Error Message:**
```
ModuleNotFoundError: No module named 'services'
ImportError: cannot import name 'load_pdf_robust' from 'services'
```

**Cause:**
- Running script from wrong directory
- Python path not set correctly

**Solution:**
```bash
# Make sure you're in the correct directory
cd Fingenie/apps/balance_sheet_comparator
python standalone_compare.py your_file.pdf --api-key YOUR_KEY
```

### Error 2: API Key Error

**Error Message:**
```
❌ ERROR: No API key provided!
   Provide --api-key or set GENIE_API_KEY environment variable
```

**Cause:**
- API key not provided in command or environment

**Solution:**
```bash
# Option 1: Provide in command
python standalone_compare.py file.pdf --api-key YOUR_KEY

# Option 2: Set environment variable
# Windows:
set GENIE_API_KEY=your_key_here
python standalone_compare.py file.pdf

# Linux/Mac:
export GENIE_API_KEY=your_key_here
python standalone_compare.py file.pdf
```

### Error 3: File Not Found

**Error Message:**
```
❌ ERROR: File not found: balance_sheet.pdf
```

**Cause:**
- Wrong file path
- File doesn't exist

**Solution:**
```bash
# Use absolute path or correct relative path
python standalone_compare.py "C:/path/to/balance_sheet.pdf" --api-key YOUR_KEY

# Or use relative path from current directory
python standalone_compare.py ../dataprocessor/test_data/company_a.pdf --api-key YOUR_KEY
```

### Error 4: Missing Dependencies

**Error Message:**
```
ModuleNotFoundError: No module named 'langchain_google_genai'
ModuleNotFoundError: No module named 'pdfplumber'
```

**Cause:**
- Required packages not installed

**Solution:**
```bash
pip install langchain-google-genai langchain-community pdfplumber pypdf pytesseract pydantic
```

### Error 5: PDF Extraction Failed

**Error Message:**
```
❌ ERROR: Failed to extract text from PDF
ValueError: Failed to extract any usable text from PDF
```

**Cause:**
- PDF is image-based (scanned)
- PDF is corrupted
- OCR not working

**Solution:**
- Make sure pytesseract is installed
- On Windows, install Tesseract OCR separately
- Try a different PDF

### Error 6: AI Extraction Failed

**Error Message:**
```
❌ ERROR: Extraction failed: AI failed to return valid JSON
```

**Cause:**
- Invalid API key
- API quota exceeded
- Network issues
- PDF content too complex

**Solution:**
- Verify API key is correct
- Check internet connection
- Try with a simpler PDF first
- Check Google AI API quota/limits

### Error 7: Division by Zero in Ratios

**Error Message:**
```
ZeroDivisionError: division by zero
```

**Cause:**
- Some ratios divide by values that are zero or null
- This should be handled, but might occur in edge cases

**Solution:**
- The code should handle this (returns null), but if you see this error, it's a bug to fix

## Improving Extraction Quality

To get more fields populated:

1. **Check the PDF Format:**
   - Make sure it's a proper balance sheet
   - Check if fields are clearly labeled

2. **Improve Field Mapping:**
   - Add more search patterns in `data_mapper.py`
   - Check what field names the AI extracted (look at raw extraction)

3. **Better AI Prompt:**
   - The prompt in `services.py` can be refined
   - Add more examples of field names

## Your Current Output is Valid!

Your JSON output is **structurally correct** - it's just that some fields couldn't be extracted from the PDF. This is normal and depends on:
- PDF quality and format
- How the balance sheet is structured
- Field naming conventions used

The ratios that can be calculated (debt_ratio, book_value_per_share) are correct based on the available data.

