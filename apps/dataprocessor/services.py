import os
import json
import re
import logging
import pandas as pd
import pdfplumber
import pytesseract
from typing import List, Optional, Dict, Any, Literal

from langchain_community.document_loaders import PyPDFLoader, UnstructuredExcelLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.documents import Document
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# --- Pydantic Schema for Extracted Data (Step 1) ---
class FinancialItem(BaseModel):
    particulars: str = Field(..., description="Full descriptive name with category, e.g., 'Assets: Current assets: Cash and cash equivalents'")
    current_year: Optional[float] = Field(None, description="The current year's financial amount as a number, or null")
    previous_year: Optional[float] = Field(None, description="The previous year's financial amount as a number, or null")

class FinancialExtractionResult(BaseModel):
    company_name: Optional[str] = Field(None, description="The full legal name of the company.")
    ticker_symbol: Optional[str] = Field(None, description="The stock market ticker symbol, including the exchange suffix if available (e.g., RELIANCE.NS, MSFT).")
    financial_items: List[FinancialItem]

# --- Pydantic Schema for Summary (Step 2) ---
class FinancialSummary(BaseModel):
    pros: List[str] = Field(..., description="List of positive financial or business points, using precise terminology and numbers.")
    cons: List[str] = Field(..., description="List of negative financial or business points, using precise terminology and numbers.")
    financial_health_summary: str = Field(..., description="Overall assessment of company's financial health based on the aggregate pros and cons, providing a big-picture view of strengths and concerns.")

class RatioItem(BaseModel):
    ratio_name: Literal[
        "Current Ratio", 
        "Quick Ratio", 
        "Debt to Equity Ratio", 
        "Asset Turnover Ratio", 
        "Return on Assets (ROA)", 
        "Return on Equity (ROE)"
    ] = Field(..., description="Name of the financial ratio")
    formula: str = Field(..., description="Formula used for calculation")
    calculation: str = Field(..., description="Step-by-step calculation")
    result: float = Field(..., description="Numeric result of the ratio")
    interpretation: str = Field(..., description="One-line interpretation of the ratio")

class FinancialRatios(BaseModel):
    financial_ratios: List[RatioItem] = Field(..., description="List of calculated financial ratios")

# --- FILE DETECTION AND LOADING ---

def detect_file_type(file_path: str) -> str:
    """Detect if file is PDF or Excel."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return 'pdf'
    elif ext in ['.xlsx', '.xls', '.csv']:
        return 'excel'
    else:
        raise ValueError(f"Unsupported file format: {ext}")

def load_financial_document(file_path: str) -> List[Document]:
    """Load financial document from PDF or Excel."""
    file_type = detect_file_type(file_path)
    
    if file_type == 'pdf':
        return load_pdf_robust(file_path)
    else:
        return load_excel_file(file_path)

def load_excel_file(file_path: str) -> List[Document]:
    """Load Excel file and convert to text format."""
    try:
        loader = UnstructuredExcelLoader(file_path)
        docs = loader.load()
        if docs and len(docs[0].page_content.strip()) > 100:
            return docs
    except Exception as e:
        print(f"UnstructuredExcelLoader failed: {e}, trying pandas fallback")

    # Fallback: Use pandas to read and convert to text
    try:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(file_path)
        else:  # .xlsx, .xls
            df = pd.read_excel(file_path)
        
        # Convert DataFrame to readable text
        text_content = "FINANCIAL STATEMENT DATA:\n\n"
        for col in df.columns:
            text_content += f"{col}: "
            # Get first few non-null values for each column
            values = df[col].dropna().head(10).astype(str).tolist()
            text_content += " | ".join(values) + "\n"
        
        return [Document(page_content=text_content, metadata={"source": file_path})]
    except Exception as e:
        print(f"Pandas loading failed: {e}")
        return [Document(page_content="", metadata={"source": file_path})]

# --- ROBUST PDF LOADING ---

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
                        pil_image = page.to_image().original
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

# --- SMART CONTEXT PREPARATION ---

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
            'financial statements', 'consolidated', 'standalone', 'cash flow',
            'statement', 'account', 'financial', 'fiscal year', 'auditor'
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

# --- GEMINI 2.5 FLASH CONFIGURATION ---

def create_gemini_llm(api_key: str, purpose: str = "extraction"):
    """Create Gemini 2.5 Flash LLM with optimized settings."""
    temperature = 0.1 if purpose == "extraction" else 0.2
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=temperature,
        max_tokens=8192,  # Increased for better responses
        timeout=120,
        max_retries=3
    )
    return llm

# --- ROBUST EXTRACTION WITH JSON MODE ---

EXTRACTION_PROMPT = """
You are an expert financial analyst with deep expertise in extracting financial data from statements. Your task is to accurately identify and extract all financial line items with their values.

