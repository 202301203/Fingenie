# ===============================
# ROBUST FINANCIAL PDF EXTRACTOR - WORKS WITH ALL PDF TYPES
# ===============================

# Install packages
!pip install -q google-generativeai langchain-google-genai langchain-community pdfplumber pytesseract pydantic pypdf pillow

print("Dependencies installed successfully!")

# Import required libraries
import os
import json
import time
import re
from typing import List, Optional

# Check if we're in Colab
try:
    from google.colab import files
    IN_COLAB = True
    print("Running in Google Colab")
except ImportError:
    IN_COLAB = False
    print("Running locally")

# Core imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema.document import Document
import pdfplumber
import pytesseract

# ===============================
# 1. SIMPLE SETUP
# ===============================

def setup_files():
    """Setup PDF and API key."""
    if IN_COLAB:
        print("Upload your PDF file:")
        uploaded = files.upload()
        pdf_path = f"/content/{list(uploaded.keys())[0]}"
    else:
        pdf_path = input("Enter PDF path: ").strip()
    
    # API Key
    api_key = input("Enter Gemini API key: ").strip()
    os.environ["GOOGLE_API_KEY"] = api_key
    
    return pdf_path

pdf_path = setup_files()
print(f"Using PDF: {pdf_path}")

# ===============================
# 2. ROBUST PDF LOADING
# ===============================

def load_pdf_robust(pdf_path):
    """Load PDF with multiple fallback methods."""
    print("Loading PDF...")
    documents = []
    
    # Method 1: Try PyPDFLoader first (fastest)
    try:
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        total_chars = sum(len(d.page_content.strip()) for d in docs)
        
        if total_chars > 2000:  # Good text extraction
            print(f"Standard extraction successful: {len(docs)} pages, {total_chars} chars")
            return docs
        else:
            print(f"Standard extraction poor quality: {total_chars} chars - trying OCR")
    except Exception as e:
        print(f"Standard extraction failed: {e} - trying OCR")
    
    # Method 2: pdfplumber with OCR fallback
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Processing page {page_num}/{len(pdf.pages)}...", end="")
                
                # Try text extraction first
                text = page.extract_text() or ""
                
                # If text is minimal, use OCR
                if len(text.strip()) < 100:
                    try:
                        image = page.to_image(resolution=300)
                        ocr_text = pytesseract.image_to_string(image.original)
                        if len(ocr_text.strip()) > len(text.strip()):
                            text = ocr_text
                        print(" OCR")
                    except:
                        print(" OCR failed")
                else:
                    print(" Text")
                
                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={"page": page_num}
                    ))
        
        print(f"pdfplumber extraction: {len(documents)} pages")
        return documents
        
    except Exception as e:
        print(f"pdfplumber failed: {e}")
        return []

# Load the PDF
documents = load_pdf_robust(pdf_path)
if not documents:
    raise ValueError("Failed to extract any text from PDF!")

# ===============================
# 3. SMART CONTEXT PREPARATION
# ===============================

def prepare_context_smart(documents):
    """Prepare context with financial focus."""
    print("Preparing context...")
    
    # Combine all text
    all_text = "\n".join([doc.page_content for doc in documents])
    
    # Financial keywords for filtering
    financial_keywords = [
        'balance sheet', 'assets', 'liabilities', 'equity', 'share capital',
        'reserves', 'current assets', 'non-current assets', 'profit', 'loss',
        'revenue', 'sales', 'income', 'expenses', 'total', 'crores', 'lakhs',
        'financial statements', 'consolidated', 'standalone'
    ]
    
    # If text is too long, smart filtering
    if len(all_text) > 30000:
        print("Large document - applying smart filtering...")
        
        # Split and score chunks
        chunks = []
        chunk_size = 4000
        for i in range(0, len(all_text), chunk_size):
            chunk = all_text[i:i+chunk_size]
            score = sum(1 for keyword in financial_keywords 
                       if keyword.lower() in chunk.lower())
            if score > 2:  # Only keep chunks with financial content
                chunks.append(chunk)
        
        if chunks:
            context_text = "\n".join(chunks[:10])  # Top 10 chunks
            print(f"Selected {len(chunks[:10])} relevant chunks")
        else:
            context_text = all_text[:25000]  # Fallback
            print("Using first 25k characters as fallback")
    else:
        context_text = all_text
        print("Using full document")
    
    print(f"Context ready: {len(context_text)} characters")
    return context_text

context_text = prepare_context_smart(documents)

# ===============================
# 4. SIMPLE LLM WITHOUT STRUCTURED OUTPUT
# ===============================

def setup_simple_llm():
    """Setup simple LLM without structured output complications."""
    print("Setting up AI model...")
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        temperature=0,
        max_retries=3,
        request_timeout=120
    )
    
    # Test the LLM
    test_response = llm.invoke("Say 'Hello'")
    print("AI model ready and tested!")
    return llm

