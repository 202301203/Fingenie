from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
import json
import shutil 

from .models import FinancialReport 

# Import core logic functions
from django.shortcuts import render
from .services import (
    load_financial_document,
    prepare_context_smart,
    extract_raw_financial_data,
    generate_summary_from_data,
    generate_ratios_from_data,
    load_pdf_robust,
    prepare_context_smart
)

def upload_file_view(request):
    """Renders the file upload form."""
    return render(request, 'pdf_app/upload.html')

@csrf_exempt
def process_financial_statements_api(request):
    """
    Handles the file upload, saves to the FinancialReport model,
    performs extraction, and saves the summary back to the model.
    Main API view to process financial statements from PDF or Excel files using Gemini.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

    # Check if file was uploaded
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file uploaded.'}, status=400)

    uploaded_file = request.FILES['file']
    
    # Get API key from request or settings
    api_key = request.POST.get('api_key') or getattr(settings, 'GENIE_API_KEY', None) or os.environ.get('GENIE_API_KEY')
    if not api_key:
        return JsonResponse({'error': 'No API key provided. Provide api_key in the POST or set GENIE_API_KEY in settings or environment.'}, status=400)

    file_extension = os.path.splitext(uploaded_file.name)[1]
    if file_extension.lower() not in ['.pdf', '.xlsx', '.xls', '.csv']:
        return JsonResponse({'error': 'Invalid file type.'}, status=400)
    
    new_report = None
    try:
        # --- STEP 1: SAVE FILE TO MODEL ---
        # This saves the file to your 'MEDIA_ROOT/reports/' folder
        new_report = FinancialReport(file=uploaded_file)
        new_report.save()
        
        # Get the permanent path and database ID
        pdf_path = new_report.file.path 
        report_db_id = new_report.id  # This is the ID for the chatbot

        extraction_result = {"financial_items": [], "summary": None}

        # --- STEP 2: LOAD AND PREPARE CONTEXT ---
        # We now use the permanent path from the model
        documents = load_pdf_robust(pdf_path)
        if not documents:
            raise ValueError("Failed to extract any usable text from PDF.")

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

        # Step 5: Save summary to DB
        summary = extraction_result.get('summary', {})
        new_report.summary_pros = "\n".join(summary.get('pros', []))
        new_report.summary_cons = "\n".join(summary.get('cons', []))
        new_report.save(update_fields=['summary_pros', 'summary_cons'])

        return JsonResponse(extraction_result, status=200)

    except Exception as e:
        if new_report:
            new_report.delete()
        return JsonResponse({'error': str(e)}, status=500)
        
@csrf_exempt
def extract_data_api(request):
    """
    Legacy endpoint - now calls the main processing function
    """
    return process_financial_statements_api(request)