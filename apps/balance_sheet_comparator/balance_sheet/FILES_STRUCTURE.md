# Balance Sheet Comparator - File Structure

## Core Files (Required for standalone_compare.py)

### Main Script
- **`standalone_compare.py`** - Main entry point. Run this script to compare balance sheets.

### Core Modules (All Required)
- **`services.py`** - PDF loading, text extraction, and AI-powered data extraction
- **`data_mapper.py`** - Maps extracted data to canonical balance sheet fields and normalizes numbers
- **`ratio_calculator.py`** - Calculates all financial ratios
- **`comparison.py`** - Evaluates which company outperformed and generates verdict

### Python Package
- **`__init__.py`** - Required for Python package imports

## Documentation Files (Optional but Useful)

- **`STANDALONE_USAGE.md`** - How to use the standalone script
- **`OUTPUT_ANALYSIS.md`** - Understanding the JSON output format
- **`ERROR_FIX.md`** - Common errors and solutions
- **`FILES_STRUCTURE.md`** - This file (overview of all files)

## Example Output

- **`balance_sheet_comparison.json`** - Example output file (generated when you run the script)

## Dependencies

Make sure you have these Python packages installed:
- `langchain-google-genai`
- `langchain-community`
- `pypdf` or `pypdf2`
- `pdfplumber`
- `pytesseract` (for OCR if needed)
- `pydantic`

## Usage

```bash
cd Fingenie/apps/balance_sheet_comparator
python standalone_compare.py file1.pdf [file2.pdf] --api-key YOUR_KEY
```

That's it! No Django, no server, just pure Python.

