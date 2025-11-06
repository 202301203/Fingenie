from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
import json
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
        
        print(f"📝 Context prepared: {len(context_text)} characters")
        
        # Step 3: Extract raw financial data
        print("💾 Step 3: Extracting financial data...")
        extraction_result = extract_raw_financial_data(context_text, api_key)
        if not extraction_result.get("success"):
            return JsonResponse(extraction_result, status=500)
        
        financial_items = extraction_result["financial_items"]
        if not financial_items:
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