*CRITICAL PRIORITIES:*
1. *COMPANY IDENTIFICATION*: First, find the full legal company name and stock ticker symbol
   - For Indian stocks: Add .NS suffix (e.g., RELIANCE.NS, TCS.NS)
   - For US stocks: Use standard symbol (e.g., AAPL, MSFT)
   - For other markets: Use appropriate exchange suffix
   - If not found, set to null

2. *FINANCIAL DATA EXTRACTION*: Extract ALL financial line items with complete hierarchical structure
   - Preserve the full category path (e.g., "Assets: Current Assets: Cash and Cash Equivalents")
   - Convert all amounts to pure numbers (remove commas, currency symbols)
   - Use negative numbers for losses, expenses, or amounts in parentheses
   - Use null for genuinely missing values

3. *FINANCIAL CATEGORIES TO FOCUS ON*:
   - ASSETS: Current Assets, Non-Current Assets, Fixed Assets, Investments, Cash
   - LIABILITIES: Current Liabilities, Non-Current Liabilities, Borrowings, Provisions
   - EQUITY: Share Capital, Reserves, Retained Earnings
   - INCOME: Revenue, Sales, Other Income
   - EXPENSES: Cost of Goods Sold, Operating Expenses, Finance Costs
   - PROFIT/LOSS: Gross Profit, Operating Profit, Net Profit
   - CASH FLOW: Operating Activities, Investing Activities, Financing Activities

*DATA PROCESSING RULES:*
- Convert "1,00,000" to 100000
- Convert "(50,000)" to -50000
- Convert "NIL" or "-" to null
- Preserve decimal points for accuracy
- Maintain the exact descriptive names from the document

*DOCUMENT CONTENT:*
{context}

Return ONLY valid JSON that strictly follows the specified schema. No additional text or explanations.
"""

def extract_raw_financial_data(context_text: str, api_key: str) -> Dict[str, Any]:
    """Extract raw data using Gemini 2.5 Flash with structured output."""
    try:
        llm = create_gemini_llm(api_key, "extraction")
        
        print("Using Gemini 2.5 Flash for financial data extraction...")
        
        # Use structured output for reliable JSON
        structured_llm = llm.with_structured_output(FinancialExtractionResult)
        formatted_prompt = EXTRACTION_PROMPT.format(context=context_text)
        
        print("Extracting financial data with AI...")
        result = structured_llm.invoke(formatted_prompt)
        
        print(f"✅ Successfully extracted {len(result.financial_items)} financial items")
        
        return {
            "company_name": result.company_name,
            "ticker_symbol": result.ticker_symbol,
            "financial_items": [
                {
                    "particulars": item.particulars,
                    "current_year": item.current_year,
                    "previous_year": item.previous_year
                }
                for item in result.financial_items
            ],
            "success": True
        }
        
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        # Fallback to manual extraction
        return extract_financial_data_manual(context_text, api_key)

def extract_financial_data_manual(context_text: str, api_key: str) -> Dict[str, Any]:
    """Manual extraction fallback using Gemini 2.5 Flash."""
    try:
        llm = create_gemini_llm(api_key, "extraction")
        
        manual_prompt = f"""
        {EXTRACTION_PROMPT.format(context=context_text)}
        
        Return ONLY valid JSON in this exact format:
        {{
            "company_name": "Company Name or null",
            "ticker_symbol": "TICKER.NS or null", 
            "financial_items": [
                {{
                    "particulars": "Assets: Current Assets: Cash and Cash Equivalents",
                    "current_year": 1500000.50,
                    "previous_year": 1200000.75
                }},
                {{
                    "particulars": "Liabilities: Current Liabilities: Trade Payables",
                    "current_year": 500000.25,
                    "previous_year": 450000.00
                }}
            ]
        }}
        """
        
        print("Using manual extraction fallback...")
        response = llm.invoke(manual_prompt)
        content = response.content.strip()
        
        # Clean the response
        content = re.sub(r'^json\s*', '', content)
        content = re.sub(r'\s*$', '', content)
        content = content.strip()
        
        # Parse JSON
        data = json.loads(content)
        
        # Validate structure
        if isinstance(data, dict) and 'financial_items' in data:
            print(f"✅ Manual extraction successful: {len(data['financial_items'])} items")
            return {
                "company_name": data.get('company_name'),
                "ticker_symbol": data.get('ticker_symbol'),
                "financial_items": data.get('financial_items', []),
                "success": True
            }
        else:
            return {"error": "Invalid JSON structure in response", "success": False}
            
    except Exception as e:
        print(f"❌ Manual extraction failed: {e}")
        return {"error": f"Extraction failed: {str(e)}", "success": False}

# --- SUMMARY GENERATION ---

SUMMARY_PROMPT = """
As a senior financial analyst, analyze the extracted financial data and provide a comprehensive assessment.

