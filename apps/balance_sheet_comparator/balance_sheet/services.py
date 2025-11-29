import os
import json
import re
from typing import List, Optional, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from langchain_core.documents import Document

from pydantic import BaseModel, Field

import logging

logger = logging.getLogger(__name__)

# --- PDF Loading Functions ---

def load_pdf(pdf_path: str) -> List["Document"]:
    """Load PDF with multiple fallback methods."""
    # Import optional dependencies lazily and handle missing packages gracefully
    try:
        from langchain_community.document_loaders import PyPDFLoader
    except Exception:
        PyPDFLoader = None

    try:
        from langchain_core.documents import Document
    except Exception:
        # Minimal fallback Document-like object used when langchain isn't available
        class Document:  # type: ignore
            def __init__(self, page_content: str, metadata: dict):
                self.page_content = page_content
                self.metadata = metadata

    # Defer optional heavy imports until needed (pdfplumber/pytesseract)
    # so tests that mock PyPDFLoader can run without these packages installed.

    logger.info("Loading PDF...")
    documents = []

    # Method 1: Try PyPDFLoader first (fastest) if available
    if PyPDFLoader is not None:
        try:
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            total_chars = sum(len(d.page_content.strip()) for d in docs)

            if total_chars > 2000:
                logger.info(f"Standard extraction successful: {len(docs)} pages, {total_chars} chars")
                return docs
            else:
                logger.warning(f"Standard extraction poor quality: {total_chars} chars - trying OCR")
        except Exception as e:
            logger.warning(f"Standard extraction failed: {e} - trying OCR")
    else:
        logger.info("PyPDFLoader not available; skipping that extraction method.")

    # Method 2: pdfplumber with OCR fallback (import lazily)
    try:
        import pdfplumber  # type: ignore
        import pytesseract  # type: ignore

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
                        logger.warning(f"OCR failed on page {page_num}: {ocr_e}")

                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={"page": page_num, "source": pdf_path}
                    ))

        logger.info(f"pdfplumber extraction: {len(documents)} pages")
        return documents

    except Exception as e:
        logger.error(f"pdfplumber failed entirely: {e}")
        return []


def prepare_context(documents: List["Document"]) -> str:
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
    from langchain_google_genai import ChatGoogleGenerativeAI

    temperature = 0.1 if purpose == "extraction" else 0.2
    model_to_use = model_name or os.environ.get('GENIE_MODEL') or 'gemini-2.5-flash'

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
    # Handle parentheses for negatives and leading minus
    negative = False
    if s.startswith('(') and s.endswith(')'):
        negative = True
        s = s[1:-1]
    s = s.strip()
    if s.startswith('-'):
        negative = True
        s = s[1:]

    # Normalize common currency symbols and spaces
    s = re.sub(r'[₹$€,\s]+', ' ', s).strip()

    # Units handling (support plural/synonym forms)
    multipliers = {
        'lakh': 100_000,
        'lakhs': 100_000,
        'lacs': 100_000,
        'thousand': 1_000,
        'thousands': 1_000,
        'million': 1_000_000,
        'millions': 1_000_000,
        'mn': 1_000_000,
        'crore': 10_000_000,
        'crores': 10_000_000,
        'cr': 10_000_000
    }

    unit_multiplier = 1
    s_lower = s.lower()
    for unit, mult in multipliers.items():
        if re.search(rf'\b{re.escape(unit)}\b', s_lower):
            unit_multiplier = mult
            s = re.sub(rf'\b{re.escape(unit)}\b', '', s, flags=re.IGNORECASE).strip()
            break

    # Remove any remaining non-numeric characters except dot
    num_text = re.sub(r'[^0-9\.]', '', s)
    if not num_text:
        return None

    try:
        val = float(num_text) * unit_multiplier
        return -val if negative else val
    except ValueError:
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
    # Match numbers like (1,234.56), 1,234, 5.5 million, ₹ 1,000,000, -500
    num_pattern = re.compile(r"\(?[-₹$€]?\s*[\d,]+(?:\.\d+)?\)?(?:\s*(?:lakhs?|lacs?|thousands?|millions?|mn|crores?|cr)\b)?", re.IGNORECASE)

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
        # Validate API key
        if not api_key or api_key.strip() == '':
            logger.error("API key is empty or None")
            logger.warning("Running deterministic fallback extractor due to missing API key...")
            deterministic = _deterministic_fallback_extraction(context_text)
            return deterministic
        
        logger.info(f"API Key provided: {api_key[:20]}...")
        
        # Try several model candidates until one works
        model_candidates = [
            os.environ.get('GENIE_MODEL'),
            'gemini-2.0-flash-lite',
            'gemini-2.0-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro-latest',
            'gemini-1.5-pro',
            'gemini-pro',
        ]
        # Filter Nones and duplicates
        model_candidates = list(dict.fromkeys(filter(None, model_candidates)))
        
        logger.info(f"Model candidates to try: {model_candidates}")

        formatted_prompt = BALANCE_SHEET_EXTRACTION_PROMPT.format(context=context_text)

        for model_name in model_candidates:
            try:
                logger.info(f"Attempting extraction using model: {model_name}")
                llm = create_gemini_llm(api_key, "extraction", model_name=model_name)
                logger.info(f"LLM created successfully for {model_name}")
                
                structured_llm = llm.with_structured_output(BalanceSheetExtractionResult)
                logger.info(f"Invoking structured LLM for {model_name}...")
                result = structured_llm.invoke(formatted_prompt)

                # If we get here, extraction succeeded
                logger.info(f"Successfully extracted {len(result.balance_sheet_items)} items using {model_name}")
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
                logger.warning(f"Model {model_name} failed: {msg}")
                # If it's a model-not-found / 404 type error, try next candidate
                if any(x in msg.lower() for x in ['not found', '404', 'not supported']):
                    logger.info(f"Model {model_name} not available, trying next...")
                    continue
                # For other errors (parsing, prompt), attempt a non-structured fallback below
                logger.error(f"Non-404 error for {model_name}, attempting manual extraction...")
                break

        # If structured output attempts failed, try a plain invoke and parse JSON manually
        try:
            fallback_model = model_candidates[-1] if model_candidates else 'gemini-1.5-flash'
            logger.info(f"Structured outputs failed, trying manual extraction with {fallback_model}...")
            llm_basic = create_gemini_llm(api_key, "extraction", model_name=fallback_model)
            logger.info(f"Invoking basic LLM for manual extraction...")
            response = llm_basic.invoke(formatted_prompt)
            # Try to parse JSON from response content
            text = getattr(response, 'content', str(response))
            logger.info(f"Response received, parsing JSON...")
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                logger.info(f"Manual extraction successful: {len(data.get('balance_sheet_items', []))} items")
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
            else:
                logger.warning(f"No JSON found in response for manual extraction")
        except Exception as e:
            logger.error(f"Manual extraction failed: {e}")
            import traceback
            logger.error(traceback.format_exc())

        # As a last resort, use deterministic fallback extraction so the user gets a result
        logger.warning("AI extraction failed for all models; running deterministic fallback extractor...")
        deterministic = _deterministic_fallback_extraction(context_text)
        if deterministic.get('success'):
            logger.info(f"Deterministic extractor found {len(deterministic.get('financial_items', []))} items")
            return deterministic

        return {"success": False, "error": "Failed to extract financial data"}

    except Exception as e:
        logger.error(f"Balance sheet extraction failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"success": False, "error": str(e), "financial_items": []}

