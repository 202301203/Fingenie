import yfinance as yf
import pandas as pd
import math
import logging
import numpy as np
import requests
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from django.utils.dateparse import parse_date
from django.utils import timezone
from .models import CompanySearch, FinancialStatementCache
from .serializers import (
    CompanySearchSerializer, ComprehensiveFinancialDataSerializer,
    BalanceSheetSerializer, IncomeStatementSerializer, CashFlowSerializer,
    StockPriceSerializer, CompanyInfoSerializer
)
from .utils import clean_financial_data

# Set up logger
logger = logging.getLogger(__name__)

class SearchSuggestionsView(APIView):
    """
    Get company search suggestions using yfinance with Indian companies support
    """
    
    def get(self, request):
        query = request.GET.get('q', '').strip().upper()
        
        if not query or len(query) < 1:
            return Response(
                {"error": "Query parameter 'q' is required and should be at least 1 character"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Try yfinance first for exact matches
            suggestions = self.get_yfinance_suggestions(query)
            
            # If no results from yfinance, use our enhanced database
            if not suggestions:
                suggestions = self.get_enhanced_suggestions(query)
            
            return Response(suggestions[:10])  # Limit to 10 suggestions
            
        except Exception as e:
            logger.error(f"Error searching for {query}: {str(e)}")
            return Response(self.get_enhanced_suggestions(query))
    
    def get_yfinance_suggestions(self, query):
        """Get suggestions using yfinance"""
        suggestions = []
        
        try:
            # Try direct symbol lookup
            ticker = yf.Ticker(query)
            info = ticker.info
            
            if info and info.get('symbol'):
                company_data = {
                    'symbol': info.get('symbol', query),
                    'name': info.get('longName', info.get('shortName', query)),
                    'exchange': info.get('exchange', 'N/A'),
                    'sector': info.get('sector', 'N/A'),
                    'industry': info.get('industry', 'N/A'),
                    'country': info.get('country', 'N/A')
                }
                suggestions.append(company_data)
                
        except Exception as e:
            logger.debug(f"yfinance lookup failed for {query}: {str(e)}")
            
        return suggestions
    
    def get_enhanced_suggestions(self, query):
        """Enhanced suggestions database with US and Indian companies"""
        query_lower = query.lower()
        
        # Comprehensive stock database with US and Indian companies
        all_companies = [
            # US Companies (Nasdaq/NYSE)
            {'symbol': 'AAPL', 'name': 'Apple Inc.', 'exchange': 'NASDAQ', 'country': 'USA'},
            {'symbol': 'MSFT', 'name': 'Microsoft Corporation', 'exchange': 'NASDAQ', 'country': 'USA'},
            {'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'exchange': 'NASDAQ', 'country': 'USA'},
            {'symbol': 'AMZN', 'name': 'Amazon.com Inc.', 'exchange': 'NASDAQ', 'country': 'USA'},
            {'symbol': 'TSLA', 'name': 'Tesla Inc.', 'exchange': 'NASDAQ', 'country': 'USA'},
            {'symbol': 'META', 'name': 'Meta Platforms Inc.', 'exchange': 'NASDAQ', 'country': 'USA'},
            {'symbol': 'NVDA', 'name': 'NVIDIA Corporation', 'exchange': 'NASDAQ', 'country': 'USA'},
            {'symbol': 'JPM', 'name': 'JPMorgan Chase & Co.', 'exchange': 'NYSE', 'country': 'USA'},
            {'symbol': 'JNJ', 'name': 'Johnson & Johnson', 'exchange': 'NYSE', 'country': 'USA'},
            {'symbol': 'V', 'name': 'Visa Inc.', 'exchange': 'NYSE', 'country': 'USA'},
            {'symbol': 'PG', 'name': 'Procter & Gamble', 'exchange': 'NYSE', 'country': 'USA'},
            {'symbol': 'UNH', 'name': 'UnitedHealth Group', 'exchange': 'NYSE', 'country': 'USA'},
            {'symbol': 'HD', 'name': 'Home Depot Inc.', 'exchange': 'NYSE', 'country': 'USA'},
            {'symbol': 'DIS', 'name': 'Walt Disney Company', 'exchange': 'NYSE', 'country': 'USA'},
            
            # Indian Companies (NSE/BSE)
            {'symbol': 'RELIANCE.NS', 'name': 'Reliance Industries Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'TCS.NS', 'name': 'Tata Consultancy Services Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'INFY.NS', 'name': 'Infosys Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'HDFCBANK.NS', 'name': 'HDFC Bank Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'HINDUNILVR.NS', 'name': 'Hindustan Unilever Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'ICICIBANK.NS', 'name': 'ICICI Bank Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'SBIN.NS', 'name': 'State Bank of India', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'BHARTIARTL.NS', 'name': 'Bharti Airtel Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'KOTAKBANK.NS', 'name': 'Kotak Mahindra Bank Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'ITC.NS', 'name': 'ITC Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'LT.NS', 'name': 'Larsen & Toubro Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'AXISBANK.NS', 'name': 'Axis Bank Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'BAJFINANCE.NS', 'name': 'Bajaj Finance Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'ASIANPAINT.NS', 'name': 'Asian Paints Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'MARUTI.NS', 'name': 'Maruti Suzuki India Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'SUNPHARMA.NS', 'name': 'Sun Pharmaceutical Industries Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'TITAN.NS', 'name': 'Titan Company Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'ULTRACEMCO.NS', 'name': 'UltraTech Cement Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'WIPRO.NS', 'name': 'Wipro Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'NESTLEIND.NS', 'name': 'Nestlé India Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'HCLTECH.NS', 'name': 'HCL Technologies Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'DMART.NS', 'name': 'Avenue Supermarts Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'BAJAJFINSV.NS', 'name': 'Bajaj Finserv Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'ADANIPORTS.NS', 'name': 'Adani Ports and Special Economic Zone Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'POWERGRID.NS', 'name': 'Power Grid Corporation of India Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'NTPC.NS', 'name': 'NTPC Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'ONGC.NS', 'name': 'Oil and Natural Gas Corporation Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'COALINDIA.NS', 'name': 'Coal India Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'TATAMOTORS.NS', 'name': 'Tata Motors Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'TATASTEEL.NS', 'name': 'Tata Steel Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'JSWSTEEL.NS', 'name': 'JSW Steel Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'HINDALCO.NS', 'name': 'Hindalco Industries Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'GRASIM.NS', 'name': 'Grasim Industries Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'M&M.NS', 'name': 'Mahindra & Mahindra Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'BRITANNIA.NS', 'name': 'Britannia Industries Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'INDUSINDBK.NS', 'name': 'IndusInd Bank Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'CIPLA.NS', 'name': 'Cipla Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'DRREDDY.NS', 'name': 'Dr. Reddy\'s Laboratories Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'EICHERMOT.NS', 'name': 'Eicher Motors Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'SHREECEM.NS', 'name': 'Shree Cement Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'DIVISLAB.NS', 'name': 'Divi\'s Laboratories Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'UPL.NS', 'name': 'UPL Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'TECHM.NS', 'name': 'Tech Mahindra Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'HEROMOTOCO.NS', 'name': 'Hero MotoCorp Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'BPCL.NS', 'name': 'Bharat Petroleum Corporation Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'IOC.NS', 'name': 'Indian Oil Corporation Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'GAIL.NS', 'name': 'GAIL (India) Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'VEDL.NS', 'name': 'Vedanta Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'SBILIFE.NS', 'name': 'SBI Life Insurance Company Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'HDFCLIFE.NS', 'name': 'HDFC Life Insurance Company Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'ICICIPRULI.NS', 'name': 'ICICI Prudential Life Insurance Company Limited', 'exchange': 'NSE', 'country': 'India'},
            
            # More popular Indian companies
            {'symbol': 'ZOMATO.NS', 'name': 'Zomato Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'PAYTM.NS', 'name': 'One 97 Communications Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'NYKAA.NS', 'name': 'FSN E-Commerce Ventures Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'IRCTC.NS', 'name': 'Indian Railway Catering And Tourism Corporation Limited', 'exchange': 'NSE', 'country': 'India'},
            {'symbol': 'TATAPOWER.NS', 'name': 'Tata Power Company Limited', 'exchange': 'NSE', 'country': 'India'},
        ]
        
        # Filter companies based on query
        filtered_companies = []
        
        for company in all_companies:
            symbol_match = company['symbol'].lower().replace('.ns', '').replace('.bo', '').startswith(query_lower)
            name_match = company['name'].lower().startswith(query_lower) or query_lower in company['name'].lower()
            
            if symbol_match or name_match:
                filtered_companies.append(company)
        
        # Sort by relevance (exact symbol matches first, then name matches)
        filtered_companies.sort(key=lambda x: (
            0 if x['symbol'].lower().replace('.ns', '').replace('.bo', '') == query_lower else
            1 if x['symbol'].lower().replace('.ns', '').replace('.bo', '').startswith(query_lower) else
            2 if x['name'].lower().startswith(query_lower) else 3
        ))
        
        return filtered_companies

class FinancialDataService:
    
    @staticmethod
    def safe_float(value):
        """Convert value to float, return None if NaN or Inf"""
        if value is None:
            return None
        try:
            float_val = float(value)
            if math.isnan(float_val) or math.isinf(float_val):
                return None
            return float_val
        except (TypeError, ValueError):
            return None

    @staticmethod
    def get_balance_sheet_data(ticker, symbol):
        """Extract comprehensive balance sheet data"""
        try:
            balance_sheet = ticker.balance_sheet
            balance_sheet_data = []
            
            if balance_sheet is not None and not balance_sheet.empty:
                for period in balance_sheet.columns:
                    period_data = {
                        'symbol': symbol,
                        'period': period.strftime('%Y-%m-%d'),
                        # Assets
                        'cash_and_cash_equivalents': FinancialDataService.safe_float(balance_sheet[period].get('Cash And Cash Equivalents')),
                        'short_term_investments': FinancialDataService.safe_float(balance_sheet[period].get('Short Term Investments')),
                        'net_receivables': FinancialDataService.safe_float(balance_sheet[period].get('Net Receivables')),
                        'inventory': FinancialDataService.safe_float(balance_sheet[period].get('Inventory')),
                        'other_current_assets': FinancialDataService.safe_float(balance_sheet[period].get('Other Current Assets')),
                        'total_current_assets': FinancialDataService.safe_float(balance_sheet[period].get('Total Current Assets')),
                        'property_plant_equipment': FinancialDataService.safe_float(balance_sheet[period].get('Property Plant Equipment')),
                        'long_term_investments': FinancialDataService.safe_float(balance_sheet[period].get('Long Term Investments')),
                        'intangible_assets': FinancialDataService.safe_float(balance_sheet[period].get('Goodwill')),
                        'other_assets': FinancialDataService.safe_float(balance_sheet[period].get('Other Assets')),
                        'total_assets': FinancialDataService.safe_float(balance_sheet[period].get('Total Assets')),
                        
                        # Liabilities
                        'accounts_payable': FinancialDataService.safe_float(balance_sheet[period].get('Accounts Payable')),
                        'short_long_term_debt': FinancialDataService.safe_float(balance_sheet[period].get('Short Long Term Debt')),
                        'other_current_liabilities': FinancialDataService.safe_float(balance_sheet[period].get('Other Current Liabilities')),
                        'total_current_liabilities': FinancialDataService.safe_float(balance_sheet[period].get('Total Current Liabilities')),
                        'long_term_debt': FinancialDataService.safe_float(balance_sheet[period].get('Long Term Debt')),
                        'other_liabilities': FinancialDataService.safe_float(balance_sheet[period].get('Other Liabilities')),
                        'total_liabilities': FinancialDataService.safe_float(balance_sheet[period].get('Total Liabilities')),
                        
                        # Equity
                        'common_stock': FinancialDataService.safe_float(balance_sheet[period].get('Common Stock')),
                        'retained_earnings': FinancialDataService.safe_float(balance_sheet[period].get('Retained Earnings')),
                        'other_equity': FinancialDataService.safe_float(balance_sheet[period].get('Other Stockholder Equity')),
                        'total_equity': FinancialDataService.safe_float(balance_sheet[period].get('Total Stockholder Equity')),
                        'total_liabilities_and_equity': FinancialDataService.safe_float(balance_sheet[period].get('Total Liabilities And Stockholders Equity')),
                    }
                    balance_sheet_data.append(period_data)
            
            return balance_sheet_data
        except Exception as e:
            logger.error(f"Error getting balance sheet data for {symbol}: {str(e)}")
            return []

    @staticmethod
    def get_income_statement_data(ticker, symbol):
        """Extract comprehensive income statement data"""
        try:
            income_stmt = ticker.income_stmt
            income_data = []
            
            if income_stmt is not None and not income_stmt.empty:
                for period in income_stmt.columns:
                    period_data = {
                        'symbol': symbol,
                        'period': period.strftime('%Y-%m-%d'),
                        # Revenue
                        'total_revenue': FinancialDataService.safe_float(income_stmt[period].get('Total Revenue')),
                        'cost_of_revenue': FinancialDataService.safe_float(income_stmt[period].get('Cost Of Revenue')),
                        'gross_profit': FinancialDataService.safe_float(income_stmt[period].get('Gross Profit')),
                        
                        # Operating Expenses
                        'research_development': FinancialDataService.safe_float(income_stmt[period].get('Research Development')),
                        'selling_general_administrative': FinancialDataService.safe_float(income_stmt[period].get('Selling General Administrative')),
                        'total_operating_expenses': FinancialDataService.safe_float(income_stmt[period].get('Total Operating Expenses')),
                        'operating_income': FinancialDataService.safe_float(income_stmt[period].get('Operating Income')),
                        
                        # Other Income/Expenses
                        'interest_expense': FinancialDataService.safe_float(income_stmt[period].get('Interest Expense')),
                        'other_income_expense': FinancialDataService.safe_float(income_stmt[period].get('Other Income Expense')),
                        'income_before_tax': FinancialDataService.safe_float(income_stmt[period].get('Income Before Tax')),
                        'income_tax_expense': FinancialDataService.safe_float(income_stmt[period].get('Income Tax Expense')),
                        
                        # Net Income
                        'net_income': FinancialDataService.safe_float(income_stmt[period].get('Net Income')),
                        'net_income_applicable_to_common_shares': FinancialDataService.safe_float(income_stmt[period].get('Net Income Applicable To Common Shares')),
                        
                        # EPS
                        'basic_eps': FinancialDataService.safe_float(income_stmt[period].get('Basic EPS')),
                        'diluted_eps': FinancialDataService.safe_float(income_stmt[period].get('Diluted EPS')),
                    }
                    income_data.append(period_data)
            
            return income_data
        except Exception as e:
            logger.error(f"Error getting income statement data for {symbol}: {str(e)}")
            return []

    @staticmethod
    def get_cash_flow_data(ticker, symbol):
        """Extract comprehensive cash flow statement data"""
        try:
            cash_flow = ticker.cashflow
            cash_flow_data = []
            
            if cash_flow is not None and not cash_flow.empty:
                for period in cash_flow.columns:
                    period_data = {
                        'symbol': symbol,
                        'period': period.strftime('%Y-%m-%d'),
                        # Operating Activities
                        'net_income': FinancialDataService.safe_float(cash_flow[period].get('Net Income')),
                        'depreciation_amortization': FinancialDataService.safe_float(cash_flow[period].get('Depreciation')),
                        'change_in_receivables': FinancialDataService.safe_float(cash_flow[period].get('Change In Receivables')),
                        'change_in_inventory': FinancialDataService.safe_float(cash_flow[period].get('Change In Inventory')),
                        'change_in_payables': FinancialDataService.safe_float(cash_flow[period].get('Change In Accounts Payable')),
                        'other_operating_activities': FinancialDataService.safe_float(cash_flow[period].get('Other Cash flows from Operating Activities')),
                        'net_cash_from_operating_activities': FinancialDataService.safe_float(cash_flow[period].get('Total Cash From Operating Activities')),
                        
                        # Investing Activities
                        'capital_expenditures': FinancialDataService.safe_float(cash_flow[period].get('Capital Expenditures')),
                        'investments': FinancialDataService.safe_float(cash_flow[period].get('Investments')),
                        'other_investing_activities': FinancialDataService.safe_float(cash_flow[period].get('Other Cashflows from Investing Activities')),
                        'net_cash_from_investing_activities': FinancialDataService.safe_float(cash_flow[period].get('Total Cashflows From Investing Activities')),
                        
                        # Financing Activities
                        'dividends_paid': FinancialDataService.safe_float(cash_flow[period].get('Dividends Paid')),
                        'stock_repurchase': FinancialDataService.safe_float(cash_flow[period].get('Repurchase Of Stock')),
                        'debt_issuance_repayment': FinancialDataService.safe_float(cash_flow[period].get('Issuance Retirement of Debt Net')),
                        'other_financing_activities': FinancialDataService.safe_float(cash_flow[period].get('Other Cashflows from Financing Activities')),
                        'net_cash_from_financing_activities': FinancialDataService.safe_float(cash_flow[period].get('Total Cash From Financing Activities')),
                        
                        # Net Change
                        'net_change_in_cash': FinancialDataService.safe_float(cash_flow[period].get('Change In Cash')),
                        'free_cash_flow': FinancialDataService.safe_float(cash_flow[period].get('Free Cash Flow')),
                    }
                    cash_flow_data.append(period_data)
            
            return cash_flow_data
        except Exception as e:
            logger.error(f"Error getting cash flow data for {symbol}: {str(e)}")
            return []

    @staticmethod
    def get_stock_price_data(info, symbol):
        """Extract comprehensive stock price data"""
        try:
            return {
                'symbol': symbol,
                'current_price': FinancialDataService.safe_float(info.get('currentPrice', info.get('regularMarketPrice'))),
                'previous_close': FinancialDataService.safe_float(info.get('previousClose')),
                'open_price': FinancialDataService.safe_float(info.get('open')),
                'day_high': FinancialDataService.safe_float(info.get('dayHigh')),
                'day_low': FinancialDataService.safe_float(info.get('dayLow')),
                'volume': FinancialDataService.safe_float(info.get('volume')),
                'market_cap': FinancialDataService.safe_float(info.get('marketCap')),
                'fifty_two_week_high': FinancialDataService.safe_float(info.get('fiftyTwoWeekHigh')),
                'fifty_two_week_low': FinancialDataService.safe_float(info.get('fiftyTwoWeekLow')),
                'dividend_yield': FinancialDataService.safe_float(info.get('dividendYield')),
                'pe_ratio': FinancialDataService.safe_float(info.get('trailingPE')),
                'beta': FinancialDataService.safe_float(info.get('beta')),
            }
        except Exception as e:
            logger.error(f"Error getting stock price data for {symbol}: {str(e)}")
            return {'symbol': symbol}  # Return minimal data

    @staticmethod
    def get_company_info_data(info, symbol):
        """Extract comprehensive company information"""
        try:
            return {
                'symbol': symbol,
                'name': info.get('longName', info.get('shortName', 'N/A')),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'country': info.get('country', 'N/A'),
                'website': info.get('website', 'N/A'),
                'description': info.get('longBusinessSummary', 'N/A'),
                'employees': FinancialDataService.safe_float(info.get('fullTimeEmployees')),
                'currency': info.get('currency', 'N/A'),
                'exchange': info.get('exchange', 'N/A'),
                'market': info.get('market', 'N/A'),
            }
        except Exception as e:
            logger.error(f"Error getting company info for {symbol}: {str(e)}")
            return {'symbol': symbol, 'name': 'N/A'}


class ComprehensiveFinancialDataView(APIView):
    """Single, consolidated ComprehensiveFinancialDataView"""
    
    def get(self, request, symbol):
        cache_key = f"comprehensive_financial_data_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            logger.info(f"Returning cached data for {symbol}")
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            
            # Validate symbol format
            if not self.is_valid_symbol(symbol):
                return Response(
                    {"error": f"Invalid symbol format: '{symbol}'"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                logger.warning(f"Company with symbol '{symbol}' not found")
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            service = FinancialDataService()
            
            # Get all financial data
            company_info = service.get_company_info_data(info, symbol)
            stock_price = service.get_stock_price_data(info, symbol)
            balance_sheet = service.get_balance_sheet_data(ticker, symbol)
            income_statement = service.get_income_statement_data(ticker, symbol)
            cash_flow = service.get_cash_flow_data(ticker, symbol)
            
            # Additional data with NaN handling
            recommendations = self.get_recommendations(ticker)
            historical_data = self.get_historical_data(ticker)
            earnings_dates = self.get_earnings_dates(ticker)
            options_chain = self.get_options_chain(ticker)
            
            response_data = {
                'company_info': company_info,
                'stock_price': stock_price,
                'balance_sheet': balance_sheet,
                'income_statement': income_statement,
                'cash_flow': cash_flow,
                'recommendations': clean_financial_data(recommendations),
                'historical_data': clean_financial_data(historical_data),
                'earnings_dates': clean_financial_data(earnings_dates),
                'options_chain': clean_financial_data(options_chain),
                'metadata': {
                    'symbol': symbol,
                    'last_updated': timezone.now().isoformat(),
                    'data_source': 'yfinance',
                    'cache_status': 'miss'
                }
            }
            
            # Clean the entire response data
            cleaned_response = clean_financial_data(response_data)
            
            # Cache for 1 hour (3600 seconds)
            cache.set(cache_key, cleaned_response, 3600)
            logger.info(f"Data for {symbol} cached successfully")
            
            return Response(cleaned_response)
            
        except requests.Timeout:
            logger.error(f"Timeout fetching data for {symbol}")
            return Response(
                {"error": "Request timeout - please try again later"}, 
                status=status.HTTP_408_REQUEST_TIMEOUT
            )
        except Exception as e:
            logger.error(f"Error fetching comprehensive financial data for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching comprehensive financial data: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def is_valid_symbol(self, symbol):
        """Validate stock symbol format"""
        import re
        # Basic validation: letters, numbers, dots, hyphens, 1-20 chars
        pattern = r'^[A-Z0-9.-]{1,20}$'
        return bool(re.match(pattern, symbol))
    
    def get_recommendations(self, ticker):
        try:
            recommendations = ticker.recommendations
            if recommendations is not None and not recommendations.empty:
                data = recommendations.tail(10).reset_index().to_dict('records')
                return clean_financial_data(data)
            return []
        except Exception as e:
            logger.warning(f"Error getting recommendations: {str(e)}")
            return []
    
    def get_historical_data(self, ticker, period="1y"):
        try:
            hist = ticker.history(period=period)
            if hist is not None and not hist.empty:
                data = hist.reset_index().to_dict('records')
                return clean_financial_data(data)
            return []
        except Exception as e:
            logger.warning(f"Error getting historical data: {str(e)}")
            return []
    
    def get_earnings_dates(self, ticker):
        try:
            earnings = ticker.earnings_dates
            if earnings is not None and not earnings.empty:
                data = earnings.tail(8).reset_index().to_dict('records')
                return clean_financial_data(data)
            return []
        except Exception as e:
            logger.warning(f"Error getting earnings dates: {str(e)}")
            return []
    
    def get_options_chain(self, ticker):
        try:
            options = ticker.options
            if options:
                exp_date = options[0]
                opt_chain = ticker.option_chain(exp_date)
                data = {
                    'calls': opt_chain.calls.head(5).to_dict('records'),
                    'puts': opt_chain.puts.head(5).to_dict('records'),
                    'expiration_date': exp_date
                }
                return clean_financial_data(data)
            return None
        except Exception as e:
            logger.warning(f"Error getting options chain: {str(e)}")
            return None


class SearchCompanyView(APIView):
    def get(self, request):
        query = request.GET.get('q', '').strip().upper()
        
        if not query:
            return Response(
                {"error": "Query parameter 'q' is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate query format
        if not self.is_valid_symbol(query):
            return Response(
                {"error": f"Invalid symbol format: '{query}'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ticker = yf.Ticker(query)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{query}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            company_data = {
                'symbol': info.get('symbol', ''),
                'name': info.get('longName', info.get('shortName', 'N/A'))
            }
            
            # Save search to database using the model's method
            company, created = CompanySearch.objects.get_or_create(
                symbol=company_data['symbol'],
                defaults={'name': company_data['name']}
            )
            
            if not created:
                # Use the model's method to increment count
                company.increment_search_count()
            else:
                logger.info(f"New company added to search database: {company_data['symbol']}")
            
            logger.info(f"Search performed for {query}")
            return Response(company_data)
            
        except Exception as e:
            logger.error(f"Error searching company {query}: {str(e)}")
            return Response(
                {"error": f"Error searching company: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def is_valid_symbol(self, symbol):
        """Validate stock symbol format"""
        import re
        pattern = r'^[A-Z0-9.-]{1,20}$'
        return bool(re.match(pattern, symbol))


# Separate views for each financial statement type (as suggested in urls.py)
class BalanceSheetView(APIView):
    """Dedicated view for balance sheet data"""
    
    def get(self, request, symbol):
        cache_key = f"balance_sheet_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            service = FinancialDataService()
            data = service.get_balance_sheet_data(ticker, symbol)
            serializer = BalanceSheetSerializer(data, many=True)
            
            response_data = {
                'symbol': symbol,
                'statement_type': 'balance-sheet',
                'count': len(data),
                'data': serializer.data,
                'last_updated': timezone.now().isoformat()
            }
            
            # Cache for 1 hour
            cache.set(cache_key, response_data, 3600)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching balance sheet for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching balance sheet: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class IncomeStatementView(APIView):
    """Dedicated view for income statement data"""
    
    def get(self, request, symbol):
        cache_key = f"income_statement_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            service = FinancialDataService()
            data = service.get_income_statement_data(ticker, symbol)
            serializer = IncomeStatementSerializer(data, many=True)
            
            response_data = {
                'symbol': symbol,
                'statement_type': 'income-statement',
                'count': len(data),
                'data': serializer.data,
                'last_updated': timezone.now().isoformat()
            }
            
            # Cache for 1 hour
            cache.set(cache_key, response_data, 3600)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching income statement for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching income statement: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CashFlowView(APIView):
    """Dedicated view for cash flow data"""
    
    def get(self, request, symbol):
        cache_key = f"cash_flow_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            service = FinancialDataService()
            data = service.get_cash_flow_data(ticker, symbol)
            serializer = CashFlowSerializer(data, many=True)
            
            response_data = {
                'symbol': symbol,
                'statement_type': 'cash-flow',
                'count': len(data),
                'data': serializer.data,
                'last_updated': timezone.now().isoformat()
            }
            
            # Cache for 1 hour
            cache.set(cache_key, response_data, 3600)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching cash flow for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching cash flow: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class IndividualStatementView(APIView):
    """Alternative view to get individual financial statements using URL parameter"""
    
    def get(self, request, symbol, statement_type):
        valid_statements = {
            'balance-sheet': (FinancialDataService.get_balance_sheet_data, BalanceSheetSerializer),
            'income-statement': (FinancialDataService.get_income_statement_data, IncomeStatementSerializer),
            'cash-flow': (FinancialDataService.get_cash_flow_data, CashFlowSerializer),
        }
        
        if statement_type not in valid_statements:
            return Response(
                {"error": f"Invalid statement type. Must be one of: {', '.join(valid_statements.keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f"{statement_type}_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            service_method, serializer_class = valid_statements[statement_type]
            service = FinancialDataService()
            
            data = service_method(ticker, symbol)
            serializer = serializer_class(data, many=True)
            
            response_data = {
                'symbol': symbol,
                'statement_type': statement_type,
                'count': len(data),
                'data': serializer.data,
                'last_updated': timezone.now().isoformat()
            }
            
            # Cache for 1 hour
            cache.set(cache_key, response_data, 3600)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching {statement_type} for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching {statement_type}: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StockPriceView(APIView):
    def get(self, request, symbol):
        cache_key = f"stock_price_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            service = FinancialDataService()
            stock_data = service.get_stock_price_data(info, symbol)
            serializer = StockPriceSerializer(stock_data)
            
            # Cache for 5 minutes (300 seconds) - stock prices change frequently
            cache.set(cache_key, serializer.data, 300)
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching stock price for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching stock price: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompanyInfoView(APIView):
    def get(self, request, symbol):
        cache_key = f"company_info_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            service = FinancialDataService()
            company_info = service.get_company_info_data(info, symbol)
            serializer = CompanyInfoSerializer(company_info)
            
            # Cache for 1 day (86400 seconds) - company info doesn't change often
            cache.set(cache_key, serializer.data, 86400)
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching company info for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching company info: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PopularSearchesView(APIView):
    def get(self, request):
        cache_key = "popular_searches"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        popular_searches = CompanySearch.objects.filter(is_active=True).order_by('-search_count')[:10]
        serializer = CompanySearchSerializer(popular_searches, many=True)
        
        # Cache for 10 minutes
        cache.set(cache_key, serializer.data, 600)
        
        return Response(serializer.data)


class HistoricalDataView(APIView):
    def get(self, request, symbol):
        period = request.GET.get('period', '1y')
        interval = request.GET.get('interval', '1d')
        
        # Validate period and interval
        valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
        valid_intervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']
        
        if period not in valid_periods:
            return Response(
                {"error": f"Invalid period. Must be one of: {', '.join(valid_periods)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if interval not in valid_intervals:
            return Response(
                {"error": f"Invalid interval. Must be one of: {', '.join(valid_intervals)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f"historical_data_{symbol}_{period}_{interval}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            
            if hist is not None and not hist.empty:
                historical_data = hist.reset_index().to_dict('records')
                cleaned_data = clean_financial_data(historical_data)
                
                response_data = {
                    'symbol': symbol,
                    'period': period,
                    'interval': interval,
                    'count': len(cleaned_data),
                    'data': cleaned_data,
                    'last_updated': timezone.now().isoformat()
                }
                
                # Cache for 1 hour
                cache.set(cache_key, response_data, 3600)
                
                return Response(response_data)
            else:
                return Response({
                    'symbol': symbol,
                    'period': period,
                    'interval': interval,
                    'count': 0,
                    'data': [],
                    'message': 'No historical data available'
                })
                
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching historical data: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Additional utility views
class HealthCheckView(APIView):
    """API health check endpoint"""
    
    def get(self, request):
        from django.db import connection
        from django.core.cache import cache
        
        # Check database connectivity
        db_ok = True
        try:
            connection.ensure_connection()
        except Exception as e:
            db_ok = False
            logger.error(f"Database health check failed: {str(e)}")
        
        # Check cache connectivity
        cache_ok = True
        try:
            cache.set('health_check', 'ok', 1)
            cache.get('health_check')
        except Exception as e:
            cache_ok = False
            logger.error(f"Cache health check failed: {str(e)}")
        
        # Check yfinance connectivity
        yfinance_ok = True
        try:
            ticker = yf.Ticker('AAPL')
            info = ticker.info
            if not info:
                yfinance_ok = False
        except Exception as e:
            yfinance_ok = False
            logger.error(f"YFinance health check failed: {str(e)}")
        
        overall_status = 'healthy' if all([db_ok, cache_ok, yfinance_ok]) else 'degraded'
        
        return Response({
            "status": overall_status,
            "timestamp": timezone.now().isoformat(),
            "services": {
                "database": "ok" if db_ok else "unavailable",
                "cache": "ok" if cache_ok else "unavailable", 
                "yfinance": "ok" if yfinance_ok else "unavailable"
            },
            "version": "1.0.0"
        })


class APIRootView(APIView):
    """API root endpoint with documentation"""
    
    def get(self, request):
        base_url = request.build_absolute_uri('/')[:-1]
        
        endpoints = {
            "search": f"{base_url}/search/?q=SYMBOL",
            "company_data": f"{base_url}/company/AAPL/",
            "balance_sheet": f"{base_url}/company/AAPL/balance-sheet/",
            "income_statement": f"{base_url}/company/AAPL/income-statement/", 
            "cash_flow": f"{base_url}/company/AAPL/cash-flow/",
            "stock_price": f"{base_url}/company/AAPL/stock-price/",
            "company_info": f"{base_url}/company/AAPL/info/",
            "historical_data": f"{base_url}/company/AAPL/historical/?period=1y&interval=1d",
            "popular_searches": f"{base_url}/popular-searches/",
            "health_check": f"{base_url}/health/",
        }
        
        return Response({
            "message": "Financial Data API",
            "version": "1.0.0", 
            "endpoints": endpoints,
            "documentation": "See each endpoint for detailed usage"
        })
    
class MarketSummaryView(APIView):
    """Get overall market summary and major indices"""
    
    def get(self, request):
        cache_key = "market_summary"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            # Major US indices
            indices = {
                '^GSPC': 'S&P 500',
                '^DJI': 'Dow Jones Industrial Average', 
                '^IXIC': 'NASDAQ Composite',
                '^RUT': 'Russell 2000',
                '^VIX': 'CBOE Volatility Index'
            }
            
            summary = {}
            
            for symbol, name in indices.items():
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    hist = ticker.history(period='1d')
                    
                    if info and not hist.empty:
                        current_price = FinancialDataService.safe_float(info.get('regularMarketPrice'))
                        previous_close = FinancialDataService.safe_float(info.get('previousClose'))
                        
                        if current_price and previous_close:
                            change = current_price - previous_close
                            change_percent = (change / previous_close) * 100
                        else:
                            change = None
                            change_percent = None
                        
                        summary[symbol] = {
                            'name': name,
                            'symbol': symbol,
                            'current_price': current_price,
                            'previous_close': previous_close,
                            'change': change,
                            'change_percent': change_percent,
                            'day_high': FinancialDataService.safe_float(info.get('dayHigh')),
                            'day_low': FinancialDataService.safe_float(info.get('dayLow')),
                            'volume': FinancialDataService.safe_float(info.get('volume')),
                        }
                    else:
                        summary[symbol] = {
                            'name': name,
                            'symbol': symbol,
                            'error': 'Data not available'
                        }
                        
                except Exception as e:
                    logger.warning(f"Error fetching data for {symbol}: {str(e)}")
                    summary[symbol] = {
                        'name': name,
                        'symbol': symbol,
                        'error': f'Failed to fetch data: {str(e)}'
                    }
            
            # Add some market metadata
            response_data = {
                'summary': summary,
                'last_updated': timezone.now().isoformat(),
                'market_status': self.get_market_status(),
                'metadata': {
                    'data_source': 'yfinance',
                    'indices_count': len(summary)
                }
            }
            
            # Clean the data
            cleaned_data = clean_financial_data(response_data)
            
            # Cache for 5 minutes (market data changes frequently)
            cache.set(cache_key, cleaned_data, 300)
            
            return Response(cleaned_data)
            
        except Exception as e:
            logger.error(f"Error fetching market summary: {str(e)}")
            return Response(
                {"error": f"Error fetching market summary: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_market_status(self):
        """Determine if US markets are open based on current time"""
        now = datetime.now()
        
        # Simple check: US markets are typically open 9:30 AM - 4:00 PM ET
        # This is a simplified check - you might want to use a more sophisticated approach
        est_time = now  # You might want to convert to EST
        
        # Check if it's a weekday (0=Monday, 6=Sunday)
        if est_time.weekday() >= 5:  # Saturday or Sunday
            return 'closed'
        
        # Check time (simplified - assuming ET timezone)
        market_open = est_time.replace(hour=9, minute=30, second=0, microsecond=0)
        market_close = est_time.replace(hour=16, minute=0, second=0, microsecond=0)
        
        if market_open <= est_time <= market_close:
            return 'open'
        else:
            return 'closed'
        

class HealthCheckView(APIView):
    """API health check endpoint"""
    
    def get(self, request):
        from django.db import connection
        from django.core.cache import cache
        
        # Check database connectivity
        db_ok = True
        try:
            connection.ensure_connection()
            # Test a simple query
            CompanySearch.objects.first()
        except Exception as e:
            db_ok = False
            logger.error(f"Database health check failed: {str(e)}")
        
        # Check cache connectivity
        cache_ok = True
        try:
            cache.set('health_check', 'ok', 1)
            result = cache.get('health_check')
            if result != 'ok':
                cache_ok = False
        except Exception as e:
            cache_ok = False
            logger.error(f"Cache health check failed: {str(e)}")
        
        # Check external service (yfinance) connectivity
        yfinance_ok = True
        try:
            ticker = yf.Ticker('AAPL')
            info = ticker.info
            if not info:
                yfinance_ok = False
        except Exception as e:
            yfinance_ok = False
            logger.error(f"YFinance health check failed: {str(e)}")
        
        overall_status = 'healthy' if all([db_ok, cache_ok, yfinance_ok]) else 'degraded'
        
        return Response({
            "status": overall_status,
            "timestamp": timezone.now().isoformat(),
            "services": {
                "database": "ok" if db_ok else "unavailable",
                "cache": "ok" if cache_ok else "unavailable", 
                "yfinance": "ok" if yfinance_ok else "unavailable"
            },
            "version": "1.0.0"
        })


class APIRootView(APIView):
    """API root endpoint with documentation"""
    
    def get(self, request):
        base_url = request.build_absolute_uri('/')[:-1]
        
        endpoints = {
            "search": {
                "url": f"{base_url}/search/?q=SYMBOL",
                "method": "GET",
                "description": "Search for company by symbol"
            },
            "company_data": {
                "url": f"{base_url}/company/AAPL/",
                "method": "GET", 
                "description": "Get comprehensive financial data for a company"
            },
            "balance_sheet": {
                "url": f"{base_url}/company/AAPL/balance-sheet/",
                "method": "GET",
                "description": "Get balance sheet data"
            },
            "income_statement": {
                "url": f"{base_url}/company/AAPL/income-statement/",
                "method": "GET",
                "description": "Get income statement data"
            },
            "cash_flow": {
                "url": f"{base_url}/company/AAPL/cash-flow/",
                "method": "GET",
                "description": "Get cash flow statement data"
            },
            "stock_price": {
                "url": f"{base_url}/company/AAPL/stock-price/",
                "method": "GET",
                "description": "Get current stock price and metrics"
            },
            "company_info": {
                "url": f"{base_url}/company/AAPL/info/",
                "method": "GET",
                "description": "Get company information and profile"
            },
            "historical_data": {
                "url": f"{base_url}/company/AAPL/historical/?period=1y&interval=1d",
                "method": "GET",
                "description": "Get historical price data"
            },
            "popular_searches": {
                "url": f"{base_url}/popular-searches/",
                "method": "GET",
                "description": "Get most frequently searched companies"
            },
            "market_summary": {
                "url": f"{base_url}/market-summary/",
                "method": "GET",
                "description": "Get market indices summary"
            },
            "health_check": {
                "url": f"{base_url}/health/",
                "method": "GET",
                "description": "API health check"
            }
        }
        
        return Response({
            "message": "Financial Data API",
            "version": "1.0.0", 
            "endpoints": endpoints,
            "documentation": "Add /docs/ for Swagger documentation if using drf-yasg"
        })

# company_search/views.py - ADD THESE NEW CLASSES

class FinancialRatioService:
    """Service to calculate financial ratios similar to Screener.in"""
    
    @staticmethod
    def calculate_profitability_ratios(income_data, balance_data, market_cap=None):
        """Calculate profitability ratios"""
        if not income_data or not balance_data:
            return {}
        
        latest_income = income_data[0] if income_data else {}
        latest_balance = balance_data[0] if balance_data else {}
        
        revenue = FinancialDataService.safe_float(latest_income.get('total_revenue'))
        net_income = FinancialDataService.safe_float(latest_income.get('net_income'))
        operating_income = FinancialDataService.safe_float(latest_income.get('operating_income'))
        total_assets = FinancialDataService.safe_float(latest_balance.get('total_assets'))
        total_equity = FinancialDataService.safe_float(latest_balance.get('total_equity'))
        
        ratios = {}
        
        # Return on Equity (ROE)
        if net_income and total_equity:
            ratios['return_on_equity'] = (net_income / total_equity) * 100
        
        # Return on Assets (ROA)
        if net_income and total_assets:
            ratios['return_on_assets'] = (net_income / total_assets) * 100
        
        # Operating Profit Margin
        if operating_income and revenue:
            ratios['operating_margin'] = (operating_income / revenue) * 100
        
        # Net Profit Margin
        if net_income and revenue:
            ratios['net_profit_margin'] = (net_income / revenue) * 100
        
        return ratios
    
    @staticmethod
    def calculate_valuation_ratios(stock_price, income_data, balance_data):
        """Calculate valuation ratios"""
        if not stock_price or not income_data:
            return {}
        
        latest_income = income_data[0] if income_data else {}
        latest_balance = balance_data[0] if balance_data else {}
        
        market_cap = FinancialDataService.safe_float(stock_price.get('market_cap'))
        current_price = FinancialDataService.safe_float(stock_price.get('current_price'))
        eps = FinancialDataService.safe_float(latest_income.get('diluted_eps') or latest_income.get('basic_eps'))
        book_value = FinancialDataService.safe_float(latest_balance.get('total_equity'))
        revenue = FinancialDataService.safe_float(latest_income.get('total_revenue'))
        net_income = FinancialDataService.safe_float(latest_income.get('net_income'))
        
        ratios = {}
        
        # P/E Ratio
        if current_price and eps:
            ratios['pe_ratio'] = current_price / eps
        
        # Price to Book
        if current_price and book_value:
            # Calculate book value per share (simplified)
            ratios['price_to_book'] = current_price / (book_value / 1000000)  # Simplified
        
        # Price to Sales
        if market_cap and revenue:
            ratios['price_to_sales'] = market_cap / revenue
        
        # PEG Ratio (simplified)
        if ratios.get('pe_ratio') and net_income:
            # Assuming 5% growth for demo - in real scenario, use historical growth
            growth_rate = 5.0
            ratios['peg_ratio'] = ratios['pe_ratio'] / growth_rate
        
        return ratios
    
    @staticmethod
    def calculate_leverage_ratios(balance_data):
        """Calculate leverage and solvency ratios"""
        if not balance_data:
            return {}
        
        latest_balance = balance_data[0]
        
        total_debt = FinancialDataService.safe_float(latest_balance.get('long_term_debt', 0)) + \
                    FinancialDataService.safe_float(latest_balance.get('short_long_term_debt', 0))
        total_equity = FinancialDataService.safe_float(latest_balance.get('total_equity'))
        total_assets = FinancialDataService.safe_float(latest_balance.get('total_assets'))
        
        ratios = {}
        
        # Debt to Equity
        if total_debt and total_equity:
            ratios['debt_to_equity'] = (total_debt / total_equity) * 100
        
        # Debt to Assets
        if total_debt and total_assets:
            ratios['debt_to_assets'] = (total_debt / total_assets) * 100
        
        return ratios
    
    @staticmethod
    def calculate_efficiency_ratios(income_data, balance_data):
        """Calculate efficiency ratios"""
        if not income_data or not balance_data:
            return {}
        
        latest_income = income_data[0]
        latest_balance = balance_data[0]
        
        revenue = FinancialDataService.safe_float(latest_income.get('total_revenue'))
        total_assets = FinancialDataService.safe_float(latest_balance.get('total_assets'))
        
        ratios = {}
        
        # Asset Turnover
        if revenue and total_assets:
            ratios['asset_turnover'] = revenue / total_assets
        
        return ratios

class QuarterlyResultsView(APIView):
    """Get quarterly results similar to Screener.in"""
    
    def get(self, request, symbol):
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            
            # Get quarterly financials
            quarterly_income = ticker.quarterly_financials
            quarterly_balance = ticker.quarterly_balance_sheet
            quarterly_cashflow = ticker.quarterly_cashflow
            
            quarters = []
            
            if quarterly_income is not None and not quarterly_income.empty:
                for period in quarterly_income.columns:
                    quarter_data = {
                        'period': period.strftime('%Y-%m-%d'),
                        'revenue': FinancialDataService.safe_float(quarterly_income[period].get('Total Revenue')),
                        'net_income': FinancialDataService.safe_float(quarterly_income[period].get('Net Income')),
                        'operating_income': FinancialDataService.safe_float(quarterly_income[period].get('Operating Income')),
                        'eps': FinancialDataService.safe_float(quarterly_income[period].get('Basic EPS')),
                    }
                    quarters.append(quarter_data)
            
            # Sort by latest first
            quarters.sort(key=lambda x: x['period'], reverse=True)
            
            return Response({
                'symbol': symbol,
                'quarterly_results': quarters[:8]  # Last 8 quarters
            })
            
        except Exception as e:
            logger.error(f"Error fetching quarterly results for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching quarterly results: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FinancialRatiosView(APIView):
    """Get comprehensive financial ratios"""
    
    def get(self, request, symbol):
        cache_key = f"financial_ratios_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            service = FinancialDataService()
            ratio_service = FinancialRatioService()
            
            # Get financial data
            balance_sheet = service.get_balance_sheet_data(ticker, symbol)
            income_statement = service.get_income_statement_data(ticker, symbol)
            stock_price = service.get_stock_price_data(info, symbol)
            
            # Calculate ratios
            profitability = ratio_service.calculate_profitability_ratios(income_statement, balance_sheet)
            valuation = ratio_service.calculate_valuation_ratios(stock_price, income_statement, balance_sheet)
            leverage = ratio_service.calculate_leverage_ratios(balance_sheet)
            efficiency = ratio_service.calculate_efficiency_ratios(income_statement, balance_sheet)
            
            ratios_data = {
                'symbol': symbol,
                'profitability_ratios': profitability,
                'valuation_ratios': valuation,
                'leverage_ratios': leverage,
                'efficiency_ratios': efficiency,
                'last_updated': timezone.now().isoformat()
            }
            
            # Cache for 1 hour
            cache.set(cache_key, ratios_data, 3600)
            
            return Response(ratios_data)
            
        except Exception as e:
            logger.error(f"Error calculating financial ratios for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error calculating financial ratios: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CompanyAnalysisView(APIView):
    """Comprehensive company analysis similar to Screener.in"""
    
    def get(self, request, symbol):
        cache_key = f"company_analysis_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all financial data
            comprehensive_data = self.get_comprehensive_data(symbol)
            
            if comprehensive_data.get('error'):
                return Response(
                    {"error": comprehensive_data['error']},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Generate analysis
            analysis = self.generate_company_analysis(comprehensive_data)
            
            response_data = {
                'symbol': symbol,
                'company_info': comprehensive_data['company_info'],
                'stock_price': comprehensive_data['stock_price'],
                'financial_ratios': comprehensive_data['financial_ratios'],
                'quarterly_results': comprehensive_data['quarterly_results'],
                'analysis': analysis,
                'key_metrics': self.get_key_metrics(comprehensive_data),
                'last_updated': timezone.now().isoformat()
            }
            
            # Cache for 1 hour
            cache.set(cache_key, response_data, 3600)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error generating company analysis for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error generating company analysis: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_comprehensive_data(self, symbol):
        """Get all required data for analysis"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            service = FinancialDataService()
            ratio_service = FinancialRatioService()
            
            # Get basic financial data
            company_info = service.get_company_info_data(info, symbol)
            stock_price = service.get_stock_price_data(info, symbol)
            balance_sheet = service.get_balance_sheet_data(ticker, symbol)
            income_statement = service.get_income_statement_data(ticker, symbol)
            
            # Calculate ratios
            profitability = ratio_service.calculate_profitability_ratios(income_statement, balance_sheet)
            valuation = ratio_service.calculate_valuation_ratios(stock_price, income_statement, balance_sheet)
            leverage = ratio_service.calculate_leverage_ratios(balance_sheet)
            efficiency = ratio_service.calculate_efficiency_ratios(income_statement, balance_sheet)
            
            financial_ratios = {
                'profitability': profitability,
                'valuation': valuation,
                'leverage': leverage,
                'efficiency': efficiency
            }
            
            # Get quarterly results
            quarterly_income = ticker.quarterly_financials
            quarterly_results = []
            
            if quarterly_income is not None and not quarterly_income.empty:
                for period in quarterly_income.columns:
                    quarter_data = {
                        'period': period.strftime('%Y-%m-%d'),
                        'revenue': FinancialDataService.safe_float(quarterly_income[period].get('Total Revenue')),
                        'net_income': FinancialDataService.safe_float(quarterly_income[period].get('Net Income')),
                        'operating_income': FinancialDataService.safe_float(quarterly_income[period].get('Operating Income')),
                    }
                    quarterly_results.append(quarter_data)
            
            quarterly_results.sort(key=lambda x: x['period'], reverse=True)
            
            return {
                'company_info': company_info,
                'stock_price': stock_price,
                'balance_sheet': balance_sheet,
                'income_statement': income_statement,
                'financial_ratios': financial_ratios,
                'quarterly_results': quarterly_results[:4]  # Last 4 quarters
            }
            
        except Exception as e:
            logger.error(f"Error getting comprehensive data for {symbol}: {str(e)}")
            return {'error': str(e)}
    
    def generate_company_analysis(self, data):
        """Generate textual analysis of the company"""
        company_info = data['company_info']
        ratios = data['financial_ratios']
        stock_price = data['stock_price']
        
        analysis = {
            'overview': f"{company_info.get('name', 'The company')} operates in the {company_info.get('sector', 'N/A')} sector.",
            'profitability_analysis': self.analyze_profitability(ratios['profitability']),
            'valuation_analysis': self.analyze_valuation(ratios['valuation'], stock_price),
            'financial_health': self.analyze_financial_health(ratios['leverage']),
            'investment_recommendation': self.generate_recommendation(ratios, stock_price)
        }
        
        return analysis
    
    def analyze_profitability(self, ratios):
        """Analyze company profitability"""
        roe = ratios.get('return_on_equity', 0)
        op_margin = ratios.get('operating_margin', 0)
        net_margin = ratios.get('net_profit_margin', 0)
        
        analysis = ""
        
        if roe > 20:
            analysis += "Excellent Return on Equity (ROE) indicates efficient use of shareholder funds. "
        elif roe > 15:
            analysis += "Good Return on Equity (ROE) shows decent profitability. "
        else:
            analysis += "Moderate Return on Equity (ROE) suggests room for improvement in profitability. "
        
        if op_margin > 20:
            analysis += "Strong operating margins demonstrate operational efficiency. "
        elif net_margin > 15:
            analysis += "Healthy net profit margins indicate good cost management. "
        
        return analysis or "Profitability metrics are within reasonable range."
    
    def analyze_valuation(self, ratios, stock_price):
        """Analyze company valuation"""
        pe_ratio = ratios.get('pe_ratio', 0)
        pb_ratio = ratios.get('price_to_book', 0)
        
        analysis = ""
        
        if pe_ratio < 15:
            analysis += "The stock appears reasonably valued based on P/E ratio. "
        elif pe_ratio > 25:
            analysis += "The stock seems expensive based on P/E ratio. "
        else:
            analysis += "P/E ratio suggests fair valuation. "
        
        if pb_ratio < 1.5:
            analysis += "Trading close to book value provides margin of safety. "
        elif pb_ratio > 3:
            analysis += "High price-to-book ratio indicates premium valuation. "
        
        return analysis or "Valuation metrics suggest market-average pricing."
    
    def analyze_financial_health(self, ratios):
        """Analyze company financial health"""
        debt_to_equity = ratios.get('debt_to_equity', 0)
        
        if debt_to_equity < 50:
            return "Strong financial health with low debt levels and good solvency."
        elif debt_to_equity < 100:
            return "Moderate debt levels, manageable with current operations."
        else:
            return "Higher debt levels warrant monitoring of interest coverage and cash flows."
    
    def generate_recommendation(self, ratios, stock_price):
        """Generate investment recommendation"""
        pe_ratio = ratios['valuation'].get('pe_ratio', 0)
        roe = ratios['profitability'].get('return_on_equity', 0)
        debt_equity = ratios['leverage'].get('debt_to_equity', 0)
        
        score = 0
        
        if pe_ratio < 20:
            score += 1
        if roe > 15:
            score += 1
        if debt_equity < 80:
            score += 1
        
        if score >= 2:
            return "Consider for investment - shows good fundamentals"
        elif score >= 1:
            return "Neutral - monitor for improvement in key metrics"
        else:
            return "Exercise caution - review financial metrics carefully"
    
    def get_key_metrics(self, data):
        """Extract key metrics for quick overview"""
        ratios = data['financial_ratios']
        stock_price = data['stock_price']
        income_stmt = data['income_statement']
        balance_sheet = data['balance_sheet']
        
        latest_income = income_stmt[0] if income_stmt else {}
        latest_balance = balance_sheet[0] if balance_sheet else {}
        
        return {
            'market_cap': stock_price.get('market_cap'),
            'current_pe': ratios['valuation'].get('pe_ratio'),
            'return_on_equity': ratios['profitability'].get('return_on_equity'),
            'debt_to_equity': ratios['leverage'].get('debt_to_equity'),
            'operating_margin': ratios['profitability'].get('operating_margin'),
            'revenue': latest_income.get('total_revenue'),
            'net_income': latest_income.get('net_income'),
            'book_value': latest_balance.get('total_equity')
        }

class ChartHistoricalDataView(APIView):
    """
    Enhanced historical data endpoint specifically for charts
    Returns formatted data ready for chart rendering
    """
    
    def get(self, request, symbol):
        period = request.GET.get('period', '1y')
        interval = request.GET.get('interval', '1d')
        
        # Validate period and interval
        valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
        valid_intervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']
        
        if period not in valid_periods:
            return Response(
                {"error": f"Invalid period. Must be one of: {', '.join(valid_periods)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if interval not in valid_intervals:
            return Response(
                {"error": f"Invalid interval. Must be one of: {', '.join(valid_intervals)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f"chart_historical_{symbol}_{period}_{interval}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            
            if hist is not None and not hist.empty:
                # Format data specifically for charts
                chart_data = self.format_chart_data(hist, symbol)
                
                response_data = {
                    'symbol': symbol,
                    'period': period,
                    'interval': interval,
                    'count': len(chart_data),
                    'data': chart_data,
                    'metadata': {
                        'currency': ticker.info.get('currency', 'USD'),
                        'timezone': 'UTC',
                        'data_source': 'yfinance',
                        'last_updated': timezone.now().isoformat()
                    }
                }
                
                # Cache for 15 minutes for intraday, 1 hour for longer periods
                cache_time = 900 if interval in ['1m', '2m', '5m', '15m', '30m', '60m', '1h'] else 3600
                cache.set(cache_key, response_data, cache_time)
                
                return Response(response_data)
            else:
                return Response({
                    'symbol': symbol,
                    'period': period,
                    'interval': interval,
                    'count': 0,
                    'data': [],
                    'message': 'No historical data available'
                })
                
        except Exception as e:
            logger.error(f"Error fetching chart historical data for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching historical data: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def format_chart_data(self, hist_data, symbol):
        """Format historical data specifically for chart display"""
        chart_data = []
        
        for index, row in hist_data.iterrows():
            date_str = index.strftime('%Y-%m-%d')
            timestamp = int(index.timestamp() * 1000)  # JavaScript timestamp in milliseconds
            
            data_point = {
                'date': date_str,
                'timestamp': timestamp,
                'price': FinancialDataService.safe_float(row.get('Close')),
                'open': FinancialDataService.safe_float(row.get('Open')),
                'high': FinancialDataService.safe_float(row.get('High')),
                'low': FinancialDataService.safe_float(row.get('Low')),
                'volume': FinancialDataService.safe_float(row.get('Volume')),
                'change': None,
                'change_percent': None
            }
            
            # Calculate price change if we have previous data
            if chart_data:
                prev_price = chart_data[-1]['price']
                if prev_price and data_point['price']:
                    data_point['change'] = data_point['price'] - prev_price
                    data_point['change_percent'] = ((data_point['price'] - prev_price) / prev_price) * 100
            
            chart_data.append(data_point)
        
        return chart_data
    
class FinancialMetricsChartView(APIView):
    """
    Get financial metrics over time for charting
    Similar to Screener.in's financial trends
    """
    
    def get(self, request, symbol):
        metric_type = request.GET.get('metric', 'revenue')  # revenue, income, cashflow, ratios
        years = int(request.GET.get('years', 5))
        
        valid_metrics = ['revenue', 'income', 'cashflow', 'ratios', 'profitability']
        if metric_type not in valid_metrics:
            return Response(
                {"error": f"Invalid metric type. Must be one of: {', '.join(valid_metrics)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f"financial_metrics_{symbol}_{metric_type}_{years}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            
            # Get financial statements
            financials = ticker.financials
            balance_sheet = ticker.balance_sheet
            cashflow = ticker.cashflow
            
            if financials is None or financials.empty:
                return Response({
                    'symbol': symbol,
                    'metric_type': metric_type,
                    'data': [],
                    'message': 'No financial data available'
                })
            
            # Generate time-series data based on metric type
            chart_data = self.generate_financial_metrics(
                financials, balance_sheet, cashflow, metric_type, years
            )
            
            response_data = {
                'symbol': symbol,
                'metric_type': metric_type,
                'years': years,
                'data': chart_data,
                'metadata': {
                    'currency': ticker.info.get('currency', 'USD'),
                    'last_updated': timezone.now().isoformat()
                }
            }
            
            # Cache for 1 day (financial data doesn't change frequently)
            cache.set(cache_key, response_data, 86400)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching financial metrics for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching financial metrics: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def generate_financial_metrics(self, financials, balance_sheet, cashflow, metric_type, years):
        """Generate financial metrics time-series data"""
        chart_data = []
        
        # Get the last N years of data
        periods = financials.columns[:years] if len(financials.columns) > years else financials.columns
        
        for period in periods:
            period_data = {
                'period': period.strftime('%Y-%m-%d'),
                'year': period.year
            }
            
            if metric_type == 'revenue':
                period_data.update(self.get_revenue_metrics(financials[period]))
            elif metric_type == 'income':
                period_data.update(self.get_income_metrics(financials[period]))
            elif metric_type == 'cashflow':
                period_data.update(self.get_cashflow_metrics(cashflow[period] if cashflow is not None else None))
            elif metric_type == 'ratios':
                period_data.update(self.get_ratio_metrics(financials[period], balance_sheet[period] if balance_sheet is not None else None))
            elif metric_type == 'profitability':
                period_data.update(self.get_profitability_metrics(financials[period], balance_sheet[period] if balance_sheet is not None else None))
            
            chart_data.append(period_data)
        
        # Sort by year (oldest first for charts)
        chart_data.sort(key=lambda x: x['year'])
        
        return chart_data
    
    def get_revenue_metrics(self, period_data):
        """Extract revenue-related metrics"""
        return {
            'revenue': FinancialDataService.safe_float(period_data.get('Total Revenue')),
            'gross_profit': FinancialDataService.safe_float(period_data.get('Gross Profit')),
            'operating_income': FinancialDataService.safe_float(period_data.get('Operating Income')),
        }
    
    def get_income_metrics(self, period_data):
        """Extract income-related metrics"""
        return {
            'net_income': FinancialDataService.safe_float(period_data.get('Net Income')),
            'operating_income': FinancialDataService.safe_float(period_data.get('Operating Income')),
            'eps': FinancialDataService.safe_float(period_data.get('Basic EPS')),
        }
    
    def get_cashflow_metrics(self, period_data):
        """Extract cashflow metrics"""
        if period_data is None:
            return {}
        
        return {
            'operating_cashflow': FinancialDataService.safe_float(period_data.get('Total Cash From Operating Activities')),
            'investing_cashflow': FinancialDataService.safe_float(period_data.get('Total Cashflows From Investing Activities')),
            'financing_cashflow': FinancialDataService.safe_float(period_data.get('Total Cash From Financing Activities')),
            'free_cashflow': FinancialDataService.safe_float(period_data.get('Free Cash Flow')),
        }
    
    def get_ratio_metrics(self, income_data, balance_data):
        """Calculate ratio metrics"""
        ratios = {}
        
        revenue = FinancialDataService.safe_float(income_data.get('Total Revenue'))
        net_income = FinancialDataService.safe_float(income_data.get('Net Income'))
        total_assets = FinancialDataService.safe_float(balance_data.get('Total Assets')) if balance_data is not None else None
        total_equity = FinancialDataService.safe_float(balance_data.get('Total Stockholder Equity')) if balance_data is not None else None
        
        # Profit margins
        if revenue and net_income:
            ratios['net_margin'] = (net_income / revenue) * 100
        
        # Return ratios
        if net_income and total_assets:
            ratios['roa'] = (net_income / total_assets) * 100
        
        if net_income and total_equity:
            ratios['roe'] = (net_income / total_equity) * 100
        
        return ratios
    
    def get_profitability_metrics(self, income_data, balance_data):
        """Extract profitability metrics"""
        revenue = FinancialDataService.safe_float(income_data.get('Total Revenue'))
        gross_profit = FinancialDataService.safe_float(income_data.get('Gross Profit'))
        operating_income = FinancialDataService.safe_float(income_data.get('Operating Income'))
        
        metrics = {}
        
        if revenue and gross_profit:
            metrics['gross_margin'] = (gross_profit / revenue) * 100
        
        if revenue and operating_income:
            metrics['operating_margin'] = (operating_income / revenue) * 100
        
        return metrics
    
class TechnicalIndicatorsView(APIView):
    """
    Calculate technical indicators for charts
    """
    
    def get(self, request, symbol):
        period = request.GET.get('period', '6mo')
        indicators = request.GET.get('indicators', 'sma,ema,rsi').split(',')
        
        cache_key = f"technical_indicators_{symbol}_{period}_{'_'.join(indicators)}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval='1d')
            
            if hist is None or hist.empty:
                return Response({
                    'symbol': symbol,
                    'indicators': [],
                    'message': 'No historical data available for technical analysis'
                })
            
            # Calculate requested indicators
            indicator_data = self.calculate_indicators(hist, indicators)
            
            response_data = {
                'symbol': symbol,
                'period': period,
                'price_data': self.format_price_data(hist),
                'indicators': indicator_data,
                'metadata': {
                    'last_updated': timezone.now().isoformat()
                }
            }
            
            # Cache for 1 hour
            cache.set(cache_key, response_data, 3600)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error calculating technical indicators for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error calculating technical indicators: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def format_price_data(self, hist_data):
        """Format price data for technical analysis"""
        price_data = []
        
        for index, row in hist_data.iterrows():
            price_data.append({
                'date': index.strftime('%Y-%m-%d'),
                'timestamp': int(index.timestamp() * 1000),
                'close': FinancialDataService.safe_float(row['Close']),
                'high': FinancialDataService.safe_float(row['High']),
                'low': FinancialDataService.safe_float(row['Low']),
                'volume': FinancialDataService.safe_float(row['Volume'])
            })
        
        return price_data
    
    def calculate_indicators(self, hist_data, indicators):
        """Calculate technical indicators"""
        indicator_data = {}
        closes = hist_data['Close'].values
        
        for indicator in indicators:
            if indicator == 'sma':
                indicator_data['sma_20'] = self.calculate_sma(closes, 20)
                indicator_data['sma_50'] = self.calculate_sma(closes, 50)
            elif indicator == 'ema':
                indicator_data['ema_12'] = self.calculate_ema(closes, 12)
                indicator_data['ema_26'] = self.calculate_ema(closes, 26)
            elif indicator == 'rsi':
                indicator_data['rsi_14'] = self.calculate_rsi(closes, 14)
            elif indicator == 'macd':
                macd, signal = self.calculate_macd(closes)
                indicator_data['macd'] = macd
                indicator_data['macd_signal'] = signal
        
        return indicator_data
    
    def calculate_sma(self, data, window):
        """Calculate Simple Moving Average"""
        if len(data) < window:
            return []
        
        sma = []
        for i in range(len(data) - window + 1):
            sma.append(float(np.mean(data[i:i+window])))
        
        return sma
    
    def calculate_ema(self, data, window):
        """Calculate Exponential Moving Average"""
        if len(data) < window:
            return []
        
        try:
            import pandas as pd
            series = pd.Series(data)
            ema = series.ewm(span=window, adjust=False).mean().tolist()
            return [float(x) for x in ema[window-1:]]
        except:
            # Fallback calculation
            ema = []
            multiplier = 2 / (window + 1)
            ema.append(float(data[0]))
            
            for i in range(1, len(data)):
                ema.append(float(data[i] * multiplier + ema[i-1] * (1 - multiplier)))
            
            return ema[window-1:]
    
    def calculate_rsi(self, data, window=14):
        """Calculate Relative Strength Index"""
        if len(data) <= window:
            return []
        
        deltas = np.diff(data)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gains = np.convolve(gains, np.ones(window)/window, mode='valid')
        avg_losses = np.convolve(losses, np.ones(window)/window, mode='valid')
        
        rs = avg_gains / avg_losses
        rsi = 100 - (100 / (1 + rs))
        
        return [float(x) for x in rsi]
    
    def calculate_macd(self, data):
        """Calculate MACD"""
        if len(data) < 26:
            return [], []
        
        ema_12 = self.calculate_ema(data, 12)
        ema_26 = self.calculate_ema(data, 26)
        
        # Align lengths
        min_len = min(len(ema_12), len(ema_26))
        ema_12 = ema_12[-min_len:]
        ema_26 = ema_26[-min_len:]
        
        macd = [ema_12[i] - ema_26[i] for i in range(min_len)]
        signal = self.calculate_ema(macd, 9) if len(macd) >= 9 else []
        
        return macd, signal

class PeerAnalysisView(APIView):
    """Get peer companies and comparative analysis"""
    
    def get(self, request, symbol):
        cache_key = f"peer_analysis_{symbol}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            symbol = symbol.upper().strip()
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get peer companies dynamically from Yahoo Finance
            peers = self.get_dynamic_peers(symbol, info)
            
            # Get comparative analysis
            comparative_analysis = self.get_comparative_analysis(symbol, peers)
            
            response_data = {
                'symbol': symbol,
                'company_name': info.get('longName', info.get('shortName', 'N/A')),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'peers': peers,
                'comparative_analysis': comparative_analysis,
                'last_updated': timezone.now().isoformat()
            }
            
            # Cache for 2 hours
            cache.set(cache_key, response_data, 7200)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching peer analysis for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error fetching peer analysis: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_dynamic_peers(self, symbol, info):
        """Get peer companies dynamically from Yahoo Finance"""
        peers = []
        
        try:
            # Method 1: Try to get peers directly from Yahoo Finance
            yf_peers = info.get('peerGroups', [])
            if not yf_peers:
                yf_peers = info.get('similarCompanies', [])
            
            # Method 2: If no direct peers, use sector-based search
            if not yf_peers:
                yf_peers = self.get_sector_peers_from_yahoo(info.get('sector'), symbol)
            
            # Method 3: Fallback to our enhanced sector mapping
            if not yf_peers:
                yf_peers = self.get_enhanced_sector_peers(info.get('sector'), symbol)
            
            # Limit to top 6 peers for performance
            peer_symbols = yf_peers[:6] if yf_peers else []
            
            # Fetch detailed data for each peer
            for peer_symbol in peer_symbols:
                try:
                    peer_data = self.get_peer_data(peer_symbol)
                    if peer_data:
                        peers.append(peer_data)
                        # Small delay to avoid rate limiting
                        time.sleep(0.2)
                except Exception as e:
                    logger.warning(f"Error fetching data for peer {peer_symbol}: {str(e)}")
                    continue
            
            # If we still don't have enough peers, add some popular ones from the same sector
            if len(peers) < 4:
                additional_peers = self.get_popular_sector_peers(info.get('sector'), symbol)
                for peer_symbol in additional_peers:
                    if len(peers) >= 6:
                        break
                    if peer_symbol not in [p['symbol'] for p in peers]:
                        try:
                            peer_data = self.get_peer_data(peer_symbol)
                            if peer_data:
                                peers.append(peer_data)
                                time.sleep(0.2)
                        except Exception:
                            continue
                    
        except Exception as e:
            logger.error(f"Error getting dynamic peers for {symbol}: {str(e)}")
            # Fallback to basic peers
            peers = self.get_fallback_peers(symbol)
        
        return peers
    
    def get_peer_data(self, symbol):
        """Get detailed data for a peer company"""
        try:
            peer_ticker = yf.Ticker(symbol)
            peer_info = peer_ticker.info
            
            if not peer_info or not peer_info.get('symbol'):
                return None
            
            # Get key financial metrics
            market_cap = FinancialDataService.safe_float(peer_info.get('marketCap'))
            current_price = FinancialDataService.safe_float(
                peer_info.get('currentPrice') or 
                peer_info.get('regularMarketPrice') or
                peer_info.get('previousClose')
            )
            
            return {
                'symbol': symbol,
                'name': peer_info.get('longName', peer_info.get('shortName', symbol)),
                'sector': peer_info.get('sector', 'N/A'),
                'industry': peer_info.get('industry', 'N/A'),
                'current_price': current_price,
                'market_cap': market_cap,
                'pe_ratio': FinancialDataService.safe_float(peer_info.get('trailingPE')),
                'forward_pe': FinancialDataService.safe_float(peer_info.get('forwardPE')),
                'volume': FinancialDataService.safe_float(peer_info.get('volume')),
                'fifty_two_week_high': FinancialDataService.safe_float(peer_info.get('fiftyTwoWeekHigh')),
                'fifty_two_week_low': FinancialDataService.safe_float(peer_info.get('fiftyTwoWeekLow')),
                'beta': FinancialDataService.safe_float(peer_info.get('beta')),
                'dividend_yield': FinancialDataService.safe_float(peer_info.get('dividendYield')),
                'profit_margins': FinancialDataService.safe_float(peer_info.get('profitMargins')),
                'revenue_growth': FinancialDataService.safe_float(peer_info.get('revenueGrowth')),
            }
        except Exception as e:
            logger.warning(f"Error getting peer data for {symbol}: {str(e)}")
            return None
    
    def get_sector_peers_from_yahoo(self, sector, exclude_symbol):
        """Try to find sector peers using Yahoo Finance search"""
        if not sector:
            return []
            
        try:
            # Yahoo Finance doesn't have a direct sector search API, but we can use some known symbols
            # This is a workaround since Yahoo Finance API limitations
            sector_mapping = {
                'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'ADBE', 'INTC', 'CSCO', 'ORCL', 'IBM'],
                'Financial Services': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA', 'PYPL'],
                'Healthcare': ['JNJ', 'PFE', 'UNH', 'MRK', 'ABT', 'TMO', 'LLY', 'GILD', 'AMGN', 'BMY'],
                'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'TJX', 'LOW', 'TGT', 'BKNG'],
                'Consumer Defensive': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'CL', 'UL', 'MDLZ', 'MO', 'PM'],
                'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'MPC', 'VLO', 'OXY', 'KMI'],
                'Industrials': ['BA', 'CAT', 'HON', 'UPS', 'FDX', 'GE', 'MMM', 'RTX', 'LMT', 'DE'],
                'Communication Services': ['T', 'VZ', 'CMCSA', 'DIS', 'NFLX', 'TMUS', 'CHTR', 'EA', 'ATVI', 'TTWO'],
                'Utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'SRE', 'XEL', 'PCG', 'WEC'],
                'Real Estate': ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'AVB', 'WELL', 'DLR'],
            }
            
            return sector_mapping.get(sector, [])
        except Exception as e:
            logger.warning(f"Error getting sector peers from Yahoo: {str(e)}")
            return []
    
    def get_enhanced_sector_peers(self, sector, exclude_symbol):
        """Enhanced sector-based peer finding"""
        # This would ideally use a financial database or more sophisticated matching
        # For now, we'll use an expanded mapping
        enhanced_sectors = {
            'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'ADBE', 'INTC', 'CSCO', 'ORCL', 'IBM', 
                          'QCOM', 'TXN', 'AVGO', 'CRM', 'NOW', 'ADSK', 'INTU', 'AMD', 'MU', 'AMAT'],
            'Financial Services': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA', 'PYPL',
                                  'SCHW', 'BLK', 'SPGI', 'MCO', 'ICE', 'CME', 'BX', 'KKR', 'APO'],
            # Add more sectors as needed...
        }
        
        return enhanced_sectors.get(sector, [])
    
    def get_popular_sector_peers(self, sector, exclude_symbol):
        """Get popular companies from the same sector"""
        popular_by_sector = {
            'Technology': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'ADBE'],
            'Financial Services': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'PYPL'],
            'Healthcare': ['JNJ', 'PFE', 'UNH', 'MRK', 'ABT', 'TMO', 'LLY', 'GILD'],
            'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'TJX', 'LOW'],
            'Consumer Defensive': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'CL', 'UL', 'MDLZ'],
        }
        
        return popular_by_sector.get(sector, ['AAPL', 'MSFT', 'GOOGL', 'AMZN'])
    
    def get_fallback_peers(self, symbol):
        """Final fallback if all else fails"""
        return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META']
    
    def get_comparative_analysis(self, symbol, peers):
        """Generate comparative analysis between company and peers"""
        try:
            main_ticker = yf.Ticker(symbol)
            main_info = main_ticker.info
            
            analysis = {
                'valuation_metrics': self.compare_valuation(main_info, peers),
                'performance_metrics': self.compare_performance(main_info, peers),
                'growth_metrics': self.compare_growth(main_info, peers),
                'risk_metrics': self.compare_risk(main_info, peers),
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in comparative analysis for {symbol}: {str(e)}")
            return {}
    
    def compare_valuation(self, main_info, peers):
        """Compare valuation metrics"""
        main_pe = FinancialDataService.safe_float(main_info.get('trailingPE'))
        main_market_cap = FinancialDataService.safe_float(main_info.get('marketCap'))
        
        peer_data = []
        for peer in peers:
            peer_pe = peer.get('pe_ratio')
            peer_market_cap = peer.get('market_cap')
            
            if main_pe and peer_pe:
                pe_comparison = ((main_pe - peer_pe) / peer_pe) * 100
            else:
                pe_comparison = None
                
            peer_data.append({
                'symbol': peer['symbol'],
                'pe_ratio': peer_pe,
                'market_cap': peer_market_cap,
                'pe_comparison': pe_comparison,
            })
        
        return {
            'main_company': {
                'pe_ratio': main_pe,
                'market_cap': main_market_cap,
            },
            'peers': peer_data
        }
    
    def compare_performance(self, main_info, peers):
        """Compare performance metrics"""
        main_price = FinancialDataService.safe_float(main_info.get('currentPrice'))
        main_52w_high = FinancialDataService.safe_float(main_info.get('fiftyTwoWeekHigh'))
        
        peer_data = []
        for peer in peers:
            peer_price = peer.get('current_price')
            peer_52w_high = peer.get('fifty_two_week_high')
            
            if main_price and peer_price and main_52w_high and peer_52w_high:
                price_to_52w_high_main = (main_price / main_52w_high) * 100
                price_to_52w_high_peer = (peer_price / peer_52w_high) * 100
                comparison = price_to_52w_high_main - price_to_52w_high_peer
            else:
                comparison = None
                
            peer_data.append({
                'symbol': peer['symbol'],
                'current_price': peer_price,
                'price_to_52w_high': peer_52w_high,
                'performance_comparison': comparison,
            })
        
        return {
            'main_company': {
                'current_price': main_price,
                'price_to_52w_high': main_52w_high,
            },
            'peers': peer_data
        }
    
    def compare_growth(self, main_info, peers):
        """Compare growth metrics (simplified)"""
        # This would typically use historical data for revenue/earnings growth
        # For demo, we'll use some placeholder metrics
        return {
            'message': 'Growth comparison requires historical financial data',
            'peers': [{'symbol': peer['symbol'], 'growth_estimate': None} for peer in peers]
        }
    
    def compare_risk(self, main_info, peers):
        """Compare risk metrics"""
        main_beta = FinancialDataService.safe_float(main_info.get('beta'))
        
        peer_data = []
        for peer in peers:
            # Beta is a common risk metric
            # For demo, we'll assign random betas or use sector averages
            peer_beta = 1.0 + (hash(peer['symbol']) % 100) / 100  # Placeholder
            
            peer_data.append({
                'symbol': peer['symbol'],
                'beta': peer_beta,
                'risk_comparison': main_beta - peer_beta if main_beta else None,
            })
        
        return {
            'main_company': {
                'beta': main_beta,
            },
            'peers': peer_data
        }
    
class CustomPeerSearchView(APIView):
    """Search for companies to add to peer analysis"""
    
    def post(self, request, symbol):
        try:
            symbol = symbol.upper().strip()
            search_symbols = request.data.get('symbols', [])
            merge_with_existing = request.data.get('merge', False)
            existing_peers = request.data.get('existing_peers', [])
            
            if not search_symbols:
                return Response(
                    {"error": "No symbols provided for comparison"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get main company data
            main_ticker = yf.Ticker(symbol)
            main_info = main_ticker.info
            
            if not main_info:
                return Response(
                    {"error": f"Company with symbol '{symbol}' not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get data for searched companies
            new_peers = []
            for search_symbol in search_symbols[:8]:  # Increased limit
                try:
                    # Skip if already in existing peers
                    if merge_with_existing and any(p.get('symbol') == search_symbol for p in existing_peers):
                        continue
                        
                    peer_data = self.get_peer_data(search_symbol)
                    if peer_data:
                        new_peers.append(peer_data)
                        time.sleep(0.2)  # Rate limiting
                except Exception as e:
                    logger.warning(f"Error fetching data for {search_symbol}: {str(e)}")
                    continue
            
            # Merge with existing peers if requested
            if merge_with_existing and existing_peers:
                all_peers = existing_peers + new_peers
            else:
                all_peers = new_peers
            
            # Generate comparative analysis
            comparative_analysis = self.get_comparative_analysis(main_info, all_peers)
            
            response_data = {
                'symbol': symbol,
                'company_name': main_info.get('longName', main_info.get('shortName', 'N/A')),
                'custom_search': True,
                'searched_symbols': search_symbols,
                'peers': all_peers,
                'comparative_analysis': comparative_analysis,
                'last_updated': timezone.now().isoformat()
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in custom peer search for {symbol}: {str(e)}")
            return Response(
                {"error": f"Error in custom peer search: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_peer_data(self, symbol):
        """Get detailed data for a peer company"""
        try:
            peer_ticker = yf.Ticker(symbol)
            peer_info = peer_ticker.info
            
            if not peer_info or not peer_info.get('symbol'):
                return None
            
            return {
                'symbol': symbol,
                'name': peer_info.get('longName', peer_info.get('shortName', symbol)),
                'sector': peer_info.get('sector', 'N/A'),
                'industry': peer_info.get('industry', 'N/A'),
                'current_price': FinancialDataService.safe_float(peer_info.get('currentPrice')),
                'market_cap': FinancialDataService.safe_float(peer_info.get('marketCap')),
                'pe_ratio': FinancialDataService.safe_float(peer_info.get('trailingPE')),
                'volume': FinancialDataService.safe_float(peer_info.get('volume')),
                'fifty_two_week_high': FinancialDataService.safe_float(peer_info.get('fiftyTwoWeekHigh')),
                'fifty_two_week_low': FinancialDataService.safe_float(peer_info.get('fiftyTwoWeekLow')),
                'beta': FinancialDataService.safe_float(peer_info.get('beta')),
            }
        except Exception as e:
            logger.warning(f"Error getting peer data for {symbol}: {str(e)}")
            return None
    
    def get_comparative_analysis(self, main_info, peers):
        """Generate comparative analysis"""
        # Implementation of comparison logic (similar to previous)
        # ... your existing comparison logic here
        return {
            'valuation_metrics': self.compare_valuation(main_info, peers),
            'performance_metrics': self.compare_performance(main_info, peers),
            'risk_metrics': self.compare_risk(main_info, peers),
        }
    
    def compare_valuation(self, main_info, peers):
        """Compare valuation metrics"""
        main_pe = FinancialDataService.safe_float(main_info.get('trailingPE'))
        main_market_cap = FinancialDataService.safe_float(main_info.get('marketCap'))
        
        peer_data = []
        for peer in peers:
            peer_pe = peer.get('pe_ratio')
            
            if main_pe and peer_pe:
                pe_comparison = ((main_pe - peer_pe) / peer_pe) * 100
            else:
                pe_comparison = None
                
            peer_data.append({
                'symbol': peer['symbol'],
                'pe_ratio': peer_pe,
                'market_cap': peer.get('market_cap'),
                'pe_comparison': pe_comparison,
            })
        
        return {
            'main_company': {
                'pe_ratio': main_pe,
                'market_cap': main_market_cap,
            },
            'peers': peer_data
        }
    
    def compare_performance(self, main_info, peers):
        """Compare performance metrics"""
        main_price = FinancialDataService.safe_float(main_info.get('currentPrice'))
        
        peer_data = []
        for peer in peers:
            peer_price = peer.get('current_price')
            
            peer_data.append({
                'symbol': peer['symbol'],
                'current_price': peer_price,
            })
        
        return {
            'main_company': {
                'current_price': main_price,
            },
            'peers': peer_data
        }
    
    def compare_risk(self, main_info, peers):
        """Compare risk metrics"""
        main_beta = FinancialDataService.safe_float(main_info.get('beta'))
        
        peer_data = []
        for peer in peers:
            peer_beta = peer.get('beta')
            
            peer_data.append({
                'symbol': peer['symbol'],
                'beta': peer_beta,
                'risk_comparison': main_beta - peer_beta if main_beta and peer_beta else None,
            })
        
        return {
            'main_company': {
                'beta': main_beta,
            },
            'peers': peer_data
        }