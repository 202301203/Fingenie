from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
import json
import shutil 

from .models import FinancialReport 

# Import core logic functions
from .services import (
    extract_raw_financial_data,
    generate_summary_from_data,
    load_pdf_robust,
    prepare_context_smart
)

# Simple form for file upload
def upload_file_view(request):
    """Renders the file upload form."""
    return render(request, 'pdf_app/upload.html')

@csrf_exempt
def extract_data_api(request):
    """
    Handles the file upload, saves to the FinancialReport model,
    performs extraction, and saves the summary back to the model.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file uploaded.'}, status=400)

    uploaded_file = request.FILES['file']
    
    api_key = request.POST.get('api_key') or getattr(settings, 'GENIE_API_KEY', None) or os.environ.get('GENIE_API_KEY')
    if not api_key:
        return JsonResponse({'error': 'No API key provided. Provide api_key in the POST or set GENIE_API_KEY in settings or environment.'}, status=500)

    file_extension = os.path.splitext(uploaded_file.name)[1]
    if file_extension.lower() != '.pdf':
        return JsonResponse({'error': 'Invalid file type. Only PDF files are accepted.'}, status=400)
    
    # We must create the DB object first to save the file
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
        
        # --- STEP 3: EXTRACT RAW FINANCIAL DATA ---
        raw_data_result = extract_raw_financial_data(context_text, api_key)
        
        if not raw_data_result.get('success'):
            return JsonResponse(raw_data_result, status=500)
            
        financial_items = raw_data_result.get('financial_items', [])
        company_name = raw_data_result.get('company_name')
        ticker_symbol = raw_data_result.get('ticker_symbol')

        extraction_result['financial_items'] = financial_items
        extraction_result['company_name'] = company_name
        extraction_result['ticker_symbol'] = ticker_symbol
        
        if not financial_items:
            extraction_result['summary'] = {'pros': ["Extraction successful but no financial tables found."], 'cons': []}
        
        # --- STEP 4: GENERATE SUMMARY FROM EXTRACTED DATA ---
        if financial_items: 
            summary_result = generate_summary_from_data(financial_items, api_key)
            
            if not summary_result.get('success'):
                print(f"Summary failed: {summary_result.get('error')}")
                extraction_result['summary'] = {'pros': [], 'cons': [f"Summary generation failed: {summary_result.get('error')}"]}
            else:
                extraction_result['summary'] = summary_result['summary']
        
        # This 'report_id' is the database Primary Key
        extraction_result['report_id'] = report_db_id
        
        # --- STEP 5: SAVE SUMMARIES BACK TO DATABASE ---
        summary_data = extraction_result.get('summary', {})
        
        pros_text = "\n".join(summary_data.get('pros', []))
        cons_text = "\n".join(summary_data.get('cons', []))
        
        # Update the model instance we created at the start
        new_report.summary_pros = pros_text
        new_report.summary_cons = cons_text
        new_report.save(update_fields=['summary_pros', 'summary_cons'])
        
        print(f"Successfully processed and saved summary for report {report_db_id}.")
            
        # --- STEP 6: RETURN COMBINED RESULTS ---
        return JsonResponse(extraction_result, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()

        # --- Error Cleanup ---
        # If processing fails after the file was saved,
        # delete the orphaned FinancialReport object.
        if new_report and new_report.pk:
            try:
                new_report.delete() # This will also delete the file from 'reports/'
                print(f"Deleted orphaned report {new_report.id} due to processing error.")
            except Exception as del_e:
                print(f"Error while deleting orphaned report {new_report.id}: {del_e}")
                
        return JsonResponse({'error': f"An internal server error occurred during processing: {e}"}, status=500)