*ANALYSIS REQUIREMENTS:*

1. *PROS (Strengths)*: 
   - Identify positive financial trends and strengths
   - Include specific numbers, percentages, and comparisons
   - Focus on revenue growth, profitability, asset quality, liquidity

2. *CONS (Weaknesses)*:
   - Identify concerning financial trends and weaknesses
   - Include specific numbers, percentages, and comparisons
   - Focus on declining metrics, high liabilities, cash flow issues

3. *FINANCIAL HEALTH SUMMARY*:
   - Provide an overall assessment of the company's financial health
   - Synthesize the key findings from pros and cons
   - Mention the most significant strengths and critical concerns
   - Give a big-picture view of the company's financial position

*ANALYSIS GUIDELINES:*
- Be specific and quantitative - always include numbers
- Calculate percentage changes where possible: ((Current - Previous) / Previous) * 100
- Focus on material items that significantly impact financial health
- Maintain objective, professional tone
- Base conclusions strictly on the provided data

*FINANCIAL DATA:*
{financial_data_json}
"""

def generate_summary_from_data(financial_items: List[Dict[str, Any]], api_key: str) -> Dict[str, Any]:
    """Generates a structured Pros/Cons summary using Gemini 2.5 Flash."""
    try:
        llm = create_gemini_llm(api_key, "summary")
        
        financial_data_json = json.dumps({"financial_items": financial_items}, indent=2)
        formatted_prompt = SUMMARY_PROMPT.format(financial_data_json=financial_data_json)

        print("Generating financial summary with Gemini 2.5 Flash...")
        
        structured_llm = llm.with_structured_output(FinancialSummary)
        result = structured_llm.invoke(formatted_prompt)
        
        print(f"✅ Summary generated: {len(result.pros)} pros, {len(result.cons)} cons")
        
        return {
            "pros": result.pros,
            "cons": result.cons,
            "financial_health_summary": result.financial_health_summary,
            "success": True
        }

    except Exception as e:
        print(f"❌ Summary generation failed: {e}")
        return {"error": f"Summary generation failed: {str(e)}", "success": False}

# --- RATIO CALCULATION ---

RATIO_PROMPT = """
As a financial analyst, calculate key financial ratios from the provided data and interpret their meaning.

*RATIOS TO CALCULATE:*
1. Current Ratio = Current Assets / Current Liabilities
2. Quick Ratio = (Current Assets - Inventory) / Current Liabilities  
3. Debt to Equity Ratio = Total Debt / Shareholders' Equity
4. Asset Turnover Ratio = Revenue / Total Assets
5. Return on Assets (ROA) = Net Income / Total Assets
6. Return on Equity (ROE) = Net Income / Shareholders' Equity

*FOR EACH RATIO, PROVIDE:*
- *Formula*: The exact formula used
- *Calculation*: Step-by-step calculation with actual numbers from the data
- *Result*: Numeric result (round to 2 decimal places)
- *Interpretation*: One-line explanation of what the ratio indicates about the company

