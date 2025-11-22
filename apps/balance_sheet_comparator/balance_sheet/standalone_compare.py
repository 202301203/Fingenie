"""
Standalone Balance Sheet Comparator
No Django server required! Just run this script directly.

Usage:
    python standalone_compare.py balance_sheet1.pdf [balance_sheet2.pdf] [--api-key YOUR_KEY]
"""
import sys
import os
import json
import argparse

# Add the app directory to Python path so we can import our modules
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

# Import our core functions (these don't need Django!)
from services import load_pdf_robust, prepare_context_smart, extract_balance_sheet_data
from data_mapper import map_to_canonical_fields
from ratio_calculator import calculate_ratios
from comparison import evaluate_comparison


def process_balance_sheet(pdf_path, api_key):
    """
    Process a single balance sheet PDF and return the results.
    No Django required - just pure Python!
    """
    print(f"\n📄 Processing: {pdf_path}")
    print("-" * 50)
    
    # Step 1: Load PDF
    print("Step 1: Loading PDF...")
    documents = load_pdf_robust(pdf_path)
    if not documents:
        raise ValueError(f"Failed to extract text from {pdf_path}")
    print(f"✓ Extracted {len(documents)} pages")
    
    # Step 2: Prepare context
    print("Step 2: Preparing context...")
    context_text = prepare_context_smart(documents)
    print(f"✓ Prepared {len(context_text)} characters of context")
    
    # Step 3: Extract data using AI
    print("Step 3: Extracting balance sheet data with AI...")
    extraction_result = extract_balance_sheet_data(context_text, api_key)
    
    if not extraction_result.get('success'):
        raise ValueError(f"Extraction failed: {extraction_result.get('error')}")
    print("✓ Data extracted successfully")
    
    # Step 4: Map to canonical fields
    print("Step 4: Mapping to canonical fields...")
    canonical = map_to_canonical_fields(extraction_result)
    print("✓ Fields mapped")
    
    # Step 5: Calculate ratios
    print("Step 5: Calculating financial ratios...")
    ratios = calculate_ratios(canonical)
    print("✓ Ratios calculated")
    
    # Build result
    result = {
        'company_name': canonical.get('company_name'),
        'fiscal_year_end': canonical.get('fiscal_year_end'),
        'currency': canonical.get('currency'),
        'units': canonical.get('units'),
        'balance_sheet': canonical,
        'ratios': ratios
    }
    
    return result


def main():
    parser = argparse.ArgumentParser(
        description='Compare balance sheets from PDF files - No server required!',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process one PDF
  python standalone_compare.py balance_sheet1.pdf --api-key YOUR_KEY
  
  # Compare two PDFs
  python standalone_compare.py balance_sheet1.pdf balance_sheet2.pdf --api-key YOUR_KEY
  
  # Use environment variable for API key
  export GENIE_API_KEY=your_key
  python standalone_compare.py balance_sheet1.pdf
        """
    )
    
    parser.add_argument('file1', help='Path to first PDF file')
    parser.add_argument('file2', nargs='?', help='Path to second PDF file (optional)')
    parser.add_argument('--api-key', help='Google API key (or set GENIE_API_KEY env var)')
    parser.add_argument('--output', '-o', help='Output JSON file (default: balance_sheet_comparison.json)')
    
    args = parser.parse_args()
    
    # Get API key
    api_key = args.api_key or os.environ.get('GENIE_API_KEY')
    if not api_key:
        print("❌ ERROR: No API key provided!")
        print("   Provide --api-key or set GENIE_API_KEY environment variable")
        sys.exit(1)
    
    # Check files exist
    if not os.path.exists(args.file1):
        print(f"❌ ERROR: File not found: {args.file1}")
        sys.exit(1)
    
    if args.file2 and not os.path.exists(args.file2):
        print(f"❌ ERROR: File not found: {args.file2}")
        sys.exit(1)
    
    print("=" * 60)
    print("Balance Sheet Comparator - Standalone Version")
    print("=" * 60)
    print("No Django server required! 🎉")
    print()
    
    try:
        # Process first company
        company1 = process_balance_sheet(args.file1, api_key)
        
        # Process second company if provided
        company2 = None
        if args.file2:
            company2 = process_balance_sheet(args.file2, api_key)
        
        comparison = evaluate_comparison(company1, company2) if company2 else None

        # Build final result
        result = {
            'company1': company1,
            'comparison': comparison,
        }

        if company2:
            result['company2'] = company2

        # Display results
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)
        
        print(f"\n📊 Company 1: {company1.get('company_name', 'N/A')}")
        print(f"   Fiscal Year End: {company1.get('fiscal_year_end', 'N/A')}")
        print(f"   Currency: {company1.get('currency', 'N/A')}")
        print(f"   Units: {company1.get('units', 'N/A')}")
        
        print("\n   Balance Sheet Data:")
        bs = company1.get('balance_sheet', {})
        for key, value in bs.items():
            if key not in ['company_name', 'fiscal_year_end', 'currency', 'units']:
                if value is not None:
                    print(f"   - {key}: {value:,.2f}" if isinstance(value, (int, float)) else f"   - {key}: {value}")
        
        print("\n   Financial Ratios:")
        ratios = company1.get('ratios', {})
        for ratio_name, ratio_value in ratios.items():
            if ratio_value is not None:
                print(f"   - {ratio_name}: {ratio_value:.4f}")
            else:
                print(f"   - {ratio_name}: N/A")
        
        if company2:
            print(f"\n📊 Company 2: {company2.get('company_name', 'N/A')}")
            print(f"   Fiscal Year End: {company2.get('fiscal_year_end', 'N/A')}")
            print(f"   Currency: {company2.get('currency', 'N/A')}")
            print(f"   Units: {company2.get('units', 'N/A')}")
            
            print("\n   Balance Sheet Data:")
            bs2 = company2.get('balance_sheet', {})
            for key, value in bs2.items():
                if key not in ['company_name', 'fiscal_year_end', 'currency', 'units']:
                    if value is not None:
                        print(f"   - {key}: {value:,.2f}" if isinstance(value, (int, float)) else f"   - {key}: {value}")
            
            print("\n   Financial Ratios:")
            ratios2 = company2.get('ratios', {})
            for ratio_name, ratio_value in ratios2.items():
                if ratio_value is not None:
                    print(f"   - {ratio_name}: {ratio_value:.4f}")
                else:
                    print(f"   - {ratio_name}: N/A")

        if comparison:
            print("\n" + "-" * 60)
            print("COMPARISON VERDICT")
            print("-" * 60)
            print(f"Winner: {comparison.get('verdict', 'tie')}")
            print(f"Summary: {comparison.get('summary')}")
            scores = comparison.get('score', {})
            if scores:
                print("Scores:")
                for name, score in scores.items():
                    print(f"   - {name}: {score}")
            details = comparison.get('comparisons', [])
            if details:
                print("\nMetric breakdown:")
                for detail in details:
                    metric = detail.get('metric')
                    winner = detail.get('winner', detail.get('result'))
                    pref = detail.get('preference')
                    v1 = detail.get('company1_value')
                    v2 = detail.get('company2_value')
                    print(f"   - {metric}: winner={winner} (prefers {pref}) | company1={v1} | company2={v2}")

        # Save to file
        output_file = args.output or 'balance_sheet_comparison.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Full results saved to: {output_file}")
        print("\n✅ Done!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

