import os
import json
import mimetypes
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
#from apps.dataprocessor.services import perform_comparative_analysis, generate_comparative_pls

# 1️⃣ Create Gemini LLM (optimized for extraction + summarization)
def create_gemini_llm(api_key: str):
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.1,
        max_output_tokens=16384,  # larger output window
    )

# 2️⃣ Detect file type and load content
def load_file_content(file_path: str) -> tuple[str, bytes | str]:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        with open(file_path, "rb") as f:
            return "pdf", f.read()
    elif ext in [".xlsx", ".xls", ".csv"]:
        try:
            if ext == ".csv":
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path, sheet_name=None)
                if isinstance(df, dict):
                    df = pd.concat(df.values(), ignore_index=True)
            text = "FINANCIAL DATA (EXCEL):\n" + df.to_csv(index=False)
            return "excel", text
        except Exception as e:
            print(f"❌ Excel load failed: {e}")
            return "excel", ""
    else:
        raise ValueError(f"Unsupported file: {ext}")

# 3️⃣ Optimized AI Extraction, Summary, and Ratios — single Gemini call
def ai_extract_all(file_path: str, api_key: str):
    llm = create_gemini_llm(api_key)
    file_type, file_content = load_file_content(file_path)

    # Unified prompt
    unified_prompt = """
    You are a senior financial analyst.
    Analyze the attached financial document (PDF or Excel). It may be scanned or digital.

    TASKS:
    1️⃣ Extract all structured financial data:
        - Identify sections: Balance Sheet, Profit & Loss (P&L)
        - For each item: {"particulars": str, "current_year": float|null, "previous_year": float|null}
        - Fix commas, parentheses, and nulls correctly

    2️⃣ Summarize key findings:
        - "pros": positive financial aspects
        - "cons": negative or risky aspects
        - "financial_health_summary": one-paragraph evaluation

    3️⃣ Compute key ratios (using extracted data if possible):
        - Current Ratio, Quick Ratio, Debt-to-Equity, ROA, ROE, Asset Turnover
        - Include formula, calculation, result, and 1-line interpretation

    RETURN STRICT JSON ONLY:
    {
      "balance_sheet": [...],
      "pl_sheet": [...],
      "summary": {
         "pros": [...],
         "cons": [...],
         "financial_health_summary": "..."
      },
      "ratios": [
         {"ratio_name": str, "formula": str, "calculation": str, "result": float, "interpretation": str}
      ]
    }
    """

    print("⚡ Using Gemini for unified extraction + summary + ratios...")

    # Build input
    if file_type == "pdf":
        response = llm.invoke(
            [
                {"role": "system", "content": "You are a financial document parser."},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": unified_prompt},
                        {"type": "file", "mime_type": "application/pdf", "data": file_content},
                    ],
                },
            ]
        )
    else:
        response = llm.invoke(f"{unified_prompt}\n\n{file_content}")

    # Parse output JSON safely
    try:
        output_text = response.content.strip()
        if output_text.startswith("```json"):
            output_text = output_text.strip("```json").strip("```").strip()
        data = json.loads(output_text)
        print("✅ AI extraction successful!")
        return data
    except Exception as e:
        print(f"❌ Failed to parse JSON: {e}")
        print(f"Raw output snippet: {response.content[:300]}")
        return {"balance_sheet": [], "pl_sheet": [], "summary": {}, "ratios": []}

# 4️⃣ Main unified processor (compatible with your project)
def process_financial_statements(file_path: str, api_key: str):
    """
    Fully AI-based, single-call Gemini pipeline:
    - Extracts financial data
    - Generates summary
    - Computes ratios
    - Performs comparative analysis
    """
    print(f"🚀 Processing {os.path.basename(file_path)} with Gemini 2.5 Flash...")

    ai_result = ai_extract_all(file_path, api_key)

    # Extract sections
    balance_items = ai_result.get("balance_sheet", [])
    pl_items = ai_result.get("pl_sheet", [])
    summary_data = ai_result.get("summary", {})
    ratio_data = ai_result.get("ratios", [])

    # Comparative analysis (your existing logic)
    result_bs = perform_comparative_analysis(balance_items)
    result_pl = generate_comparative_pls(pl_items)

    return {
        "success": True,
        "balance_sheet": result_bs,
        "pl_sheet": result_pl,
        "summary": summary_data,
        "ratios": ratio_data,
        "metadata": {
            "ai_model": "gemini-2.5-flash",
            "file_name": os.path.basename(file_path),
            "num_items_bs": len(balance_items),
            "num_items_pl": len(pl_items),
        },
    }

# ✅ Example usage
if __name__ == "__main__":
    file_path = r"D:\Academics\SEM V\Software_Engineering\Project\Fingenie\apps\dataprocessor\Tata_2024.pdf"
    api_key = "YOUR_GOOGLE_API_KEY"

    result = process_financial_statements(file_path, api_key)

    print("\n✅ Summary:")
    print(json.dumps(result["metadata"], indent=2))
    print("\n📈 Financial Health Summary:")
    print(result["summary"].get("financial_health_summary", ""))
