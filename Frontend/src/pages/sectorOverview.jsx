import React, { useState, useRef, useEffect } from 'react';
import { Search, Wrench, User, ChevronDown, Plus, X, TrendingUp, Activity, BookOpen, Cpu, GitCompare, History, Settings, LogOut } from 'lucide-react';
import fglogo_Wbg from './images/fglogo_Wbg.png';

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


const initialSectors = [
  {
    name: "Telecom",
    avgPrice: 185.50,
    avgChange: -0.8,
    companies: [
      { ticker: "BHARTIARTL.NS", name: "Bharti Airtel", change: -0.5 },
      { ticker: "IDEA.NS", name: "Vodafone Idea", change: -2.3 },
      { ticker: "TATACOMM.NS", name: "Tata Communications", change: 0.2 }
    ]
  },
  {
    name: "Technology",
    avgPrice: 2070.67,
    avgChange: 0.3,
    companies: [
  { ticker: "TCS.NS", name: "Tata Consultancy Services", change: 1.3 },
  { ticker: "INFY.NS", name: "Infosys", change: -0.5 },
  { ticker: "WIPRO.NS", name: "Wipro", change: 0.8 },
  { ticker: "HCLTECH.NS", name: "HCL Technologies", change: -0.2 },
  { ticker: "LT.NS", name: "Larsen & Toubro", change: 0.6 },
  { ticker: "TECHM.NS", name: "Tech Mahindra", change: 1.1 },
  { ticker: "MINDTREE.NS", name: "Mindtree", change: -0.9 },
  { ticker: "MPHASIS.NS", name: "Mphasis", change: 0.3 },
  { ticker: "COFORGE.NS", name: "Coforge", change: 1.9 },
  { ticker: "PERSISTENT.NS", name: "Persistent Systems", change: 2.4 },
  { ticker: "HEXAWARE.NS", name: "Hexaware Technologies", change: -0.7 },
  { ticker: "NIITTECH.NS", name: "NIIT Technologies", change: 1.0 },
  { ticker: "CYIENT.NS", name: "Cyient", change: -1.4 },
  { ticker: "LTTS.NS", name: "L&T Technology Services", change: 0.5 },
  { ticker: "OFSS.NS", name: "Oracle Financial Services Software", change: -0.3 },
  { ticker: "REDINGTON.NS", name: "Redington", change: 2.1 },
  { ticker: "SONATSOFTW.NS", name: "Sonata Software", change: 0.9 },
  { ticker: "ZENSARTECH.NS", name: "Zensar Technologies", change: -0.8 },
  { ticker: "KPITTECH.NS", name: "KPIT Technologies", change: 1.7 }
]

  },
  {
    name: "Financial Services",
    avgPrice: 1450.25,
    avgChange: 1.2,
    companies: [
      { ticker: "BAJFINANCE.NS", name: "Bajaj Finance", change: 2.1 },
      { ticker: "BAJAJFINSV.NS", name: "Bajaj Finserv", change: 1.5 },
      { ticker: "HDFCLIFE.NS", name: "HDFC Life Insurance", change: 0.9 },
      { ticker: "SBILIFE.NS", name: "SBI Life Insurance", change: 0.3 }
    ]
  },
  {
    name: "Real Estate",
    avgPrice: 580.40,
    avgChange: -1.5,
    companies: [
      { ticker: "DLF.NS", name: "DLF", change: -1.2 },
      { ticker: "GODREJPROP.NS", name: "Godrej Properties", change: -2.5 },
      { ticker: "OBEROIRLTY.NS", name: "Oberoi Realty", change: -0.8 }
    ]
  },
  {
    name: "Banking",
    avgPrice: 890.75,
    avgChange: 0.7,
    companies: [
      { ticker: "HDFCBANK.NS", name: "HDFC Bank", change: 1.1 },
      { ticker: "ICICIBANK.NS", name: "ICICI Bank", change: 0.9 },
      { ticker: "SBIN.NS", name: "State Bank of India", change: 0.5 },
      { ticker: "AXISBANK.NS", name: "Axis Bank", change: 0.3 },
      { ticker: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", change: 0.6 }
    ]
  },
  {
    name: "Infrastructure",
    avgPrice: 320.90,
    avgChange: 2.1,
    companies: [
      { ticker: "LT.NS", name: "Larsen & Toubro", change: 2.5 },
      { ticker: "ADANIENT.NS", name: "Adani Enterprises", change: 3.2 },
      { ticker: "GAIL.NS", name: "GAIL India", change: 0.8 }
    ]
  },
  {
    name: "Pharma",
    avgPrice: 1250.30,
    avgChange: -0.4,
    companies: [
      { ticker: "SUNPHARMA.NS", name: "Sun Pharma", change: 0.2 },
      { ticker: "DRREDDY.NS", name: "Dr. Reddy's Lab", change: -1.2 },
      { ticker: "CIPLA.NS", name: "Cipla", change: -0.5 },
      { ticker: "DIVISLAB.NS", name: "Divi's Lab", change: -0.1 }
    ]
  },
  {
    name: "Automobile",
    avgPrice: 2340.60,
    avgChange: 1.8,
    companies: [
      { ticker: "MARUTI.NS", name: "Maruti Suzuki", change: 2.3 },
      { ticker: "TATAMOTORS.NS", name: "Tata Motors", change: 1.5 },
      { ticker: "M&M.NS", name: "Mahindra & Mahindra", change: 1.9 },
      { ticker: "BAJAJ-AUTO.NS", name: "Bajaj Auto", change: 1.5 }
    ]
  },
  {
    name: "Energy",
    avgPrice: 450.20,
    avgChange: 0.5,
    companies: [
      { ticker: "RELIANCE.NS", name: "Reliance Industries", change: 0.7 },
      { ticker: "ONGC.NS", name: "ONGC", change: 0.3 },
      { ticker: "POWERGRID.NS", name: "Power Grid Corp", change: 0.5 },
      { ticker: "NTPC.NS", name: "NTPC", change: 0.4 }
    ]
  },
  {
    name: "Consumer Goods",
    avgPrice: 1890.45,
    avgChange: -0.6,
    companies: [
      { ticker: "HINDUNILVR.NS", name: "Hindustan Unilever", change: -0.3 },
      { ticker: "ITC.NS", name: "ITC", change: -0.8 },
      { ticker: "NESTLEIND.NS", name: "Nestle India", change: -0.7 },
      { ticker: "BRITANNIA.NS", name: "Britannia Industries", change: -0.6 }
    ]
  },
  {
    name: "Metals & Mining",
    avgPrice: 680.75,
    avgChange: 3.2,
    companies: [
      { ticker: "TATASTEEL.NS", name: "Tata Steel", change: 4.1 },
      { ticker: "HINDALCO.NS", name: "Hindalco Industries", change: 3.5 },
      { ticker: "JSWSTEEL.NS", name: "JSW Steel", change: 2.8 },
      { ticker: "COALINDIA.NS", name: "Coal India", change: 2.4 }
    ]
  },
  {
    name: "Chemicals",
    avgPrice: 920.15,
    avgChange: 1.1,
    companies: [
      { ticker: "UPL.NS", name: "UPL", change: 1.5 },
      { ticker: "PIDILITIND.NS", name: "Pidilite Industries", change: 0.9 },
      { ticker: "SRF.NS", name: "SRF", change: 1.2 },
      { ticker: "ATUL.NS", name: "Atul Ltd", change: 0.8 }
    ]
  }
];

const SectorChart = ({ companies }) => {
  const chartData = {
    labels: companies.map(c => c.ticker),
    datasets: [
      {
        label: '% Change',
        data: companies.map(c => c.change),
        backgroundColor: companies.map(c => 
          c.change >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: companies.map(c => 
          c.change >= 0 ? 'rgba(12, 218, 149, 1)' : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      ///////add current and previous price here//////////////////////////////////////////////////////////////////////////////////////////////////////
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: function(context) {
            const company = companies[context[0].dataIndex];
            return company.name;
          },
          label: function(context) {
            return `${context.parsed.y >= 0 ? '+' : ''}${context.parsed.y.toFixed(2)}%`;
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
        barPercentage: 1,    // Controls the thickness of the bar (80% of the category width)
        categoryPercentage: 0.9,
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};
const SectorOverviewDashboard = () => {
  const [sectors, setSectors] = useState(initialSectors);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  
  const [tempSelectedCompanies, setTempSelectedCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const sectionRefs = useRef({});

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

// ... in SectorOverviewDashboard component
const applyCustomGroup = () => {
    // 1. Find the full company list from the initial data
    const fullSectorData = initialSectors.find(
      (s) => s.name === selectedSector.name
    );

    if (!fullSectorData) {
      console.error('Sector not found in initial data.');
      setModalOpen(false);
      return;
    }

    // 2. Filter the FULL company list using the temporary selections
    const newCompanyList = fullSectorData.companies.filter((c) =>
      tempSelectedCompanies.includes(c.ticker)
    );

    // 3. Update the component state with the new list
    setSectors((prev) =>
      prev.map((sector) =>
        sector.name === selectedSector.name
          ? {
              ...sector,
              companies: newCompanyList, // Use the new list derived from FULL data
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
  const Header = () => (
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

  const Footer = () => (
    <footer style={styles.footer}>
      <div style={styles.footerLeft}>
        <p style={styles.copyright}>
          © 2025 FinGenie | <a href="#" style={styles.footerLink}>About</a> | <a href="#" style={styles.footerLink}>Privacy Policy</a> | <a href="#" style={styles.footerLink}>Contact</a>
        </p>
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

  return (
    <div style={styles.page}>
      <Header />

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
      </div>

      <div style={styles.container}>
        {filteredSectors.map(sector => (
          <div
            key={sector.name}
            ref={el => sectionRefs.current[sector.name] = el}
            style={styles.sectionContainer}
          >
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectorTitle}>{sector.name}</h2>
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
                  ₹{sector.avgPrice.toFixed(2)}
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
            </div>
                  {/* Sector Chart ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div style={styles.chartContainer}>
              <div style={{ ...styles.chartWrapper, minWidth: `${Math.max(600, sector.companies.length * 120)}px` }}>
                <SectorChart companies={sector.companies} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Footer />

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
      {/* Company Selection List////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}
            <div style={styles.companyList}>
              {initialSectors
                .find(s => s.name === selectedSector.name)
                .companies.map(company => (
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
                      {company.name} ({company.ticker})
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
    transition: 'color 0.2s',
    '&:hover': {
      color: '#454c5cff'
    }
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
  footerLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    transition: 'color 0.2s'
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
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    flex: 1
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
    alignItems: 'center',
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
    height: '350px'
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