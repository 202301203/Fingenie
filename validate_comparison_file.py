#!/usr/bin/env python
"""
Validate the saved JSON comparison file against the Pydantic schema in comparison.py
"""
import json
import sys
from apps.balance_sheet_comparator.balance_sheet import comparison

FILE = r"apps\balance_sheet_comparator\balance_sheet\balance_sheet_comparison.json"

if __name__ == '__main__':
    try:
        with open(FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"File not found: {FILE}")
        sys.exit(2)

    try:
        parsed = comparison.validate_comparison_schema(data)
        import json as _json
        print("✅ Validation successful. Parsed structure:")
        print(_json.dumps(parsed.model_dump(), indent=2, ensure_ascii=False))
        sys.exit(0)
    except Exception as e:
        print("❌ Validation failed:")
        print(str(e))
        sys.exit(1)