*CALCULATION RULES:*
- Use the most recent year's data (current_year)
- If exact line items aren't available, use the closest reasonable substitutes
- Clearly state any assumptions made in calculations
- If data is insufficient, explain what's missing

*FINANCIAL DATA:*
{financial_data_json}
"""

def generate_ratios_from_data(financial_items: List[Dict[str, Any]], api_key: str) -> Dict[str, Any]:
    """Generates financial ratios using Gemini 2.5 Flash."""
    try:
        llm = create_gemini_llm(api_key, "ratios")
        
        financial_data_json = json.dumps({"financial_items": financial_items}, indent=2)
        formatted_prompt = RATIO_PROMPT.format(financial_data_json=financial_data_json)

        print("Calculating financial ratios with Gemini 2.5 Flash...")
        
        structured_llm = llm.with_structured_output(FinancialRatios)
        result = structured_llm.invoke(formatted_prompt)
        
        print(f"✅ Ratios calculated: {len(result.financial_ratios)} ratios")
        
        return {
            "financial_ratios": [
                {
                    "ratio_name": ratio.ratio_name,
                    "formula": ratio.formula,
                    "calculation": ratio.calculation,
                    "result": ratio.result,
                    "interpretation": ratio.interpretation
                }
                for ratio in result.financial_ratios
            ],
            "success": True
        }

    except Exception as e:
        print(f"❌ Ratio calculation failed: {e}")
        return {"error": f"Ratio calculation failed: {str(e)}", "success": False}

# --- MAIN PROCESSING FUNCTION ---

def process_financial_statements(file_path: str, google_api_key: str) -> Dict[str, Any]:
    """
    Main function to process financial statements from PDF or Excel files using Gemini 2.5 Flash.
    
    Args:
        file_path: Path to PDF or Excel file
        google_api_key: Google Gemini API key
        
    Returns:
        Dictionary containing extracted data, summary, and ratios
    """
    print(f"🚀 Processing financial statements from: {file_path}")
    print(f"📊 Using Gemini 2.5 Flash for AI analysis...")
    
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}", "success": False}
    
    try:
        # Step 1: Load document
        print("📄 Step 1: Loading document...")
        documents = load_financial_document(file_path)
        if not documents or not any(doc.page_content.strip() for doc in documents):
            return {"error": "No readable content found in document", "success": False}
        
        # Step 2: Prepare context
        print("🔍 Step 2: Preparing context...")
        context_text = prepare_context_smart(documents)
        if len(context_text.strip()) < 100:
            return {"error": "Insufficient financial content found", "success": False}
        
        print(f"📝 Context prepared: {len(context_text)} characters")
        
        # Step 3: Extract raw financial data
        print("💾 Step 3: Extracting financial data...")
        extraction_result = extract_raw_financial_data(context_text, google_api_key)
        if not extraction_result.get("success"):
            return extraction_result
        
        # Step 4: Generate summary
        print("📈 Step 4: Generating financial summary...")
        summary_result = generate_summary_from_data(
            extraction_result["financial_items"], 
            google_api_key
        )
        
        # Step 5: Calculate ratios
        print("🧮 Step 5: Calculating financial ratios...")
        ratio_result = generate_ratios_from_data(
            extraction_result["financial_items"],
            google_api_key
        )
        
        # Compile final result
        final_result = {
            "success": True,
            "company_info": {
                "company_name": extraction_result.get("company_name"),
                "ticker_symbol": extraction_result.get("ticker_symbol")
            },
            "extracted_data": extraction_result,
            "summary": summary_result,
            "ratios": ratio_result,
            "metadata": {
                "file_type": detect_file_type(file_path),
                "content_length": len(context_text),
                "items_extracted": len(extraction_result.get("financial_items", [])),
                "ai_model": "gemini-2.5-flash"
            }
        }
        
        print("✅ Processing completed successfully!")
        return final_result
        
    except Exception as e:
        print(f"Processing failed: {e}")
        return {"error": f"Processing failed: {str(e)}", "success": False}
    
# Add this to your services.py

def ensure_service_response_structure(response: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure service responses have consistent structure"""
    if not isinstance(response, dict):
        return {"success": False, "error": "Invalid response format"}
    
    if "success" not in response:
        response["success"] = True  # Assume success if not specified
    
    return response
