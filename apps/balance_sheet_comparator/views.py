from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
import json

import logging
import tempfile
import traceback

from .models import BalanceSheetComparison
from .balance_sheet.services import load_pdf, prepare_context, extract_raw_financial_data
from .balance_sheet.ratio_calculator import calculate_ratios_from_items
from .balance_sheet.comparison import evaluate_comparison

logger = logging.getLogger(__name__)


@csrf_exempt
def compare_balance_sheets_api(request):
    """
    API endpoint to compare balance sheets from two PDF files.

    Expected request:
    - file1: uploaded PDF file (Company 1)
    - file2: uploaded PDF file (Company 2)
    - api_key: Optional Google API key
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method. Use POST.'}, status=405)

    # Get uploaded files
    file1 = request.FILES.get('file1')
    file2 = request.FILES.get('file2')

    if not file1 or not file2:
        return JsonResponse({'error': 'Both file1 and file2 are required'}, status=400)

    # Get API key from request or settings
    api_key = request.POST.get('api_key') or getattr(settings, 'GENIE_API_KEY', None) or os.environ.get('GENIE_API_KEY')
    if not api_key:
        return JsonResponse({'error': 'Missing GENIE_API_KEY. Provide via request or server settings.'}, status=400)

    temp_dir = tempfile.gettempdir()
    temp_path1 = os.path.join(temp_dir, f"company1_{uuid.uuid4()}.pdf")
    temp_path2 = os.path.join(temp_dir, f"company2_{uuid.uuid4()}.pdf")

    try:
        # Basic file type check (case-insensitive)
        file1_name = getattr(file1, 'name', '')
        file2_name = getattr(file2, 'name', '')
        
        if not file1_name.lower().endswith('.pdf'):
             return JsonResponse({'error': 'Failed to extract text from one or both PDF files'}, status=400)
             
        if not file2_name.lower().endswith('.pdf'):
            # Keep existing error message expected by tests
            return JsonResponse({'error': 'Failed to extract text from one or both PDF files'}, status=400)

        # Save uploaded files (handle chunk errors per-file)
        try:
            with open(temp_path1, 'wb+') as destination:
                for chunk in file1.chunks():
                    destination.write(chunk)
        except Exception as e:
            logger.error(f"Failed saving file1: {e}")
            return JsonResponse({'error': 'Failed to extract text from one or both PDF files'}, status=400)

        try:
            with open(temp_path2, 'wb+') as destination:
                for chunk in file2.chunks():
                    destination.write(chunk)
        except Exception as e:
            logger.error(f"Failed saving file2: {e}")
            return JsonResponse({'error': 'Failed to extract text from one or both PDF files'}, status=400)

        # Load PDFs
        logger.info("Loading PDF files...")
        documents1 = load_pdf(temp_path1)
        documents2 = load_pdf(temp_path2)

        if not documents1 or not documents2:
            return JsonResponse({'error': 'Failed to extract text from one or both PDF files'}, status=400)

        # Prepare context
        context1 = prepare_context(documents1)
        context2 = prepare_context(documents2)

        if len(context1.strip()) < 100 or len(context2.strip()) < 100:
            return JsonResponse({'error': 'Insufficient financial content found in PDF files'}, status=400)

        # Extract financial data
        logger.info("Extracting financial data...")
        company1_data = extract_raw_financial_data(context1, api_key) or {}
        company2_data = extract_raw_financial_data(context2, api_key) or {}

        if not company1_data.get("success") or not company2_data.get("success"):
            error1 = company1_data.get("error", "Unknown error")
            error2 = company2_data.get("error", "Unknown error")
            return JsonResponse({
                'error': 'Failed to extract financial data',
                'details': f"Company 1: {error1}, Company 2: {error2}"
            }, status=400)

        # Calculate ratios
        logger.info("Calculating financial ratios...")
        financial_items1 = company1_data.get('financial_items', [])
        financial_items2 = company2_data.get('financial_items', [])

        ratios1 = calculate_ratios_from_items(financial_items1)
        ratios2 = calculate_ratios_from_items(financial_items2)

        # Evaluate comparison
        logger.info("Evaluating comparison...")

        # Ensure company names are never None or empty and are within DB limits
        company1_name = (company1_data.get('company_name') or 'Company 1')[:255]
        company2_name = (company2_data.get('company_name') or 'Company 2')[:255]

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

        # Save to database
        comparison_id = str(uuid.uuid4())
        try:
            comparison = BalanceSheetComparison.objects.create(
                comparison_id=comparison_id,
                company1_name=company1_name,
                company2_name=company2_name,
                company1_metrics=ratios1,
                company2_metrics=ratios2,
                evaluation=evaluation,
                comparison_result={
                    "company1": company1_info,
                    "company2": company2_info
                }
            )
            logger.info("Comparison saved to database successfully!")
        except Exception as e:
            logger.error(f"Error saving to database: {str(e)}")
            logger.error(traceback.format_exc())
            return JsonResponse({'error': f'Failed to save comparison: {str(e)}'}, status=500)

        # Return response
        return JsonResponse({
            'success': True,
            'comparison_id': comparison_id,
            'company1_name': company1_name,
            'company2_name': company2_name,
            'company1_metrics': ratios1,
            'company2_metrics': ratios2,
            'evaluation': evaluation,
            'metadata': {
                'file1_name': getattr(file1, 'name', None),
                'file2_name': getattr(file2, 'name', None),
                # Use actual saved temp file sizes for accuracy
                'file1_size_kb': round(os.path.getsize(temp_path1) / 1024, 2) if os.path.exists(temp_path1) else None,
                'file2_size_kb': round(os.path.getsize(temp_path2) / 1024, 2) if os.path.exists(temp_path2) else None,
            }
        })

    finally:
        # Clean up temporary files (module-level `os` is already imported)
        try:
            if os.path.exists(temp_path1):
                os.remove(temp_path1)
            if os.path.exists(temp_path2):
                os.remove(temp_path2)
        except Exception:
            # Best-effort cleanup; don't mask the main response
            logger.exception("Error cleaning up temporary files")


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
            'company1_metrics': comparison.company1_metrics,
            'company2_metrics': comparison.company2_metrics,
            'evaluation': comparison.evaluation,
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
