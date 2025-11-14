from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import os

def create_sample_financial_statement(
    output_path: str,
    company_name: str,
    fiscal_year: str,
    financial_data: dict
):
    """Create a sample financial statement PDF."""
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    normal_style = styles['Normal']
    
    # Content elements
    elements = []
    
    # Add company name and fiscal year
    elements.append(Paragraph(company_name, title_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Financial Statement for {fiscal_year}", normal_style))
    elements.append(Spacer(1, 24))
    
    # Format financial data for tables
    def format_number(num):
        if isinstance(num, (int, float)):
            return f"₹ {num:,.2f}"
        return str(num)
    
    # Income Statement
    elements.append(Paragraph("Income Statement", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    income_data = [
        ["Item", "Amount"],
        ["Revenue", format_number(financial_data['revenue'])],
        ["Cost of Goods Sold", format_number(financial_data['cogs'])],
        ["Gross Profit", format_number(financial_data['revenue'] - financial_data['cogs'])],
        ["Operating Expenses", format_number(financial_data['operating_expense'])],
        ["Operating Income", format_number(financial_data['revenue'] - financial_data['cogs'] - financial_data['operating_expense'])],
        ["Interest Expense", format_number(financial_data['interest_expense'])],
        ["Tax Expense", format_number(financial_data['tax_expense'])],
        ["Net Income", format_number(financial_data['net_income'])]
    ]
    
    income_table = Table(income_data, colWidths=[4*inch, 2*inch])
    income_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(income_table)
    elements.append(Spacer(1, 20))
    
    # Balance Sheet
    elements.append(Paragraph("Balance Sheet", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    balance_data = [
        ["Item", "Amount"],
        ["Total Assets", format_number(financial_data['total_assets'])],
        ["Cash and Equivalents", format_number(financial_data['cash_and_equivalents'])],
        ["Inventory", format_number(financial_data['inventory'])],
        ["Total Liabilities", format_number(financial_data['total_liabilities'])],
        ["Shareholders' Equity", format_number(financial_data['shareholders_equity'])]
    ]
    
    balance_table = Table(balance_data, colWidths=[4*inch, 2*inch])
    balance_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(balance_table)
    elements.append(Spacer(1, 20))
    
    # Cash Flow
    elements.append(Paragraph("Cash Flow Statement", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    cash_flow_data = [
        ["Item", "Amount"],
        ["Operating Cash Flow", format_number(financial_data['operating_cash_flow'])],
        ["Investing Cash Flow", format_number(financial_data['investing_cash_flow'])],
        ["Financing Cash Flow", format_number(financial_data['financing_cash_flow'])],
        ["Capital Expenditure", format_number(financial_data['capex'])]
    ]
    
    cash_flow_table = Table(cash_flow_data, colWidths=[4*inch, 2*inch])
    cash_flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(cash_flow_table)
    
    # Build PDF
    doc.build(elements)

if __name__ == "__main__":
    # Sample data for two companies
    
    # Company A - A larger, more profitable company
    company_a_data = {
        'revenue': 1000000000,  # 1000 crore
        'cogs': 600000000,      # 600 crore
        'operating_expense': 200000000,  # 200 crore
        'interest_expense': 20000000,    # 20 crore
        'tax_expense': 45000000,         # 45 crore
        'net_income': 135000000,         # 135 crore
        'total_assets': 2000000000,      # 2000 crore
        'cash_and_equivalents': 300000000,  # 300 crore
        'inventory': 250000000,          # 250 crore
        'total_liabilities': 800000000,  # 800 crore
        'shareholders_equity': 1200000000,  # 1200 crore
        'operating_cash_flow': 180000000,   # 180 crore
        'investing_cash_flow': -120000000,  # -120 crore
        'financing_cash_flow': -40000000,   # -40 crore
        'capex': 100000000,              # 100 crore
    }
    
    # Company B - A smaller company with lower margins
    company_b_data = {
        'revenue': 500000000,   # 500 crore
        'cogs': 350000000,      # 350 crore
        'operating_expense': 100000000,  # 100 crore
        'interest_expense': 15000000,    # 15 crore
        'tax_expense': 8750000,          # 8.75 crore
        'net_income': 26250000,          # 26.25 crore
        'total_assets': 800000000,       # 800 crore
        'cash_and_equivalents': 100000000,  # 100 crore
        'inventory': 150000000,          # 150 crore
        'total_liabilities': 500000000,  # 500 crore
        'shareholders_equity': 300000000,   # 300 crore
        'operating_cash_flow': 50000000,    # 50 crore
        'investing_cash_flow': -40000000,   # -40 crore
        'financing_cash_flow': -5000000,    # -5 crore
        'capex': 35000000,               # 35 crore
    }
    
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(__file__), 'test_data')
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate PDFs
    create_sample_financial_statement(
        os.path.join(output_dir, 'company_a.pdf'),
        "TechCorp Solutions Ltd.",
        "FY 2024-25",
        company_a_data
    )
    
    create_sample_financial_statement(
        os.path.join(output_dir, 'company_b.pdf'),
        "InnovativeTech Industries Ltd.",
        "FY 2024-25",
        company_b_data
    )
    
    print("Sample PDFs created successfully in the test_data directory!")
    print("Company A: TechCorp Solutions Ltd. - A larger, more profitable company")
    print("Company B: InnovativeTech Industries Ltd. - A smaller company with lower margins")