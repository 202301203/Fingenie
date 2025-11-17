# Balance Sheet Comparator App

## Overview
The **balance_sheet_comparator** app is a Django application that compares financial data from two balance sheet PDFs. It follows the same architecture and patterns as the **dataprocessor** app.

## Architecture

### App Structure
```
balance_sheet_comparator/
├── __init__.py
├── admin.py                    # Django admin configuration
├── apps.py                     # App configuration
├── models.py                   # BalanceSheetComparison database model
├── views.py                    # Django API endpoints
├── urls.py                     # URL routing
├── tests.py                    # Tests
└── balance_sheet/              # Core comparison logic
    ├── __init__.py
    ├── services.py             # PDF loading, extraction (uses Gemini 1.5 Flash)
    ├── ratio_calculator.py      # Financial ratio calculations
    ├── comparison.py            # Comparison logic
    └── data_mapper.py           # Data mapping utilities
```

## Key Features

### 1. **PDF Processing** (`balance_sheet/services.py`)
- **`load_pdf_robust()`**: Loads PDFs with multiple fallback methods
  - PyPDFLoader first (fastest)
  - pdfplumber with OCR fallback
  - Handles scanned PDFs via Tesseract OCR
  
- **`prepare_context_smart()`**: Intelligently extracts financial content
  - Prioritizes financial keywords
  - Limits context size (max 50,000 chars)
  - Handles large documents

- **`extract_raw_financial_data()`**: Uses **Gemini 1.5 Flash** model
  - Extracts company name, fiscal year, currency, units
  - Extracts all balance sheet line items
  - Returns standardized financial items format

### 2. **Financial Ratio Calculation** (`balance_sheet/ratio_calculator.py`)
```python
calculate_ratios_from_items(financial_items)
```
Calculates:
- Current Ratio
- Quick Ratio
- Cash Ratio
- Debt-to-Equity Ratio
- Debt Ratio
- Working Capital
- Fixed Asset Ratio
- Intangibles Percentage

### 3. **Comparison Logic** (`balance_sheet/comparison.py`)
- `evaluate_comparison()`: Compares two companies
- Metric scoring system
- Weighted comparison results

### 4. **Database Model** (`models.py`)
```python
BalanceSheetComparison
├── comparison_id (UUID)
├── company1_name
├── company2_name
├── comparison_result (JSON)
├── company1_metrics (JSON)
├── company2_metrics (JSON)
├── evaluation (JSON)
├── created_at
└── updated_at
```

## API Endpoints

### 1. Compare Two Balance Sheets
**POST** `/api/balance_sheet_comparator/compare/`

**Request:**
```json
{
  "file1": <PDF file>,
  "file2": <PDF file>,
  "api_key": "your-google-api-key"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "comparison_id": "uuid",
  "company1_name": "Company A",
  "company2_name": "Company B",
  "company1_metrics": { /* ratios */ },
  "company2_metrics": { /* ratios */ },
  "evaluation": { /* comparison result */ },
  "metadata": {
    "file1_name": "...",
    "file2_name": "...",
    "file1_size_kb": 123.45,
    "file2_size_kb": 234.56
  }
}
```

### 2. Get Saved Comparison
**GET** `/api/balance_sheet_comparator/comparison/<comparison_id>/`

**Response:**
```json
{
  "success": true,
  "comparison_id": "uuid",
  "company1_name": "Company A",
  "company2_name": "Company B",
  "company1_metrics": { /* ratios */ },
  "company2_metrics": { /* ratios */ },
  "evaluation": { /* comparison result */ },
  "created_at": "2025-11-16T10:30:00Z"
}
```

### 3. List All Comparisons
**GET** `/api/balance_sheet_comparator/comparisons/`

**Response:**
```json
{
  "success": true,
  "count": 5,
  "comparisons": [
    {
      "comparison_id": "uuid",
      "company1_name": "Company A",
      "company2_name": "Company B",
      "created_at": "2025-11-16T10:30:00Z"
    }
  ]
}
```

## Usage Example

### Python Script
```python
from apps.balance_sheet_comparator.balance_sheet.services import (
    load_pdf_robust, 
    prepare_context_smart, 
    extract_raw_financial_data
)
from apps.balance_sheet_comparator.balance_sheet.ratio_calculator import calculate_ratios_from_items
from apps.balance_sheet_comparator.balance_sheet.comparison import evaluate_comparison

# Load PDFs
docs1 = load_pdf_robust("company1.pdf")
docs2 = load_pdf_robust("company2.pdf")

# Extract data
context1 = prepare_context_smart(docs1)
context2 = prepare_context_smart(docs2)

data1 = extract_raw_financial_data(context1, api_key)
data2 = extract_raw_financial_data(context2, api_key)

# Calculate ratios
items1 = data1.get('financial_items', [])
items2 = data2.get('financial_items', [])

ratios1 = calculate_ratios_from_items(items1)
ratios2 = calculate_ratios_from_items(items2)

# Compare
company1 = {"company_name": data1.get('company_name'), "ratios": ratios1}
company2 = {"company_name": data2.get('company_name'), "ratios": ratios2}

evaluation = evaluate_comparison(company1, company2)
```

## Integration with Django Settings

Add to `settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'apps.balance_sheet_comparator',
]
```

Add to `urls.py`:
```python
from django.urls import path, include

urlpatterns = [
    # ...
    path('api/balance_sheet_comparator/', include('apps.balance_sheet_comparator.urls')),
]
```

## Notes

1. **Gemini Model**: Uses Gemini 1.5 Flash (same as dataprocessor app)
2. **API Key**: Can be provided via request or `GENIE_API_KEY` environment variable
3. **Database**: Stores all comparison results for future retrieval
4. **Admin Panel**: Accessible at Django admin for managing comparisons
5. **Error Handling**: Graceful fallback for extraction failures

## Dependencies

- `langchain`
- `langchain-google-genai`
- `langchain-core`
- `pdfplumber`
- `pytesseract`
- `Tesseract-OCR` (system requirement)

## Similar Apps

This app follows the exact same pattern as:
- **dataprocessor** - Processes single financial statements
- **chatbot** - Handles chat queries based on extracted data

All three apps use:
- Gemini 1.5 Flash for AI operations
- Similar PDF loading and extraction pipeline
- JSON storage in database models
