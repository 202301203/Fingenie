from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
import json

from .models import FinancialReport
from .services import (
    load_pdf_robust,
    prepare_context_smart,
    extract_raw_financial_data,
    generate_summary_from_data,
    generate_ratios_from_data
)

@csrf_exempt
def process_financial_statements_api(request):
    if request.method == 'POST':
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return JsonResponse({'error': 'No file uploaded'}, status=400)

        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}.pdf")

        try:
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

        context_text = prepare_context_smart(documents)
        if len(context_text.strip()) < 100:
            return JsonResponse({"error": "Insufficient financial content found", "success": False}, status=400)
        
       
        extraction_result = extract_raw_financial_data(context_text, api_key)
        if not extraction_result.get("success"):
            raise ValueError(extraction_result.get("error", "Extraction failed."))

        financial_items = extraction_result.get("financial_items", [])
        summary_result = generate_summary_from_data(financial_items, api_key)
        ratio_result = generate_ratios_from_data(financial_items, api_key)

        extraction_result.update({
            "summary": summary_result.get("summary"),
            "ratios": ratio_result.get("ratios"),
            "report_id": report_db_id
        })

            # Step 2: Load and extract financial data
            documents = load_pdf_robust(temp_path)
            context = prepare_context_smart(documents)
            extracted_data = extract_raw_financial_data(context, google_api_key)

            # Step 3: Generate summary & ratios
            summary_result = generate_summary_from_data(extracted_data.get('financial_items', []), google_api_key)
            ratios_result = generate_ratios_from_data(extracted_data.get('financial_items', []), google_api_key)

            # FIXED: Extract the actual data from the results
            summary_data = summary_result.get('summary', {}) if isinstance(summary_result, dict) else {}
            ratios_data = ratios_result.get('financial_ratios', []) if isinstance(ratios_result, dict) else ratios_result

            # Step 4: Save to DB (FIXED - using TextField approach)
            report_id = str(uuid.uuid4())
            try:
                report = FinancialReport.objects.create(
                    report_id=report_id,
                    company_name=extracted_data.get("company_name", "Unknown"),
                    ticker_symbol=extracted_data.get("ticker_symbol", ""),
                )
                # Use the setter methods for TextField
                report.set_summary(summary_data)
                report.set_ratios(ratios_data)
                report.save()
                print("Report saved to database successfully!")
            except Exception as e:
                print(f"Error saving to database: {str(e)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                return JsonResponse({'error': f'Failed to save report: {str(e)}'}, status=500)

            # Clean up temp file
            os.remove(temp_path)

            # Respond to frontend
            return JsonResponse({
                'success': True,
                'report_id': report_id,
                'company_name': extracted_data.get("company_name", "Unknown"),
                'ticker_symbol': extracted_data.get("ticker_symbol", ""),
                'summary': summary_data,
                'ratios': ratios_data,
                'metadata': {
                    "file_name": uploaded_file.name,
                    "size_kb": round(uploaded_file.size / 1024, 2)
                }
            })

        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

# FIX the other view functions to use getter methods:

@csrf_exempt
def get_report_by_id_api(request, report_id):
    try:
        report = FinancialReport.objects.get(report_id=report_id)
        return JsonResponse({
            'success': True,
            'report_id': str(report.report_id),
            'company_name': report.company_name,
            'ticker_symbol': report.ticker_symbol,
            'summary': report.get_summary(),  # Use getter method
            'ratios': report.get_ratios(),    # Use getter method
        })
    except FinancialReport.DoesNotExist:
        return JsonResponse({'error': 'Report not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)

@csrf_exempt
def get_latest_report_api(request):
    try:
        report = FinancialReport.objects.order_by('-created_at').first()
        if not report:
            return JsonResponse({'error': 'No reports found'}, status=404)

        return JsonResponse({
            'success': True,
            'report_id': str(report.report_id),
            'company_name': report.company_name,
            'ticker_symbol': report.ticker_symbol,
            'summary': report.get_summary(),  # Use getter method
            'ratios': report.get_ratios(),    # Use getter method
        })
    except Exception as e:
        return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)

# ... rest of your views remain the same
# ----------------------------
# 4️ STOCK DATA API
# ----------------------------
@csrf_exempt
def get_stock_data_api(request, ticker_symbol, period='1M'):
    """
    Mock stock data endpoint - you'll want to integrate with a real API
    """
    return process_financial_statements_api(request)
