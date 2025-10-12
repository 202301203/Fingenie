import os
import json
import re
from typing import List, Optional, Dict, Any

from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema.document import Document
import pdfplumber
import pytesseract
from pydantic import BaseModel, Field

# --- Pydantic Schema for Extracted Data (Step 1) ---
class FinancialItem(BaseModel):
    particulars: str = Field(..., description="Full descriptive name with category, e.g., 'Assets: Current assets: Cash and cash equivalents'")
    current_year: Optional[float] = Field(None, description="The current year's financial amount as a number, or null")
    previous_year: Optional[float] = Field(None, description="The previous year's financial amount as a number, or null")

class FinancialExtractionResult(BaseModel):
    financial_items: List[FinancialItem]

# --- Pydantic Schema for Summary (Step 2) ---
class FinancialSummary(BaseModel):
    pros: List[str] = Field(..., description="List of positive financial or business points, using precise terminology and numbers.")
    cons: List[str] = Field(..., description="List of negative financial or business points, using precise terminology and numbers.")

# --- 2. ROBUST PDF LOADING ---

def load_pdf_robust(pdf_path: str) -> List[Document]:
    """Load PDF with multiple fallback methods."""
    print("Loading PDF...")
    documents = []

    # Method 1: Try PyPDFLoader first (fastest)
    try:
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        total_chars = sum(len(d.page_content.strip()) for d in docs)

        if total_chars > 2000:
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
                # Try text extraction first
                text = page.extract_text() or ""

                if len(text.strip()) < 100:
                    try:
                        from PIL import Image
                        image = page.to_image(resolution=300)
                        # The following line uses the original PIL image from pdfplumber's to_image,
                        # but often explicit conversion is safer:
                        pil_image = Image.frombytes(
                            'RGB', (image.original.width, image.original.height), image.original.tobytes()
                        )
                        ocr_text = pytesseract.image_to_string(pil_image)
                        if len(ocr_text.strip()) > len(text.strip()):
                            text = ocr_text
                    except Exception as ocr_e:
                        print(f" OCR failed on page {page_num}: {ocr_e}")

                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={"page": page_num}
                    ))

        print(f"pdfplumber extraction: {len(documents)} pages")
        return documents

    except Exception as e:
        print(f"pdfplumber failed entirely: {e}")
        return []

# --- 3. SMART CONTEXT PREPARATION (Kept for completeness, though not strictly needed here) ---

def prepare_context_smart(documents: List[Document]) -> str:
    """Prepare context with financial focus (Same as previous version)."""
    # ... (omitted for brevity, assume the original logic is here) ...
    all_text = "\n".join([doc.page_content for doc in documents])
    financial_keywords = ['balance sheet', 'assets', 'liabilities', 'equity', 'share capital', 'reserves', 'current assets', 'non-current assets', 'profit', 'loss', 'revenue', 'sales', 'income', 'expenses', 'total', 'crores', 'lakhs', 'financial statements', 'consolidated', 'standalone']
    
    context_text = all_text
    
    if len(all_text) > 30000:
        chunks = []
        chunk_size = 4000
        for i in range(0, len(all_text), chunk_size):
            chunk = all_text[i:i+chunk_size]
            score = sum(1 for keyword in financial_keywords if keyword.lower() in chunk.lower())
            if score > 2:
                chunks.append(chunk)
        
        if chunks:
            context_text = "\n".join(chunks[:10])
        else:
            context_text = all_text[:25000]

    return context_text

# --- 5. ROBUST EXTRACTION WITH JSON MODE (Step 1) ---

EXTRACTION_PROMPT = """
You are a financial data extraction expert. Extract ALL quantitative financial line items from the Balance Sheet, Profit & Loss Statement, and Cash Flow Statement from the provided document. Return it as valid JSON strictly adhering to the specified schema.

EXTRACTION RULES:
1. Extract ALL financial line items and use descriptive names (e.g., "Assets: Current assets: Cash and cash equivalents").
2. Convert all amounts to numbers (remove currency symbols, Rs., commas). Use **negative numbers** for losses, credits, or items typically shown in parentheses (like tax expense or dividend paid). Do not use parentheses or surrounding quotes for numeric values.
3. Use null if a value is genuinely not available or if the 'particulars' line is a header or purely descriptive without a value.

DOCUMENT CONTENT:
{context}

Return only valid JSON. Do not include any markdown fences (```json) or introductory/explanatory text.
"""

