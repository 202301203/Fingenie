# dataprocessor/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required  # retained for potential future use but not applied now
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

import json
from django.core.serializers.json import DjangoJSONEncoder
from decimal import Decimal

class CustomJSONEncoder(DjangoJSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

@csrf_exempt
def process_financial_statements_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return JsonResponse({'error': 'No file uploaded'}, status=400)

    temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads')
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}.pdf")

    google_api_key = request.POST.get('api_key')  
    
    if not google_api_key:
        return JsonResponse({'error': 'Missing API key'}, status=500)
    if not google_api_key:
        return JsonResponse({'error': 'Missing Google API key'}, status=500)

    try:
        # Save uploaded file temporarily
        with open(temp_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        # Step 1: Load and prepare document context
        documents = load_pdf_robust(temp_path)
        context = prepare_context_smart(documents)
        if len(context.strip()) < 100:
            return JsonResponse({"error": "Insufficient financial content found", "success": False}, status=400)

        # Step 2: Extract raw financial data
        extracted_data = extract_raw_financial_data(context, google_api_key)
        if not extracted_data.get("success"):
            error_msg = extracted_data.get("error", "Data extraction failed")
            return JsonResponse({"error": error_msg, "success": False}, status=400)

        # Step 3: Generate summary
        summary_result = generate_summary_from_data(extracted_data.get('financial_items', []), google_api_key)
        if not summary_result.get("success"):
            # Don't fail entirely if summary fails, just use empty summary
            summary_data = {"pros": [], "cons": [], "financial_health_summary": "Summary generation failed"}
        else:
            summary_data = {
                "pros": summary_result.get("pros", []),
                "cons": summary_result.get("cons", []),
                "financial_health_summary": summary_result.get("financial_health_summary", "")
            }

        # Step 4: Calculate ratios
        ratios_result = generate_ratios_from_data(extracted_data.get('financial_items', []), google_api_key)
        if not ratios_result.get("success"):
            # Don't fail entirely if ratios fail, just use empty ratios
            ratios_data = []
        else:
            ratios_data = ratios_result.get("financial_ratios", [])

        # Step 5: Save to DB using your model's setter methods - NOW WITH USER LINK
        report_id = str(uuid.uuid4())
        # Remove user linkage: allow creation without authentication.
        # If you later want optional linkage, use:
        # user_obj = request.user if getattr(request.user, 'is_authenticated', False) else None
        # and pass user=user_obj.
        report = FinancialReport.objects.create(
            report_id=report_id,
            company_name=extracted_data.get("company_name", "Unknown Company"),
            ticker_symbol=extracted_data.get("ticker_symbol", ""),
            user=None,  # No user association
            uploaded_pdf=uploaded_file,
            pdf_original_name=uploaded_file.name,
        )
        
        # Use the setter methods from your model
        report.set_summary(summary_data)
        report.set_ratios(ratios_data)
        report.save()

        # Clean up
        os.remove(temp_path)

        # Return the response in the format expected by frontend
        return JsonResponse({
            'success': True,
            'report_id': report_id,
            'company_name': extracted_data.get("company_name", "Unknown Company"),
            'ticker_symbol': extracted_data.get("ticker_symbol", ""),
            'summary': report.get_summary(),  # Use getter to ensure proper format
            'ratios': report.get_ratios(),    # Use getter to ensure proper format
            'metadata': {
                "file_name": uploaded_file.name,
                "size_kb": round(uploaded_file.size / 1024, 2),
                "uploaded_pdf": True,
            }
        }, encoder=CustomJSONEncoder)

    except Exception as e:
        import traceback
        print(f"Error in processing: {str(e)}")
        print(traceback.format_exc())
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)

@csrf_exempt
def get_report_by_id_api(request, report_id):
    try:
        print(f" Looking for report: {report_id}")
        # Public access: fetch by report_id only (no user restriction)
        report = FinancialReport.objects.get(report_id=report_id)
        print(f" Found report: {report.company_name}")
        
        # Debug: Check what data we have
        print(f" Summary data type: {type(report.summary)}")
        print(f" Ratios data type: {type(report.ratios)}")
        
        # Use getter methods to ensure proper structure
        summary_data = report.get_summary()
        ratios_data = report.get_ratios()
        
        print(f" Summary pros count: {len(summary_data.get('pros', []))}")
        print(f" Summary cons count: {len(summary_data.get('cons', []))}")
        print(f" Ratios count: {len(ratios_data)}")
        
        response_data = {
            'success': True,
            'report_id': str(report.report_id),
            'company_name': report.company_name,
            'ticker_symbol': report.ticker_symbol,
            'summary': summary_data,
            'ratios': ratios_data,
            'created_at': report.created_at.isoformat(),
            'time_ago': report.time_ago,
            'has_uploaded_pdf': report.has_uploaded_pdf,
            'uploaded_pdf_name': report.pdf_original_name,
        }
        
        print(f" Sending response for report: {report_id}")
        return JsonResponse(response_data)
        
    except FinancialReport.DoesNotExist:
        print(f" Report not found or access denied: {report_id}")
        return JsonResponse({'error': 'Report not found or access denied'}, status=404)
    except Exception as e:
        print(f" Error in get_report_by_id_api: {str(e)}")
        import traceback
        print(f"Stack trace: {traceback.format_exc()}")
        return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)

