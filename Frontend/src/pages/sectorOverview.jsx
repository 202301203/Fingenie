import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  TrendingUp, 
  BarChart3, 
  Building2, 
  ArrowRight, 
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
  PieChart,
  X,
  Plus,
  RefreshCw
} from 'lucide-react';
import { companySearchService, testAuthStatus } from '../api/index';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CompanySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const toolsMenuRef = useRef(null);

  const enhancedPopularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'USA' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', country: 'USA' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'USA' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', country: 'USA' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', country: 'India' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', country: 'India' },
    { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', country: 'India' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', country: 'India' },
  ];

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
      await companySearchService.search('AAPL');
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('error');
    }
  };

  const fetchPopularSearches = async () => {
    try {
      const data = await companySearchService.getPopularSearches();
      if (data && Array.isArray(data) && data.length > 0) {
        setPopularSearches(data);
      } else {
        setPopularSearches(enhancedPopularStocks);
      }
    } catch (error) {
      setPopularSearches(enhancedPopularStocks);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 1) return [];

    try {
      setIsFetchingSuggestions(true);
      const data = await companySearchService.getSearchSuggestions(query);
      return data && Array.isArray(data) ? data.slice(0, 8) : getEnhancedFallbackSuggestions(query);
    } catch (error) {
      return getEnhancedFallbackSuggestions(query);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const getEnhancedFallbackSuggestions = (query) => {
    const queryLower = query.toLowerCase().trim();
    return enhancedPopularStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(queryLower) || 
      stock.name.toLowerCase().includes(queryLower)
    ).slice(0, 8);
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
    setHistoricalData([]);
    setError('');
    setShowSuggestions(false);

    try {
      let searchResults = await companySearchService.search(searchQuery);
      
      if (!searchResults || searchResults.error || (Array.isArray(searchResults) && searchResults.length === 0)) {
        searchResults = getEnhancedFallbackSuggestions(searchQuery);
      }

      if (searchResults.length > 0) {
        const results = Array.isArray(searchResults) ? searchResults : [searchResults];
        setSearchResults(results);
        const company = results[0];
        setSelectedCompany(company);
        await fetchCompanyData(company.symbol);
      } else {
        setError('Company not found. Try popular symbols like AAPL, MSFT, TSLA, RELIANCE.NS');
      }
    } catch (error) {
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

  const fetchCompanyData = async (symbol) => {
    try {
      setIsLoading(true);
      const comprehensiveData = await companySearchService.getCompanyData(symbol);
      
      if (comprehensiveData && !comprehensiveData.error) {
        setCompanyData(comprehensiveData);
        await fetchHistoricalData(symbol);
      } else {
        throw new Error('Failed to load company data');
      }
    } catch (error) {
      setError('Using demo data - backend connection issue');
      setCompanyData(generateEnhancedDemoData(symbol));
      await fetchHistoricalData(symbol);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricalData = async (symbol) => {
    try {
      const data = await companySearchService.getHistoricalData(symbol, '1y', '1d');
      if (data && data.data) {
        setHistoricalData(data.data.map(item => ({
          date: new Date(item.Date).toLocaleDateString(),
          price: item.Close || item.High || 0
        })).slice(-30)); // Last 30 days
      } else {
        // Generate demo historical data
        const demoData = [];
        const basePrice = 100 + Math.random() * 100;
        for (let i = 30; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          demoData.push({
            date: date.toLocaleDateString(),
            price: basePrice + (Math.random() - 0.5) * 20
          });
        }
        setHistoricalData(demoData);
      }
    } catch (error) {
      // Generate demo historical data on error
      const demoData = [];
      const basePrice = 100 + Math.random() * 100;
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        demoData.push({
          date: date.toLocaleDateString(),
          price: basePrice + (Math.random() - 0.5) * 20
        });
      }
      setHistoricalData(demoData);
    }
  };

  const generateEnhancedDemoData = (symbol) => {
    const baseValue = 1000000000;
    const randomMultiplier = () => 0.5 + Math.random();
    
    return {
      company_info: {
        name: `${symbol} Corporation`,
        exchange: symbol.includes('.NS') ? 'NSE' : 'NASDAQ',
        sector: 'Technology',
        industry: 'Software & Services',
        employees: 5000 + Math.floor(Math.random() * 45000),
        description: `${symbol} Corporation is a leading technology company specializing in innovative software solutions and digital services.`,
        country: symbol.includes('.NS') ? 'India' : 'USA'
      },
      stock_price: {
        current_price: 150 + Math.random() * 200,
        previous_close: 145 + Math.random() * 200,
        market_cap: baseValue * (50 + Math.random() * 50),
        pe_ratio: 15 + Math.random() * 25,
        fifty_two_week_high: 200 + Math.random() * 100,
        fifty_two_week_low: 100 + Math.random() * 50,
        volume: 1000000 + Math.floor(Math.random() * 9000000),
      },
      balance_sheet: [{
        period: '2023-12-31',
        total_assets: baseValue * 2 * randomMultiplier(),
        total_liabilities: baseValue * randomMultiplier(),
        total_equity: baseValue * randomMultiplier(),
        cash_and_cash_equivalents: baseValue * 0.3 * randomMultiplier(),
      }],
      income_statement: [{
        period: '2023-12-31',
        total_revenue: baseValue * 1.5 * randomMultiplier(),
        gross_profit: baseValue * 0.9 * randomMultiplier(),
        operating_income: baseValue * 0.4 * randomMultiplier(),
        net_income: baseValue * 0.3 * randomMultiplier(),
        eps: 2 + Math.random() * 3
      }],
      cash_flow: [{
        period: '2023-12-31',
        operating_cash_flow: baseValue * 0.4 * randomMultiplier(),
        free_cash_flow: baseValue * 0.25 * randomMultiplier()
      }],
    };
  };

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

  const renderStockChart = () => {
    if (!historicalData || historicalData.length === 0) {
      return <div style={styles.noData}>No historical data available</div>;
    }

    return (
      <div style={styles.chartContainer}>
        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={styles.tooltip}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#515266" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#515266" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

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
          </div>
          {companyData.balance_sheet.map((period, index) => (
            <div key={index} style={styles.tableRow}>
              <div style={styles.tableCell}>{period.period}</div>
              <div style={styles.tableCell}>{formatCurrency(period.total_assets)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.total_liabilities)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.total_equity)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.cash_and_cash_equivalents)}</div>
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
          </div>
          {companyData.income_statement.map((period, index) => (
            <div key={index} style={styles.tableRow}>
              <div style={styles.tableCell}>{period.period}</div>
              <div style={styles.tableCell}>{formatCurrency(period.total_revenue)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.gross_profit)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.operating_income)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.net_income)}</div>
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
            <div style={styles.tableCell}>Free Cash Flow</div>
          </div>
          {companyData.cash_flow.map((period, index) => (
            <div key={index} style={styles.tableRow}>
              <div style={styles.tableCell}>{period.period}</div>
              <div style={styles.tableCell}>{formatCurrency(period.operating_cash_flow)}</div>
              <div style={styles.tableCell}>{formatCurrency(period.free_cash_flow)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSuggestionsDropdown = () => {
    if (!showSuggestions) return null;

    return (
      <div style={styles.suggestionsDropdown} ref={suggestionsRef}>
        {isFetchingSuggestions ? (
          <div style={styles.noSuggestions}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
            Searching...
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((company, index) => (
            <button
              key={`${company.symbol}-${index}`}
              style={styles.suggestionItem}
              onClick={() => handleSuggestionClick(company)}
              type="button"
            >
              <Building size={16} style={styles.suggestionIcon} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                <span style={styles.suggestionSymbol}>{company.symbol}</span>
                <span style={styles.suggestionName}>{company.name}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                {company.exchange}
              </span>
            </button>
          ))
        ) : (
          <div style={styles.noSuggestions}>No companies found</div>
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
        <div style={{...styles.statusIndicator, color: '#10b981'}}>
          <CheckCircle2 size={14} style={{ marginRight: '0.5rem' }} />
          Backend connected
        </div>
      );
    }
    
    return (
      <div style={{...styles.statusIndicator, color: '#ef4444'}}>
        <AlertCircle size={14} style={{ marginRight: '0.5rem' }} />
        Backend offline - using demo data
      </div>
    );
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#070d1fff' }}>Fingenie</span>
          </div>
        </div>
        
        <nav style={styles.nav}>
          <span style={styles.navLink}>Home</span>
          <span style={styles.navLink}>Features</span>
          <div 
            ref={toolsMenuRef}
            style={styles.toolsMenu}
            onMouseEnter={() => setShowToolsDropdown(true)}
            onMouseLeave={() => setShowToolsDropdown(false)}
          >
            <span style={styles.navLink}>Tools</span>
            {showToolsDropdown && (
              <div style={styles.HFdropdown}>
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
          <span style={styles.navLink}>About</span>
          <div style={styles.userMenu}>
            <User style={styles.userIcon} size={20} />
          </div>
        </nav>
      </header>

      {/* Controls Bar */}
      <div style={styles.controlsBar}>
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '500px' }}>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search companies (AAPL, MSFT, RELIANCE.NS, TCS.NS)..."
              style={styles.searchInput}
            />
            {renderSuggestionsDropdown()}
          </div>
        </form>
        
        <button style={styles.sectorsButton}>
          <Plus size={16} />
          Sectors
        </button>
        
        <button style={styles.refreshButton}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        {renderBackendStatus()}
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>Data Source:</span>
          <span style={styles.statusValue}>
            {backendStatus === 'connected' ? 'Live Market Data' : 'Demo Data'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorContainer}>
          <div style={styles.errorTitle}>Error</div>
          <div style={styles.errorText}>{error}</div>
        </div>
      )}

      {/* Main Content */}
      <div style={styles.container}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>Loading Financial Data</div>
            <div style={styles.loadingSubtext}>Please wait while we fetch the latest information</div>
          </div>
        ) : selectedCompany && companyData ? (
          <div style={styles.sectionContainer}>
            {/* Company Header */}
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectorTitle}>
                  {companyData.company_info?.name || selectedCompany.name}
                </h2>
                <p style={styles.successRate}>
                  {selectedCompany.symbol} • {companyData.company_info?.exchange} • {companyData.company_info?.country}
                </p>
              </div>
              
              {companyData.stock_price && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                    {formatCurrency(companyData.stock_price.current_price)}
                  </div>
                  <div style={{
                    color: priceChange.change >= 0 ? '#10b981' : '#ef4444',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {priceChange.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {formatCurrency(Math.abs(priceChange.change))} ({formatPercent(priceChange.percent)})
                  </div>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div style={styles.metricsContainer}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Market Cap</span>
                <span style={styles.metricValue}>
                  {formatNumber(companyData.stock_price?.market_cap)}
                </span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>P/E Ratio</span>
                <span style={styles.metricValue}>
                  {companyData.stock_price?.pe_ratio ? companyData.stock_price.pe_ratio.toFixed(2) : 'N/A'}
                </span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>52W High</span>
                <span style={styles.metricValue}>
                  {formatCurrency(companyData.stock_price?.fifty_two_week_high)}
                </span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>52W Low</span>
                <span style={styles.metricValue}>
                  {formatCurrency(companyData.stock_price?.fifty_two_week_low)}
                </span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Volume</span>
                <span style={styles.metricValue}>
                  {companyData.stock_price?.volume?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              {['overview', 'chart', 'balance-sheet', 'income-statement', 'cash-flow'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: activeTab === tab ? '#515266' : 'transparent',
                    color: activeTab === tab ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={styles.tabContent}>
              {activeTab === 'overview' && (
                <div>
                  {companyData.company_info?.description && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                        Company Description
                      </h3>
                      <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                        {companyData.company_info.description}
                      </p>
                    </div>
                  )}
                  {renderStockChart()}
                </div>
              )}

              {activeTab === 'chart' && renderStockChart()}
              {activeTab === 'balance-sheet' && renderBalanceSheet()}
              {activeTab === 'income-statement' && renderIncomeStatement()}
              {activeTab === 'cash-flow' && renderCashFlow()}
            </div>
          </div>
        ) : (
          <div style={styles.noResults}>
            <h3 style={{ color: '#6b7280', marginBottom: '1rem' }}>Search for a Company</h3>
            <p style={{ color: '#9ca3af' }}>Enter a stock symbol or company name to get started</p>
            
            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ color: '#6b7280', marginBottom: '1rem' }}>Popular Companies</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {popularSearches.map((company) => (
                    <button
                      key={company.symbol}
                      onClick={() => handlePopularSearchClick(company)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Star size={14} style={{ color: '#f59e0b' }} />
                      <span style={{ fontWeight: '600' }}>{company.symbol}</span>
                      <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{company.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <p style={styles.copyright}>
            © 2024 Fingenie. All rights reserved.
          </p>
          <p style={styles.lastUpdated}>
            Data last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        <div style={styles.footerRight}>
          <h4 style={styles.functionsTitle}>Financial Tools</h4>
          <ul style={styles.functionsList}>
            <li style={styles.functionsItem}>Company Analysis</li>
            <li style={styles.functionsItem}>Financial Statements</li>
            <li style={styles.functionsItem}>Market Trends</li>
            <li style={styles.functionsItem}>Investment Research</li>
          </ul>
        </div>
      </footer>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Updated styles matching your aesthetic
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#ffffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '4rem 2rem'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #515266',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  loadingText: {
    fontSize: '1.5rem',
    color: '#1f2937',
    marginBottom: '0.5rem'
  },
  loadingSubtext: {
    color: '#6b7280',
    fontSize: '1rem'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    margin: '2rem'
  },
  errorTitle: {
    fontSize: '1.25rem',
    color: '#dc2626',
    marginBottom: '0.5rem'
  },
  errorText: {
    color: '#6b7280',
    marginBottom: '1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 2rem',
    backgroundColor: '#ffffff',
    border: '1px solid #000000ff',
    borderRadius: '8px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  navLink: {
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#070d1fff',
    transition: 'color 0.2s'
  },
  toolsMenu: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  userMenu: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  userIcon: {
    cursor: 'pointer'
  },
  HFdropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
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
    fontSize: '0.95rem'
  },
  footer: {
    backgroundColor: '#4D5C61',
    color: '#ffffff',
    padding: '2rem',
    marginTop: 'auto',
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
    margin: 0,
    fontSize: '0.9rem',
    color: '#d1d5db'
  },
  lastUpdated: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.8rem',
    color: '#9ca3af'
  },
  footerRight: {
    flex: 1
  },
  functionsTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#ffffff'
  },
  functionsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  functionsItem: {
    fontSize: '0.9rem',
    color: '#d1d5db',
    marginBottom: '0.5rem'
  },
  controlsBar: {
    backgroundColor: '#ffffff',
    padding: '1.5rem 2rem',
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    maxWidth: '500px'
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    border: '1px solid #424242ff',
    borderRadius: '20px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#5d6067ff'
  },
  sectorsButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: '#515266',
    color: 'white',
    border: '1px solid #000000ff',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: '#515266',
    color: 'white',
    border: '1px solid #000000ff',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  },
  statusBar: {
    backgroundColor: '#f8fafc',
    padding: '1rem 2rem',
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  statusLabel: {
    fontSize: '0.9rem',
    color: '#6b7280'
  },
  statusValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    flex: 1
  },
  noResults: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#6b7280'
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #000000ff',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  sectorTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  successRate: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.9rem',
    color: '#6b7280'
  },
  metricsContainer: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  chartContainer: {
    overflowX: 'auto',
    overflowY: 'hidden',
    marginTop: '1rem',
    paddingBottom: '1rem'
  },
  chartWrapper: {
    minWidth: '600px',
    height: '400px'
  },
  tooltip: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  noData: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  tabContent: {
    minHeight: '400px'
  },
  // Financial Table Styles
  financialTableContainer: {
    marginBottom: '2rem'
  },
  financialTableTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#1f2937',
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
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    backgroundColor: '#f7fafc',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: '600',
    color: '#1f2937'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    borderBottom: '1px solid #f3f4f6'
  },
  tableCell: {
    padding: '0.75rem 1rem',
    borderRight: '1px solid #f3f4f6',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center'
  },
  // Suggestions Dropdown
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
    maxHeight: '300px',
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
    color: '#1f2937',
    minWidth: '80px'
  },
  suggestionName: {
    color: '#6b7280',
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
  }
};

export default CompanySearch;