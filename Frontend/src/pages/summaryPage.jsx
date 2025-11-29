import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Chatbot from '../components/chatbot.jsx';
import {
  Download,
  User,
  ChevronDown,
  X
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
import Header from "../components/Header";
import Footer from "../components/Footer";

// Register Chart.js components once so the chart can render (must come after imports)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const [stockLoading, setStockLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [selectedInterval, setSelectedInterval] = useState(''); // empty means auto
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

      // Authentication check removed: allow anonymous access to summaries

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

  // Fetch stock data whenever ticker / period / interval changes
  useEffect(() => {
    const fetchStockData = async () => {
      if (!companyData?.ticker_symbol) return;
      setStockLoading(true);
      try {
        const url = `/dataprocessor/api/stock-data/${companyData.ticker_symbol}/?period=${selectedPeriod}` + (selectedInterval ? `&interval=${selectedInterval}` : '');
        const stockData = await djangoRequest(url);
        setStockData(stockData.data || stockData);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setStockData({ data: [], note: 'Failed to load stock data' });
      } finally {
        setStockLoading(false);
      }
    };
    fetchStockData();
  }, [companyData?.ticker_symbol, selectedPeriod, selectedInterval]);

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

  const sectors = [
    'Telecom', 'Technology', 'Financial Services',
    'Real Estate', 'Banking', 'Infrastructure',
    'Pharma', 'Automobile', 'Energy',
    'Consumer Goods', 'Metals & Mining', 'Chemicals'
  ];

  // Summary Page
  const SummaryPage = () => {
    // Derive data first (Hooks must appear before any early returns)
    const summary = companyData?.summary || {};
    const pros = summary.pros || [];
    const cons = summary.cons || [];
    const financialHealthSummary = summary.financial_health_summary || 'No financial health summary available.';

    // Prepare stock chart data (hooks before returns)
    const pricePoints = useMemo(() => {
      const raw = Array.isArray(stockData?.data) ? stockData.data : Array.isArray(stockData) ? stockData : [];
      return raw.slice(-60);
    }, [stockData]);

    const chartData = useMemo(() => ({
      labels: pricePoints.map(p => {
        if (!p.timestamp && !p.date) return '';
        const d = new Date(p.timestamp || p.date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Price',
          data: pricePoints.map(p => p.price || p.close || 0),
          borderColor: '#0A2540',
          backgroundColor: 'rgba(10,37,64,0.2)',
          tension: 0.25,
          pointRadius: 0,
          fill: true,
        }
      ]
    }), [pricePoints]);

    const latestPrice = pricePoints.length ? (pricePoints[pricePoints.length - 1].price || pricePoints[pricePoints.length - 1].close) : null;
    const prevPrice = pricePoints.length > 1 ? (pricePoints[pricePoints.length - 2].price || pricePoints[pricePoints.length - 2].close) : null;
    const priceDelta = (latestPrice != null && prevPrice != null) ? (latestPrice - prevPrice) : null;
    const priceDeltaPct = (priceDelta != null && prevPrice) ? (priceDelta / prevPrice) * 100 : null;

    // Early returns AFTER hooks
    if (loading) return <div style={styles.loading}>Loading company data...</div>;
    if (error) return <div style={styles.error}>{error}</div>;
    if (!companyData) return <div style={styles.noData}>No company data available. Please upload a balance sheet to get started.</div>;

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

        {/* STOCK PRICE CHART */}
        <div style={{ marginTop: '2rem' }}>
          <div style={styles.stockHeaderRow}>
            <h3 style={{ color: '#1a1a1a', marginBottom: '0.75rem' }}>Stock Price Trend</h3>
            {companyData?.ticker_symbol && (
              <div style={styles.stockControls}>
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} style={styles.select}>
                  {['1D','5D','1M','3M','6M','1Y'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={selectedInterval} onChange={e => setSelectedInterval(e.target.value)} style={styles.select}>
                  <option value=''>Auto</option>
                  <option value='30m'>30m</option>
                  <option value='1h'>1h</option>
                  <option value='1d'>1d</option>
                  <option value='1wk'>1wk</option>
                </select>
              </div>
            )}
          </div>
          <div style={styles.chartContainer}>
            {chartData && chartData.labels.length ? (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: { enabled: true }
                  },
                  scales: {
                    x: {
                      ticks: { maxRotation: 0, autoSkip: true },
                      grid: { display: false }
                    },
                    y: {
                      ticks: { callback: v => (typeof v === 'number' ? v.toFixed(2) : v) },
                      grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                  }
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>
                {stockLoading ? 'Loading stock data...' : (stockData ? (stockData.note || 'No stock data points available.') : 'No data')}
              </div>
            )}
          </div>
        </div>

          {/* ------------------ GAUGE CHART SECTION ------------------ */}

<div
  style={{
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginTop: "2rem"
  }}
>
  <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>
    Debt & Performance Ratings
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "2rem"
    }}
  >
    <GaugeChart
      title="Liquidity"
      subtitle="Short-term solvency"
      value={companyData?.liquidity_score ?? 64}
    />

    <GaugeChart
      title="Stability"
      subtitle="Debt-equity strength"
      value={companyData?.stability_score ?? 49}
    />

    <GaugeChart
      title="Profitability"
      subtitle="Earnings & margins"
      value={companyData?.profitability_score ?? 72}
    />

    <GaugeChart
      title="Efficiency"
      subtitle="Return ratios & activity"
      value={companyData?.efficiency_score ?? 58}
    />

    <GaugeChart
      title="Growth"
      subtitle="Revenue & earnings growth"
      value={companyData?.growth_score ?? 61}
    />
  </div>
</div>


      </>
    );
  };
 //debt rations
