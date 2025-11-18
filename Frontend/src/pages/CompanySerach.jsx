import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  TrendingUp, 
  BarChart3, 
  Building2, 
  ArrowRight, 
  AreaChart,
  Star, 
  Loader2, 
  DollarSign, 
  Users,
  TrendingDown,
  GitCompare,
  User,
  Building,
  AlertCircle,
  CheckCircle2,
  FileText,
  CreditCard,
  PieChart,
  LineChart,
  BarChart
} from 'lucide-react';
import { 
  LineChart as RechartsLine, 
  BarChart as RechartsBar, 
  PieChart as RechartsPie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Line, 
  Bar,
  Pie,
  Cell,
  Area,
  ResponsiveContainer
} from 'recharts';
import { companySearchService, testAuthStatus } from '../api/index';

const CompanySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [requestLog, setRequestLog] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [ratiosData, setRatiosData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line', 'area', 'bar'
  const [chartPeriod, setChartPeriod] = useState('1y'); // '1m', '3m', '6m', '1y', '5y'
  const [financialChartData, setFinancialChartData] = useState(null);
  const [activeFinancialChart, setActiveFinancialChart] = useState('revenue'); 
  const [peerAnalysisData, setPeerAnalysisData] = useState(null);
  const [activeComparisonMetric, setActiveComparisonMetric] = useState('valuation');
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const toolsMenuRef = useRef(null);
  const [customPeerSearch, setCustomPeerSearch] = useState('');
  const [isSearchingPeers, setIsSearchingPeers] = useState(false);
  const [selectedPeers, setSelectedPeers] = useState([]);
  const [peerSuggestions, setPeerSuggestions] = useState([]);
  const [showPeerSuggestions, setShowPeerSuggestions] = useState(false);



  // Enhanced popular stocks list
  const enhancedPopularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
    { symbol: 'PG', name: 'Procter & Gamble', exchange: 'NYSE' },
    { symbol: 'UNH', name: 'UnitedHealth Group', exchange: 'NYSE' },
    { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE' },
    { symbol: 'DIS', name: 'Walt Disney Company', exchange: 'NYSE' },
    { symbol: 'PYPL', name: 'PayPal Holdings', exchange: 'NASDAQ' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
    { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ' },
    { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE' },
    { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ' },
    { symbol: 'CSCO', name: 'Cisco Systems', exchange: 'NASDAQ' }
  ];

  // Add to request log for debugging
  const addToRequestLog = (method, endpoint, status, data = null) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      status,
      data: data ? JSON.stringify(data).substring(0, 100) + '...' : null
    };
    setRequestLog(prev => [logEntry, ...prev.slice(0, 10)]); // Keep last 10 requests
    console.log(`API Request: ${method} ${endpoint} - ${status}`, data);
  };

  useEffect(() => {
    checkBackendConnection();
    fetchPopularSearches();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setShowToolsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkBackendConnection = async () => {
    try {
      setBackendStatus('checking');
      addToRequestLog('GET', '/health-check', 'pending');
      
      // Test the company search endpoint directly
      const response = await companySearchService.search('AAPL');
      addToRequestLog('GET', '/search/?q=AAPL', 'success', response);
      
      setBackendStatus('connected');
    } catch (error) {
      addToRequestLog('GET', '/health-check', 'error', error.message);
      setBackendStatus('error');
      console.error('Backend connection check failed:', error);
    }
  };

  const fetchPopularSearches = async () => {
    try {
      addToRequestLog('GET', '/popular-searches/', 'pending');
      const data = await companySearchService.getPopularSearches();
      addToRequestLog('GET', '/popular-searches/', 'success', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        setPopularSearches(data);
      } else {
        setPopularSearches(enhancedPopularStocks.slice(0, 8));
      }
    } catch (error) {
      addToRequestLog('GET', '/popular-searches/', 'error', error.message);
      console.error('Error fetching popular searches:', error);
      setPopularSearches(enhancedPopularStocks.slice(0, 8));
    }
  };

  const handlePeerSearchChange = async (value) => {
  setCustomPeerSearch(value);
  
  if (value.length > 1) {
    const suggestions = await fetchPeerSuggestions(value);
    setPeerSuggestions(suggestions);
    setShowPeerSuggestions(true);
  } else {
    setShowPeerSuggestions(false);
  }
};

const fetchPeerSuggestions = async (query) => {
  try {
    const results = await companySearchService.getSearchSuggestions(query);
    return results.slice(0, 5); // Limit to 5 suggestions
  } catch (error) {
    return [];
  }
};

const handleSuggestionSelect = (suggestion) => {
  setCustomPeerSearch(suggestion.symbol);
  setShowPeerSuggestions(false);
};

  // Fixed suggestion system with proper backend requests
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 1) {
      return [];
    }

    try {
      setIsFetchingSuggestions(true);
      addToRequestLog('GET', `/search-suggestions/?q=${query}`, 'pending');
      
      let backendResults = [];
      try {
        // Use the new search suggestions endpoint
        const data = await companySearchService.getSearchSuggestions(query);
        addToRequestLog('GET', `/search-suggestions/?q=${query}`, 'success', data);
        
        if (data && Array.isArray(data)) {
          backendResults = data;
        }
      } catch (backendError) {
        addToRequestLog('GET', `/search-suggestions/?q=${query}`, 'error', backendError.message);
        console.log('Backend suggestions failed, using fallback');
      }

      // If no results from backend, use fallback
      if (backendResults.length === 0) {
        backendResults = getEnhancedFallbackSuggestions(query);
      }

      return backendResults.slice(0, 10);
    } catch (error) {
      console.error('Error in fetchSuggestions:', error);
      return getEnhancedFallbackSuggestions(query);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  // Update the fallback function to include Indian companies
  const getEnhancedFallbackSuggestions = (query) => {
    const queryLower = query.toLowerCase().trim();
    
    const allCompanies = [
      // US Companies
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'USA' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', country: 'USA' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'USA' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', country: 'USA' },
      { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', country: 'USA' },
      { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', country: 'USA' },
      
      // Indian Companies
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', country: 'India' },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'TITAN.NS', name: 'Titan Company Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'WIPRO.NS', name: 'Wipro Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'NESTLEIND.NS', name: 'Nestlé India Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'NTPC.NS', name: 'NTPC Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'ONGC.NS', name: 'Oil and Natural Gas Corporation Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'COALINDIA.NS', name: 'Coal India Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'CIPLA.NS', name: 'Cipla Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Laboratories Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'ZOMATO.NS', name: 'Zomato Limited', exchange: 'NSE', country: 'India' },
      { symbol: 'PAYTM.NS', name: 'One 97 Communications Limited', exchange: 'NSE', country: 'India' },
    ];

    return allCompanies.filter(company => 
      company.symbol.toLowerCase().includes(queryLower) || 
      company.name.toLowerCase().includes(queryLower)
    ).slice(0, 10);
  };

  const handleSearchInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 0) {
      setShowSuggestions(true);
      const backendSuggestions = await fetchSuggestions(value);
      setSuggestions(backendSuggestions);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setSearchResults([]);
    setSelectedCompany(null);
    setCompanyData(null);
    setError('');
    setShowSuggestions(false);

    try {
      addToRequestLog('GET', `/search/?q=${searchQuery}`, 'pending');
      
      let searchResults = [];
      let backendData = null;
      
      // Try backend search
      try {
        backendData = await companySearchService.search(searchQuery);
        addToRequestLog('GET', `/search/?q=${searchQuery}`, 'success', backendData);
        
        if (backendData) {
          if (Array.isArray(backendData)) {
            searchResults = backendData;
          } else if (backendData.symbol) {
            searchResults = [backendData];
          } else if (backendData.results) {
            searchResults = backendData.results;
          } else if (backendData.data) {
            searchResults = backendData.data;
          }
        }
      } catch (backendError) {
        addToRequestLog('GET', `/search/?q=${searchQuery}`, 'error', backendError.message);
        console.log('Backend search failed, using fallback');
      }

      // If no results from backend, use fallback
      if (searchResults.length === 0) {
        searchResults = getEnhancedFallbackSuggestions(searchQuery);
      }

      if (searchResults.length > 0) {
        setSearchResults(searchResults);
        const company = searchResults[0];
        setSelectedCompany(company);
        await fetchCompanyData(company.symbol);
      } else {
        setError('Company not found. Try popular symbols like AAPL, MSFT, TSLA');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Error searching for company. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (company) => {
    setSearchQuery(company.symbol);
    setSelectedCompany(company);
    setError('');
    setShowSuggestions(false);
    setIsLoading(true);
    
    try {
      await fetchCompanyData(company.symbol);
    } catch (error) {
      setError('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePopularSearchClick = async (company) => {
    setSearchQuery(company.symbol);
    setSelectedCompany(company);
    setError('');
    setShowSuggestions(false);
    setIsLoading(true);
    
    try {
      await fetchCompanyData(company.symbol);
    } catch (error) {
      setError('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  // Add the missing function definitions
 // Enhanced historical data function
const fetchHistoricalData = async (symbol) => {
  try {
    setIsLoading(true);
    
    // Try to get real historical data from backend
    let backendData = null;
    try {
      const response = await companySearchService.getHistoricalData(symbol, chartPeriod);
      addToRequestLog('GET', `/historical/${symbol}?period=${chartPeriod}`, 'success', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        backendData = response.data.map(item => ({
          date: item.date || item.Date || item.timestamp,
          price: item.price || item.Close || item.close,
          volume: item.volume || item.Volume,
          open: item.open || item.Open,
          high: item.high || item.High,
          low: item.low || item.Low,
          change: item.change || ((item.price || item.Close) - (item.open || item.Open))
        }));
      }
    } catch (error) {
      addToRequestLog('GET', `/historical/${symbol}?period=${chartPeriod}`, 'error', error.message);
      console.log('Backend historical data failed, using demo data');
    }

    if (backendData && backendData.length > 0) {
      setHistoricalData(backendData);
    } else {
      // Generate demo historical data
      const demoData = generateDemoHistoricalData(symbol, chartPeriod);
      setHistoricalData(demoData);
    }

    // Also generate financial chart data
    generateFinancialChartData();
    
  } catch (error) {
    console.error('Error fetching historical data:', error);
    const demoData = generateDemoHistoricalData(symbol, chartPeriod);
    setHistoricalData(demoData);
    generateFinancialChartData();
  } finally {
    setIsLoading(false);
  }
};
// Generate demo historical price data
const generateDemoHistoricalData = (symbol, period = '1y') => {
  const data = [];
  const basePrice = 100 + Math.random() * 100;
  let currentPrice = basePrice;
  const today = new Date();
  
  let days;
  switch (period) {
    case '1m': days = 30; break;
    case '3m': days = 90; break;
    case '6m': days = 180; break;
    case '5y': days = 1825; break;
    default: days = 365; // 1 year
  }

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random walk for stock price
    const change = (Math.random() - 0.5) * 4;
    currentPrice = Math.max(10, currentPrice + change);
    
    const volume = 1000000 + Math.floor(Math.random() * 5000000);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2)),
      volume: volume,
      open: parseFloat((currentPrice + (Math.random() - 0.5) * 2).toFixed(2)),
      high: parseFloat((currentPrice + Math.random() * 3).toFixed(2)),
      low: parseFloat((currentPrice - Math.random() * 3).toFixed(2)),
      change: parseFloat(change.toFixed(2))
    });
  }
  
  return data;
};

// Generate financial metrics chart data
const generateFinancialChartData = () => {
  if (!companyData) return;

  const quarters = ['Q1 2022', 'Q2 2022', 'Q3 2022', 'Q4 2022', 'Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023'];
  const revenueData = [];
  const incomeData = [];
  const cashflowData = [];
  const ratioData = [];

  const baseRevenue = 1000000000;
  
  quarters.forEach((quarter, index) => {
    const growth = 1 + (index * 0.05); // 5% growth per quarter
    const revenue = baseRevenue * growth * (0.9 + Math.random() * 0.2);
    const netIncome = revenue * (0.1 + Math.random() * 0.1);
    const operatingCashFlow = revenue * (0.15 + Math.random() * 0.1);
    
    revenueData.push({
      period: quarter,
      revenue: revenue,
      grossProfit: revenue * (0.4 + Math.random() * 0.2),
      operatingIncome: revenue * (0.2 + Math.random() * 0.1)
    });
    
    incomeData.push({
      period: quarter,
      netIncome: netIncome,
      operatingIncome: revenue * (0.15 + Math.random() * 0.1),
      eps: (netIncome / 1000000000) * (8 + Math.random() * 4)
    });
    
    cashflowData.push({
      period: quarter,
      operating: operatingCashFlow,
      investing: -operatingCashFlow * (0.3 + Math.random() * 0.2),
      financing: -operatingCashFlow * (0.1 + Math.random() * 0.1),
      freeCashFlow: operatingCashFlow * (0.6 + Math.random() * 0.2)
    });
    
    ratioData.push({
      period: quarter,
      peRatio: 15 + Math.random() * 20,
      roe: 8 + Math.random() * 12,
      profitMargin: (netIncome / revenue) * 100,
      debtToEquity: 30 + Math.random() * 40
    });
  });

  setFinancialChartData({
    revenue: revenueData,
    income: incomeData,
    cashflow: cashflowData,
    ratios: ratioData
  });
};

  

  const generateDemoAnalysis = (symbol) => {
    return {
      key_metrics: {
        market_cap: 1000000000 * (50 + Math.random() * 50),
        current_pe: 15 + Math.random() * 25,
        return_on_equity: 10 + Math.random() * 15,
        debt_to_equity: 30 + Math.random() * 40
      },
      analysis: {
        profitability_analysis: `${symbol} shows strong profitability with consistent revenue growth and healthy margins.`,
        valuation_analysis: `Current valuation appears reasonable compared to industry peers.`,
        financial_health: `Strong balance sheet with adequate liquidity and manageable debt levels.`,
        investment_recommendation: `Consider for long-term growth portfolio with moderate risk tolerance.`
      },
      quarterly_results: [
        {
          period: 'Q4 2023',
          revenue: 1000000000 * (1.2 + Math.random() * 0.5),
          operating_income: 1000000000 * (0.3 + Math.random() * 0.2),
          net_income: 1000000000 * (0.2 + Math.random() * 0.15)
        }
      ]
    };
  };

  const generateDemoRatios = (symbol) => {
    return {
      profitability_ratios: {
        gross_margin: 40 + Math.random() * 20,
        operating_margin: 15 + Math.random() * 15,
        net_margin: 10 + Math.random() * 10,
        return_on_assets: 8 + Math.random() * 8,
        return_on_equity: 12 + Math.random() * 12
      },
      valuation_ratios: {
        price_to_earnings: 15 + Math.random() * 25,
        price_to_sales: 3 + Math.random() * 5,
        price_to_book: 2 + Math.random() * 4,
        ev_to_ebitda: 10 + Math.random() * 15
      },
      leverage_ratios: {
        debt_to_equity: 30 + Math.random() * 40,
        debt_to_assets: 20 + Math.random() * 30,
        interest_coverage: 8 + Math.random() * 12
      }
    };
  };

  // Enhanced company data fetching with individual API calls
  const fetchCompanyData = async (symbol) => {
  try {
    setIsLoading(true);
    
    // Fetch all data in parallel
    const [comprehensiveData, analysis, ratios, peerAnalysis] = await Promise.all([
      companySearchService.getCompanyData(symbol).catch(() => null),
      companySearchService.getCompanyAnalysis(symbol).catch(() => null),
      companySearchService.getFinancialRatios(symbol).catch(() => null),
      companySearchService.getPeerAnalysis(symbol).catch(() => null)
    ]);

    if (comprehensiveData && !comprehensiveData.error) {
      setCompanyData(comprehensiveData);
    } else {
      setCompanyData(generateEnhancedDemoData(symbol));
    }

    setAnalysisData(analysis || generateDemoAnalysis(symbol));
    setRatiosData(ratios || generateDemoRatios(symbol));
    setPeerAnalysisData(peerAnalysis || generateDemoPeerAnalysis(symbol));
    await fetchHistoricalData(symbol);
    
  } catch (error) {
    setError('Using demo data - backend connection issue');
    setCompanyData(generateEnhancedDemoData(symbol));
    setAnalysisData(generateDemoAnalysis(symbol));
    setRatiosData(generateDemoRatios(symbol));
    setPeerAnalysisData(generateDemoPeerAnalysis(symbol));
    await fetchHistoricalData(symbol);
  } finally {
    setIsLoading(false);
  }
};

  const fetchPeerAnalysis = async (symbol) => {
  try {
    setIsLoading(true);
    const data = await companySearchService.getPeerAnalysis(symbol);
    setPeerAnalysisData(data);
  } catch (error) {
    console.error('Error fetching peer analysis:', error);
    // You could set demo data here as fallback
    setPeerAnalysisData(null);
  } finally {
    setIsLoading(false);
  }
};

const generateDemoPeerAnalysis = (symbol) => {
  const demoPeers = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      current_price: 150 + Math.random() * 50,
      market_cap: 2000000000000 + Math.random() * 500000000000,
      pe_ratio: 25 + Math.random() * 10,
      volume: 10000000 + Math.random() * 50000000,
      fifty_two_week_high: 180 + Math.random() * 20,
      fifty_two_week_low: 120 + Math.random() * 20,
      beta: 1.2 + Math.random() * 0.3
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      sector: 'Technology',
      current_price: 300 + Math.random() * 100,
      market_cap: 2200000000000 + Math.random() * 500000000000,
      pe_ratio: 30 + Math.random() * 10,
      volume: 20000000 + Math.random() * 50000000,
      fifty_two_week_high: 350 + Math.random() * 20,
      fifty_two_week_low: 250 + Math.random() * 20,
      beta: 0.9 + Math.random() * 0.3
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      sector: 'Technology',
      current_price: 120 + Math.random() * 50,
      market_cap: 1800000000000 + Math.random() * 500000000000,
      pe_ratio: 22 + Math.random() * 8,
      volume: 15000000 + Math.random() * 50000000,
      fifty_two_week_high: 140 + Math.random() * 20,
      fifty_two_week_low: 100 + Math.random() * 20,
      beta: 1.1 + Math.random() * 0.3
    }
  ];

  return {
    symbol: symbol,
    company_name: `${symbol} Corporation`,
    sector: 'Technology',
    industry: 'Software & Services',
    peers: demoPeers,
    comparative_analysis: {
      valuation_metrics: {
        main_company: { 
          pe_ratio: 20 + Math.random() * 15, 
          market_cap: 1500000000000 
        },
        peers: demoPeers.map(peer => ({
          symbol: peer.symbol,
          pe_ratio: peer.pe_ratio,
          market_cap: peer.market_cap,
          pe_comparison: (20 - peer.pe_ratio) / peer.pe_ratio * 100
        }))
      },
      performance_metrics: {
        main_company: { 
          current_price: 100 + Math.random() * 50 
        },
        peers: demoPeers.map(peer => ({
          symbol: peer.symbol,
          current_price: peer.current_price
        }))
      },
      risk_metrics: {
        main_company: { 
          beta: 1.0 + Math.random() * 0.5 
        },
        peers: demoPeers.map(peer => ({
          symbol: peer.symbol,
          beta: peer.beta,
          risk_comparison: (1.0 - peer.beta) * 100
        }))
      }
    }
  };
};

  // Enhanced demo data with realistic financial information
  const generateEnhancedDemoData = (symbol) => {
    const baseValue = 1000000000;
    const randomMultiplier = () => 0.5 + Math.random();
    
    return {
      company_info: {
        name: `${symbol} Corporation`,
        exchange: 'NASDAQ',
        sector: 'Technology',
        industry: 'Software & Services',
        employees: 5000 + Math.floor(Math.random() * 45000),
        description: `${symbol} Corporation is a leading technology company specializing in innovative software solutions and digital services. The company has demonstrated strong growth and market leadership in its sector.`,
        website: `https://www.${symbol.toLowerCase()}.com`,
        country: 'United States',
        currency: 'USD'
      },
      stock_price: {
        current_price: 150 + Math.random() * 200,
        previous_close: 145 + Math.random() * 200,
        market_cap: baseValue * (50 + Math.random() * 50),
        pe_ratio: 15 + Math.random() * 25,
        fifty_two_week_high: 200 + Math.random() * 100,
        fifty_two_week_low: 100 + Math.random() * 50,
        volume: 1000000 + Math.floor(Math.random() * 9000000),
        beta: 0.8 + Math.random() * 0.8
      },
      balance_sheet: [
        {
          period: '2023-12-31',
          total_assets: baseValue * 2 * randomMultiplier(),
          total_liabilities: baseValue * randomMultiplier(),
          total_equity: baseValue * randomMultiplier(),
          cash_and_cash_equivalents: baseValue * 0.3 * randomMultiplier(),
          accounts_receivable: baseValue * 0.2 * randomMultiplier(),
          inventory: baseValue * 0.1 * randomMultiplier(),
          property_plant_equipment: baseValue * 0.5 * randomMultiplier(),
          long_term_debt: baseValue * 0.4 * randomMultiplier()
        }
      ],
      income_statement: [
        {
          period: '2023-12-31',
          total_revenue: baseValue * 1.5 * randomMultiplier(),
          gross_profit: baseValue * 0.9 * randomMultiplier(),
          operating_income: baseValue * 0.4 * randomMultiplier(),
          net_income: baseValue * 0.3 * randomMultiplier(),
          eps: 2 + Math.random() * 3
        }
      ],
      cash_flow: [
        {
          period: '2023-12-31',
          operating_cash_flow: baseValue * 0.4 * randomMultiplier(),
          investing_cash_flow: -baseValue * 0.2 * randomMultiplier(),
          financing_cash_flow: -baseValue * 0.1 * randomMultiplier(),
          net_cash_flow: baseValue * 0.1 * randomMultiplier(),
          free_cash_flow: baseValue * 0.25 * randomMultiplier()
        }
      ],
      recommendations: [
        { analyst: 'Morgan Stanley', rating: 'Overweight', price_target: 180 + Math.random() * 50 },
        { analyst: 'Goldman Sachs', rating: 'Buy', price_target: 190 + Math.random() * 40 }
      ]
    };
  };

  // Formatting utilities - moved to top level of component
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const calculatePriceChange = () => {
    if (!companyData?.stock_price?.current_price || !companyData?.stock_price?.previous_close) {
      return { change: 0, percent: 0 };
    }
    const current = companyData.stock_price.current_price;
    const previous = companyData.stock_price.previous_close;
    const change = current - previous;
    const percent = previous !== 0 ? (change / previous) * 100 : 0;
    return { change, percent };
  };

  const priceChange = calculatePriceChange();

  const handleCustomPeerSearch = async () => {
  if (!customPeerSearch.trim()) return;
  
  try {
    setIsSearchingPeers(true);
    
    // Parse symbols (comma separated)
    const symbols = customPeerSearch
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);
    
    if (symbols.length === 0) {
      setError('Please enter valid stock symbols');
      return;
    }

    // Prepare request data
    const requestData = {
      symbols: symbols,
      merge: true, // Always merge with existing
      existing_peers: peerAnalysisData?.peers || [] // Send current peers
    };

    const customPeersData = await companySearchService.searchCustomPeers(
      selectedCompany.symbol, 
      requestData
    );
    
    if (customPeersData && customPeersData.peers) {
      setPeerAnalysisData(customPeersData);
    }
    
    setCustomPeerSearch('');
    
  } catch (error) {
    console.error('Error in custom peer search:', error);
    setError('Failed to search for custom peers');
  } finally {
    setIsSearchingPeers(false);
  }
};
const renderPeerAnalysisTab = () => {
  if (!peerAnalysisData) {
    return (
      <div style={styles.noData}>
        <Users size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>No peer analysis data available</p>
        <button 
          onClick={() => fetchPeerAnalysis(selectedCompany.symbol)}
          style={styles.retryButton}
        >
          Load Peer Analysis
        </button>
      </div>
    );
  }


  const comparisonMetrics = {
    valuation: 'Valuation (P/E Ratio)',
    performance: 'Performance',
    growth: 'Growth',
    risk: 'Risk (Beta)'
  };

  return (
    <div>
      {/* Header with Search Toggle */}
      <div style={styles.peerHeader}>
        <h3 style={styles.peerTitle}>Peer Company Analysis</h3>
        <p style={styles.peerSubtitle}>
          {peerAnalysisData.custom_search 
            ? `Custom comparison with ${peerAnalysisData.searched_symbols.join(', ')}`
            : `Comparing ${peerAnalysisData.company_name} with sector peers in ${peerAnalysisData.industry}`
          }
        </p>
        
        {/* Custom Search Section */}
        // Update the search box in renderPeerAnalysisTab
        // In your renderPeerAnalysisTab function, update the search section:
        <div style={styles.searchSection}>
          <div style={styles.searchBox}>
            <div style={styles.searchInputContainer}>
              <input
                type="text"
                value={customPeerSearch}
                onChange={(e) => setCustomPeerSearch(e.target.value.toUpperCase())}
                placeholder="Enter symbols to compare (e.g., AAPL,MSFT,GOOGL)"
                style={styles.searchInput}
                disabled={isSearchingPeers}
              />
              {isSearchingPeers && (
                <div style={styles.searchingIndicator}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Adding companies to comparison...
                </div>
              )}
            </div>
            <button
              onClick={handleCustomPeerSearch}
              disabled={isSearchingPeers || !customPeerSearch.trim()}
              style={{
                ...styles.searchButton,
                backgroundColor: isSearchingPeers || !customPeerSearch.trim() ? '#a0aec0' : '#4a90e2'
              }}
            >
              {isSearchingPeers ? 'Adding...' : 'Add to Comparison'}
            </button>
          </div>
          
          {/* Show current comparison count */}
          {peerAnalysisData?.peers && (
            <div style={styles.comparisonInfo}>
              <span style={styles.infoText}>
                Comparing {selectedCompany.symbol} with {peerAnalysisData.peers.length} companies
              </span>
              {peerAnalysisData.custom_search && (
                <button
                  onClick={() => fetchPeerAnalysis(selectedCompany.symbol)}
                  style={styles.resetButton}
                >
                  Reset to Auto Peers
                </button>
              )}

              
            </div>
          )}
        </div>
      </div>

      <div style={styles.metricSelector}>
        {Object.entries(comparisonMetrics).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveComparisonMetric(key)}
            style={{
              ...styles.metricButton,
              backgroundColor: activeComparisonMetric === key ? '#4a90e2' : 'white',
              color: activeComparisonMetric === key ? 'white' : '#4a5568'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Peer Comparison Chart */}
      <div style={styles.chartContainer}>
        <h4 style={styles.chartSectionTitle}>
          {comparisonMetrics[activeComparisonMetric]} Comparison
        </h4>
        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBar data={preparePeerChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="symbol" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [value?.toFixed(2), 'Value']} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#4a90e2" 
                name={comparisonMetrics[activeComparisonMetric]}
              />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peer Companies Grid */}
      <div style={styles.peerGrid}>
        <h4 style={styles.peerSectionTitle}>Peer Companies</h4>
        <div style={styles.peersContainer}>
          {peerAnalysisData.peers.map((peer, index) => (
            <div key={peer.symbol} style={styles.peerCard}>
              <div style={styles.peerHeader}>
                <div style={styles.peerSymbol}>{peer.symbol}</div>
                <div style={styles.peerName}>{peer.name}</div>
              </div>
              
              <div style={styles.peerMetrics}>
                <div style={styles.peerMetric}>
                  <span style={styles.metricLabel}>Price</span>
                  <span style={styles.metricValue}>
                    {formatCurrency(peer.current_price)}
                  </span>
                </div>
                
                <div style={styles.peerMetric}>
                  <span style={styles.metricLabel}>Market Cap</span>
                  <span style={styles.metricValue}>
                    {formatNumber(peer.market_cap)}
                  </span>
                </div>
                
                <div style={styles.peerMetric}>
                  <span style={styles.metricLabel}>P/E Ratio</span>
                  <span style={{
                    ...styles.metricValue,
                    color: getPERatioColor(peer.pe_ratio)
                  }}>
                    {peer.pe_ratio ? peer.pe_ratio.toFixed(2) : 'N/A'}
                  </span>
                </div>
                
                <div style={styles.peerMetric}>
                  <span style={styles.metricLabel}>52W Range</span>
                  <span style={styles.metricValue}>
                    {formatCurrency(peer.fifty_two_week_low)} - {formatCurrency(peer.fifty_two_week_high)}
                  </span>
                </div>
              </div>
              
              // In your peer card, update the button:
              <button
                onClick={() => handlePeerClick(peer.symbol, peer.name)}
                style={styles.viewPeerButton}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Comparative Analysis */}
      <div style={styles.comparisonSection}>
        <h4 style={styles.comparisonTitle}>Comparative Analysis</h4>
        
        {/* Valuation Comparison */}
        <div style={styles.comparisonCategory}>
          <h5 style={styles.categoryTitle}>Valuation Comparison</h5>
          <div style={styles.comparisonTable}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>Company</div>
              <div style={styles.tableCell}>P/E Ratio</div>
              <div style={styles.tableCell}>Market Cap</div>
              <div style={styles.tableCell}>vs Main Company</div>
            </div>
            {peerAnalysisData.comparative_analysis?.valuation_metrics?.peers.map((peer, index) => (
              <div key={peer.symbol} style={styles.tableRow}>
                <div style={styles.tableCell}>{peer.symbol}</div>
                <div style={styles.tableCell}>
                  {peer.pe_ratio ? peer.pe_ratio.toFixed(2) : 'N/A'}
                </div>
                <div style={styles.tableCell}>
                  {formatNumber(peer.market_cap)}
                </div>
                <div style={{
                  ...styles.tableCell,
                  color: peer.pe_comparison > 0 ? '#e53e3e' : '#38a169'
                }}>
                  {peer.pe_comparison ? `${peer.pe_comparison > 0 ? '+' : ''}${peer.pe_comparison.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
      
  );
};

// Helper function to prepare chart data
const preparePeerChartData = () => {
  if (!peerAnalysisData) return [];
  
  const mainCompany = {
    symbol: selectedCompany.symbol,
    value: getComparisonValue(selectedCompany.symbol)
  };
  
  const peerData = peerAnalysisData.peers.map(peer => ({
    symbol: peer.symbol,
    value: getComparisonValue(peer.symbol)
  }));
  
  return [mainCompany, ...peerData];
};

const getComparisonValue = (symbol) => {
  if (!peerAnalysisData) return null;
  
  if (symbol === selectedCompany.symbol) {
    // Main company value
    switch (activeComparisonMetric) {
      case 'valuation':
        return peerAnalysisData.comparative_analysis?.valuation_metrics?.main_company?.pe_ratio;
      case 'performance':
        return peerAnalysisData.comparative_analysis?.performance_metrics?.main_company?.current_price;
      case 'risk':
        return peerAnalysisData.comparative_analysis?.risk_metrics?.main_company?.beta;
      default:
        return null;
    }
  } else {
    // Peer company value
    const peer = peerAnalysisData.peers.find(p => p.symbol === symbol);
    if (!peer) return null;
    
    switch (activeComparisonMetric) {
      case 'valuation':
        return peer.pe_ratio;
      case 'performance':
        return peer.current_price;
      case 'risk':
        return 1.0 + (hash(peer.symbol) % 100) / 100; // Placeholder beta
      default:
        return null;
    }
  }
};

const handlePeerClick = async (symbol, companyName = '') => {
  // Update search input to show which company we're loading
  setSearchQuery(symbol);
  
  // Show loading state immediately
  setSelectedCompany({ 
    symbol, 
    name: companyName || symbol 
  });
  setCompanyData(null);
  setAnalysisData(null);
  setRatiosData(null);
  setPeerAnalysisData(null);
  setHistoricalData(null);
  setError('');
  setIsLoading(true);

  // Show a temporary loading message
  setError(`Loading data for ${symbol}...`);

  try {
    // Fetch all data for the new company
    await fetchCompanyData(symbol);
    
    // Clear the loading message
    setError('');
    
    // Switch to overview tab
    setActiveTab('overview');
    
    // Scroll to the search section so users can see the new company
    const searchSection = document.querySelector('[data-section="search"]');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Log the action for debugging
    console.log(`Switched to company: ${symbol}`);
    
  } catch (error) {
    console.error('Error loading peer company data:', error);
    setError(`Failed to load data for ${symbol}. Please try again.`);
    
    // Fallback: Try to at least show basic info
    setSelectedCompany({ 
      symbol, 
      name: companyName || symbol 
    });
  } finally {
    setIsLoading(false);
  }
};

const getPERatioColor = (peRatio) => {
  if (!peRatio) return '#718096';
  if (peRatio < 15) return '#38a169'; // Green for undervalued
  if (peRatio > 25) return '#e53e3e'; // Red for overvalued
  return '#d69e2e'; // Yellow for fair value
};

// Simple hash function for placeholder data
const hash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

  const renderSuggestionsDropdown = () => {
  if (!showSuggestions) return null;

  return (
    <div style={styles.suggestionsDropdown} ref={suggestionsRef}>
      {isFetchingSuggestions ? (
        <div style={styles.noSuggestions}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
          Searching companies...
        </div>
      ) : suggestions.length > 0 ? (
        suggestions.map((company, index) => (
          <button
            key={`${company.symbol}-${index}`}
            style={styles.suggestionsItem}
            onClick={() => handleSuggestionClick(company)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            type="button"
          >
            <Building size={16} style={styles.suggestionIcon} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
              <span style={styles.suggestionSymbol}>{company.symbol}</span>
              <span style={styles.suggestionName}>{company.name}</span>
            </div>
            {company.exchange && company.exchange !== 'N/A' && (
              <span style={{ fontSize: '0.7rem', color: '#9ca3af', textAlign: 'right' }}>
                {company.exchange}
              </span>
            )}
          </button>
        ))
      ) : searchQuery.length > 0 ? (
        <div style={styles.noSuggestions}>
          No companies found. Try AAPL, MSFT, TSLA, etc.
        </div>
      ) : null}
    </div>
  );
};
  // Render financial statements
  const renderBalanceSheet = () => {
    if (!companyData?.balance_sheet || companyData.balance_sheet.length === 0) {
      return <div style={styles.noData}>No balance sheet data available</div>;
    }

    return (
      <div style={styles.financialTableContainer}>
        <h4 style={styles.financialTableTitle}>Balance Sheet</h4>
        <div style={styles.financialTable}>
          <div style={styles.tableHeader}>
            <div style={styles.tableCell}>Period</div>
            <div style={styles.tableCell}>Total Assets</div>
            <div style={styles.tableCell}>Total Liabilities</div>
            <div style={styles.tableCell}>Total Equity</div>
            <div style={styles.tableCell}>Cash</div>
            <div style={styles.tableCell}>Long Term Debt</div>
          </div>
          {companyData.balance_sheet.map((period, index) => (
            <div key={index} style={styles.tableRow}>
              <div style={styles.tableCell}>{period.period}</div>
              <div style={styles.tableCell}>{formatCurrency(period.total_assets)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.total_liabilities)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.total_equity)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.cash_and_cash_equivalents)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.long_term_debt)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!companyData?.income_statement || companyData.income_statement.length === 0) {
      return <div style={styles.noData}>No income statement data available</div>;
    }

    return (
      <div style={styles.financialTableContainer}>
        <h4 style={styles.financialTableTitle}>Income Statement</h4>
        <div style={styles.financialTable}>
          <div style={styles.tableHeader}>
            <div style={styles.tableCell}>Period</div>
            <div style={styles.tableCell}>Revenue</div>
            <div style={styles.tableCell}>Gross Profit</div>
            <div style={styles.tableCell}>Operating Income</div>
            <div style={styles.tableCell}>Net Income</div>
            <div style={styles.tableCell}>EPS</div>
          </div>
          {companyData.income_statement.map((period, index) => (
            <div key={index} style={styles.tableRow}>
              <div style={styles.tableCell}>{period.period}</div>
              <div style={styles.tableCell}>{formatCurrency(period.total_revenue)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.gross_profit)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.operating_income)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.net_income)}</div>
              <div style={styles.tableCell}>{period.eps ? `$${period.eps.toFixed(2)}` : 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!companyData?.cash_flow || companyData.cash_flow.length === 0) {
      return <div style={styles.noData}>No cash flow data available</div>;
    }

    return (
      <div style={styles.financialTableContainer}>
        <h4 style={styles.financialTableTitle}>Cash Flow Statement</h4>
        <div style={styles.financialTable}>
          <div style={styles.tableHeader}>
            <div style={styles.tableCell}>Period</div>
            <div style={styles.tableCell}>Operating Cash Flow</div>
            <div style={styles.tableCell}>Investing Cash Flow</div>
            <div style={styles.tableCell}>Financing Cash Flow</div>
            <div style={styles.tableCell}>Net Cash Flow</div>
            <div style={styles.tableCell}>Free Cash Flow</div>
          </div>
          {companyData.cash_flow.map((period, index) => (
            <div key={index} style={styles.tableRow}>
              <div style={styles.tableCell}>{period.period}</div>
              <div style={styles.tableCell}>{formatCurrency(period.operating_cash_flow)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.investing_cash_flow)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.financing_cash_flow)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.net_cash_flow)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.free_cash_flow)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add the missing render functions for analysis and ratios tabs
  const renderAnalysisTab = () => {
    return <FinancialAnalysisTab analysisData={analysisData} />;
  };

  const renderRatiosTab = () => {
    return <RatiosTab ratiosData={ratiosData} />;
  };

  const renderChartTab = () => {
  if (!historicalData || historicalData.length === 0) {
    return (
      <div style={styles.noData}>
        <BarChart3 size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>No historical data available</p>
        <button 
          onClick={() => fetchHistoricalData(selectedCompany.symbol)}
          style={styles.retryButton}
        >
          Load Historical Data
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Chart Controls */}
      <div style={styles.chartControls}>
        <div style={styles.chartTypeSelector}>
          <button
            onClick={() => setChartType('line')}
            style={{
              ...styles.chartControlButton,
              backgroundColor: chartType === 'line' ? '#4a90e2' : 'white',
              color: chartType === 'line' ? 'white' : '#4a5568'
            }}
          >
            <LineChart size={16} />
            Line
          </button>
          <button
            onClick={() => setChartType('area')}
            style={{
              ...styles.chartControlButton,
              backgroundColor: chartType === 'area' ? '#4a90e2' : 'white',
              color: chartType === 'area' ? 'white' : '#4a5568'
            }}
          >
            <AreaChart size={16} />
            Area
          </button>
          <button
            onClick={() => setChartType('bar')}
            style={{
              ...styles.chartControlButton,
              backgroundColor: chartType === 'bar' ? '#4a90e2' : 'white',
              color: chartType === 'bar' ? 'white' : '#4a5568'
            }}
          >
            <BarChart size={16} />
            Bar
          </button>
        </div>

        <div style={styles.periodSelector}>
          {['1m', '3m', '6m', '1y', '5y'].map((period) => (
            <button
              key={period}
              onClick={() => {
                setChartPeriod(period);
                fetchHistoricalData(selectedCompany.symbol);
              }}
              style={{
                ...styles.periodButton,
                backgroundColor: chartPeriod === period ? '#4a90e2' : 'white',
                color: chartPeriod === period ? 'white' : '#4a5568'
              }}
            >
              {period.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div style={styles.chartContainer}>
        <h4 style={styles.chartSectionTitle}>Price Chart - {selectedCompany.symbol}</h4>
        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' && (
              <RechartsLine data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return chartPeriod === '1m' || chartPeriod === '3m' 
                      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#4a90e2" 
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
              </RechartsLine>
            )}

            {chartType === 'area' && (
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return chartPeriod === '1m' || chartPeriod === '3m' 
                      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#4a90e2" 
                  fill="#4a90e2"
                  fillOpacity={0.3}
                  name="Price"
                />
              </AreaChart>
            )}

            {chartType === 'bar' && (
              <RechartsBar data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return chartPeriod === '1m' || chartPeriod === '3m' 
                      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                <Bar 
                  dataKey="price" 
                  fill="#4a90e2" 
                  name="Price"
                />
              </RechartsBar>
            )}
          </ResponsiveContainer>
        </div>

        {/* Chart Info */}
        {historicalData.length > 0 && (
          <div style={styles.chartInfo}>
            <div style={styles.chartMetric}>
              <span style={styles.metricLabel}>Current</span>
              <span style={styles.metricValue}>
                {formatCurrency(historicalData[historicalData.length - 1].price)}
              </span>
            </div>
            <div style={styles.chartMetric}>
              <span style={styles.metricLabel}>Change</span>
              <span style={{
                ...styles.metricValue,
                color: historicalData[historicalData.length - 1].change >= 0 ? '#38a169' : '#e53e3e'
              }}>
                {historicalData[historicalData.length - 1].change >= 0 ? '+' : ''}
                {formatCurrency(historicalData[historicalData.length - 1].change)}
              </span>
            </div>
            <div style={styles.chartMetric}>
              <span style={styles.metricLabel}>Period High</span>
              <span style={styles.metricValue}>
                {formatCurrency(Math.max(...historicalData.map(d => d.price)))}
              </span>
            </div>
            <div style={styles.chartMetric}>
              <span style={styles.metricLabel}>Period Low</span>
              <span style={styles.metricValue}>
                {formatCurrency(Math.min(...historicalData.map(d => d.price)))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Volume Chart */}
      <div style={styles.chartContainer}>
        <h4 style={styles.chartSectionTitle}>Volume</h4>
        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBar data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return chartPeriod === '1m' || chartPeriod === '3m' 
                    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
                  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
                  return value;
                }}
              />
              <Tooltip
                formatter={(value) => [value.toLocaleString(), 'Volume']}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              />
              <Legend />
              <Bar 
                dataKey="volume" 
                fill="#718096" 
                name="Volume"
              />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Metrics Charts */}
      {financialChartData && (
        <div style={styles.financialChartsContainer}>
          <h4 style={styles.chartSectionTitle}>Financial Metrics</h4>
          
          <div style={styles.financialChartTabs}>
            {['revenue', 'income', 'cashflow', 'ratios'].map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveFinancialChart(metric)}
                style={{
                  ...styles.financialChartTab,
                  backgroundColor: activeFinancialChart === metric ? '#4a90e2' : 'white',
                  color: activeFinancialChart === metric ? 'white' : '#4a5568'
                }}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>

          <div style={styles.financialChartContent}>
            <ResponsiveContainer width="100%" height="100%">
              {activeFinancialChart === 'revenue' && (
                <RechartsBar data={financialChartData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1e6).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${(value / 1e6).toFixed(2)}M`, 'Value']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#4a90e2" name="Revenue" />
                  <Bar dataKey="grossProfit" fill="#38a169" name="Gross Profit" />
                  <Bar dataKey="operatingIncome" fill="#d69e2e" name="Operating Income" />
                </RechartsBar>
              )}

              {activeFinancialChart === 'income' && (
                <RechartsLine data={financialChartData.income}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1e6).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${(value / 1e6).toFixed(2)}M`, 'Value']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="netIncome" stroke="#4a90e2" strokeWidth={2} name="Net Income" />
                  <Line type="monotone" dataKey="operatingIncome" stroke="#38a169" strokeWidth={2} name="Operating Income" />
                  <Line type="monotone" dataKey="eps" stroke="#d69e2e" strokeWidth={2} name="EPS" />
                </RechartsLine>
              )}

              {activeFinancialChart === 'cashflow' && (
                <AreaChart data={financialChartData.cashflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1e6).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${(value / 1e6).toFixed(2)}M`, 'Value']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="operating" stackId="1" stroke="#4a90e2" fill="#4a90e2" name="Operating" />
                  <Area type="monotone" dataKey="investing" stackId="1" stroke="#e53e3e" fill="#e53e3e" name="Investing" />
                  <Area type="monotone" dataKey="financing" stackId="1" stroke="#d69e2e" fill="#d69e2e" name="Financing" />
                </AreaChart>
              )}

              {activeFinancialChart === 'ratios' && (
                <RechartsLine data={financialChartData.ratios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="peRatio" stroke="#4a90e2" strokeWidth={2} name="P/E Ratio" />
                  <Line type="monotone" dataKey="roe" stroke="#38a169" strokeWidth={2} name="ROE (%)" />
                  <Line type="monotone" dataKey="profitMargin" stroke="#d69e2e" strokeWidth={2} name="Profit Margin (%)" />
                  <Line type="monotone" dataKey="debtToEquity" stroke="#e53e3e" strokeWidth={2} name="Debt/Equity (%)" />
                </RechartsLine>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

  const renderBackendStatus = () => {
    if (backendStatus === 'checking') {
      return (
        <div style={styles.statusIndicator}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
          Connecting to backend...
        </div>
      );
    }
    
    if (backendStatus === 'connected') {
      return (
        <div style={{...styles.statusIndicator, color: '#10b981', backgroundColor: '#f0fdf4'}}>
          <CheckCircle2 size={14} style={{ marginRight: '0.5rem' }} />
          Backend connected - Live data
        </div>
      );
    }
    
    if (backendStatus === 'error') {
      return (
        <div style={{...styles.statusIndicator, color: '#ef4444', backgroundColor: '#fef2f2'}}>
          <AlertCircle size={14} style={{ marginRight: '0.5rem' }} />
          Backend offline - Using demo data
        </div>
      );
    }
    
    return null;
  };


  const handleRemovePeer = (symbolToRemove) => {
  if (!peerAnalysisData || !peerAnalysisData.peers) return;
  
  const updatedPeers = peerAnalysisData.peers.filter(peer => peer.symbol !== symbolToRemove);
  
  setPeerAnalysisData({
    ...peerAnalysisData,
    peers: updatedPeers,
    // Recalculate comparisons if needed
    comparative_analysis: recalculateComparisons(peerAnalysisData.comparative_analysis, updatedPeers)
  });
};

// Helper function to recalculate comparisons
const recalculateComparisons = (currentAnalysis, updatedPeers) => {
  // This would ideally call the backend, but for now we'll just filter
  if (!currentAnalysis) return currentAnalysis;
  
  const filteredAnalysis = { ...currentAnalysis };
  
  // Filter peers in each comparison category
  Object.keys(filteredAnalysis).forEach(category => {
    if (filteredAnalysis[category]?.peers) {
      filteredAnalysis[category].peers = filteredAnalysis[category].peers.filter(
        peer => updatedPeers.some(p => p.symbol === peer.symbol)
      );
    }
  });
  
  return filteredAnalysis;
};

  // Debug panel to see requests
  const renderDebugPanel = () => {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={styles.debugPanel}>
          <h4>API Request Log (Last 10)</h4>
          <div style={styles.requestLog}>
            {requestLog.map((log, index) => (
              <div key={index} style={styles.requestLogEntry}>
                <span style={styles.requestTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span style={styles.requestMethod}>{log.method}</span>
                <span style={styles.requestEndpoint}>{log.endpoint}</span>
                <span style={{
                  ...styles.requestStatus,
                  color: log.status === 'success' ? '#10b981' : 
                         log.status === 'error' ? '#ef4444' : '#f59e0b'
                }}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <a href="/" style={styles.logo}>
            Fingenie
          </a>
        </div>
        
        <nav style={styles.nav}>
          <div style={styles.navCenter}>
            <a href="/" style={styles.navLink}>Home</a>
            <a href="/features" style={styles.navLink}>Features</a>
            <div 
              ref={toolsMenuRef}
              style={styles.toolsMenu}
              onMouseEnter={() => setShowToolsDropdown(true)}
              onMouseLeave={() => setShowToolsDropdown(false)}
            >
              <span style={styles.navLink}>Tools</span>
              {showToolsDropdown && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownItem}>
                    <BarChart3 size={16} />
                    <span>Financial Analysis</span>
                  </div>
                  <div style={styles.dropdownItem}>
                    <GitCompare size={16} />
                    <span>Company Comparison</span>
                  </div>
                  <div style={styles.dropdownItem}>
                    <TrendingUp size={16} />
                    <span>Market Trends</span>
                  </div>
                </div>
              )}
            </div>
            <a href="/about" style={styles.navLink}>About</a>
          </div>
          
          <div style={styles.navRight}>
            <User style={styles.userIcon} size={20} />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroLogo}>Fingenie</h1>
          <p style={styles.heroSubtitle}>Advanced Company Financial Analysis</p>
          
          {/* Backend Status */}
          {renderBackendStatus()}
          
          {/* Error Message */}
          {error && (
            <div style={styles.errorContainer}>
              <AlertCircle size={16} style={{ marginRight: '0.5rem' }} />
              {error}
            </div>
          )}
          
          {/* Search Container */}
          <div style={styles.searchContainer}>
            <h2 style={styles.searchTitle}>Search Company Financial Data</h2>
            <p style={styles.searchSubtitle}>
              Enter a stock symbol or company name to get comprehensive financial data
            </p>
            
            <form onSubmit={handleSearch} style={styles.searchForm}>
              <div style={styles.searchInputContainer}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                  placeholder="Try AAPL, Microsoft, TSLA, GOOGL, AMZN..."
                  style={styles.searchInput}
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !searchQuery.trim()}
                  style={{
                    ...styles.searchButton,
                    backgroundColor: isLoading || !searchQuery.trim() ? '#a0aec0' : '#4a90e2'
                  }}
                >
                  {isLoading ? <Loader2 size={16} /> : <Search size={16} />}
                  {isLoading ? 'Searching...' : 'Search'}
                </button>

                {/* Search Suggestions Dropdown */}
                {renderSuggestionsDropdown()}
              </div>
            </form>

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <div style={styles.popularSearches}>
                <h3 style={styles.popularTitle}>
                  <TrendingUp size={18} />
                  Popular Companies
                </h3>
                <div style={styles.popularGrid}>
                  {popularSearches.map((company) => (
                    <button
                      key={company.symbol}
                      onClick={() => handlePopularSearchClick(company)}
                      style={styles.popularItem}
                      disabled={isLoading}
                      type="button"
                    >
                      <Star size={14} style={{ color: '#f6ad55' }} />
                      <span style={{ fontWeight: '600' }}>{company.symbol}</span>
                      <span style={{ color: '#718096', fontSize: '0.8rem' }}>{company.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Debug Panel */}
          {renderDebugPanel()}
        </div>
      </section>

      {/* Results Section */}
      {selectedCompany && (
        <section style={styles.resultsSection}>
          {companyData ? (
            <div style={styles.companyCard}>
              {/* Company Header */}
              <div style={styles.companyHeader}>
                <div style={styles.companyInfo}>
                  <h2 style={styles.companyName}>
                    {companyData.company_info?.name || selectedCompany.name}
                  </h2>
                  <p style={styles.companySymbol}>{selectedCompany.symbol}</p>
                  <p style={styles.companyMeta}>
                    {companyData.company_info?.exchange || 'N/A'} • {companyData.company_info?.sector || 'N/A'} • {companyData.company_info?.industry || 'N/A'}
                  </p>
                  {companyData.company_info?.employees && (
                    <p style={styles.companyEmployees}>
                      Employees: {companyData.company_info.employees.toLocaleString()}
                    </p>
                  )}
                </div>
                
                {companyData.stock_price && (
                  <div style={styles.priceSection}>
                    <div style={styles.currentPrice}>
                      {formatCurrency(companyData.stock_price.current_price)}
                    </div>
                    <div style={{
                      ...styles.priceChange,
                      color: priceChange.change >= 0 ? '#38a169' : '#e53e3e'
                    }}>
                      {priceChange.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {formatCurrency(Math.abs(priceChange.change))} 
                      ({formatPercent(priceChange.percent)})
                    </div>
                    <div style={styles.marketCap}>
                      Market Cap: {formatNumber(companyData.stock_price.market_cap)}
                    </div>
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div style={styles.tabNavigation}>
              {['overview', 'chart', 'analysis', 'ratios', 'peer-analysis', 'balance-sheet', 'income-statement', 'cash-flow'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    ...styles.tabButton,
                    backgroundColor: activeTab === tab ? '#4a90e2' : 'transparent',
                    color: activeTab === tab ? 'white' : '#718096'
                  }}
                  type="button"
                >
                  {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>
              {/* Tab Content */}
              <div style={styles.tabContent}>
                {activeTab === 'overview' && companyData.stock_price && (
                  <div>
                    <div style={styles.metricsGrid}>
                      <div style={styles.metricCard}>
                        <div style={styles.metricHeader}>
                          <DollarSign size={20} style={styles.metricIcon} />
                          <h3 style={styles.metricTitle}>Market Cap</h3>
                        </div>
                        <p style={styles.metricValue}>
                          {formatNumber(companyData.stock_price.market_cap)}
                        </p>
                      </div>
                      
                      <div style={styles.metricCard}>
                        <div style={styles.metricHeader}>
                          <BarChart3 size={20} style={styles.metricIcon} />
                          <h3 style={styles.metricTitle}>P/E Ratio</h3>
                        </div>
                        <p style={styles.metricValue}>
                          {companyData.stock_price.pe_ratio ? companyData.stock_price.pe_ratio.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                      
                      <div style={styles.metricCard}>
                        <div style={styles.metricHeader}>
                          <TrendingUp size={20} style={styles.metricIcon} />
                          <h3 style={styles.metricTitle}>52W High</h3>
                        </div>
                        <p style={styles.metricValue}>
                          {formatCurrency(companyData.stock_price.fifty_two_week_high)}
                        </p>
                      </div>
                      
                      <div style={styles.metricCard}>
                        <div style={styles.metricHeader}>
                          <TrendingDown size={20} style={styles.metricIcon} />
                          <h3 style={styles.metricTitle}>52W Low</h3>
                        </div>
                        <p style={styles.metricValue}>
                          {formatCurrency(companyData.stock_price.fifty_two_week_low)}
                        </p>
                      </div>

                      <div style={styles.metricCard}>
                        <div style={styles.metricHeader}>
                          <Users size={20} style={styles.metricIcon} />
                          <h3 style={styles.metricTitle}>Employees</h3>
                        </div>
                        <p style={styles.metricValue}>
                          {companyData.company_info?.employees?.toLocaleString() || 'N/A'}
                        </p>
                      </div>

                      <div style={styles.metricCard}>
                        <div style={styles.metricHeader}>
                          <PieChart size={20} style={styles.metricIcon} />
                          <h3 style={styles.metricTitle}>Volume</h3>
                        </div>
                        <p style={styles.metricValue}>
                          {companyData.stock_price.volume?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Company Description */}
                    {companyData.company_info?.description && (
                      <div style={styles.descriptionCard}>
                        <h4 style={styles.descriptionTitle}>Company Description</h4>
                        <p style={styles.descriptionText}>{companyData.company_info.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chart' && renderChartTab()}
                {activeTab === 'analysis' && renderAnalysisTab()}
                {activeTab === 'ratios' && renderRatiosTab()}
                {activeTab === 'peer-analysis' && renderPeerAnalysisTab()}
                {activeTab === 'balance-sheet' && renderBalanceSheet()}
                {activeTab === 'income-statement' && renderIncomeStatement()}
                {activeTab === 'cash-flow' && renderCashFlow()}
              </div>
            </div>
          ) : (
            <div style={styles.loadingContainer}>
              <Loader2 size={32} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
              <p>Loading comprehensive financial data...</p>
            </div>
          )}
        </section>
      )}

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.cardContent}>
              <div style={styles.cardIcon}>
                <FileText size={32} style={{ color: '#4a90e2' }} />
              </div>
              <h3 style={styles.cardTitle}>Financial Statements</h3>
              <p style={styles.cardDescription}>
                Access complete balance sheets, income statements, and cash flow statements with detailed financial metrics.
              </p>
            </div>
          </div>
          
          <div style={styles.featureCard}>
            <div style={styles.cardContent}>
              <div style={styles.cardIcon}>
                <GitCompare size={32} style={{ color: '#4a90e2' }} />
              </div>
              <h3 style={styles.cardTitle}>Company Comparison</h3>
              <p style={styles.cardDescription}>
                Compare multiple companies side by side with comprehensive financial ratios and performance metrics.
              </p>
            </div>
          </div>
          
          <div style={styles.featureCard}>
            <div style={styles.cardContent}>
              <div style={styles.cardIcon}>
                <TrendingUp size={32} style={{ color: '#4a90e2' }} />
              </div>
              <h3 style={styles.cardTitle}>Market Analysis</h3>
              <p style={styles.cardDescription}>
                Get real-time market data, analyst recommendations, and investment insights for informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLeft}>
            <p style={styles.copyright}>
              © 2024 Fingenie. All rights reserved.
            </p>
          </div>
          <div style={styles.footerRight}>
            <h4 style={styles.functionsTitle}>Financial Tools</h4>
            <ul style={styles.functionsList}>
              <li style={styles.functionsItem}>Balance Sheet Analysis</li>
              <li style={styles.functionsItem}>Income Statement Review</li>
              <li style={styles.functionsItem}>Cash Flow Analysis</li>
              <li style={styles.functionsItem}>Investment Research</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};




// Move the FinancialAnalysisTab and RatiosTab components outside the main component
const FinancialAnalysisTab = ({ analysisData }) => {
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  if (!analysisData) return <div style={styles.noData}>No analysis data available</div>;

  return (
    <div>
      {/* Key Metrics Grid */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <TrendingUp size={20} style={styles.metricIcon} />
            <h3 style={styles.metricTitle}>Market Cap</h3>
          </div>
          <p style={styles.metricValue}>
            {formatNumber(analysisData.key_metrics?.market_cap)}
          </p>
        </div>
        
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <BarChart3 size={20} style={styles.metricIcon} />
            <h3 style={styles.metricTitle}>P/E Ratio</h3>
          </div>
          <p style={styles.metricValue}>
            {analysisData.key_metrics?.current_pe ? analysisData.key_metrics.current_pe.toFixed(2) : 'N/A'}
          </p>
        </div>
        
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <DollarSign size={20} style={styles.metricIcon} />
            <h3 style={styles.metricTitle}>ROE</h3>
          </div>
          <p style={styles.metricValue}>
            {analysisData.key_metrics?.return_on_equity ? analysisData.key_metrics.return_on_equity.toFixed(1) + '%' : 'N/A'}
          </p>
        </div>
        
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <PieChart size={20} style={styles.metricIcon} />
            <h3 style={styles.metricTitle}>Debt/Equity</h3>
          </div>
          <p style={styles.metricValue}>
            {analysisData.key_metrics?.debt_to_equity ? analysisData.key_metrics.debt_to_equity.toFixed(1) + '%' : 'N/A'}
          </p>
        </div>
      </div>

      {/* Analysis Sections */}
      <div style={styles.analysisSections}>
        <div style={styles.analysisSection}>
          <h4 style={styles.analysisSectionTitle}>Profitability Analysis</h4>
          <p style={styles.analysisText}>
            {analysisData.analysis?.profitability_analysis || 'No analysis available'}
          </p>
        </div>
        
        <div style={styles.analysisSection}>
          <h4 style={styles.analysisSectionTitle}>Valuation Analysis</h4>
          <p style={styles.analysisText}>
            {analysisData.analysis?.valuation_analysis || 'No analysis available'}
          </p>
        </div>
        
        <div style={styles.analysisSection}>
          <h4 style={styles.analysisSectionTitle}>Financial Health</h4>
          <p style={styles.analysisText}>
            {analysisData.analysis?.financial_health || 'No analysis available'}
          </p>
        </div>
        
        <div style={styles.analysisSection}>
          <h4 style={styles.analysisSectionTitle}>Investment Recommendation</h4>
          <div style={styles.recommendationBox}>
            <p style={styles.recommendationText}>
              {analysisData.analysis?.investment_recommendation || 'No recommendation available'}
            </p>
          </div>
        </div>
      </div>

      {/* Quarterly Results */}
      {analysisData.quarterly_results && analysisData.quarterly_results.length > 0 && (
        <div style={styles.quarterlySection}>
          <h4 style={styles.quarterlyTitle}>Quarterly Results</h4>
          <div style={styles.quarterlyTable}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>Quarter</div>
              <div style={styles.tableCell}>Revenue</div>
              <div style={styles.tableCell}>Operating Income</div>
              <div style={styles.tableCell}>Net Income</div>
            </div>
            {analysisData.quarterly_results.map((quarter, index) => (
              <div key={index} style={styles.tableRow}>
                <div style={styles.tableCell}>{quarter.period}</div>
                <div style={styles.tableCell}>{formatCurrency(quarter.revenue)}</div>
                <div style={styles.tableCell}>{formatCurrency(quarter.operating_income)}</div>
                <div style={styles.tableCell}>{formatCurrency(quarter.net_income)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RatiosTab = ({ ratiosData }) => {
  if (!ratiosData) return <div style={styles.noData}>No ratios data available</div>;

  return (
    <div>
      {/* Profitability Ratios */}
      <div style={styles.ratioSection}>
        <h4 style={styles.ratioSectionTitle}>Profitability Ratios</h4>
        <div style={styles.ratiosGrid}>
          {Object.entries(ratiosData.profitability_ratios || {}).map(([key, value]) => (
            <div key={key} style={styles.ratioItem}>
              <span style={styles.ratioLabel}>{key.replace('_', ' ').toUpperCase()}</span>
              <span style={styles.ratioValue}>
                {typeof value === 'number' ? value.toFixed(2) + '%' : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Valuation Ratios */}
      <div style={styles.ratioSection}>
        <h4 style={styles.ratioSectionTitle}>Valuation Ratios</h4>
        <div style={styles.ratiosGrid}>
          {Object.entries(ratiosData.valuation_ratios || {}).map(([key, value]) => (
            <div key={key} style={styles.ratioItem}>
              <span style={styles.ratioLabel}>{key.replace('_', ' ').toUpperCase()}</span>
              <span style={styles.ratioValue}>
                {typeof value === 'number' ? value.toFixed(2) : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leverage Ratios */}
      <div style={styles.ratioSection}>
        <h4 style={styles.ratioSectionTitle}>Leverage Ratios</h4>
        <div style={styles.ratiosGrid}>
          {Object.entries(ratiosData.leverage_ratios || {}).map(([key, value]) => (
            <div key={key} style={styles.ratioItem}>
              <span style={styles.ratioLabel}>{key.replace('_', ' ').toUpperCase()}</span>
              <span style={styles.ratioValue}>
                {typeof value === 'number' ? value.toFixed(2) + '%' : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Add the missing styles
const styles = {
  // ... (all your existing styles remain the same)
  analysisSections: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  
  analysisSection: {
    backgroundColor: '#f7fafc',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb'
  },
  
  analysisSectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  analysisText: {
    fontSize: '0.95rem',
    color: '#718096',
    lineHeight: '1.6',
    margin: 0
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb',
    marginBottom: '2rem'
  },
  
  chartControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  
  chartTypeSelector: {
    display: 'flex',
    gap: '0.5rem'
  },
  
  chartControlButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease'
  },
  
  periodSelector: {
    display: 'flex',
    gap: '0.5rem'
  },
  
  periodButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  
  chartWrapper: {
    width: '100%',
    height: '400px',
    marginBottom: '1rem'
  },
  
  chartInfo: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  
  chartMetric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
  },
  
  metricLabel: {
    fontSize: '0.8rem',
    color: '#718096',
    fontWeight: '500'
  },
  
  metricValue: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2d3748'
  },
  
  chartSection: {
    marginBottom: '3rem'
  },
  
  chartSectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1.5rem'
  },
  
  financialChartsContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb'
  },
  
  financialChartTabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  
  financialChartTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  
  financialChartContent: {
    width: '100%',
    height: '350px'
  },
  
  recommendationBox: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e5e7eb'
  },
  
  recommendationText: {
    fontSize: '0.95rem',
    color: '#2d3748',
    lineHeight: '1.6',
    margin: 0,
    fontWeight: '500'
  },
  
  quarterlySection: {
    marginTop: '2rem'
  },
  
  quarterlyTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  quarterlyTable: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  
  ratioSection: {
    marginBottom: '2rem'
  },
  
  ratioSectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  ratiosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  
  ratioItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e5e7eb'
  },
  
  ratioLabel: {
    fontSize: '0.9rem',
    color: '#718096',
    fontWeight: '500'
  },
  
  ratioValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2d3748'
  },
  
  // ... (include all your existing styles here - they remain unchanged)
  debugPanel: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f7fafc',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.8rem'
  },
  
  requestLog: {
    maxHeight: '200px',
    overflowY: 'auto'
  },
  
  requestLogEntry: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 2fr 1fr',
    gap: '0.5rem',
    padding: '0.25rem 0',
    borderBottom: '1px solid #e5e7eb'
  },
  
  requestTime: {
    color: '#718096',
    fontSize: '0.7rem'
  },
  
  requestMethod: {
    fontWeight: '600',
    color: '#4a90e2'
  },
  
  requestEndpoint: {
    color: '#2d3748'
  },
  
  requestStatus: {
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '0.7rem'
  },
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Montserrat', 'Inter', sans-serif",
    backgroundColor: '#F8F8F8',
    color: '#2d3748'
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid #000000',
    position: 'relative',
    top: 0,
    width: '100%',
    zIndex: 999,
    padding: '1rem 3rem'
  },
  
  headerLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  
  logo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#4a90e2',
    textDecoration: 'none'
  },
  
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  
  navCenter: {
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'center'
  },
  
  navLink: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#4a5568',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
    textDecoration: 'none',
    position: 'relative'
  },
  
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  
  toolsMenu: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  
  userIcon: {
    cursor: 'pointer',
    color: '#4a5568',
    transition: 'color 0.3s ease'
  },
  
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '200px',
    zIndex: 1000
  },
  
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '0.95rem',
    color: '#4a5568'
  },
  
  heroSection: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '2rem',
    overflow: 'hidden',
    backgroundColor: '#F8F8F8'
  },
  
  heroContent: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto'
  },
  
  heroLogo: {
    fontSize: '4rem',
    fontWeight: '700',
    color: '#4a90e2',
    marginBottom: '0.5rem',
    letterSpacing: '-0.03em'
  },
  
  heroSubtitle: {
    fontSize: '1.35rem',
    color: '#718096',
    fontWeight: '400',
    marginBottom: '3rem'
  },

  
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#f7fafc',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    fontWeight: '500',
    maxWidth: '300px',
    margin: '0 auto 1rem auto'
  },
  
  errorContainer: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #feb2b2',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '500px',
    margin: '0 auto 1rem auto'
  },
  
  searchContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #ffffff',
    maxWidth: '800px',
    margin: '0 auto',
    position: 'relative'
  },
  
  searchTitle: {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.5rem',
    textAlign: 'center'
  },
  
  searchSubtitle: {
    textAlign: 'center',
    color: '#718096',
    marginBottom: '1.5rem',
    fontSize: '1rem',
    lineHeight: '1.5'
  },
  
  searchForm: {
    position: 'relative',
    marginBottom: '2rem'
  },
  
  searchInputContainer: {
    position: 'relative',
    width: '100%'
  },
  
  searchInput: {
    width: '100%',
    padding: '1rem 3rem 1rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
  },
  
  searchButton: {
    position: 'absolute',
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    transition: 'background-color 0.3s ease',
    zIndex: 1002
  },
  
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1001,
    maxHeight: '400px',
    overflowY: 'auto',
    marginTop: '4px'
  },
  
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid #f3f4f6',
    border: 'none',
    backgroundColor: 'white',
    width: '100%',
    fontFamily: 'inherit',
    textAlign: 'left'
  },
  
  suggestionSymbol: {
    fontWeight: '600',
    color: '#2d3748',
    minWidth: '60px'
  },
  
  suggestionName: {
    color: '#718096',
    fontSize: '0.9rem',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  suggestionIcon: {
    color: '#9ca3af'
  },
  
  noSuggestions: {
    padding: '1rem',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  popularSearches: {
    marginTop: '1.5rem'
  },
  
  popularTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'center'
  },
  
  popularGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    justifyContent: 'center'
  },
  
  popularItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f7fafc',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    border: 'none',
    fontFamily: 'inherit',
    flexDirection: 'column',
    minWidth: '120px'
  },
  
  resultsSection: {
    padding: '2rem 3rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  },
  
  companyCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #ffffff',
    marginBottom: '2rem'
  },
  
  companyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  
  companyInfo: {
    flex: 1
  },
  
  companyName: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.25rem'
  },
  
  companySymbol: {
    fontSize: '1.25rem',
    color: '#718096',
    marginBottom: '0.5rem'
  },
  
  companyMeta: {
    fontSize: '0.95rem',
    color: '#718096',
    marginBottom: '0.25rem'
  },
  
  companyEmployees: {
    fontSize: '0.9rem',
    color: '#718096'
  },
  
  priceSection: {
    textAlign: 'right'
  },
  
  currentPrice: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.25rem'
  },
  
  priceChange: {
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'flex-end',
    marginBottom: '0.25rem'
  },
  
  marketCap: {
    fontSize: '0.9rem',
    color: '#718096'
  },
  
  tabNavigation: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '1rem',
    flexWrap: 'wrap'
  },
  
  tabButton: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#718096',
    cursor: 'pointer',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap'
  },
  
  tabContent: {
    minHeight: '400px'
  },
  
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  
  metricCard: {
    backgroundColor: '#f7fafc',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb',
    textAlign: 'center'
  },
  
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    justifyContent: 'center'
  },
  
  metricIcon: {
    color: '#4a90e2'
  },

  suggestionsItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid #f3f4f6',
    border: 'none',
    backgroundColor: 'white',
    width: '100%',
    fontFamily: 'inherit',
    textAlign: 'left'
  },
  
  metricTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#718096',
    margin: 0
  },
  
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: 0
  },
  
  descriptionCard: {
    backgroundColor: '#f7fafc',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb'
  },
  
  descriptionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  descriptionText: {
    fontSize: '0.95rem',
    color: '#718096',
    lineHeight: '1.6'
  },
  
  // Financial Table Styles
  financialTableContainer: {
    marginBottom: '2rem'
  },
  
  financialTableTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  financialTable: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    backgroundColor: '#f7fafc',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: '600',
    color: '#2d3748'
  },
  
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    borderBottom: '1px solid #f3f4f6'
  },
  
  tableCell: {
    padding: '0.75rem 1rem',
    borderRight: '1px solid #f3f4f6',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center'
  },
  
  noData: {
    textAlign: 'center',
    color: '#718096',
    padding: '2rem',
    fontSize: '1rem'
  },
  
  // Analysis Styles
  analysisCard: {
    backgroundColor: '#f7fafc',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb'
  },
  
  analysisTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  recommendationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e5e7eb',
    textAlign: 'center'
  },
  
  recommendationAnalyst: {
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.5rem'
  },
  
  recommendationRating: {
    fontWeight: '600',
    marginBottom: '0.5rem',
    fontSize: '1.1rem'
  },
  
  recommendationTarget: {
    color: '#718096',
    fontSize: '0.9rem'
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#718096'
  },
  
  featuresSection: {
    padding: '4rem 3rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%'
  },
  
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem'
  },
  
  featureCard: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #ffffff'
  },
  
  cardContent: {
    position: 'relative',
    zIndex: 1
  },
  
  cardIcon: {
    marginBottom: '1.5rem',
    display: 'inline-block'
  },
  
  cardTitle: {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.75rem'
  },
  
  cardDescription: {
    fontSize: '0.95rem',
    color: '#718096',
    lineHeight: '1.6'
  },
  
  footer: {
    backgroundColor: '#2d3748',
    color: '#e2e8f0',
    padding: '3rem',
    marginTop: 'auto'
  },
  
  footerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '2rem'
  },
  
  footerLeft: {
    flex: 1
  },
  
  copyright: {
    fontSize: '0.9rem',
    color: '#cbd5e0',
    margin: 0
  },
  
  footerRight: {
    flex: 1,
    maxWidth: '250px'
  },
  
  functionsTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  
  functionsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  
  functionsItem: {
    fontSize: '0.9rem',
    color: '#cbd5e0',
    marginBottom: '0.5rem',
    paddingLeft: '1rem',
    position: 'relative'
  },


  chartContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb',
    marginBottom: '2rem'
  },
  
  chartControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  
  chartTypeSelector: {
    display: 'flex',
    gap: '0.5rem'
  },
  
  chartControlButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    backgroundColor: 'white'
  },
  
  periodSelector: {
    display: 'flex',
    gap: '0.5rem'
  },
  
  periodButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: 'white'
  },
  
  chartWrapper: {
    width: '100%',
    height: '400px',
    marginBottom: '1rem'
  },
  
  chartInfo: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  
  chartMetric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
  },
  
  metricLabel: {
    fontSize: '0.8rem',
    color: '#718096',
    fontWeight: '500'
  },
  
  metricValue: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2d3748'
  },
  
  chartSection: {
    marginBottom: '3rem'
  },
  
  chartSectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1.5rem'
  },
  
  financialChartsContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb'
  },
  
  financialChartTabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  
  financialChartTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },

  peerHeader: {
    marginBottom: '2rem',
    textAlign: 'center'
  },
  
  peerTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.5rem'
  },
  
  peerSubtitle: {
    color: '#718096',
    fontSize: '1rem'
  },
  
  metricSelector: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  
  metricButton: {
    padding: '0.75rem 1.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  
  peerGrid: {
    marginBottom: '2rem'
  },
  
  peerSectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  peersContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  
  peerCard: {
    backgroundColor: '#f7fafc',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease'
  },
  
  peerHeader: {
    marginBottom: '1rem'
  },
  
  peerSymbol: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.25rem'
  },
  
  peerName: {
    fontSize: '0.9rem',
    color: '#718096'
  },
  
  peerMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  
  peerMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  viewPeerButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.3s ease'
  },
  
  comparisonSection: {
    marginTop: '2rem'
  },
  
  comparisonTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  comparisonCategory: {
    marginBottom: '2rem'
  },
  
  categoryTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '1rem'
  },
  
  financialChartContent: {
    width: '100%',
    height: '350px'
  },
  
  retryButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginTop: '1rem'
  },

  searchSection: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#f7fafc',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  
  searchBox: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  
  searchInputContainer: {
    position: 'relative',
    flex: 1
  },
  
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit'
  },
  
  resetButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#718096',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },

  // Multi-select for peers
  selectedPeers: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  
  selectedPeer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#4a90e2',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem'
  },
  
  removePeer: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};

export default CompanySearch; 