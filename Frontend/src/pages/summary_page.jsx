import React, { useState, useRef, useEffect } from 'react';
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

  // Improved CSRF token function
  function getCSRFToken() {
    const csrfCookie = document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='));
    return csrfCookie ? csrfCookie.split('=')[1] : null;
  }

  // Get data from location state (if coming from upload) or fetch from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have data from location state (from upload)
        const locationData = location.state;
        
        let response;
        if (locationData && locationData.report_id) {
          response = await fetch(`http://127.0.0.1:8000/dataprocessor/api/reports/${locationData.report_id}/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
          });
        } else {
          response = await fetch('http://127.0.0.1:8000/dataprocessor/api/latest-report/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCSRFToken(),
            },
            credentials: 'include',
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        setCompanyData(data);
        setFinancialRatios(data.ratios || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load company data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  // Fetch stock data if company has a ticker
  useEffect(() => {
    const fetchStockData = async () => {
      if (!companyData?.ticker_symbol) return;

      try {
        const response = await fetch(`http://127.0.0.1:8000/dataprocessor/api/stock-data/${companyData.ticker_symbol}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
          },
          credentials: 'include',
        });

        if (response.ok) {
          const stockDataResponse = await response.json();
          setStockData(stockDataResponse.stock_data);
        }
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
        // Pros
        if (companyData.summary.pros && companyData.summary.pros.length > 0) {
          pdf.setTextColor(0, 100, 0); // Green for pros
          pdf.text('Strengths:', 40, yPosition);
          yPosition += 15;
          pdf.setTextColor(0, 0, 0);
          
          companyData.summary.pros.forEach(pro => {
            if (yPosition > 700) {
              pdf.addPage();
              yPosition = 40;
            }
            pdf.text(`• ${pro}`, 50, yPosition);
            yPosition += 15;
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
            if (yPosition > 700) {
              pdf.addPage();
              yPosition = 40;
            }
            pdf.text(`• ${con}`, 50, yPosition);
            yPosition += 15;
          });
        }

        // Financial Health Summary
        if (companyData.summary.financial_health_summary) {
          if (yPosition > 600) {
            pdf.addPage();
            yPosition = 40;
          }
          pdf.setTextColor(0, 0, 139); // Blue for summary
          pdf.text('Financial Health Overview:', 40, yPosition);
          yPosition += 15;
          pdf.setTextColor(0, 0, 0);
          
          // Split long text into multiple lines
          const summaryLines = pdf.splitTextToSize(companyData.summary.financial_health_summary, 500);
          summaryLines.forEach(line => {
            if (yPosition > 700) {
              pdf.addPage();
              yPosition = 40;
            }
            pdf.text(line, 40, yPosition);
            yPosition += 15;
          });
        }
      }

      // Ratios section on new page
      pdf.addPage();
      yPosition = 40;
      pdf.setFontSize(14);
      pdf.text('Financial Ratios Analysis', 40, yPosition);
      yPosition += 30;

      pdf.setFontSize(10);
      if (financialRatios.length > 0) {
        financialRatios.forEach((ratio, index) => {
          if (yPosition > 700) {
            pdf.addPage();
            yPosition = 40;
          }
          
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 128);
          pdf.text(`${index + 1}. ${ratio.ratio_name || `Ratio ${index + 1}`}`, 40, yPosition);
          yPosition += 20;
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`Formula: ${ratio.formula || 'N/A'}`, 50, yPosition);
          yPosition += 15;
          pdf.text(`Calculation: ${ratio.calculation || 'N/A'}`, 50, yPosition);
          yPosition += 15;
          pdf.text(`Result: ${ratio.result || 'N/A'}`, 50, yPosition);
          yPosition += 15;
          
          // Split interpretation text
          const interpretation = ratio.interpretation || 'No interpretation available';
          const interpretationLines = pdf.splitTextToSize(`Interpretation: ${interpretation}`, 500);
          interpretationLines.forEach(line => {
            if (yPosition > 700) {
              pdf.addPage();
              yPosition = 40;
            }
            pdf.text(line, 50, yPosition);
            yPosition += 15;
          });
          
          yPosition += 10; // Space between ratios
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
        {/* Home */}
        <span
          style={styles.navLink}
          onClick={() => navigate("/mainpageafterlogin")}
        >
          Home
        </span>

        {/* News */}
        <span
          style={styles.navLink}
          onClick={() => navigate("/NewsPage")}
        >
          News
        </span>

        {/* About */}
        <span
          style={styles.navLink}
          onClick={() => navigate("/AboutUs")}
        >
          About us
        </span>

        {/* Tools Menu */}
        <div
          style={styles.toolsMenu}
          onMouseEnter={() => setShowToolsDropdown(true)}
          onMouseLeave={() => setShowToolsDropdown(false)}
        >
          <Wrench size={24} color="black" style={styles.userIcon} />

          {showToolsDropdown && (
            <div style={styles.dropdown}>
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

        {/* User Menu */}
        <div
          style={styles.userMenu}
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <User size={24} color="black" style={styles.userIcon} />

          {showDropdown && (
            <div style={styles.dropdown}>
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

              <div
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/homepage_beforelogin");
                }}
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
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
    if (!companyData) return <div style={styles.error}>No company data available</div>;

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
          <div onClick={() => setSectorDropdown(prev => !prev)}>
            <button style={styles.compareSectorButton}>  
              Compare with your sector
            </button>

            {sectorDropdown && (
              <div style={styles.dropdownContainer}>
                <div style={styles.sectorHeader}>select your sector</div>
                {sectors.map((sector, index) => (
                  <div 
                    key={index} 
                    style={styles.sectorItem}
                  >
                    <span>{sector}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.contentBox}>
          <div style={styles.contentGrid}>
            <div style={styles.prosSection}>
              <h3 style={styles.prosTitle}>→ Pros</h3>
              <ul style={styles.prosList}>
                {pros.length > 0 ? (
                  pros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))
                ) : (
                  <li>No pros data available</li>
                )}
              </ul>
            </div>
            <div style={styles.consSection}>
              <h3 style={styles.prosTitle}>→ Cons</h3>
              <ul style={styles.prosList}>
                {cons.length > 0 ? (
                  cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))
                ) : (
                  <li>No cons data available</li>
                )}
              </ul>
            </div> 
          </div>
          
          <div style={styles.financialHealthSummarySec}>
            <h3 style={styles.prosTitle}>→ Financial Health Summary</h3>
            <h4 style={{ color: '#3d3d3dff' }}> Overview </h4>
            <p>{financialHealthSummary}</p>
          </div>

          {/* Stock Chart Section */}
          {stockData && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={styles.prosTitle}>Stock Performance</h3>
              <div style={styles.chartContainer}>
                <p>Stock data available for {companyData.ticker_symbol}</p>
                <p>Current Price: ${stockData.current_price}</p>
                <p>Change: {stockData.change} ({stockData.change_percent}%)</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // Ratios Page
  const RatiosPage = () => {
    if (loading) return <div style={styles.loading}>Loading ratios...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

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
                ...styles.ratioCard,
                ...(index === 2 || index === 3 ? styles.ratioCardDark : {}),
                ...(index === 4 || index === 5 ? styles.ratioCardLight : {})
              }}
            >
              <h3 style={index >= 4 ? styles.ratioCardTitleDark : styles.ratioCardTitle}>
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
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffffff',
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
    padding: '2rem',
    color: '#333',
    fontSize: '16px'
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#d6867d',
    fontSize: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 4rem',
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '15px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.1)',
    borderBottom: '2px solid black',
    color: 'white',
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
    position: "relative",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginLeft: "1rem",
    color: "Black",
  },
  userMenu: {
    position: 'relative',
    cursor: 'pointer',
    color: 'Black'
  },
  userIcon: {
    transition: 'color 0.2s'
  },
  dropdown: {
    position: 'absolute',
    right: '0',
    top: '32px',
    backgroundColor: '#D9D9D9',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(245, 238, 238, 0.2)',
    padding: '0.5rem',
    minWidth: '120px',
    zIndex: 1000
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
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 3rem',
    backgroundColor: '#ffffffff',
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
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
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
    backgroundColor: '#ffffffff',
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
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '40px',
  },
  prosSection: {
    backgroundColor: '#D1DFDF',
    padding: '2rem',
    borderRadius: '20px',
    minHeight: '300px'
  },
  consSection: {
    backgroundColor: '#dfd1d1ff',
    padding: '2rem',
    borderRadius: '20px',
    minHeight: '300px'
  },
  financialHealthSummarySec: {
    backgroundColor: '#d1d5dfff',
    padding: '2rem',
    borderRadius: '20px',
    minHeight: '300px',
    marginTop: '2rem',
  },
  prosTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '1rem',
  },
  prosList: {
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
    backgroundColor: '#515266',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
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
    borderRadius: '25px',
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
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginLeft: '3rem',
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
    backgroundColor: '#4D5C61',
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
    color: '#ddd',
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