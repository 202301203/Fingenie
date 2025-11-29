# Fingenie: AI-Powered Financial Statement Analyzer

Fingenie is a Django-based financial analysis tool that transforms complex financial statements into clear, actionable insights. Upload PDFs or Excel files containing balance sheets and financial data, and receive AI-generated summaries with KPIs, risk assessments, and trend analysis—all in plain language.

---

## Problem Statement

Understanding financial statements can be challenging, especially for non-finance professionals or students. This project provides a solution by allowing users to upload PDFs or Excel files containing balance sheets and other financial statements. The system uses AI to generate clear, plain-language summaries of the data. It highlights important trends, key performance indicators (KPIs), and potential risks using simple explanations and visual charts. This makes financial insights accessible quickly, helping users make informed decisions without needing deep financial expertise.

---

## Tech Stack

### Backend
- Python
- Django
- Django REST Framework
- File Processing Libraries (PyPDF2, openpyxl, pandas)

### Frontend
- HTML/CSS/JavaScript
- Bootstrap / Tailwind CSS
- Chart.js for visualizations

---

## Setup & Running Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/202301203/Fingenie.git
cd Fingenie
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```


## Running the Application

### 1. Apply Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

---

## Team Members

| Name | Student ID |
|------|------------|
| TANDEL DHRUVINEE DINESHKUMAR | 202301203 |
| MEET RUPESH GANDHI | 202301219 |
| PRIYANKA GARG | 202301262 |
| JAYADITYA SHAH | 202301254 |
| CHHABHAYA MANAN KETANBHAI | 202301222 |
| GAADHE JAYANSH MANUBHAI | 202301232 |
| VORA KRESHA MANOJBHAI | 202301231 |
| RATHOD AJAYKUMAR VALLABHBHAI | 202301221 |
| CHAUDHARI RUTU RAHUL | 202301235 |
| NAKUM AYUSH VIJAYBHAI | 202301233 |

---

## Notes
- Ensure Python 3.8+ is installed
- For production deployment, set `DEBUG=False` and configure proper database settings
- Upload file size limits can be configured in Django settings
