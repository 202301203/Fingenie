# ===============================
# GOOGLE COLAB SETUP - RUN THIS FIRST
# ===============================

# Install required packages
!pip install -q langchain-google-genai langchain-community pdfplumber pytesseract pydantic
pip install pypdf
# Install system dependencies for OCR (if needed)
!apt-get install -qq tesseract-ocr

# Import required libraries
import os
import json
from pydantic import BaseModel, Field
from typing import List, Optional
import time

# Check if we're in Colab
try:
    from google.colab import files, drive
    IN_COLAB = True
    print("✅ Running in Google Colab")
except ImportError:
    IN_COLAB = False
    print("⚠ Not running in Google Colab")

# LangChain Imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema.document import Document

# OCR libraries
import pdfplumber
import pytesseract

# ===============================
# 1. Define Pydantic Schema for Structured Output
# ===============================

class FinancialItem(BaseModel):
    """A single financial item with current and previous year values."""
    particulars: str = Field(description="The name of the financial item (e.g., 'Total Revenue', 'Equity Share Capital').")
    current_year: Optional[float] = Field(description="The value for the current year (can be null if not found).")
    previous_year: Optional[float] = Field(description="The value for the previous year (can be null if not found).")
    currency_unit: Optional[str] = Field(description="The unit of currency (e.g., 'Crores of Rupees', 'Lakhs of Rupees', 'Thousands of Rupees', 'Rupees').", default=None)

class BalanceSheet(BaseModel):
    """Extracted Balance Sheet items."""
    financial_items: List[FinancialItem]
    currency_unit: Optional[str] = Field(description="Overall currency unit for the balance sheet (e.g., 'Crores of Rupees').", default=None)

class ProfitLoss(BaseModel):
    """Extracted Profit & Loss items."""
    financial_items: List[FinancialItem]
    currency_unit: Optional[str] = Field(description="Overall currency unit for the profit & loss statement (e.g., 'Crores of Rupees').", default=None)

class FinancialDataExtraction(BaseModel):
    """The root object containing both Balance Sheet and Profit & Loss data."""
    balance_sheet: BalanceSheet
    profit_loss: ProfitLoss

# ===============================
# 2. PDF Upload and Setup
# ===============================

def setup_pdf_file():
    """Handle PDF file upload in Colab or local path."""
    pdf_path = None
    
    if IN_COLAB:
        print("📁 Please upload your PDF file:")
        uploaded = files.upload()
        
        if uploaded:
            # Get the first uploaded file
            filename = list(uploaded.keys())[0]
            pdf_path = f"/content/{filename}"
            print(f"✅ Uploaded: {filename}")
        else:
            print("❌ No file uploaded")
            return None
    else:
        # For local development
        pdf_path = input("Enter the path to your PDF file: ").strip()
    
    return pdf_path

def setup_api_key():
    """Setup Google Gemini API key."""
    if IN_COLAB:
        # In Colab, you can use Colab's built-in secrets or input
        try:
            from google.colab import userdata
            api_key = userdata.get('GOOGLE_API_KEY')  # Set this in Colab secrets
            print("✅ API key loaded from Colab secrets")
        except:
            api_key = input("🔑 Enter your Google Gemini API key: ").strip()
    else:
        api_key = input("🔑 Enter your Google Gemini API key: ").strip()
    
    os.environ["GOOGLE_API_KEY"] = api_key
    return api_key

# Setup files and API
pdf_path = setup_pdf_file()
if not pdf_path:
    raise ValueError("No PDF file provided!")

api_key = setup_api_key()
if not api_key:
    raise ValueError("No API key provided!")

print(f"Using PDF: {pdf_path}")

# ===============================
# 3. Enhanced PDF Loading Function
# ===============================

def load_pdf_with_fallback(pdf_path):
    """Load PDF with OCR fallback if needed."""
    docs = []
    
    print("📖 Loading PDF...")
    
    # First attempt: Standard PDF text extraction
    try:
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        print(f"✅ Loaded {len(docs)} pages using standard extraction")
    except Exception as e:
        print(f"⚠ Standard PDF loader failed: {e}")

    # Check if we got meaningful content
    total_text = sum(len(d.page_content.strip()) for d in docs)
    print(f"📄 Total text extracted: {total_text} characters")
    
    if total_text < 100:  # If very little text extracted
        print("🔍 PDF appears scanned. Attempting OCR...")
        docs = []  # Reset docs for OCR
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages, 1):
                    print(f"Processing page {i}/{len(pdf.pages)}", end="...")
                    
                    # Try text extraction first
                    text = page.extract_text() or ""
                    
                    # If extracted text is too short, try OCR
                    if len(text.strip()) < 50:
                        try:
                            im = page.to_image(resolution=150).original
                            ocr_text = pytesseract.image_to_string(im)
                            if len(ocr_text.strip()) > len(text.strip()):
                                text = ocr_text
                            print(" OCR applied")
                        except Exception as ocr_e:
                            print(f" OCR failed: {ocr_e}")
                    else:
                        print(" text extracted")
                    
                    if text.strip():
                        docs.append(Document(page_content=text, metadata={"page": i}))
                        
            print(f"✅ OCR processed {len(docs)} pages")
            
        except Exception as e:
            print(f"❌ OCR fallback failed: {e}")

    if not docs or sum(len(d.page_content.strip()) for d in docs) == 0:
        raise ValueError("❌ No readable text found in PDF!")
    
    return docs

