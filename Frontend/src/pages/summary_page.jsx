import React, { useState, useRef, useEffect } from 'react';
import Chatbot from '../components/chatbot.jsx';
import {
  Download,
  User,
  ChevronDown,
  X,
  History,
  Settings,
  LogOut,
  Wrench,
  BarChart,
  TrendingUp,
  Search,
  Activity,
  BookOpen,
  Cpu,
  GitCompare
} from "lucide-react";
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from 'jspdf';
import { 
  djangoRequest, 
  testAuthStatus, 
  getLatestReport, 
  getReport 
} from '../api/index'; // Import the corrected functions

export default function FinGenieApp() {
  const [currentPage, setCurrentPage] = useState('summary');
  const [selectedRatio, setSelectedRatio] = useState(1);
  const [showDetailedRatios, setShowDetailedRatios] = useState(false);
  const [hoveredRatio, setHoveredRatio] = useState(null);
  const [hoverTimer, setHoverTimer] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sectorDropdown, setSectorDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const summaryRef = useRef();
  const ratiosRef = useRef();

  // State for backend data
  const [companyData, setCompanyData] = useState(null);
  const [financialRatios, setFinancialRatios] = useState([]);
  const [stockData, setStockData] = useState(null);
  // Attempt to load stored API key (user may have saved it earlier on API key page)
  const [apiKey, setApiKey] = useState(() => (
    localStorage.getItem('groq_api_key') ||
    localStorage.getItem('userApiKey') ||
    localStorage.getItem('GENAI_API_KEY') ||
    ''
  ));

  // Enhanced authentication check
  const checkAuthentication = async () => {
    try {
      console.log("Checking authentication status...");
      const authStatus = await testAuthStatus();
      console.log("Auth status:", authStatus);
      
      if (!authStatus.authenticated) {
        console.log('User not authenticated, redirecting to login');
        setError('Please log in to access this page');
        setTimeout(() => {
          navigate("/homepage_beforelogin");
        }, 2000);
        return false;
      }
      
      console.log('User authenticated successfully');
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Authentication check failed. Please log in again.');
      setTimeout(() => {
        navigate("/homepage_beforelogin");
      }, 2000);
      return false;
    }
  };

  // Add logout function
  const handleLogout = async () => {
    try {
      await djangoRequest('/accounts/api/logout/', {
        method: 'POST'
      });
      navigate("/homepage_beforelogin");
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate anyway even if logout request fails
      navigate("/homepage_beforelogin");
    }
  };

  // Get data from location state (if coming from upload) or fetch from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check authentication
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) return;

      console.log("Fetching company data...");
      
      let data;
      const locationData = location.state;
      
      if (locationData && locationData.report_id) {
        console.log("Fetching specific report:", locationData.report_id);
        data = await getReport(locationData.report_id);
      } else {
        console.log("Fetching latest report");
        data = await getLatestReport();
      }

      console.log('API Response:', data);
      
      if (data.success === false) {
        throw new Error(data.error || 'Failed to load data');
      }
      
      setCompanyData(data);
      setFinancialRatios(data.ratios || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      
      if (err.message.includes('Authentication') || err.message.includes('401') || err.message.includes('403')) {
        setError('Authentication required. Redirecting to login...');
        setTimeout(() => {
          navigate("/homepage_beforelogin");
        }, 2000);
      } else if (err.message.includes('404')) {
        setError('No financial reports found. Please upload a balance sheet to get started.');
      } else {
        setError(err.message || 'Failed to load company data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.state]);

  // Fetch stock data if company has a ticker
  useEffect(() => {
    const fetchStockData = async () => {
      if (!companyData?.ticker_symbol) return;

      try {
        const stockDataResponse = await djangoRequest(`/dataprocessor/api/stock-data/${companyData.ticker_symbol}/`);
        setStockData(stockDataResponse.data || stockDataResponse);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      }
    };

    fetchStockData();
  }, [companyData?.ticker_symbol]);

  // Handle ratio hover
  const handleRatioHover = (ratioId) => {
    const timer = setTimeout(() => {
      setHoveredRatio(ratioId);
    }, 500);
    setHoverTimer(timer);
  };

  const handleRatioLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setHoveredRatio(null);
  };

  // Simplified PDF Download Function 
  const downloadPDF = async () => {
    const addWrappedText = (pdf, text, x, y, maxWidth, lineHeight = 16) => {
  const lines = pdf.splitTextToSize(text, maxWidth);
  for (let line of lines) {
    if (y > 760) {             // page overflow check
      pdf.addPage();
      y = 40;                  // reset to top margin
    }
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
};

    try {
      const pdf = new jsPDF('p', 'pt', 'a4');
      let yPosition = 40;
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Financial Report - FinGenie', 40, yPosition);
      yPosition += 40;

      // Company info
      pdf.setFontSize(16);
      pdf.text(`Company: ${companyData?.company_name || 'Unknown Company'}`, 40, yPosition);
      yPosition += 25;
      
      if (companyData?.ticker_symbol) {
        pdf.text(`Ticker: ${companyData.ticker_symbol}`, 40, yPosition);
        yPosition += 25;
      }

      // Summary section
      pdf.setFontSize(14);
      pdf.text('Executive Summary', 40, yPosition);
      yPosition += 20;

      pdf.setFontSize(10);
      if (companyData?.summary) {
        // Financial Health Summary
        if (companyData.summary.financial_health_summary) {
  pdf.setTextColor(0, 0, 139);
  pdf.text("Financial Health Overview:", 40, yPosition);
  yPosition += 20;
  pdf.setTextColor(0, 0, 0);

  yPosition = addWrappedText(
    pdf,
    companyData.summary.financial_health_summary,
    40,
    yPosition,
    500,   // max width
    16     // line height
  );
}
        // Pros
        if (companyData.summary.pros && companyData.summary.pros.length > 0) {
          pdf.setTextColor(0, 100, 0); // Green for pros
          pdf.text('Strengths:', 40, yPosition);
          yPosition += 15;
          pdf.setTextColor(0, 0, 0);
          
          companyData.summary.pros.forEach(pro => {
  yPosition = addWrappedText(pdf, `• ${pro}`, 50, yPosition, 480, 16);
});

        }

        // Cons
        if (companyData.summary.cons && companyData.summary.cons.length > 0) {
          if (yPosition > 650) {
            pdf.addPage();
            yPosition = 40;
          }
          pdf.setTextColor(139, 0, 0); // Red for cons
          pdf.text('Areas for Improvement:', 40, yPosition);
          yPosition += 15;
          pdf.setTextColor(0, 0, 0);
          
          companyData.summary.cons.forEach(con => {
  yPosition = addWrappedText(pdf, `• ${con}`, 50, yPosition, 480, 16);
});

        }

        

      }

      // Ratios section on new page
      // Ratios section on new page
pdf.addPage();
yPosition = 40;

pdf.setFontSize(14);
pdf.text('Financial Ratios Analysis', 40, yPosition);
yPosition += 30;

pdf.setFontSize(10);

if (financialRatios.length > 0) {
 financialRatios.forEach((ratio, index) => {

  if (yPosition > 720) {
    pdf.addPage();
    yPosition = 40;
  }

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 128);
  pdf.text(`${index + 1}. ${ratio.ratio_name || `Ratio ${index + 1}`}`, 40, yPosition);
  yPosition += 22;

  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  yPosition = addWrappedText(pdf, `Formula: ${ratio.formula || "N/A"}`, 50, yPosition, 480, 16);
  yPosition = addWrappedText(pdf, `Calculation: ${ratio.calculation || "N/A"}`, 50, yPosition, 480, 16);
  yPosition = addWrappedText(pdf, `Result: ${ratio.result || "N/A"}`, 50, yPosition, 480, 16);

  yPosition = addWrappedText(
    pdf,
    `Interpretation: ${ratio.interpretation || "No interpretation available"}`,
    50,
    yPosition,
    480,
    16
  );

  yPosition += 10;
});

}


      // Save PDF
      pdf.save(`FinGenie_Report_${companyData?.company_name || 'Unknown'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Header Component
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
          <span
            className="nav-link"
            style={styles.navLink}
            onClick={() => navigate("/mainpageafterlogin")}
          >
            Home
          </span>
          <span
            className="nav-link"
            style={{
              ...styles.navLink,
              borderBottom:
                location.pathname === "/NewsPage" ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/NewsPage")}
          >
            News
          </span>
          <span
            className="nav-link"
            style={{
              ...styles.navLink,
              borderBottom:
                location.pathname === "/AboutUs" ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/AboutUs")}
          >
            About us
          </span>
  
          <div
            style={styles.toolsMenu}
             onClick={() => setShowToolsDropdown(prev => !prev)} 
          >
            <Wrench size={24} color="black" style={styles.userIcon} />
            {showToolsDropdown && (
              <div style={styles.HFdropdown}>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/debt-ratings");
                  setShowToolsDropdown(false);
                }}
              >
                  <TrendingUp size={16} />
                  <span>Debt Ratings</span>
                </div>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/company-search");
                  setShowToolsDropdown(false);
                }}
              >
                  <Search size={16} />
                  <span>Search Companies</span>
                </div>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/charts-kpis");
                  setShowToolsDropdown(false);
                }}
              >
                  <Activity size={16} />
                  <span>Trends & KPIs</span>
                </div>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/blogs");
                  setShowToolsDropdown(false);
                }}
              >
                  <BookOpen size={16} />
                  <span>Blog Page</span>
                </div>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  setShowToolsDropdown(false);
                }}
              >
                  <Cpu size={16} />
                  <span>AI Summary</span>
                </div>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/comparison");
                  setShowToolsDropdown(false);
                }}
              >
                  <GitCompare size={16} />
                  <span>Comparison</span>
                </div>
                <div style={styles.dropdownItem}>
                  <GitCompare size={16} />
                  <span>Sector Overview</span>
                </div>
              </div>
            )}
          </div>
  
          <div
            style={styles.userMenu}
            onClick={() => setShowDropdown(prev => !prev)} 
          >
            <User size={24} color="black" style={styles.userIcon} />
            {showDropdown && (
              <div style={styles.HFdropdown}>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/profile");
                  setShowDropdown(false);
                }}
              >
                  <User size={16} />
                  <span>Profile</span>
                </div>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/profile?tab=history");
                  setShowDropdown(false);
                }}
              >
                  <History size={16} />
                  <span>History</span>
                </div>
                <div 
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/profile?tab=settings");
                  setShowDropdown(false);
                }}
              >
                  <Settings size={16} />
                  <span>Settings</span>
                </div>
                <div style={styles.dropdownItem}
                  onClick={() => {
                    // (Optional) clear user data or tokens here
                    handleLogout();      // Redirect to dashboard on logout
                  }}>
                  <LogOut size={16} />
                  <span>Sign Out</span>
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
            <li style={styles.functionsItem}>Sector View</li>
            <li style={styles.functionsItem}>Debt ratings</li>
            <li style={styles.functionsItem}>search companies</li>
            <li style={styles.functionsItem}>Blog Page</li>
            <li style={styles.functionsItem}>Trends & KPIs</li>
            <li style={styles.functionsItem}>Compare companies</li>
          </ul>
        </div>
      </footer>
    );

  // Navigation Component
  const Navigation = () => (
    <div style={styles.navigation}>
      <div style={styles.navButtons}>
        <button
          style={{
            ...styles.navButton,
            ...(currentPage === 'summary' ? styles.navButtonActive : {})
          }}
          onClick={() => setCurrentPage('summary')}
        >
          Summary
        </button>
        <button
          style={{
            ...styles.navButton,
            ...(currentPage === 'ratios' ? styles.navButtonActive : {})
          }}
          onClick={() => setCurrentPage('ratios')}
        >
          Ratios
        </button>
      </div>

      {/* Download Button */}
      <button style={styles.downloadButton} onClick={downloadPDF}>
        Download <Download size={18} />
      </button>
    </div>
  );

  // Footer Component


  const sectors = [
    'Telecom', 'Technology', 'Financial Services', 
    'Real Estate', 'Banking', 'Infrastructure', 
    'Pharma', 'Automobile', 'Energy', 
    'Consumer Goods', 'Metals & Mining', 'Chemicals'
  ];

  // Summary Page
  const SummaryPage = () => {
    if (loading) return <div style={styles.loading}>Loading company data...</div>;
    if (error) return <div style={styles.error}>{error}</div>;
    if (!companyData) return <div style={styles.noData}>No company data available. Please upload a balance sheet to get started.</div>;

    // Safely access the data with fallbacks
    const summary = companyData.summary || {};
    const pros = summary.pros || [];
    const cons = summary.cons || [];
    const financialHealthSummary = summary.financial_health_summary || 'No financial health summary available.';

    return (
      <>
        <div style={styles.CompareSectorHeaderContainer}>
          <h2 style={styles.companyName}>{companyData.company_name || 'Unknown Company'}</h2>
          {companyData.ticker_symbol && (
            <p style={styles.tickerSymbol}>Ticker: {companyData.ticker_symbol}</p>
          )}
          
        </div>

        <div style={styles.contentBox}>
  <div style={styles.contentGrid}>

    {/* SUMMARY (FULL WIDTH) */}
    <div style={{ ...styles.financialHealthSummarySec, gridArea: "summary" }}>
      <h3 style={styles.prosTitle}>Financial Health Summary</h3>
      <h4 style={{ color: '#3d3d3dff' }}>Overview</h4>
      <p style={styles.financialSummary}>{financialHealthSummary}</p>
    </div>

    {/* CONS (LEFT BOX) */}
    <div style={{ ...styles.consSection, gridArea: "cons" }}>
      <h3 style={styles.prosTitle}>Cons</h3>
      <ul style={styles.prosList}>
        {cons.length > 0 ? cons.map((con, i) => <li key={i}>{con}</li>) : <li>No cons data available</li>}
      </ul>
    </div>

    {/* PROS (RIGHT BOX) */}
    <div style={{ ...styles.prosSection, gridArea: "pros" }}>
      <h3 style={styles.prosTitle}>Pros</h3>
      <ul style={styles.prosList}>
        {pros.length > 0 ? pros.map((pro, i) => <li key={i}>{pro}</li>) : <li>No pros data available</li>}
      </ul>
    </div>

  </div>
</div>

      </>
    );
  };

  // Ratios Page
  const RatiosPage = () => {
    if (loading) return <div style={styles.loading}>Loading ratios...</div>;
    if (error) return <div style={styles.error}>{error}</div>;
    if (!companyData) return <div style={styles.noData}>No company data available.</div>;

    // Safely access ratios data
    const ratios = Array.isArray(companyData?.ratios) ? companyData.ratios : [];

    return (
      <>
        <h2 style={styles.companyName}>{companyData?.company_name || 'Company Ratios'}</h2>
        {companyData?.ticker_symbol && (
          <p style={styles.tickerSymbol}>Ticker: {companyData.ticker_symbol}</p>
        )}

        <div style={{ ...styles.contentBox, minHeight: '400px', paddingBottom: '1rem', marginBottom: '1rem' }}>
          {ratios.length > 0 ? (
            ratios.map((ratio, index) => (
              <div key={index} style={styles.ratioRow}>
                <button style={styles.ratioButton} onClick={() => setShowDetailedRatios(true)}>
                  {ratio.ratio_name || `Ratio ${index + 1}`}
                </button>
                <div style={{ display: 'flex' }}>
                  <div style={styles.ratioDot} />
                </div>
                <div style={styles.ratioDescription}>
                  <div style={styles.ratioDescText}>
                    <strong>Formula:</strong> {ratio.formula || 'N/A'} <br />
                    <strong>Calculation:</strong> {ratio.calculation || 'N/A'} <br />
                    <strong>Result:</strong> {ratio.result || 'N/A'} <br />
                    <strong>Interpretation:</strong> {ratio.interpretation || 'No interpretation available'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No financial ratios available.</p>
          )}
        </div>
        
        {ratios.length > 0 && (
          <button
            style={styles.knowMoreButtonOutside}
            onClick={() => setShowDetailedRatios(true)}
          >
            know about your ratios.
          </button>
        )}
      </>
    );
  };

  // Detailed Ratios Modal
  const DetailedRatiosModal = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <button
          style={styles.closeButton}
          onClick={() => setShowDetailedRatios(false)}
        >
          <X size={24} />
        </button>
        <h2 style={styles.modalTitle}>Detailed Ratio Analysis</h2>
        <div style={styles.ratiosGrid}>
          {financialRatios.map((ratio, index) => (
            <div
              key={index}
              style={{
                ...styles.ratioCard
              }}
            >
              <h3 style={styles.ratioCardTitleDark}>
                {ratio.ratio_name || `Ratio ${index + 1}`}
              </h3>
              <p style={index >= 4 ? styles.ratioCardTextDark : styles.ratioCardText}>
                {ratio.interpretation || 'No detailed interpretation available.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <Header />
      <Navigation />

      <main style={styles.main}>
        {currentPage === 'summary' && (
          <div ref={summaryRef}>
            <SummaryPage />
          </div>
        )}
        {currentPage === 'ratios' && (
          <div ref={ratiosRef}>
            <RatiosPage />
          </div>
        )}
      </main>

      <Footer />
      {showDetailedRatios && <DetailedRatiosModal />}
      {/* Floating Chatbot mounted globally on summary page */}
      <Chatbot reportId={companyData?.report_id} apiKey={apiKey} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f8f8',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  tickerSymbol: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '1rem',
    fontStyle: 'italic',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#333',
    fontSize: '16px',
    fontStyle: 'italic'
  },
  error: {
    textAlign: 'center',
    padding: '3rem',
    color: '#d32f2f',
    fontSize: '16px',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    margin: '2rem'
  },
  noData: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666',
    fontSize: '16px',
    fontStyle: 'italic'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 2rem',
    backgroundColor: '#DEE6E6',
    
    border: '1px solid #000000ff',
    borderRadius: '8px',

    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  navLink: {
    cursor: "pointer",
    color: "#000000",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "opacity 0.3s",
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
    color: 'Black'
  },
  userIcon: {
    transition: 'color 0.2s'
  },

  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '14px'
    ,color:'black'
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 3rem',
    backgroundColor: '#f8f8f8',
  },
  navButtons: {
    display: 'flex',
    gap: '1rem',
  },
  navButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#ffffffff',
    color: 'black',
    border: '1px solid black',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
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
  navButtonActive: {
    backgroundColor: '#515266',
    color: 'white',
  },
  downloadButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0A2540',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.3s',
  },
  CompareSectorHeaderContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  compareSectorButton: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#F8FAF1',
    color: 'Black',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.3s',
    border: '1px solid #444',
    marginLeft: 'auto',
  },
  main: {
    flex: 1,
    padding: '0.5rem 3rem',
  },
  contentBox: {
    backgroundColor: '#faf9f9ff',
    border: '2px solid #444',
    borderRadius: '20px',
    padding: '2rem',
    minHeight: '500px',
  },
  companyName: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '2rem',
    color: 'black',
  },
  contentGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gridTemplateAreas: `
    "summary summary"
    "cons    pros"
  `,
  gap: "40px",
},

  prosSection: {
    backgroundColor: '#D1DFDF',
    padding: '2rem',
    borderRadius: '12px',
    minHeight: '300px'
  },
  consSection: {
    backgroundColor: '#dfd1d1ff',
    padding: '2rem',
    borderRadius: '12px',
    minHeight: '300px'
  },
  financialHealthSummarySec: {
    backgroundColor: '#d1d5dfff',
    padding: '2rem',
    borderRadius: '12px',
    minHeight: '300px',
    marginTop: '2rem',
  },
  prosTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  prosList: {
    color: '#1a1a1a',
    lineHeight: '1.8',
    paddingLeft: '1.5rem',
  },
  financialSummary: {
    color: '#1a1a1a',
    lineHeight: '1.8',
    paddingLeft: '1.5rem',
  },
  chartContainer: {
    width: '50%',
    minWidth: 320,
    maxWidth: 800,
    height: 320,
    backgroundColor: '#ffffff',
    padding: '0.5rem',
    borderRadius: 12,
  },
  ratioRow: { 
    display: 'grid',
    gridTemplateColumns: '150px 30px 1fr', 
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  ratioDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#555',
    marginTop: '-2.9rem',
    marginLeft: '0.2rem',
  },
  ratioButton: {
    padding: '1rem',
    backgroundColor: '#c1cadcff',
    color: 'Black',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'background-color 0.3s',
    width: '100%',
    marginTop: '-5rem',
  },
  ratioDescription: {
    backgroundColor: '#D1DFDF',
    padding: '2rem',
    borderRadius: '10px',
    position: 'relative',
    marginBottom: '2rem',
  },
  ratioDescText: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#202020ff',
  },
  knowMoreButtonOutside: {
    padding: '1rem',
    backgroundColor: '#ECF0D4',
    color: 'black',
    border: '1px solid black',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '1rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    padding: '3rem',
    borderRadius: '12px',
    maxWidth: '1200px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem',
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '2rem',
    color: 'white',
  },
  ratiosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
  },
  ratioCard: {
    backgroundColor: '#D1DFDF',
    padding: '2rem',
    borderRadius: '8px',
  },
  ratioCardDark: {
    backgroundColor: '#383838',
  },
  ratioCardLight: {
    backgroundColor: '#EEF4CE',
  },
  ratioCardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'white',
  },
  ratioCardTitleDark: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1a1a1a',
  },
  ratioCardText: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#0c0c0cff',
  },
  ratioCardTextDark: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#1a1a1a',
  },
  footer: {
    backgroundColor: '#4D5C61',
    color: '#FFFFFF',
    padding: '2rem 4rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: '4rem',
    position: 'relative',
    zIndex: 5,
  },
  footerLeft: {
    flex: 1,
    alignItems: 'center',
  },
  copyright: {
    fontSize: '13px',
    marginBottom: 0,
    lineHeight: 1.8,
  },
  footerLink: {
    color: '#FFFFFF',
    textDecoration: 'none',
    transition: 'opacity 0.3s',
  },
  footerRight: {
    textAlign: 'right',
    flex: 1,
  },
  functionsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    marginRight: '10rem',
  },
  functionsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: '3.5fr 1fr',
    textAlign: 'right', 
    gap: '6px 0px',
  },
  functionsItem: {
    fontSize: '13px',
    margin: 0,
    textTransform: "capitalize",
    whiteSpace: 'nowrap'
  },
  dropdownContainer: {
    position: 'absolute', 
    marginTop: '0.5rem',
    right: 0, 
    minWidth: '180px',
    maxWidth: '80vw',
    backgroundColor: '#DCDCDC', 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    zIndex: 10,
    padding: '0.5rem 0',
  },
  sectorHeader: {
    fontSize: '14px',
    fontWeight: 'normal',
    color: '#444444',
    padding: '5px 15px',
    textAlign: 'center',
    borderBottom: '1px solid #C0C0C0',
  },
  sectorItem: {
    padding: '8px 15px',
    fontSize: '18px',
    color: '#333333',
    textAlign: 'center',
    cursor: 'pointer',
  },
};