def extract_raw_financial_data(context_text: str, api_key: str) -> Dict[str, Any]:
    """Extract raw data using the LLM in JSON mode."""
    os.environ["GOOGLE_API_KEY"] = api_key
    
    try:
        # Use gemini-2.5-flash for JSON Mode
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            temperature=0,
            max_retries=3,
            request_timeout=300,
            response_mime_type="application/json",
            response_schema=FinancialExtractionResult.model_json_schema(), # <-- FIX APPLIED HERE
        )
    except Exception as e:
        print(f"Failed to initialize Gemini model for extraction: {e}")
        return {"error": f"Failed to initialize Gemini model: {e}"}

    formatted_prompt = EXTRACTION_PROMPT.format(context=context_text)
    
    try:
        response = llm.invoke(formatted_prompt)
        response_text = response.content
        
        # In JSON Mode, the response content is the pure JSON string
        json_data = json.loads(response_text) 
        
        if json_data and 'financial_items' in json_data:
            return {"financial_items": json_data['financial_items'], "success": True}
        else:
            return {"error": "AI failed to return valid JSON or 'financial_items' key is missing."}
            
    except Exception as e:
        print(f"Raw data extraction failed during AI call: {e}")
        return {"error": f"Extraction process failed during AI call: {e}"}

# --- 6. SUMMARY GENERATION (Step 2) ---

SUMMARY_PROMPT = """
You are a world-class financial analyst. Your task is to analyze the provided raw financial data (extracted from an annual report or financial statement) and generate a concise, balanced summary of the business's current standing, focusing on key strengths (Pros) and weaknesses (Cons).

DATA ANALYSIS RULES:
1. Focus on the most significant data points, such as major changes in revenue, profit, asset, or liability line items between 'current_year' and 'previous_year'.
2. Calculate simple metrics like growth rates (e.g., Revenue growth = (Current - Previous) / Previous).
3. If possible, calculate common ratios like Debt-to-Equity, P/E, or Interest Coverage Ratio if the necessary components (EBIT, Interest Expense, etc.) are clearly available in the data.
4. Each Pro or Con should be a single, descriptive sentence that includes the specific financial item, the metric, and the associated number.

Example Output Structure (Do NOT use this exact text unless you calculate the numbers):
Pros
- Revenue from operations grew by X% this year, from $A to $B.
- The company's cash and cash equivalents increased by Y%.

Cons
- Non-current liabilities, specifically Borrowings, increased by Z%.
- Net profit for the year decreased compared to the previous period.

RAW EXTRACTED FINANCIAL DATA (JSON Format):
{financial_data_json}

Generate the analysis and return ONLY the JSON that strictly follows the FinancialSummary schema.
"""

def generate_summary_from_data(financial_items: List[Dict[str, Any]], api_key: str) -> Dict[str, Any]:
    """Generates a structured Pros/Cons summary from the extracted data."""
    os.environ["GOOGLE_API_KEY"] = api_key
    
    # 1. Prepare input JSON string for the summary prompt
    financial_data_json = json.dumps({"financial_items": financial_items}, indent=2)

    # 2. Setup LLM for structured JSON summary
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            temperature=0.2,
            max_retries=3,
            request_timeout=120,
            response_mime_type="application/json",
            response_schema=FinancialSummary.model_json_schema(), # <-- FIX APPLIED HERE
        )
    except Exception as e:
        print(f"Failed to initialize Gemini model for summary: {e}")
        return {"error": "Failed to initialize Gemini model for summary."}

    # 3. Format and invoke prompt
    formatted_prompt = SUMMARY_PROMPT.format(financial_data_json=financial_data_json)

    try:
        print("Sending request to AI for summary analysis...")
        response = llm.invoke(formatted_prompt)
        summary_json = json.loads(response.content)
        
        if 'pros' in summary_json and 'cons' in summary_json:
            return {"summary": summary_json, "success": True}
        else:
            return {"error": "AI summary failed to return Pros/Cons list."}

    except Exception as e:
        print(f"Summary generation failed during AI call: {e}")
        return {"error": f"Summary generation failed: {e}"}
