import React, { useState, useRef, useEffect } from 'react';
import { Search, Wrench, User, ChevronDown, Plus, X, TrendingUp, Activity, BookOpen, Cpu, GitCompare, History, Settings, LogOut, RefreshCw } from 'lucide-react';
import fglogo_Wbg from '../images/fglogo_Wbg.png';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define Header component at the top level, before SectorOverviewDashboard
const Header = ({ showDropdown, setShowDropdown, showToolsDropdown, setShowToolsDropdown }) => (
  <header style={styles.header}>
    <div style={styles.headerLeft}>
      <div style={styles.logo}>
        <img
          src={fglogo_Wbg}
          style={{ height: "80px", width: "auto" }}
          alt="logo"
        />
      </div>
    </div>
    <nav style={styles.nav}>
      <span style={styles.navLink}>Home</span>
      <span style={styles.navLink}>News</span>
      <span style={styles.navLink}>About us</span>
      
      <div
        style={styles.toolsMenu}
        onMouseEnter={() => setShowToolsDropdown(true)}
        onMouseLeave={() => setShowToolsDropdown(false)}
      >
        <Wrench size={24} color="black" style={styles.userIcon} />
        {showToolsDropdown && (
          <div style={styles.HFdropdown}>
            <div style={styles.dropdownItem}>
              <TrendingUp size={16} />
              <span>Debt Ratings</span>
            </div>
            <div style={styles.dropdownItem}>
              <Search size={16} />
              <span>Search Companies</span>
            </div>
            <div style={styles.dropdownItem}>
              <Activity size={16} />
              <span>Charts & KPIs</span>
            </div>
            <div style={styles.dropdownItem}>
              <BookOpen size={16} />
              <span>Blog Page</span>
            </div>
            <div style={styles.dropdownItem}>
              <Cpu size={16} />
              <span>AI Summary</span>
            </div>
            <div style={styles.dropdownItem}>
              <GitCompare size={16} />
              <span>Comparison</span>
            </div>
          </div>
        )}
      </div>

      <div
        style={styles.userMenu}
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        <User size={24} color="black" style={styles.userIcon} />
        {showDropdown && (
          <div style={styles.HFdropdown}>
            <div style={styles.dropdownItem}>
              <User size={16} />
              <span>Profile</span>
            </div>
            <div style={styles.dropdownItem}>
              <History size={16} />
              <span>History</span>
            </div>
            <div style={styles.dropdownItem}>
              <Settings size={16} />
              <span>Settings</span>
            </div>
            <div style={styles.dropdownItem}>
              <LogOut size={16} />
              <span>Sign out</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  </header>
);

// Define Footer component
const Footer = ({ lastUpdated }) => (
  <footer style={styles.footer}>
    <div style={styles.footerLeft}>
      <p style={styles.copyright}>
        © 2025 FinGenie | <a href="#" style={styles.footerLink}>About</a> | <a href="#" style={styles.footerLink}>Privacy Policy</a> | <a href="#" style={styles.footerLink}>Contact</a>
      </p>
      {lastUpdated && (
        <p style={styles.lastUpdated}>
          Last updated: {lastUpdated}
        </p>
      )}
    </div>
    <div style={styles.footerRight}>
      <h4 style={styles.functionsTitle}>Functions</h4>
      <ul style={styles.functionsList}>
        <li style={styles.functionsItem}>AI summary</li>
        <li style={styles.functionsItem}>stock graphs</li>
        <li style={styles.functionsItem}>Debt ratings</li>
        <li style={styles.functionsItem}>search companies</li>
        <li style={styles.functionsItem}>Blog Page</li>
        <li style={styles.functionsItem}>Charts & KPIs</li>
      </ul>
    </div>
  </footer>
);

const SectorChart = ({ companies }) => {
  // Check if we have valid data
  if (!companies || companies.length === 0) {
    return (
      <div style={styles.noData}>
        <p>No company data available for chart</p>
      </div>
    );
  }

  // Validate that we have the required properties
  const validCompanies = companies.filter(company => 
    company && company.symbol && typeof company.change_pct !== 'undefined'
  );

  if (validCompanies.length === 0) {
    return (
      <div style={styles.noData}>
        <p>No valid data for chart</p>
      </div>
    );
  }

  const chartData = {
    labels: validCompanies.map(c => c.symbol),
    datasets: [
      {
        label: '% Change',
        data: validCompanies.map(c => c.change_pct),
        backgroundColor: validCompanies.map(c => 
          c.change_pct >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: validCompanies.map(c => 
          c.change_pct >= 0 ? 'rgba(12, 218, 149, 1)' : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // Optimized for more companies
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280',
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: '% Change',
          color: '#6b7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 0
        },
        barPercentage: 0.7, // Thinner bars for more companies
        categoryPercentage: 0.8, // More spacing between categories
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

const SectorOverviewDashboard = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [tempSelectedCompanies, setTempSelectedCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const sectionRefs = useRef({});

  // Fetch real-time data from backend
  const fetchSectorData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      console.log('Fetching real-time sector data...');
      const response = await fetch('/sector/api/sector-overview/');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API data received:', data);
      
      // Remove metadata if present
      const { _metadata, ...sectorsData } = data;
      
      // Transform the API response to match our frontend structure
      const transformedSectors = Object.entries(sectorsData).map(([sectorName, sectorData]) => {
        // FIX: Ensure the companies have the correct property names
        const companies = (sectorData.stocks || []).map(stock => ({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          change_pct: stock.change_pct || 0,
          price: stock.price || 0,
          ticker: stock.symbol
        }));
        
        return {
          name: sectorName,
          avgPrice: sectorData.avg_price || 0,
          avgChange: sectorData.avg_change_pct || 0,
          companies: companies,
          companies_count: sectorData.companies_count || companies.length,
          success_rate: sectorData.success_rate || '0/0'
        };
      });
      
      setSectors(transformedSectors);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
      
    } catch (err) {
      console.error('Error fetching sector data:', err);
      setError(err.message);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSectorData();
    
    // Set up auto-refresh every 30 minutes (1800000 milliseconds)
    const interval = setInterval(fetchSectorData, 1800000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSector = (sectorName) => {
    const element = sectionRefs.current[sectorName];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setDropdownOpen(false);
    }
  };

  const openModal = (sector) => {
    setSelectedSector(sector);
    setTempSelectedCompanies(sector.companies.map(c => c.ticker));
    setModalOpen(true);
  };

  const toggleCompany = (ticker) => {
    setTempSelectedCompanies(prev =>
      prev.includes(ticker)
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };

  const applyCustomGroup = () => {
    if (!selectedSector) return;

    const newCompanyList = selectedSector.companies.filter((c) =>
      tempSelectedCompanies.includes(c.ticker)
    );

    setSectors((prev) =>
      prev.map((sector) =>
        sector.name === selectedSector.name
          ? {
              ...sector,
              companies: newCompanyList,
            }
          : sector
      )
    );
    setModalOpen(false);
  };

  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sector.companies.some(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Loading skeleton
  if (loading) {
    return (
      <div style={styles.page}>
        <Header 
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          showToolsDropdown={showToolsDropdown}
          setShowToolsDropdown={setShowToolsDropdown}
        />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <h3 style={styles.loadingText}>Loading Real-Time Market Data...</h3>
          <p style={styles.loadingSubtext}>Fetching live stock prices from yfinance</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.page}>
        <Header 
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          showToolsDropdown={showToolsDropdown}
          setShowToolsDropdown={setShowToolsDropdown}
        />
        <div style={styles.errorContainer}>
          <h3 style={styles.errorTitle}>⚠️ Unable to Load Market Data</h3>
          <p style={styles.errorText}>{error}</p>
          <button 
            style={styles.retryButton}
            onClick={fetchSectorData}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : '🔄 Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Header 
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        showToolsDropdown={showToolsDropdown}
        setShowToolsDropdown={setShowToolsDropdown}
      />

      <div style={styles.controlsBar}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search sectors or companies..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button
            style={styles.sectorsButton}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#707181ff'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#515266'}
          >
            Sectors
            <ChevronDown size={18} />
          </button>
          
          {dropdownOpen && (
            <div style={styles.dropdown}>
              {sectors.map(sector => (
                <div
                  key={sector.name}
                  style={styles.dropdownItemSector}
                  onClick={() => scrollToSector(sector.name)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {sector.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          style={styles.refreshButton}
          onClick={fetchSectorData}
          disabled={refreshing}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#707181ff'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#515266'}
        >
          <RefreshCw 
            size={18} 
            style={refreshing ? { 
              animation: 'spin 1s linear infinite',
              transformOrigin: 'center'
            } : {}} 
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={styles.statusBar}>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>Sectors Loaded:</span>
          <span style={styles.statusValue}>{sectors.length}</span>
        </div>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>Total Stocks:</span>
          <span style={styles.statusValue}>
            {sectors.reduce((acc, sector) => acc + sector.companies_count, 0)}
          </span>
        </div>
        {lastUpdated && (
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Last Updated:</span>
            <span style={styles.statusValue}>{lastUpdated}</span>
          </div>
        )}
      </div>

      <div style={styles.container}>
        {filteredSectors.length === 0 ? (
          <div style={styles.noResults}>
            <h3>No sectors found</h3>
            <p>Try adjusting your search terms</p>
          </div>
        ) : (
          filteredSectors.map(sector => (
            <div
              key={sector.name}
              ref={el => sectionRefs.current[sector.name] = el}
              style={styles.sectionContainer}
            >
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectorTitle}>{sector.name}</h2>
                  {sector.success_rate && (
                    <p style={styles.successRate}>
                      {sector.success_rate} stocks loaded
                    </p>
                  )}
                </div>
                <button
                  style={styles.createGroupButton}
                  onClick={() => openModal(sector)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#CAD3E7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#CAD3E7'}
                >
                  <Plus size={18} />
                  Make custom company group
                </button>
              </div>

              <div style={styles.metricsContainer}>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Average Price</span>
                  <span style={styles.metricValue}>
                    ₹{sector.avgPrice.toLocaleString()}
                  </span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Average % Change</span>
                  <span
                    style={{
                      ...styles.metricValue,
                      color: sector.avgChange >= 0 ? '#1cc638ff' : '#ef4444'
                    }}
                  >
                    {sector.avgChange >= 0 ? '+' : ''}{sector.avgChange.toFixed(2)}%
                  </span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Companies</span>
                  <span style={styles.metricValue}>
                    {sector.companies_count}
                  </span>
                </div>
              </div>

              {sector.companies.length > 0 ? (
                <div style={styles.chartContainer}>
                  <div style={{ ...styles.chartWrapper, minWidth: `${Math.max(600, sector.companies.length * 90)}px` }}>
                    <SectorChart companies={sector.companies} />
                  </div>
                </div>
              ) : (
                <div style={styles.noData}>
                  <p>No stock data available for this sector</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Footer lastUpdated={lastUpdated} />

      {modalOpen && selectedSector && (
        <div style={styles.modal} onClick={() => setModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Customize {selectedSector.name} Companies</h3>
              <button
                style={styles.closeButton}
                onClick={() => setModalOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <X size={24} />
              </button>
            </div>

            <div style={styles.companyList}>
              {selectedSector.companies.map(company => (
                <div
                  key={company.ticker}
                  style={styles.companyItem}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <input
                    type="checkbox"
                    id={company.ticker}
                    style={styles.checkbox}
                    checked={tempSelectedCompanies.includes(company.ticker)}
                    onChange={() => toggleCompany(company.ticker)}
                  />
                  <label
                    htmlFor={company.ticker}
                    style={styles.companyLabel}
                  >
                    {company.ticker} - ₹{company.price} ({company.change_pct >= 0 ? '+' : ''}{company.change_pct}%)
                  </label>
                </div>
              ))}
            </div>

            <div style={styles.modalActions}>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={() => setModalOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={applyCustomGroup}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#515266'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#515266'}
              >
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for spinning animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

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
    flex: 1,
    padding: '4rem 2rem',
    textAlign: 'center'
  },
  errorTitle: {
    fontSize: '1.5rem',
    color: '#dc2626',
    marginBottom: '1rem'
  },
  errorText: {
    color: '#6b7280',
    marginBottom: '2rem',
    maxWidth: '400px'
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#515266',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500'
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
  footerLink: {
    color: '#60a5fa',
    textDecoration: 'none'
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    marginTop: '0.5rem',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '200px',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1000
  },
  dropdownItemSector: {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '0.95rem'
  },
  statusBar: {
    backgroundColor: '#f8fafc',
    padding: '1rem 2rem',
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb'
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
  createGroupButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: '#CAD3E7',
    color: 'black',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
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
  noData: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '1rem'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  closeButton: {
    padding: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  companyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  companyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    transition: 'background-color 0.2s'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  companyLabel: {
    fontSize: '0.95rem',
    color: '#1f2937',
    cursor: 'pointer',
    flex: 1
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },
  button: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  primaryButton: {
    backgroundColor: '#515266',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    color: '#1f2937'
  }
};

export default SectorOverviewDashboard;
