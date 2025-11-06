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
    detect_file_type
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
        
    # Save the file temporarily
    unique_name = str(uuid.uuid4())
    file_extension = os.path.splitext(uploaded_file.name)[1].lower()
    
    # Validate file type
    if file_extension not in ['.pdf', '.xlsx', '.xls', '.csv']:
        return JsonResponse({'error': 'Invalid file type. Only PDF and Excel files are accepted.'}, status=400)
    
    temp_filename = f"{unique_name}{file_extension}"
    file_path = os.path.join(settings.MEDIA_ROOT, temp_filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    try:
        # Save uploaded file
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        # Step 1: Load document
        print("📄 Step 1: Loading document...")
        documents = load_financial_document(file_path)
        if not documents or not any(doc.page_content.strip() for doc in documents):
            return JsonResponse({"error": "No readable content found in document", "success": False}, status=400)
        
        # Step 2: Prepare context
        print("🔍 Step 2: Preparing context...")
        context_text = prepare_context_smart(documents)
        if len(context_text.strip()) < 100:
            return JsonResponse({"error": "Insufficient financial content found", "success": False}, status=400)
        
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
        print(f"📝 Context prepared: {len(context_text)} characters")
        
        # Step 3: Extract raw financial data
        print("💾 Step 3: Extracting financial data...")
        extraction_result = extract_raw_financial_data(context_text, api_key)
        if not extraction_result.get("success"):
            return JsonResponse(extraction_result, status=500)
        
        financial_items = extraction_result["financial_items"]
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

            return JsonResponse({"error": "No financial items could be extracted", "success": False}, status=400)
        
        print(f"✅ Extracted {len(financial_items)} financial items")
        
        # Step 4: Generate summary (with fallback)
        print("📈 Step 4: Generating financial summary...")
        summary_result = generate_summary_from_data(financial_items, api_key)
        
        # Step 5: Calculate ratios (with fallback)
        print("🧮 Step 5: Calculating financial ratios...")
        ratio_result = generate_ratios_from_data(financial_items, api_key)
        
        # Compile final result
        final_result = {
            "success": True,
            "company_info": {
                "company_name": extraction_result.get("company_name"),
                "ticker_symbol": extraction_result.get("ticker_symbol")
            },
            "extracted_data": {
                "financial_items": financial_items,
                "total_items": len(financial_items)
            },
            "analysis": {
                "summary": summary_result,
                "ratios": ratio_result
            },
            "metadata": {
                "file_type": detect_file_type(file_path),
                "content_length": len(context_text),
                "items_extracted": len(financial_items),
                "ai_model": "gemini-2.0-flash-exp",
                "original_filename": uploaded_file.name,
                "processing_steps": {
                    "extraction": "success",
                    "summary": summary_result.get("source", "unknown"),
                    "ratios": ratio_result.get("source", "unknown")
                }
            }
        }
        
        print("✅ Processing completed successfully!")
        print(final_result)
        return JsonResponse(final_result, status=200)
        
    except Exception as e:
        print(f"❌ Processing failed: {e}")
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
        return JsonResponse({"error": f"Processing failed: {str(e)}", "success": False}, status=500)

    finally:
        # Clean up the temporary file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass  # Ignore cleanup errors

# Alternative simpler API endpoint
@csrf_exempt
def extract_data_api(request):
    """
    Legacy endpoint - now calls the main processing function
    """
    return process_financial_statements_api(request)
