from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
import json

from .models import BalanceSheetComparison
from .balance_sheet.services import load_pdf_robust, prepare_context_smart, extract_raw_financial_data
from .balance_sheet.ratio_calculator import calculate_ratios_from_items
from .balance_sheet.comparison import evaluate_comparison


@csrf_exempt
def compare_balance_sheets_api(request):
    """
    API endpoint to compare balance sheets from two PDF files.
    
    Expected request:
    {
        "file1": uploaded PDF file (Company 1),
        "file2": uploaded PDF file (Company 2),
        "api_key": Optional Google API key
    }
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method. Use POST.'}, status=405)
    
    try:
        # Get uploaded files
        file1 = request.FILES.get('file1')
        file2 = request.FILES.get('file2')
        
        if not file1 or not file2:
            return JsonResponse({'error': 'Both file1 and file2 are required'}, status=400)
        
        # Get API key from request or settings
        api_key = request.POST.get('api_key') or getattr(settings, 'GENIE_API_KEY', None) or os.environ.get('GENIE_API_KEY')
        
        if not api_key:
            return JsonResponse({'error': 'Missing GENIE_API_KEY. Provide via request or server settings.'}, status=400)
        
        # Create temporary files
        import tempfile
        temp_dir = tempfile.gettempdir()
        
        temp_path1 = os.path.join(temp_dir, f"company1_{uuid.uuid4()}.pdf")
        temp_path2 = os.path.join(temp_dir, f"company2_{uuid.uuid4()}.pdf")
        
        try:
            # Save uploaded files
            with open(temp_path1, 'wb+') as destination:
                for chunk in file1.chunks():
                    destination.write(chunk)
            
            with open(temp_path2, 'wb+') as destination:
                for chunk in file2.chunks():
                    destination.write(chunk)
            
            # Step 1: Load PDFs
            print("Loading PDF files...")
            documents1 = load_pdf_robust(temp_path1)
            documents2 = load_pdf_robust(temp_path2)
            
            if not documents1 or not documents2:
                return JsonResponse({'error': 'Failed to extract text from one or both PDF files'}, status=400)
            
            # Step 2: Prepare context
            context1 = prepare_context_smart(documents1)
            context2 = prepare_context_smart(documents2)
            
            if len(context1.strip()) < 100 or len(context2.strip()) < 100:
                return JsonResponse({'error': 'Insufficient financial content found in PDF files'}, status=400)
            
            # Step 3: Extract financial data
            print("Extracting financial data...")
            company1_data = extract_raw_financial_data(context1, api_key)
            company2_data = extract_raw_financial_data(context2, api_key)
            
            if not company1_data.get("success") or not company2_data.get("success"):
                error1 = company1_data.get("error", "Unknown error")
                error2 = company2_data.get("error", "Unknown error")
                return JsonResponse({
                    'error': 'Failed to extract financial data',
                    'details': f"Company 1: {error1}, Company 2: {error2}"
                }, status=400)
            
            # Step 4: Calculate ratios
            print("Calculating financial ratios...")
            financial_items1 = company1_data.get('financial_items', [])
            financial_items2 = company2_data.get('financial_items', [])
            
            ratios1 = calculate_ratios_from_items(financial_items1)
            ratios2 = calculate_ratios_from_items(financial_items2)
            
            # Step 5: Evaluate comparison
            print("Evaluating comparison...")
            
            # Ensure company names are never None or empty
            company1_name = company1_data.get('company_name') or 'Company 1'
            company2_name = company2_data.get('company_name') or 'Company 2'
            
            company1_info = {
                "company_name": company1_name,
                "financial_items": financial_items1,
                "ratios": ratios1
            }
            
            company2_info = {
                "company_name": company2_name,
                "financial_items": financial_items2,
                "ratios": ratios2
            }
            
            evaluation = evaluate_comparison(company1_info, company2_info)
            
            # Step 6: Save to database
            comparison_id = str(uuid.uuid4())
            try:
                comparison = BalanceSheetComparison.objects.create(
                    comparison_id=comparison_id,
                    company1_name=company1_name,
                    company2_name=company2_name,
                )
                
                comparison.set_company1_metrics(ratios1)
                comparison.set_company2_metrics(ratios2)
                comparison.set_evaluation(evaluation)
                comparison.set_comparison_result({
                    "company1": company1_info,
                    "company2": company2_info
                })
                comparison.save()
                
                print("Comparison saved to database successfully!")
            except Exception as e:
                print(f"Error saving to database: {str(e)}")
                import traceback
                print(traceback.format_exc())
                return JsonResponse({'error': f'Failed to save comparison: {str(e)}'}, status=500)
            
            # Step 7: Return response
            return JsonResponse({
                'success': True,
                'comparison_id': comparison_id,
                'company1_name': company1_name,
                'company2_name': company2_name,
                'company1_metrics': ratios1,
                'company2_metrics': ratios2,
                'evaluation': evaluation,
                'metadata': {
                    'file1_name': file1.name,
                    'file2_name': file2.name,
                    'file1_size_kb': round(file1.size / 1024, 2),
                    'file2_size_kb': round(file2.size / 1024, 2)
                }
            })
        
        finally:
            # Clean up temporary files (module-level `os` is already imported)
            if os.path.exists(temp_path1):
                os.remove(temp_path1)
            if os.path.exists(temp_path2):
                os.remove(temp_path2)
    
    except Exception as e:
        print(f"Error in compare_balance_sheets_api: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_comparison_api(request, comparison_id):
    """
    API endpoint to retrieve a saved balance sheet comparison.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid method. Use GET.'}, status=405)
    
    try:
        comparison = BalanceSheetComparison.objects.get(comparison_id=comparison_id)
        
        return JsonResponse({
            'success': True,
            'comparison_id': str(comparison.comparison_id),
            'company1_name': comparison.company1_name,
            'company2_name': comparison.company2_name,
            'company1_metrics': comparison.get_company1_metrics(),
            'company2_metrics': comparison.get_company2_metrics(),
            'evaluation': comparison.get_evaluation(),
            'created_at': comparison.created_at.isoformat()
        })
    except BalanceSheetComparison.DoesNotExist:
        return JsonResponse({'error': 'Comparison not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_comparisons_api(request):
    """
    API endpoint to list all saved balance sheet comparisons.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid method. Use GET.'}, status=405)
    
    try:
        comparisons = BalanceSheetComparison.objects.all().values(
            'comparison_id', 'company1_name', 'company2_name', 'created_at'
        )
        
        return JsonResponse({
            'success': True,
            'count': comparisons.count(),
            'comparisons': list(comparisons)
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
