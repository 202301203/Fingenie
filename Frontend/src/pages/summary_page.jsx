import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import React, { useState, useRef,useEffect  } from 'react';
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
} from "lucide-react";import fglogo_Wbg from '../images/fglogo_Wbg.png';
import api from '../api';

import { useNavigate,useLocation  } from "react-router-dom";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import Chatbot from '../components/chatbot';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend
);

// --- (CHANGED) Import your new Chatbot component using a relative path ---


export default function FinGenieApp() {
  const [currentPage, setCurrentPage] = useState('summary');
  const [selectedRatio, setSelectedRatio] = useState(1);
  const [showDetailedRatios, setShowDetailedRatios] = useState(false);
  const [hoveredRatio, setHoveredRatio] = useState(null);
  const [hoverTimer, setHoverTimer] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sectorDropdown, setSectorDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  const navigate = useNavigate();
  const summaryRef = useRef();
  const ratiosRef = useRef();
   const location = useLocation();

  // Data passed from upload page (server response)
  const backendResult = location && location.state ? location.state : {};
  const companyNameFromBackend = backendResult.company_name || backendResult.company || null;
  const summaryFromBackend = backendResult.summary || null;
  const tickerFromBackend = backendResult.ticker_symbol || backendResult.ticker || null;

  // --- (MODIFIED) Get reportId and apiKey for the chatbot ---
  // We get the report_id from location.state first, but fallback to localStorage
  // for persistence (e.g., if the user refreshes the page).
    const reportId = backendResult?.report_id || backendResult?.reportId || localStorage.getItem('currentReportId');
  // We get the apiKey from localStorage (assuming the upload page saved it there)
    const apiKey = localStorage.getItem('userApiKey') || backendResult?.api_key || backendResult?.apiKey || null;

  // Log resolved values once on mount to help debugging missing-chat issues
  useEffect(() => {
    try {
      console.debug('FinGenieApp: resolved chat creds', { reportId, hasApiKey: Boolean(apiKey) });
    } catch (err) {
      // ignore console errors in restricted environments
    }
  }, []);

  // Stock data states
  const [stockChartData, setStockChartData] = useState(null);
  const [latestPrice, setLatestPrice] = useState(null);
  const [priceDifference, setPriceDifference] = useState(null);
  const [percentDifference, setPercentDifference] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  useEffect(() => {
    // Fetch stock data for 1 month if ticker present
    const ticker = tickerFromBackend;
    if (!ticker) return;

    const fetchStock = async () => {
      setLoadingStock(true);
      try {
        const json = await api.getStockData(ticker, '1M');
        // json.chartData is an array of {x: timestamp_ms, y: [O,H,L,C]}
        const labels = [];
        const closes = [];
        if (Array.isArray(json.chartData)) {
          json.chartData.forEach(point => {
            labels.push(new Date(point.x));
            closes.push(Number(point.y[3]));
          });
        }

        setStockChartData({ labels, closes, currency: json.currency || 'USD' });
        setLatestPrice(json.latestPrice);
        setPriceDifference(json.priceDifference);
        setPercentDifference(json.percentDifference);

      } catch (err) {
        console.error('Failed to fetch stock data', err);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, [tickerFromBackend]);



  const summaryRef = useRef();
  const ratiosRef = useRef();

  // Ratio data
  const ratios = [
    { id: 1, name: 'Ratio 1', short: 'Measures liquidity and short-term obligations.', long: 'The Current Ratio measures the company\'s ability to pay short-term obligations. Formula: Current Assets / Current Liabilities. A ratio above 1.0 indicates good liquidity.' , fromBackend: 'Current Ratio = 1.85' },
    { id: 2, name: 'Ratio 2', short: 'Evaluates profitability margins.', long: 'The Net Profit Margin shows the percentage of revenue that translates to profit. Formula: Net Profit / Revenue × 100. Higher percentages indicate better profitability.',fromBackend: 'ROA = 7.4%' },
    { id: 3, name: 'Ratio 3', short: 'Analyzes asset efficiency.', long: 'The Asset Turnover Ratio measures how efficiently a company uses its assets. Formula: Revenue / Total Assets. Higher values indicate better asset utilization.',fromBackend: 'Debt-to-Equity = 0.62' },
    { id: 4, name: 'Ratio 4', short: 'Assesses debt levels and leverage.', long: 'The Debt-to-Equity Ratio evaluates financial leverage. Formula: Total Debt / Total Equity. Lower ratios indicate less financial risk.',   fromBackend: 'Operating Margin = 18.3%' },
    { id: 5, name: 'Ratio 5', short: 'Measures return on investments.', long: 'Return on Equity (ROE) shows how effectively equity generates profit. Formula: Net Income / Shareholder Equity × 100. Higher ROE indicates better returns.',   fromBackend: 'Inventory Turnover = 4.7 times/year' },
    { id: 6, name: 'Ratio 6', short: 'Evaluates operational efficiency.', long: 'The Operating Margin measures operational profitability. Formula: Operating Income / Revenue × 100. Higher margins indicate better operational efficiency.', fromBackend: 'Current Ratio = 1.85' }
 const displayName = companyNameFromBackend || 'Unknown Company';
  //summary data
  const summaryData = [
    {company: displayName,
    pros: [
      "Strong brand recognition and customer loyalty",
      "Consistent revenue growth and profitability",
      "Diverse product portfolio and ecosystem",
      "Robust cash flow and financial stability",
      "Innovation in technology and design",
    ],
    cons: [
      "Revenue growth of 12.55% was outpaced by a 16.88% increase in Cost of Goods Sold.",
      "The Debt to Equity Ratio worsened due to a 35.10% surge in Total Debt vs. a 15.00% rise in Equity.",
      "Receivables increased by 21.90%, significantly outpacing sales growth, which may indicate collection issues.",
      "Operating cash flow grew by only 5.40%, falling behind the 12.55% revenue growth rate.",
      "Selling and Marketing expenses increased by 20.00%, exerting pressure on the operating margin.",
    ],
    financialHealth:
      "The company posted strong top-line growth with revenue increasing by 12.55% and a healthy 15.20% rise in Net Income for the period. Operational efficiency is robust, evidenced by a 25.10% increase in EBITDA. Liquidity remains stable, with the Current Ratio holding steady at 1.8x, and the Return on Equity (ROE) improving by 90 basis points to 18.0%. The capital base was bolstered by a 15.00% increase in Shareholders' Equity.",}
  ];
    // Ratio data
  const ratios = [
  {
    id: 1,
    name: 'Current Ratio',
    short: 'Measures a company’s ability to cover its short-term liabilities with its short-term assets (liquidity).',
    long: 'A liquidity ratio that indicates a company’s capacity to meet its one-year or near-term obligations using its readily available current assets. A ratio above 1.0 is generally considered acceptable, meaning current assets exceed current liabilities.',
    fromBackend: {
      formula: 'Current Assets / Current Liabilities',
      calculation: '62,000 / 100,000',
      result: '0.62',
      interpretation: 'Indicates good short-term liquidity.',
    },
  },
  {
    id: 2,
    name: 'Quick Ratio',
    short: 'A more stringent measure of short-term liquidity that excludes inventory and other less-liquid current assets.',
    long: 'A liquidity ratio that measures a company’s ability to pay off its current liabilities without relying on the sale of inventory or pre-paid expenses. Because inventory is often the least liquid current asset, this ratio provides a more conservative view of a company’s immediate cash position. A ratio above 1.0 is generally preferred.',
    fromBackend: {
      formula: '(Current Assets - Inventory) / Current Liabilities',
      calculation: '50,000 / 100,000',
      result: '0.50',
      interpretation: 'Indicates potential liquidity issues.',
    },
  },
  {
    id: 3,
    name: 'Debt-to-Equity Ratio',
    short: 'Measures the proportion of debt used to finance a company\'s assets relative to shareholders\' equity (financial leverage).',
    long: 'A solvency ratio that compares a company\'s total debt (both short-term and long-term liabilities) to the equity held by its shareholders. It indicates how much a company is relying on borrowed money (leverage) versus owned funds. A higher ratio generally implies greater financial risk.',
    fromBackend: {
      formula: 'Total Debt / Shareholders\' Equity',
      calculation: '50,000 / 100,000',
      result: '0.50',
      interpretation: 'Indicates potential liquidity issues.',
    },
  },
  {
    id: 4,
    name: 'Asset Turnover Ratio',
    short: 'Measures a company\'s efficiency in using its assets to generate revenue (sales).',
    long: 'An efficiency ratio that measures how effectively a company is utilizing its total assets to produce sales. A higher ratio suggests the company is operating more efficiently, generating more revenue for every dollar of assets. This ratio is highly dependent on the industry.',
    fromBackend: {
      formula: 'Revenue / Total Assets',
      calculation: '100,000 / 500,000',
      result: '0.20',
      interpretation: 'Indicates efficient use of assets to generate sales.',
    },
  },
  {
    id: 5,
    name: 'Return on Assets (ROA)',
    short: 'Measures a company\'s profitability relative to its total assets (how efficiently assets generate profit).',
    long: 'A profitability ratio that shows the percentage of profit a company earns from its total resources (assets). It indicates management\'s efficiency in using the company\'s assets to generate earnings. It is often calculated using average total assets for a more accurate result..',
    fromBackend: {
      formula: 'Net Income / Total Assets',
      calculation: '18,300 / 500,000',
      result: '0.0366',
      interpretation: 'Indicates how efficiently assets are being used to generate profit.',
    },
  },
    {
    id: 6,
    name: 'Return on Equity (ROE)',
    short: 'Measures the return generated for the shareholders on their investment in the company (profitability for owners).',
    long: 'A profitability ratio that calculates the net income earned as a percentage of shareholders\' equity. It is a key metric for investors, showing how effectively a company is using the money invested by shareholders to generate profit. A higher ROE is generally seen as better.',
    fromBackend: {
      formula: 'Net Income / Shareholders\' Equity',
      calculation: '18,300 / 100,000',
      result: '0.183',
      interpretation: 'It interprets the return generated for the shareholders on their investment. It is the single most important measure of how well management uses the owners\' capital.',
    },
  },
];
 const modifiedRatios = ratios.map(ratio => ({
        ...ratio,
        fromBackend: ratio.fromBackend || ratio.long.split('.')[0] + '...',
    }));
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

  // PDF Download Function (Temporarily disabled to fix build errors)
  const downloadPDF = async () => {
    alert('PDF Download is temporarily disabled.');
    // const pdf = new jsPDF('p', 'pt', 'a4');
    // ... all of downloadPDF logic commented out ...
  // PDF Download Function 
  const downloadPDF = async () => {
    const pdf = new jsPDF('p', 'pt', 'a4');

    // Create a temporary container for all sections
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);
    
    // Render all pages inside this container
    const sections = [
      { title: "Summary", content: (
        <div>
          {summaryFromBackend.map(sd => (
            <div>
              <h3>{sd.company}</h3>
              <p><strong>Pros:</strong> {sd.pros}</p>
              <p><strong>Cons:</strong> {sd.cons}</p>
              <p><strong>Financial Health Summary:</strong> {sd.financialHealth}</p>
            </div>
          ))}
        </div>
      ) },
      { title: "Ratios", content:  (
        <div>
          {ratios.map(r => (
            <div key={r.id} style={{ marginBottom: "10px" }}>
              <h3>{r.name}</h3>
              <p><strong>Formula:</strong> {r.fromBackend.formula}</p>
              <p><strong>Calculation:</strong> {r.fromBackend.calculation}</p>
              <p><strong>Result:</strong> {r.fromBackend.result}</p>
              <p><strong>Interpretation:</strong> {r.fromBackend.interpretation}</p>
            </div>
          ))}
        </div>
      ) },
    ];

    let yOffset = 40;

    for (const section of sections) {
      // Render React content into a temporary div
      const tempDiv = document.createElement('div');
      container.appendChild(tempDiv);

      // Render component using ReactDOM
      const root = ReactDOM.createRoot(tempDiv);
      root.render(section.content);

      // Wait for the DOM to render
      await new Promise((r) => setTimeout(r, 600));

      // Capture to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 60;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add section title
      pdf.text(section.title, 30, yOffset - 10);

      // Add image
      pdf.addImage(imgData, 'PNG', 30, yOffset, pdfWidth, pdfHeight);

      // Add new page for next section
      if (section !== sections[sections.length - 1]) {
        pdf.addPage();
        yOffset = 60;
      }
    }

    //  Cleanup temporary container
    document.body.removeChild(container);

    // Save PDF
    pdf.save('FinGenie_Report.pdf');
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
            {/* <span style={{ marginLeft: "0px", fontWeight: "500" }}>Tools</span> */}

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
                    // (Optional) clear user data or tokens here
                    navigate("/homepage_beforelogin");      // Redirect to dashboard on logout
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
      <button style={styles.downloadButton}
        onClick={downloadPDF} // This will now show an alert
      >  Download <Download size={18} />
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
    const displayName = companyNameFromBackend || 'Unknown Company';

    return (
      <>
        <h2 style={styles.companyName}>{displayName}</h2>

        <div style={styles.contentBox}>
          {/* Summary Section */}
          <div style={styles.prosSection}>
            <h3 style={styles.prosTitle}>Summary</h3>
            {summaryFromBackend ? (
              <div>
                {summaryFromBackend.pros && summaryFromBackend.pros.length > 0 && (
                  <>
                    <h4 style={styles.subHeading}>Pros</h4>
                    <ul style={styles.prosList}>
                      {summaryFromBackend.pros.map((p, i) => (
                        <li key={`pro-${i}`} style={styles.proItem}>{p}</li>
                      ))}
                    </ul>
                  </>
                )}

                {summaryFromBackend.cons && summaryFromBackend.cons.length > 0 && (
                  <>
                    <h4 style={styles.subHeading}>Cons</h4>
                    <ul style={styles.prosList}>
                      {summaryFromBackend.cons.map((c, i) => (
                        <li key={`con-${i}`} style={styles.conItem}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
          ///////////////////////////////////////////////////////////NEED TO ADD FINANCIAL_HEALTH_SUMMARY (CONNECTED TO BACKEND)
            ) : (
              <p style={{ color: '#333' }}>No summary available. Please upload a PDF first.</p>
            )}
          </div>

          {/* Stock Chart Section */}
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={styles.prosTitle}>Stock (1 Month)</h3>

            {!tickerFromBackend && (
              <p>Company is not publicly listed or ticker unavailable.</p>
            )}

            {tickerFromBackend && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'Bricolage Grotesque, Arial, sans-serif', color: '#0b1220', fontWeight: 700, fontSize: 18 }}>{displayName}</div>
                  <div style={{ color: '#0b1220', fontWeight: 600, fontSize: 16 }}>{tickerFromBackend}</div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    {latestPrice && (
                      <div style={{ color: '#000', fontSize: '18px', fontWeight: 700 }}>{latestPrice} {stockChartData?.currency || ''}</div>
                    )}
                    {priceDifference && (
                      <div style={{ color: String(priceDifference).startsWith('+') ? 'green' : 'red', fontWeight: 600 }}>{priceDifference} ({percentDifference})</div>
                    )}
                  </div>
                </div>

                {loadingStock && <p style={{ color: '#333' }}>Loading stock chart...</p>}

                {stockChartData && (
                  <div style={styles.chartWrap}>
                    <div style={styles.chartContainer}>
                      <Line
                        data={{
                          labels: stockChartData.labels,
                          datasets: [
                            {
                              label: `${tickerFromBackend} Close`,
                              data: stockChartData.closes,
                              borderColor: 'rgba(75,192,192,1D)',
                              backgroundColor: 'rgba(75,192,192,0.2)',
                              pointRadius: 2,
                              tension: 0.25,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: { mode: 'index', intersect: false },
                          plugins: { legend: { display: false }, tooltip: { enabled: true } },
                          scales: {
                            x: { type: 'time', time: { unit: 'day' } },
                            y: { beginAtZero: false },
                          },
                        }}
                        height={300}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
           </div>
     </>
    );
  };
  // Ratios Page
 const RatiosPage = () => (
    <>
      <h2 style={styles.companyName}>Apple Inc.</h2>

      <div style={{ ...styles.contentBox, minHeight: '400px', paddingBottom: '1rem', marginBottom: '1rem' }}>
            
                {/* Looping through each ratio to create a grid row */}
                {modifiedRatios.map((ratio) => (
                    <div key={ratio.id} style={styles.ratioRow}>
                        
                        {/* Column 1 (150px): Ratio Button */}
                        <button style={styles.ratioButton} 
                        onClick={() => setShowDetailedRatios(true)}>
                            {ratio.name}
                        </button>
                        
                        {/* Column 2 (30px): Dot in the Middle */}
                        <div style={{ display: 'flex' }}>
                            <div style={styles.ratioDot} />
                        </div>
                        
                        {/* Column 3 (1fr): Description Box */}
                        <div style={styles.ratioDescription}>
                            <p style={styles.ratioDescText}>
                                  <div>
                                    <strong>Formula:</strong> {ratio.fromBackend.formula} <br />
                                    <strong>Calculation:</strong> {ratio.fromBackend.calculation} <br />
                                    <strong>Result:</strong> {ratio.fromBackend.result} <br />
                                    <strong>Interpretation:</strong> {ratio.fromBackend.interpretation}
                                  </div>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
      <button
        style={styles.knowMoreButtonOutside}
        onClick={() => setShowDetailedRatios(true)}
      >
        know about your ratios.
      </button>
    </>
  );

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
          {ratios.map((ratio) => (
            <div
              key={ratio.id}
              style={{
                ...styles.ratioCard,
                ...(ratio.id===3 || ratio.id===4 ? styles.ratioCardDark : {}),
                ...(ratio.id===5 || ratio.id===6 ? styles.ratioCardLight : {})
              }}
            >
              <h3 style={ratio.id >= 5 ? styles.ratioCardTitleDark : styles.ratioCardTitle}>
                {ratio.name}
              </h3>
              <p style={ratio.id >= 5 ? styles.ratioCardTextDark : styles.ratioCardText}>
                {ratio.long}
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

      {/* Hidden content for PDF generation */}
      <div style={{ display: 'none' }}>
        <div ref={summaryRef}>
          <SummaryPage />
        </div>
        <div ref={ratiosRef}>
          <RatiosPage />
        </div>
      </div>

      <Footer />

      {showDetailedRatios && <DetailedRatiosModal />}

      {/* --- (NEW) ADD THIS AT THE END --- */}
      {/* This adds the floating chatbot.
        We only render it if we have the reportId and apiKey.
      */}
    {/* Always mount the Chatbot; it will show internal guidance if props are missing */}
    <Chatbot reportId={reportId} apiKey={apiKey} />
      {/* --- END OF NEW CODE --- */}

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

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
        padding: '2rem 4rem',
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
    backdropFilter: 'blur(10px)',         // Blur background
    WebkitBackdropFilter: 'blur(10px)',     // Safari support
    borderRadius: '15px',
    border: '1px solid rgba(255, 255, 255, 0.3)', // Subtle border
    boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.1)', // Soft glow shadow
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
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'background-color 0.3s',
    backgroundColor: 'white',
    border: '1px solid black',
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
    // border: 'none', // Removed duplicate key
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
    display: 'flex',              /* 1. Enable Flexbox */
    justifyContent: 'space-between', /* 2. Push elements to opposite sides (left/right) */
    alignItems: 'center',         /* 3. Vertically center the elements */
    width: '100%',                /* Ensure the container spans the full width */
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

  subHeading: {
    color: '#0b1220',
    fontSize: '16px',
    margin: '0.5rem 0',
    fontWeight: 700,
  },

  proItem: {
    color: '#0b1220',
    marginBottom: '0.5rem',
    fontFamily: 'Inter, Arial, sans-serif'
  },

  conItem: {
    color: '#3b1220',
    marginBottom: '0.5rem',
    fontFamily: 'Inter, Arial, sans-serif'
  },

  chartWrap: {
    display: 'flex',
    justifyContent: 'center',
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

  prosList: {
    color: '#1a1a1a',
    lineHeight: '1.8',
    paddingLeft: '1.5rem',
  },

  ratiosLayout: {
    display: 'grid',
    gridTemplateColumns: '250px 1fr',
    gap: '2rem',
  },

  ratiosList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingRight: '2rem'
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
    //marginBottom: '1rem',
    marginTop: '-5rem',
  },

  ratioButtonActive: {
    backgroundColor: '#383838',
  },

  tooltip: {
    position: 'absolute',
    left: '190px',
    top: '0',
    backgroundColor: 'rgba(168, 168, 168, 0.3)',
    color: 'black',
    padding: '0.75rem',
    borderRadius: '15px',
    fontSize: '12px',
    maxWidth: '200px',
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
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

  ratioDescription: {
    backgroundColor: '#D1DFDF',
    padding: '2rem',
    borderRadius: '25px',
    position: 'relative',
    marginBottom: '2rem',
  },

  indicatorDot: {
    position: 'absolute',
    left: '-40px',
    width: '20px',
    height: '20px',
    backgroundColor: '#4D5C61',
    borderRadius: '50%',
    transition: 'top 0.3s ease',
  },

  ratioDescTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'white',
  },

  ratioDescText: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#202020ff',
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

  graphLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
  },

  graphContainer: {
    position: 'relative',
  },

  graphSvg: {
    backgroundColor: '#1a1a1a',
    // borderRadius: '8px', // Removed duplicate key
    padding: '1rem',
    borderRadius: '20px',
  },

  resetZoomButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#515266',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },

  graphDescription: {
    backgroundColor: '#4D5C61',
    padding: '2rem',
    borderRadius: '20px',
  },

  graphDescTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'white',
  },

  graphDescText: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#ddd',
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

   ratioRow: { 
        display: 'grid',
        // Sets 3 explicit columns: 150px | 30px | 1fr
        gridTemplateColumns: '150px 30px 1fr', 
        alignItems: 'center', // Vertically align all items in the row
        gap: '10px', // Small gap between columns
        marginBottom: '10px', // Vertical spacing between ratio rows
    },
    ratioDot: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#555', // Dark dot
        //border: '2px solid #ddd',
        marginTop: '-2.9rem',
        marginLeft: '0.2rem',
    },
    toolsMenu: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginLeft: "1rem", // spacing between menus
    color: "Black",
  },

  nav: {
    display: "flex",
    gap: "1.5rem",
    marginTop: "10px",
  },

  navLink: {
    cursor: "pointer",
    color: "#000000",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "opacity 0.3s",
  },
  
  userMenu: {
    position: 'relative',
    cursor: 'pointer',
    color: 'Black'
  },

  userIcon: {
    transition: 'color 0.2s'
  },

dropdownContainer: {
    position: 'absolute', 
    
    // Position vertically below the button with a consistent gap
    // Assuming the button wrapper is the relative parent
    marginTop: '0.5rem', // Adds a flexible 8px gap (0.5rem)

    // Positioning horizontally: Align to the right edge
    // Use a small padding/margin for offset from the screen edge if needed
    right: 0, 

    // Use relative/flexible width properties:
    minWidth: '180px', // Minimum readable size
    maxWidth: '80vw',  // Ensures it doesn't exceed 80% of the viewport width

    // Visuals
    backgroundColor: '#DCDCDC', 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    zIndex: 10,
    padding: '0.5rem 0', // Reduced vertical padding for flexibility
},

  sectorHeader: {
    fontSize: '14px',
    fontWeight: 'normal',
    color: '#444444', // Dark gray text
    padding: '5px 15px',
    textAlign: 'center',
    //marginBottom: '5px',
    borderBottom: '1px solid #C0C0C0', // Separator line for the header
  },

  sectorItem: {
    // Styling for each selectable sector
    padding: '8px 15px',
    fontSize: '18px', // Larger font size as seen in the image
    color: '#333333', // Dark text color
    textAlign: 'center',
    cursor: 'pointer',
    
    // Hover effect for user interaction
    ':hover': { 
      backgroundColor: '#C5C5C5', // Slightly darker hover color
    },
  },
};