# ===============================
# 4. Load and Process PDF
# ===============================

docs = load_pdf_with_fallback(pdf_path)
print(f"✅ Successfully loaded {len(docs)} pages")

# Show a sample of the content
sample_text = docs[0].page_content[:500] if docs else ""
print(f"\n📋 Sample content preview:\n{sample_text}...\n")

# ===============================
# 5. Process Text for Financial Extraction
# ===============================

def prepare_context(docs):
    """Prepare context text from documents."""
    all_text = "\n\n".join([doc.page_content for doc in docs if doc.page_content.strip()])
    
    # Financial keywords to identify relevant content
    financial_keywords = [
        'balance sheet', 'profit', 'loss', 'revenue', 'sales', 'income',
        'assets', 'liabilities', 'equity', 'expenses', 'cash flow',
        'financial statement', 'consolidated', 'standalone', 'current year',
        'previous year', 'total', 'net profit', 'gross profit', 'crores',
        'lakhs', 'thousands', 'rupees', 'rs.', '₹', 'inr'
    ]
    
    # If text is too long, split and find relevant chunks
    if len(all_text) > 40000:
        print("📊 Text is long, finding financial content...")
        splitter = RecursiveCharacterTextSplitter(chunk_size=4000, chunk_overlap=400)
        chunks = splitter.split_text(all_text)
        
        # Score chunks based on financial keywords
        chunk_scores = []
        for i, chunk in enumerate(chunks):
            score = sum(1 for keyword in financial_keywords if keyword.lower() in chunk.lower())
            chunk_scores.append((score, i, chunk))
        
        # Sort by score and take top chunks
        chunk_scores.sort(reverse=True, key=lambda x: x[0])
        top_chunks = [chunk for score, i, chunk in chunk_scores[:6] if score > 0]
        
        if top_chunks:
            context_text = "\n\n".join(top_chunks)
            print(f"✅ Selected {len(top_chunks)} relevant chunks")
        else:
            # Fallback to first few chunks
            context_text = "\n\n".join(chunks[:4])
            print("⚠ No highly relevant chunks found, using first 4 chunks")
    else:
        context_text = all_text
        print("✅ Using full document text")
    
    print(f"📝 Final context length: {len(context_text)} characters")
    return context_text

context_text = prepare_context(docs)

# ===============================
# 6. Setup LLM with Structured Output
# ===============================

print("🤖 Setting up AI model...")

llm_base = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp",
    temperature=0,
    max_retries=2,
    request_timeout=120  # Longer timeout for Colab
)

# Apply structured output
llm = llm_base.with_structured_output(FinancialDataExtraction)

print("✅ AI model ready")

# ===============================
# 7. Enhanced Prompt Template
# ===============================

prompt_template = """
You are an expert financial analyst specializing in Indian financial statements. Extract financial data from the provided document context.

EXTRACTION RULES:
1. Look for Balance Sheet items: Assets, Liabilities, Equity, Share Capital, Reserves, Current Assets, Non-current Assets, etc.
2. Look for Profit & Loss items: Revenue, Sales, Income, Expenses, Profit, Loss, EBITDA, Operating Profit, etc.
3. Extract numerical values with their proper labels
4. Look for current year and previous year columns (often labeled as different financial years like 2023-24, 2022-23)
5. Only extract explicitly mentioned items - do not calculate or infer values
6. If a value is not clearly stated, set it as null

CURRENCY UNIT DETECTION:
- Pay special attention to currency units mentioned in the document
- Common Indian units: "Crores of Rupees", "Lakhs of Rupees", "Thousands of Rupees", "Rupees"
- Look for phrases like "All figures in Crores except per share data", "₹ in Crores", "Rs. in Lakhs", etc.
- If currency unit is mentioned at statement level, apply it to the overall statement
- If different items have different units, specify at item level

NUMBER FORMATTING:
- Remove currency symbols (₹, Rs., INR) and commas from numbers
- Keep only numerical values (including decimals)
- Preserve negative values with minus sign

DOCUMENT CONTEXT:
{context}

Extract all financial data following the provided schema structure. Pay special attention to currency units and ensure they are captured accurately.
"""

# ===============================
# 8. Main Extraction Function
# ===============================

