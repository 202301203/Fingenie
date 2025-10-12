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
import cv2
import unicodedata
import re
import json
import numpy as np
import pandas as pd
from pdf2image import convert_from_bytes
from concurrent.futures import ThreadPoolExecutor
from rapidfuzz import process, fuzz
from apps.dataprocessor.services import perform_comparative_analysis

# ===========================
# CONFIG
# ===========================
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

BALANCE_KEYWORDS = ["balance sheet", "equity", "assets", "liabilities", "reserves"]
PL_KEYWORDS = ["profit and loss", "statement of profit", "revenue", "expenses", "income", "eps", "earning"]
OTHER_KEYWORDS = ["cash flow", "fund flow"]
KEEP_KEYWORDS = BALANCE_KEYWORDS + PL_KEYWORDS + OTHER_KEYWORDS

CANONICAL_TERMS = [
    "Share capital", "Reserves and surplus", "Money received against share warrants",
    "Share application money pending allotment", "Long-term borrowings",
    "Deferred tax liabilities (net)", "Other long-term liabilities", "Long-term provisions",
    "Short-term borrowings", "Trade payables", "Other current liabilities", "Short-term provisions",
    "Total equity and liabilities", "Total liabilities", "Total assets", "Fixed assets",
    "Property, plant and equipment", "Tangible assets", "Intangible assets",
    "Capital work in progress", "Non-current investments", "Deferred tax assets (net)",
    "Long-term loans and advances", "Other non-current assets", "Inventories",
    "Trade receivables", "Cash and cash equivalents", "Bank balances",
    "Current investments", "Other current assets", "Revenue from operations",
    "Other income", "Total revenue", "Cost of materials consumed",
    "Employee benefit expense", "Finance costs", "Depreciation and amortisation expense",
    "Other expenses", "Total expenses", "Profit before tax", "Tax expense",
    "Profit for the period", "Earnings per equity share - Basic", "Earnings per equity share - Diluted"
]

REPLACEMENTS = {
    "fights": "fixed", "onziais": "intangibles", "atnbutable": "attributable",
    "owneinr": "owner", "franca": "financial", "nor-": "non-",
    "curert": "current", "curent": "current", "come tac": "deferred tax",
    "tac": "tax", "dhi": "dividend", "dividenddend": "dividend",
    "purchose": "purchase", "eens ad nengie": "assets and intangible",
    "itaogble": "intangible", "fnaneal": "financial", "noe": "non"
}

STOPWORDS = [
    "cin", "registered office", "committee", "approved", "statement of",
    "audited", "unaudited", "balance sheet as of", "profit and loss",
    "cash flow", "quarter ended", "march", "january", "may", "date"
]

UNIT = "crore"
SCALE_MAP = {"crore": 1e7, "lakh": 1e5, "million": 1e6, "unit": 1.0}

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

# ===========================
# MAIN FUNCTION
# ===========================
def process_financial_file(file):
    """
    Accepts a file (PDF), processes OCR, parses financial data,
    returns cleaned JSON ready for frontend
    """
    # Convert PDF to images in memory
    pages = convert_from_bytes(file.read(), dpi=200)
    
    balance_rows, pl_rows, other_rows = [], [], []

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(process_page, enumerate(pages, start=1)))

    for section, rows in results:
        if section == "balance":
            balance_rows.extend(rows)
        elif section == "pl":
            pl_rows.extend(rows)
        elif section == "other":
            other_rows.extend(rows)

    output = {
        "balance_sheet": rows_to_json(balance_rows),
        "profit_loss": rows_to_json(pl_rows)
    }

    final_data = {}
    for key in output.keys():
        final_data[key] = clean_section(output[key])

    # Optional: comparative analysis
    items_list = final_data["balance_sheet"]["financial_items"]
    result = perform_comparative_analysis(items_list)

    return {"comparative_analysis": result}
