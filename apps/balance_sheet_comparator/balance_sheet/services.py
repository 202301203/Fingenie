import os
import json
import re
from typing import List, Optional, Dict, Any

from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.documents import Document
import pdfplumber
import pytesseract
from pydantic import BaseModel, Field


# --- PDF Loading Functions (Following dataprocessor pattern) ---

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
                        # Convert page to image for OCR
                        pil_image = page.to_image(resolution=300).original
                        ocr_text = pytesseract.image_to_string(pil_image)
                        if len(ocr_text.strip()) > len(text.strip()):
                            text = ocr_text
                    except Exception as ocr_e:
                        print(f"OCR failed on page {page_num}: {ocr_e}")

                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={"page": page_num, "source": pdf_path}
                    ))

        print(f"pdfplumber extraction: {len(documents)} pages")
        return documents

    except Exception as e:
        print(f"pdfplumber failed entirely: {e}")
        return []


def prepare_context_smart(documents: List[Document]) -> str:
    """Prepare context with financial focus."""
    all_text = "\n".join([doc.page_content for doc in documents])
    
    # If text is too long, focus on financial sections
    if len(all_text) > 30000:
        # Split into lines and prioritize financial content
        lines = all_text.split('\n')
        financial_lines = []
        other_lines = []
        
        financial_keywords = [
            'balance sheet', 'assets', 'liabilities', 'equity', 'share capital', 
            'reserves', 'current assets', 'non-current assets', 'profit', 'loss', 
            'revenue', 'sales', 'income', 'expenses', 'total', 'crores', 'lakhs', 
            'financial statements', 'consolidated', 'standalone', 'cash', 'inventory',
            'accounts receivable', 'fixed assets', 'intangible assets', 'debt'
        ]
        
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in financial_keywords):
                financial_lines.append(line)
            elif len(line.strip()) > 10:  # Non-empty lines
                other_lines.append(line)
        
        # Combine with priority to financial lines
        if len(financial_lines) > 100:
            context_text = "\n".join(financial_lines[:200] + other_lines[:50])
        else:
            context_text = "\n".join(lines[:500])  # First 500 lines as fallback
    else:
        context_text = all_text

    return context_text[:50000]  # Hard limit


# --- Pydantic Schema for Balance Sheet Extraction ---

class BalanceSheetItem(BaseModel):
    line_item: str = Field(..., description="The name of the balance sheet line item")
    value: Optional[float] = Field(None, description="The numeric value for this line item")


class BalanceSheetExtractionResult(BaseModel):
    company_name: Optional[str] = Field(None, description="The full legal name of the company")
    fiscal_year_end: Optional[str] = Field(None, description="Fiscal year end date")
    currency: Optional[str] = Field(None, description="Currency code (e.g., 'INR', 'USD')")
    units: Optional[str] = Field(None, description="Units (e.g., 'lakhs', 'thousands')")
    balance_sheet_items: List[BalanceSheetItem] = Field(..., description="List of all balance sheet line items")


# --- Extraction Prompt ---

BALANCE_SHEET_EXTRACTION_PROMPT = """
You are an expert financial analyst. Extract all balance sheet data from the provided document.

**KEY INSTRUCTIONS:**
1. Extract company name, fiscal year end, currency, and units
2. Extract ALL balance sheet line items with numeric values
3. Normalize numbers: remove commas, convert parentheses to negatives
4. Convert units: lakhs (×100,000), thousands (×1,000), millions (×1,000,000)

**NUMBER RULES:**
- "1,000" → 1000
- "(500)" → -500
- "10 lakhs" → 1000000
- "10 thousands" → 10000

DOCUMENT:
{context}

Return ONLY valid JSON with this structure:
{{
    "company_name": "Company Name",
    "fiscal_year_end": "2024-03-31",
    "currency": "INR",
    "units": "lakhs",
    "balance_sheet_items": [
        {{
            "line_item": "Cash and cash equivalents",
            "value": 1500000.50
        }}
    ]
}}
"""


def create_gemini_llm(api_key: str, purpose: str = "extraction", model_name: Optional[str] = None):
    """Create a ChatGoogleGenerativeAI LLM with optimized settings.

    model_name can override the default. We default to gemini-1.5-flash but callers
    may pass alternate model names for compatibility with different API versions.
    """
    temperature = 0.1 if purpose == "extraction" else 0.2
    model_to_use = model_name or os.environ.get('GENIE_MODEL') or 'gemini-1.5-flash'

    llm = ChatGoogleGenerativeAI(
        model=model_to_use,
        google_api_key=api_key,
        temperature=temperature,
        max_tokens=8192,
        timeout=120,
        max_retries=3
    )
    return llm


def _simple_text_number(s: str) -> Optional[float]:
    """Convert text like '1,234', '(1,234)', '10 lakhs' into a float value."""
    if not s or not s.strip():
        return None
    s = s.strip()
    # Handle parentheses for negatives
    negative = False
    if s.startswith('(') and s.endswith(')'):
        negative = True
        s = s[1:-1]
    # Units handling
    unit_multiplier = 1
    if re.search(r'\blakhs?\b', s, re.IGNORECASE):
        unit_multiplier = 100000
        s = re.sub(r'\blakhs?\b', '', s, flags=re.IGNORECASE)
    elif re.search(r'\bthousand(s)?\b', s, re.IGNORECASE):
        unit_multiplier = 1000
        s = re.sub(r'\bthousand(s)?\b', '', s, flags=re.IGNORECASE)
    elif re.search(r'\bmillion(s)?\b', s, re.IGNORECASE):
        unit_multiplier = 1000000
        s = re.sub(r'\bmillion(s)?\b', '', s, flags=re.IGNORECASE)

    # Remove commas and non-numeric characters
    num_text = re.sub(r'[^0-9\.\-]', '', s)
    if not num_text:
        return None
    try:
        val = float(num_text) * unit_multiplier
        if negative:
            val = -val
        return val
    except Exception:
        return None