const GaugeChart = ({ title, subtitle, value }) => {
  const [animatedValue, setAnimatedValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 900;
    const step = end / (duration / 16);

    const animate = () => {
      start += step;
      if (start < end) {
        setAnimatedValue(start);
        requestAnimationFrame(animate);
      } else {
        setAnimatedValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const angle = (animatedValue / 100) * 180;
  const rad = (angle * Math.PI) / 180;

  const needleX = 100 + 80 * Math.cos(Math.PI - rad);
  const needleY = 100 + 80 * Math.sin(Math.PI - rad);

  return (
    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
      <h3 style={{ margin: 0, fontWeight: 700 }}>{title}</h3>
      <p style={{ margin: 0, color: "#555" }}>{subtitle}</p>

      <svg width="220" height="140">
        <defs>
          <linearGradient id="gaugeColors">
            <stop offset="0%" stopColor="#e74c3c" />
            <stop offset="40%" stopColor="#f1c40f" />
            <stop offset="80%" stopColor="#2ecc71" />
          </linearGradient>
        </defs>

        {/* Arc */}
        <path
          d="M20,100 A80,80 0 0,1 180,100"
          fill="none"
          stroke="url(#gaugeColors)"
          strokeWidth="20"
        />

        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={needleX}
          y2={needleY}
          stroke="black"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Center circle */}
        <circle cx="100" cy="100" r="6" fill="black" />

        {/* Score */}
        <text
          x="100"
          y="130"
          textAnchor="middle"
          fontSize="16"
          fontWeight="600"
        >
          {Math.round(animatedValue)}/100
        </text>
      </svg>
    </div>
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
      <Header/>

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
    fontFamily: '"Bricolage Grotesque", sans-serif',
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
    width: '100%',
    minWidth: 320,
    maxWidth: '100%',
    height: 360,
    backgroundColor: '#ffffff',
    padding: '0.5rem',
    borderRadius: 12,
  },
  stockHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem'
  },
  stockControls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #444',
    backgroundColor: '#fff',
    fontSize: '14px',
    cursor: 'pointer'
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