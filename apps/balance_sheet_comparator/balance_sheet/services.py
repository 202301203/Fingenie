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


# --- PDF Loading Functions (Following dataprocessor pattern) ---

def load_pdf_robust(pdf_path: str) -> List[Document]:
    """Load PDF with multiple fallback methods."""
    print("Loading PDF...")

    # Attempt 1 — PyPDFLoader
    try:
        if PyPDFLoader is None:
            raise Exception("PyPDFLoader unavailable")

        # Support both callable and non-callable mocks
        loader_obj = PyPDFLoader(pdf_path) if callable(PyPDFLoader) else PyPDFLoader
        docs = loader_obj.load()
        total_chars = sum(len(d.page_content.strip()) for d in docs)
        if total_chars > 2000:
            # Early success path expected by tests
            return docs
        else:
            print(f"Standard extraction poor quality: {total_chars} chars - trying OCR")
    except Exception as e:
        print(f"Standard extraction failed: {e} - trying OCR")

    # Attempt 2 — pdfplumber with OCR fallback
    docs_out: List[Document] = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""
                if len(text.strip()) < 100:
                    try:
                        pil_image = page.to_image().original
                        ocr_text = pytesseract.image_to_string(pil_image)
                        if len(ocr_text.strip()) > len(text.strip()):
                            text = ocr_text
                    except Exception:
                        pass
                if text.strip():
                    docs_out.append(
                        Document(page_content=text, metadata={"page": page_num, "source": pdf_path})
                    )
        return docs_out
    except Exception as e:
        print(f"pdfplumber failed entirely: {e}")
        return []


def prepare_context_smart(documents: List[Document]) -> str:
    """Prepare context with financial focus."""
    all_text = "\n".join([doc.page_content for doc in documents])
    financial_keywords = [
        'balance sheet', 'assets', 'liabilities', 'equity', 'share capital', 
        'reserves', 'current assets', 'non-current assets', 'profit', 'loss', 
        'revenue', 'sales', 'income', 'expenses', 'total', 'crores', 'lakhs', 
        'financial statements', 'consolidated', 'standalone', 'cash', 'inventory',
        'accounts receivable', 'fixed assets', 'intangible assets', 'debt'
    ]
    
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


# --- Pydantic Schema for Balance Sheet Extraction ---

class BalanceSheetItem(BaseModel):
    line_item: str = Field(..., description="The name of the balance sheet line item")
    value: Optional[float] = Field(None, description="The numeric value for this line item")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata like year, currency, etc.")


class BalanceSheetExtractionResult(BaseModel):
    company_name: Optional[str] = Field(None, description="The full legal name of the company")
    fiscal_year_end: Optional[str] = Field(None, description="Fiscal year end date (e.g., '2024-03-31')")
    currency: Optional[str] = Field(None, description="Currency code (e.g., 'INR', 'USD')")
    units: Optional[str] = Field(None, description="Units (e.g., 'lakhs', 'thousands', 'millions')")
    balance_sheet_items: List[BalanceSheetItem] = Field(..., description="List of all balance sheet line items")


# --- Extraction Prompt ---

BALANCE_SHEET_EXTRACTION_PROMPT = """
You are an expert financial analyst specializing in balance sheet extraction. Extract all balance sheet data from the provided document.

**CRITICAL INSTRUCTIONS:**
1. Extract the company name, fiscal year end date, currency, and units (lakhs/thousands/millions)
2. Extract ALL balance sheet line items with their numeric values
3. Normalize numbers: remove commas, convert parentheses to negatives, handle currency symbols (₹, $, etc.)
4. Convert units: if values are in lakhs, convert to base units; if in thousands, note it
5. Extract these specific items if available:
   - Cash and cash equivalents
   - Inventory
   - Accounts receivable
   - Total current assets
   - Total current liabilities
   - Total assets
   - Total liabilities
   - Share capital
   - Reserves and surplus
   - Long-term debt
   - Intangible assets
   - Fixed assets
   - Number of shares outstanding

**NUMBER NORMALIZATION RULES:**
- Remove commas: "1,000" → 1000
- Parentheses = negative: "(500)" → -500
- Currency symbols: "₹1,000" → 1000, "$500" → 500
- Lakhs: "10 lakhs" → 1000000 (10 * 100000)
- Thousands: "10 thousands" → 10000 (10 * 1000)
- Millions: "10 millions" → 10000000 (10 * 1000000)

**OUTPUT FORMAT:**
Return ONLY valid JSON following the BalanceSheetExtractionResult schema. Do not include markdown fences or explanatory text.

DOCUMENT CONTENT:
{context}
"""


def extract_balance_sheet_data(context_text: str, api_key: str) -> Dict[str, Any]:
    """Extract balance sheet data using Google Generative AI."""
    os.environ["GOOGLE_API_KEY"] = api_key
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
            max_retries=3,
            timeout=300,
            response_mime_type="application/json",
            response_schema=BalanceSheetExtractionResult.model_json_schema(),
        )
    except Exception as e:
        print(f"Failed to initialize Gemini model: {e}")
        return {"success": False, "error": f"Failed to initialize Gemini model: {e}"}

    formatted_prompt = BALANCE_SHEET_EXTRACTION_PROMPT.format(context=context_text)
    
    try:
        response = llm.invoke(formatted_prompt)
        response_text = response.content
        
        json_data = json.loads(response_text)
        
        if json_data and 'balance_sheet_items' in json_data:
            return {**json_data, "success": True}
        else:
            return {"success": False, "error": "AI failed to return valid JSON or 'balance_sheet_items' key is missing."}
            
    except Exception as e:
        print(f"Balance sheet extraction failed: {e}")
        return {"success": False, "error": f"Extraction process failed: {e}"}