def _deterministic_fallback_extraction(context_text: str) -> Dict[str, Any]:
    """Best-effort extraction by regex heuristics when AI fails.

    Looks for lines containing common balance sheet keywords and numbers.
    """
    lines = [l.strip() for l in context_text.split('\n') if l.strip()]
    candidate_items = []
    keywords = ['cash', 'cash and cash equivalents', 'total assets', 'total liabilities',
                'share capital', 'reserves', 'inventory', 'accounts receivable', 'trade receivables',
                'short-term borrowings', 'long-term borrowings', 'deferred tax', 'property', 'plant', 'equipment',
                'goodwill', 'intangible', 'equity', 'total equity', 'net worth']
    num_pattern = re.compile(r'\(?[\d,]+(?:\.\d+)?\)?(?:\s*(?:lakhs|thousand|thousands|million|crores))?', re.IGNORECASE)

    for line in lines:
        lower = line.lower()
        if any(k in lower for k in keywords):
            m = num_pattern.search(line)
            if m:
                raw_num = m.group()
                val = _simple_text_number(raw_num)
                if val is not None:
                    # pick the text before the number as the label
                    parts = re.split(re.escape(m.group()), line)
                    label = parts[0].strip(' :.-') if parts else line
                    candidate_items.append({
                        'particulars': label[:120],
                        'current_year': val,
                        'previous_year': None
                    })

    # If nothing found with keywords, find any numeric lines and return top matches
    if not candidate_items:
        for line in lines:
            m = num_pattern.search(line)
            if m:
                raw_num = m.group()
                val = _simple_text_number(raw_num)
                if val is not None:
                    label = line[:120]
                    candidate_items.append({
                        'particulars': label,
                        'current_year': val,
                        'previous_year': None
                    })
                    if len(candidate_items) >= 10:
                        break

    return {
        'company_name': None,
        'financial_items': candidate_items,
        'success': True if candidate_items else False,
        'model_used': 'deterministic_fallback'
    }


def extract_raw_financial_data(context_text: str, api_key: str) -> Dict[str, Any]:
    """Extract raw financial data using Gemini (preferred) with structured output.

    If AI extraction fails or models are unavailable, fall back to a simple deterministic
    parser so we can still provide a best-effort comparison to the user.
    """
    try:
        # Try several model candidates until one works (some deployments may not have
        # gemini-1.5-flash available or exposed via v1beta). We attempt fallbacks.
        model_candidates = [
            os.environ.get('GENIE_MODEL'),
            'gemini-1.5-flash',
            'gemini-1.5',
            'text-bison-001',
            'chat-bison',
            'models/text-bison-001'
        ]
        # Filter Nones and duplicates
        seen = set()
        model_candidates = [m for m in model_candidates if m and not (m in seen or seen.add(m))]

        formatted_prompt = BALANCE_SHEET_EXTRACTION_PROMPT.format(context=context_text)

        for model_name in model_candidates:
            try:
                print(f"Attempting extraction using model: {model_name}")
                llm = create_gemini_llm(api_key, "extraction", model_name=model_name)
                structured_llm = llm.with_structured_output(BalanceSheetExtractionResult)
                result = structured_llm.invoke(formatted_prompt)

                # If we get here, extraction succeeded
                print(f"Successfully extracted {len(result.balance_sheet_items)} items using {model_name}")
                return {
                    "company_name": result.company_name,
                    "financial_items": [
                        {
                            "particulars": item.line_item,
                            "current_year": item.value,
                            "previous_year": None
                        }
                        for item in result.balance_sheet_items
                    ],
                    "success": True,
                    "model_used": model_name
                }
            except Exception as e:
                msg = str(e)
                print(f"Model {model_name} failed: {msg}")
                # If it's a model-not-found / 404 type error, try next candidate
                if 'not found' in msg.lower() or '404' in msg.lower() or 'not supported' in msg.lower():
                    continue
                # For other errors (parsing, prompt), attempt a non-structured fallback below
                break

        # If structured output attempts failed, try a plain invoke and parse JSON manually
        try:
            fallback_model = model_candidates[-1] if model_candidates else 'text-bison-001'
            print(f"Structured outputs failed, trying manual extraction with {fallback_model}...")
            llm_basic = create_gemini_llm(api_key, "extraction", model_name=fallback_model)
            response = llm_basic.invoke(formatted_prompt)
            # Try to parse JSON from response content
            text = getattr(response, 'content', str(response))
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return {
                    "company_name": data.get("company_name"),
                    "financial_items": [
                        {
                            "particulars": item.get("line_item", ""),
                            "current_year": item.get("value"),
                            "previous_year": None
                        }
                        for item in data.get("balance_sheet_items", [])
                    ],
                    "success": True,
                    "model_used": fallback_model
                }
        except Exception as e:
            print(f"Manual extraction failed: {e}")

        # As a last resort, use deterministic fallback extraction so the user gets a result
        print("AI extraction failed for all models; running deterministic fallback extractor...")
        deterministic = _deterministic_fallback_extraction(context_text)
        if deterministic.get('success'):
            print(f"Deterministic extractor found {len(deterministic.get('financial_items', []))} items")
            return deterministic

        return {"success": False, "error": "Failed to extract financial data"}

    except Exception as e:
        print(f"Balance sheet extraction failed: {e}")
        return {"success": False, "error": str(e), "financial_items": []}