@csrf_exempt
def get_latest_report_api(request):
    try:
        print(" Looking for latest report...")
        # Public: latest overall report (no user filter)
        report = FinancialReport.objects.order_by('-created_at').first()
        if not report:
            print(" No reports found for user")
            return JsonResponse({'error': 'No reports found'}, status=404)

        print(f" Found latest report: {report.company_name}")
        
        # Use getter methods
        response_data = {
            'success': True,
            'report_id': str(report.report_id),
            'company_name': report.company_name,
            'ticker_symbol': report.ticker_symbol,
            'summary': report.get_summary(),
            'ratios': report.get_ratios(),
            'created_at': report.created_at.isoformat(),
            'time_ago': report.time_ago,
            'has_uploaded_pdf': report.has_uploaded_pdf,
        }
        
        print(f" Sending latest report response")
        return JsonResponse(response_data)
        
    except Exception as e:
        print(f" Error in get_latest_report_api: {str(e)}")
        import traceback
        print(f"Stack trace: {traceback.format_exc()}")
        return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)

# ============================================
# NEW PROFILE-INTEGRATED VIEWS
# ============================================

@csrf_exempt
def user_summary_history(request):
    """Get public financial analysis history (all reports)."""
    try:
        reports = FinancialReport.objects.order_by('-created_at')
        
        reports_data = []
        for report in reports:
            reports_data.append({
                'report_id': str(report.report_id),
                'company_name': report.company_name,
                'ticker_symbol': report.ticker_symbol,
                'summary_preview': report.financial_health_summary[:100] + '...' if report.financial_health_summary else '',
                'full_summary': report.financial_health_summary,
                'date': report.created_at.strftime('%b %d, %Y'),
                'time_ago': report.time_ago,
                'uploaded_pdf': report.has_uploaded_pdf,
                'pdf_name': report.pdf_original_name,
            })
        
        return JsonResponse({
            'success': True,
            'reports': reports_data,
            'total_reports': len(reports_data)
        })
        
    except Exception as e:
        print(f"Error in user_summary_history: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to load summary history'
        }, status=500)

@csrf_exempt
def delete_report_api(request, report_id):
    """Delete a report by id (public). WARNING: consider re-adding auth for production."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)
    
    try:
        # Public delete by id (no user filter)
        report = FinancialReport.objects.get(report_id=report_id)
        company_name = report.company_name
        report.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Report for {company_name} deleted successfully'
        })
        
    except FinancialReport.DoesNotExist:
        return JsonResponse({'error': 'Report not found or access denied'}, status=404)
    except Exception as e:
        print(f"Error deleting report: {str(e)}")
        return JsonResponse({'error': 'Failed to delete report'}, status=500)

@csrf_exempt
def get_recent_analyses(request):
    """Get recent analyses (public feed)."""
    try:
        limit = request.GET.get('limit', 5)
        reports = FinancialReport.objects.order_by('-created_at')[:int(limit)]
        
        analyses_data = []
        for report in reports:
            analyses_data.append({
                'report_id': str(report.report_id),
                'company_name': report.company_name,
                'ticker_symbol': report.ticker_symbol,
                'summary_preview': report.financial_health_summary[:50] + '...' if report.financial_health_summary else 'Analysis completed',
                'date': report.created_at.strftime('%b %d, %Y'),
                'time_ago': report.time_ago,
            })
        
        return JsonResponse({
            'success': True,
            'analyses': analyses_data
        })
        
    except Exception as e:
        print(f"Error in get_recent_analyses: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to load recent analyses'
        }, status=500)

@csrf_exempt
def get_stock_data_api(request, ticker_symbol, period='1M'):
    """
    Mock stock data endpoint - you'll want to integrate with a real API
    """
    # This might not need authentication if it's public data
    return JsonResponse({
        'success': True,
        'ticker': ticker_symbol,
        'period': period,
        'data': []  # Mock data - integrate with real API
    })