llm = setup_simple_llm()

# ===============================
# 5. ROBUST EXTRACTION WITH JSON PARSING
# ===============================

EXTRACTION_PROMPT = """
You are a financial data extraction expert. Extract financial data from the provided document and return it as valid JSON.

IMPORTANT: Return ONLY valid JSON in this exact format:
{{
    "financial_items": [
        {{
            "particulars": "Full descriptive name with category",
            "current_year": number_or_null,
            "previous_year": number_or_null
        }}
    ]
}}

EXTRACTION RULES:
1. Extract ALL financial line items from Balance Sheet and P&L
2. Use descriptive names like "Assets: Current assets: Cash and cash equivalents"
3. Convert all amounts to numbers (remove ₹, Rs., commas)
4. Include current year and previous year values
5. Use null if value is not available

DOCUMENT CONTENT:
{context}

Return only valid JSON. No explanations or additional text.
"""

def extract_with_json_parsing(llm, context_text):
    """Extract financial data with robust JSON parsing."""
    print("Starting financial data extraction...")
    
    try:
        # Format prompt
        formatted_prompt = EXTRACTION_PROMPT.format(context=context_text)
        
        print("Sending request to AI...")
        response = llm.invoke(formatted_prompt)
        
        # Handle different response types
        response_text = ""
        if hasattr(response, 'content'):
            response_text = response.content
        elif isinstance(response, str):
            response_text = response
        else:
            response_text = str(response)
        
        print(f"Received response of length: {len(response_text)}")
        print("Response preview:", response_text[:200])
        
        # Extract JSON from response
        json_data = extract_json_from_text(response_text)
        
        if json_data and 'financial_items' in json_data:
            items = json_data['financial_items']
            print(f"Successfully extracted {len(items)} financial items")
            return json_data
        else:
            print("No valid financial items found in response")
            return {"financial_items": []}
            
    except Exception as e:
        print(f"Extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return {"financial_items": []}

def extract_json_from_text(text):
    """Extract JSON object from text response."""
    try:
        # Try direct JSON parsing first
        return json.loads(text)
    except:
        pass
    
    try:
        # Find JSON object in text
        start_idx = text.find('{')
        if start_idx == -1:
            return None
        
        # Find matching closing brace
        brace_count = 0
        end_idx = start_idx
        
        for i, char in enumerate(text[start_idx:], start_idx):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
        
        if brace_count == 0:
            json_str = text[start_idx:end_idx]
            return json.loads(json_str)
        else:
            return None
            
    except Exception as e:
        print(f"JSON extraction failed: {e}")
        return None

# ===============================
# 6. EXECUTE EXTRACTION
# ===============================

print("="*60)
print("STARTING FINANCIAL DATA EXTRACTION")
print("="*60)

# Extract financial data
result = extract_with_json_parsing(llm, context_text)

# Display results
print("\n" + "="*50)
print("EXTRACTION RESULTS")
print("="*50)

if result and result.get('financial_items'):
    # Format output nicely
    formatted_result = json.dumps(result, indent=4, ensure_ascii=False)
    print(formatted_result)
    
    # Save results
    output_file = "financial_extraction_results.json"
    with open(output_file, "w", encoding='utf-8') as f:
        json.dump(result, f, indent=4, ensure_ascii=False)
    
    print(f"\nResults saved to: {output_file}")
    
    # Download in Colab
    if IN_COLAB:
        files.download(output_file)
    
    # Summary
    num_items = len(result['financial_items'])
    print(f"\nSUMMARY:")
    print(f"Total financial items extracted: {num_items}")
    
    # Show first few items
    if num_items > 0:
        print("\nFirst few items:")
        for i, item in enumerate(result['financial_items'][:5], 1):
            print(f"{i}. {item['particulars']}")
            print(f"   Current: {item.get('current_year', 'N/A')}")
            print(f"   Previous: {item.get('previous_year', 'N/A')}")
    
    print(f"\nSUCCESS! Extracted {num_items} financial items from PDF")
else:
    print("No financial items were extracted. Possible reasons:")
    print("1. PDF contains no financial statements")
    print("2. Text quality is too poor (try better OCR)")
    print("3. Financial data is in non-standard format")
    print("4. API issues or context too large")
    
    # Save empty result for debugging
    with open("debug_extraction.json", "w") as f:
        json.dump({
            "financial_items": [],
            "debug_info": {
                "pages_processed": len(documents),
                "context_length": len(context_text),
                "has_financial_keywords": any(keyword in context_text.lower() 
                    for keyword in ['balance', 'asset', 'liability', 'revenue', 'profit'])
            }
        }, f, indent=4)
    
    print("Debug info saved to debug_extraction.json")

print("\nProcess completed!")
