from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
import json

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
    Handles the file upload, performs robust extraction, and generates a business summary.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

    # --- MODIFIED KEY ---
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file uploaded.'}, status=400)

    uploaded_file = request.FILES['file']
    # --------------------
    # Prefer api_key sent from frontend (if provided), otherwise fall back to server-side configured key
    api_key = request.POST.get('api_key') or getattr(settings, 'GENIE_API_KEY', None) or os.environ.get('GENIE_API_KEY')
    if not api_key:
        return JsonResponse({'error': 'No API key provided. Provide api_key in the POST or set GENIE_API_KEY in settings or environment.'}, status=500)

    # 1. Save the file temporarily
    unique_name = str(uuid.uuid4())
    file_extension = os.path.splitext(uploaded_file.name)[1]
    
    # --- ADDED PDF CHECK ---
    if file_extension.lower() != '.pdf':
        return JsonResponse({'error': 'Invalid file type. Only PDF files are accepted.'}, status=400)
    # -----------------------
    temp_filename = f"{unique_name}{file_extension}"
    pdf_path = os.path.join(settings.MEDIA_ROOT, temp_filename)
    
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    
    extraction_result = {"financial_items": [], "summary": None}
    
    try:
        with open(pdf_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        
        # --- STEP 1: LOAD AND PREPARE CONTEXT ---
        documents = load_pdf_robust(pdf_path)
        if not documents:
            raise ValueError("Failed to extract any usable text from PDF.")
        
        context_text = prepare_context_smart(documents)
        
        
        # --- STEP 2: EXTRACT RAW FINANCIAL DATA ---
        raw_data_result = extract_raw_financial_data(context_text, api_key)
        
        if not raw_data_result.get('success'):
            return JsonResponse(raw_data_result, status=500)
            
        # Capture all the extracted data, not just financial_items
        financial_items = raw_data_result.get('financial_items', [])
        company_name = raw_data_result.get('company_name')
        ticker_symbol = raw_data_result.get('ticker_symbol')

        # Store everything in the main result object
        extraction_result['financial_items'] = financial_items
        extraction_result['company_name'] = company_name
        extraction_result['ticker_symbol'] = ticker_symbol
        
        if not financial_items:
            # If no items were extracted, skip the summary step
             return JsonResponse({
                'financial_items': [],
                'summary': {'pros': ["Extraction successful but no financial tables found."], 'cons': []}
            }, status=200)

        # --- STEP 3: GENERATE SUMMARY FROM EXTRACTED DATA ---
        summary_result = generate_summary_from_data(financial_items, api_key)
        
        if not summary_result.get('success'):
             # If summary fails, return raw data and log the error
            print(f"Summary failed: {summary_result.get('error')}")
            extraction_result['summary'] = {'pros': [], 'cons': [f"Summary generation failed: {summary_result.get('error')}"]}
        else:
            extraction_result['summary'] = summary_result['summary']

        # --- STEP 4: RETURN COMBINED RESULTS ---
        return JsonResponse(extraction_result, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f"An internal server error occurred during processing: {e}"}, status=500)

    finally:
        # Clean up the temporary file, regardless of success/failure
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
