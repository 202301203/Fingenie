# Standalone Usage - No Server Required!

## Why Use Standalone Version?

The **standalone version** doesn't require a Django server. It's a simple Python script that directly uses the core functions. Perfect for:
- Quick testing
- Command-line usage
- Integration into other scripts
- When you don't need a web API

## Quick Start

### 1. Process One PDF

```bash
cd Fingenie/apps/balance_sheet_comparator
python standalone_compare.py path/to/balance_sheet.pdf --api-key YOUR_API_KEY
```

### 2. Compare Two PDFs

```bash
python standalone_compare.py balance_sheet1.pdf balance_sheet2.pdf --api-key YOUR_API_KEY
```

### 3. Use Environment Variable for API Key

```bash
# Windows
set GENIE_API_KEY=your_api_key_here
python standalone_compare.py balance_sheet.pdf

# Linux/Mac
export GENIE_API_KEY=your_api_key_here
python standalone_compare.py balance_sheet.pdf
```

## Output

The script will:
1. Process the PDF(s)
2. Display results in the terminal
3. Save full JSON to `balance_sheet_comparison.json`
4. Produce a comparison verdict when two companies are provided

## Example Output

```
============================================================
Balance Sheet Comparator - Standalone Version
============================================================
No Django server required! 🎉

📄 Processing: balance_sheet1.pdf
--------------------------------------------------
Step 1: Loading PDF...
✓ Extracted 3 pages
Step 2: Preparing context...
✓ Prepared 15234 characters of context
Step 3: Extracting balance sheet data with AI...
✓ Data extracted successfully
Step 4: Mapping to canonical fields...
✓ Fields mapped
Step 5: Calculating financial ratios...
✓ Ratios calculated

============================================================
RESULTS
============================================================

📊 Company 1: ABC Corporation
   Fiscal Year End: 2024-03-31
   Currency: INR
   Units: lakhs

   Balance Sheet Data:
   - cash_and_cash_equivalents: 1,000,000.00
   - inventory: 500,000.00
   - total_current_assets: 2,000,000.00
   ...

   Financial Ratios:
   - current_ratio: 1.3333
   - quick_ratio: 1.0000
   - debt_to_equity: 0.8000
   ...

------------------------------------------------------------
COMPARISON VERDICT
------------------------------------------------------------
Winner: ABC Corporation
Summary: ABC Corporation outperformed XYZ Ltd. on 4 of 6 comparable metrics (ties: 1).
Scores:
   - ABC Corporation: 4
   - XYZ Ltd.: 2

Metric breakdown:
   - current_ratio: winner=ABC Corporation (prefers higher) | company1=1.3333 | company2=1.1200
   - debt_ratio: winner=ABC Corporation (prefers lower) | company1=0.4200 | company2=0.5600
   ...

💾 Full results saved to: balance_sheet_comparison.json

✅ Done!
```

## Command Line Options

```bash
python standalone_compare.py [OPTIONS] file1 [file2]

Arguments:
  file1                  Path to first PDF file (required)
  file2                  Path to second PDF file (optional)

Options:
  --api-key KEY         Google API key (or set GENIE_API_KEY env var)
  --output, -o FILE     Output JSON file (default: balance_sheet_comparison.json)
  -h, --help           Show help message
```

## Comparison: Standalone vs Django API

| Feature | Standalone | Django API |
|---------|-----------|------------|
| **Server Required** | ❌ No | ✅ Yes |
| **Setup** | Just run script | Start server first |
| **Usage** | Command line | HTTP requests |
| **Best For** | Quick testing, CLI | Web apps, APIs |
| **Dependencies** | Same Python libs | Same + Django |

## When to Use Which?

### Use Standalone When:
- ✅ You want to test quickly
- ✅ You're using it from command line
- ✅ You're integrating into another Python script
- ✅ You don't need a web interface

### Use Django API When:
- ✅ You have a web frontend
- ✅ You need HTTP API endpoints
- ✅ Multiple users/clients need access
- ✅ You want to integrate with existing Django app

## Both Use the Same Core Functions!

Both versions use the exact same core functions:
- `services.py` - PDF loading and AI extraction
- `data_mapper.py` - Field mapping
- `ratio_calculator.py` - Ratio calculations

The only difference is:
- **Standalone**: Calls functions directly
- **Django API**: Wraps functions in HTTP endpoint

## Troubleshooting

### Import Errors
Make sure you're running from the correct directory:
```bash
cd Fingenie/apps/balance_sheet_comparator
python standalone_compare.py ...
```

### API Key Not Found
Either provide `--api-key` or set environment variable:
```bash
export GENIE_API_KEY=your_key  # Linux/Mac
set GENIE_API_KEY=your_key     # Windows
```

### File Not Found
Use absolute paths or relative paths from the script location.