def extract_financial_data(context_text):
    """Extract financial data with error handling and currency unit detection."""
    print("🔍 Starting financial data extraction...")
    
    # First, let's detect currency units in the context
    currency_patterns = [
        r'(?i)all figures.?in\s(crores?|lakhs?|thousands?)\s*(?:of\s*)?(?:rupees?|rs\.?|₹|inr)',
        r'(?i)₹\s*in\s*(crores?|lakhs?|thousands?)',
        r'(?i)rs\.?\s*in\s*(crores?|lakhs?|thousands?)',
        r'(?i)\(\s*in\s*(crores?|lakhs?|thousands?)\s*(?:of\s*)?(?:rupees?|rs\.?|₹|inr)?\s*\)',
        r'(?i)figures?\s*(?:are\s*)?in\s*(crores?|lakhs?|thousands?)\s*(?:of\s*)?(?:rupees?|rs\.?|₹|inr)?'
    ]
    
    detected_currency = None
    for pattern in currency_patterns:
        import re
        match = re.search(pattern, context_text)
        if match:
            unit = match.group(1).lower()
            if 'crore' in unit:
                detected_currency = "Crores of Rupees"
            elif 'lakh' in unit:
                detected_currency = "Lakhs of Rupees"  
            elif 'thousand' in unit:
                detected_currency = "Thousands of Rupees"
            break
    
    if detected_currency:
        print(f"💰 Detected currency unit: {detected_currency}")
    else:
        print("💰 No specific currency unit detected, will extract from context")
    
    try:
        # Add delay to avoid rate limiting
        time.sleep(2)
        
        formatted_prompt = prompt_template.format(context=context_text)
        print("📤 Sending request to AI model...")
        
        response = llm.invoke(formatted_prompt)
        print("✅ AI extraction complete")
        
        return response
        
    except Exception as e:
        print(f"❌ Initial extraction failed: {e}")
        
        # Try with shorter context
        if len(context_text) > 15000:
            print("🔄 Retrying with shorter context...")
            shorter_context = context_text[:12000] + "\n\n[Content truncated for processing]"
            formatted_prompt = prompt_template.format(context=shorter_context)
            
            time.sleep(3)  # Longer delay for retry
            response = llm.invoke(formatted_prompt)
            print("✅ Retry successful")
            return response
        else:
            raise

# ===============================
# 9. Run Extraction and Save Results
# ===============================

try:
    # Extract data
    result_pydantic = extract_financial_data(context_text)
    
    # Convert to dictionary
    if hasattr(result_pydantic, 'model_dump'):
        result = result_pydantic.model_dump()
    else:
        result = result_pydantic.dict()
    
    # Pretty print results
    result_json_string = json.dumps(result, indent=2)
    print("\n" + "="*50)
    print("📊 EXTRACTION RESULTS")
    print("="*50)
    print(result_json_string)
    
    # Save to file
    output_filename = "financials_extracted.json"
    with open(output_filename, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✅ Results saved to: {output_filename}")
    
    # In Colab, also offer to download
    if IN_COLAB:
        print("\n📥 Downloading results file...")
        files.download(output_filename)
    
    # Print summary with currency information
    balance_sheet_items = len(result.get('balance_sheet', {}).get('financial_items', []))
    profit_loss_items = len(result.get('profit_loss', {}).get('financial_items', []))
    
    bs_currency = result.get('balance_sheet', {}).get('currency_unit', 'Not specified')
    pl_currency = result.get('profit_loss', {}).get('currency_unit', 'Not specified')
    
    print(f"\n📈 EXTRACTION SUMMARY:")
    print(f"   Balance Sheet items: {balance_sheet_items}")
    print(f"   Balance Sheet currency: {bs_currency}")
    print(f"   Profit & Loss items: {profit_loss_items}")
    print(f"   Profit & Loss currency: {pl_currency}")
    print(f"   Total items extracted: {balance_sheet_items + profit_loss_items}")
    
    # Show sample items if available
    if balance_sheet_items > 0:
        sample_bs = result['balance_sheet']['financial_items'][0]
        print(f"\n📊 Sample Balance Sheet item:")
        print(f"   {sample_bs.get('particulars', 'N/A')}: {sample_bs.get('current_year', 'N/A')}")
        if sample_bs.get('currency_unit'):
            print(f"   Unit: {sample_bs['currency_unit']}")
    
    if profit_loss_items > 0:
        sample_pl = result['profit_loss']['financial_items'][0]
        print(f"\n💰 Sample Profit & Loss item:")
        print(f"   {sample_pl.get('particulars', 'N/A')}: {sample_pl.get('current_year', 'N/A')}")
        if sample_pl.get('currency_unit'):
            print(f"   Unit: {sample_pl['currency_unit']}")

except Exception as e:
    print(f"\n❌ EXTRACTION FAILED: {e}")
    print("\nPossible issues:")
    print("1. API quota exceeded - wait and try again")
    print("2. PDF content not suitable for extraction")
    print("3. Network connectivity issues")
    print("4. Invalid API key")
    
    # Create empty fallback file
    fallback_result = {
        "balance_sheet": {"financial_items": []},
        "profit_loss": {"financial_items": []},
        "error": str(e)
    }
    
    with open("financials_extracted.json", "w") as f:
        json.dump(fallback_result, f, indent=2)
    
    print("\n📄 Created empty structure file for reference")

print("\n🎉 Process completed!")
