# Finggenie Project Analysis

## Project Structure

### Backend (Django)
- **Framework**: Django 5.2.6
- **Database**: SQLite3
- **Location**: `Fingenie/` directory

#### Apps Structure:
1. **accounts** - User authentication and account management
2. **dataprocessor** - PDF processing and financial data extraction
3. **stockgraph** - Stock graph visualization
4. **pdf_comparison** - PDF comparison functionality (newly created)

### Frontend (React)
- **Framework**: React 18.3.1
- **Build Tool**: react-scripts (Create React App)
- **Location**: `Fingenie/Frontend/` directory

## Tech Stack

### Backend Technologies:
- **Django** - Web framework
- **LangChain** - LLM integration framework
  - `langchain-google-genai` - Google Gemini integration
  - `langchain-community` - Community integrations
- **PDF Processing**:
  - `pypdf` - PDF text extraction
  - `pdfplumber` - Advanced PDF parsing
  - `pytesseract` - OCR for scanned PDFs
- **Data Processing**:
  - `pydantic` - Data validation
  - `yfinance` - Stock market data
- **Other**:
  - `tabulate` - Table formatting for terminal output
  - `corsheaders` - CORS handling for frontend-backend communication

### Frontend Technologies:
- **Core**:
  - React 18.3.1
  - React Router DOM 6.30.1
- **UI/Visualization**:
  - Chart.js 4.4.0 & react-chartjs-2 5.3.0 - Charting
  - Three.js 0.180.0 - 3D graphics
  - lucide-react 0.548.0 - Icons
- **Authentication**:
  - @react-oauth/google 0.12.2 - Google OAuth
  - jwt-decode 4.0.0 - JWT token handling
- **Utilities**:
  - html2canvas 1.4.1 - HTML to canvas conversion
  - jspdf 3.0.3 - PDF generation
  - date-fns 2.30.0 - Date manipulation

## Key Features

### 1. PDF Data Extraction (`apps/dataprocessor`)
- Robust PDF loading with multiple fallback methods:
  1. PyPDFLoader (primary)
  2. pdfplumber (fallback)
  3. OCR with pytesseract (if text extraction fails)
- AI-powered financial data extraction using Google Gemini
- Extracts:
  - Company name and ticker symbol
  - Financial line items (revenue, profit, assets, liabilities, etc.)
  - Generates pros/cons summary

### 2. PDF Comparison (`apps/pdf_comparison`) - NEW
- Compares two company PDFs across multiple criteria
- Extracts financial metrics from both PDFs
- Displays comparison in terminal with three-column format:
  - Comparison Factor
  - Company A Value
  - Company B Value
- Comparison factors include:
  - Company information (name, ticker)
  - Financial metrics (revenue, profit, assets, liabilities)
  - Calculated ratios (profit margin, debt-to-assets ratio)
  - Extraction quality metrics

### 3. Stock Graph (`apps/stockgraph`)
- Stock market data visualization
- Uses yfinance for stock data

### 4. Frontend Pages
- Authentication flow
- File upload interface
- Main dashboard after login
- News page
- Summary page for financial reports

## Architecture

### Backend Architecture:
```
Fingenie/
├── fingenie_core/          # Django project settings
│   ├── settings.py         # Main configuration
│   ├── urls.py            # Root URL routing
│   └── wsgi.py/asgi.py    # WSGI/ASGI config
├── apps/
│   ├── accounts/          # User management
│   ├── dataprocessor/     # PDF processing
│   │   ├── services.py    # Core extraction logic
│   │   ├── views.py       # API endpoints
│   │   └── utils.py       # Utility functions
│   ├── stockgraph/        # Stock visualization
│   └── pdf_comparison/    # PDF comparison (NEW)
│       ├── comparison.py  # Main comparison logic
│       └── run_comparison.py  # CLI script
└── media/                 # Uploaded files storage
```

### Frontend Architecture:
```
Frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # UI components
│   │   └── Orb.jsx       # 3D orb component
│   ├── pages/            # Page components
│   │   ├── AuthFlow.jsx
│   │   ├── FileUploadApp.jsx
│   │   ├── mainpageafterlogin.jsx
│   │   └── summary_page.jsx
│   └── App.js            # Main app component
└── build/                # Production build
```

## API Endpoints

### Data Processor:
- `POST /extract_data_api/` - Upload PDF and extract financial data
  - Requires: PDF file, API key (optional)
  - Returns: Financial items, company name, ticker, summary

## Environment Variables

- `GOOGLE_API_KEY` or `GENIE_API_KEY` - Google Gemini API key for AI extraction
- Django settings configured for CORS with React frontend (localhost:3000)

## Database

- SQLite3 database (`db.sqlite3`)
- Django ORM for data models

## Development Setup

1. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install frontend dependencies:
   ```bash
   cd Frontend
   npm install
   ```

3. Run Django server:
   ```bash
   python manage.py runserver
   ```

4. Run React development server:
   ```bash
   cd Frontend
   npm start
   ```

## PDF Comparison Usage

The new PDF comparison module can be used as follows:

```bash
# From project root
python apps/pdf_comparison/run_comparison.py <pdf1> <pdf2> [api_key]
```

Or programmatically:
```python
from apps.pdf_comparison.comparison import PDFComparison

comparator = PDFComparison()
result = comparator.compare_pdfs("company_a.pdf", "company_b.pdf")
comparator.display_comparison(result)
```

