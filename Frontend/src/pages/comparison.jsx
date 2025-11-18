import React, { useState } from 'react';
import { useNavigate } from "react-router-dom"; 
import { Upload, FileText, RefreshCw,CheckCircle, Home, Scale, Wrench, LogOut, Search,Activity,Cpu,BookOpen,GitCompare,User,History,Settings, AlignCenter, AlignCenterHorizontal } from "lucide-react";
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import api from '../api';

// --- UPDATED COLORS for Light/Interactive Theme (Matching About_us.jsx) ---
const COLORS = {
    PageBackground: '#F4F7F9',      // Light Blue-Grey Background
    CardBackground: '#CAD3E7',      // Pure White
    PrimaryText: '#2C3E50',         // Dark Navy for main text
    SecondaryText: '#2d2f2fff',       // Soft Grey for secondary text
    Accent: '#515266',              // Vivid Blue (Primary Accent)
    AccentLight: '#a6b1caff',         // Lighter Blue for hover/sub-accents
    TextLight: '#ffffff',           // White text
    InteractiveBg: '#f5f5f5ff',       // Very light blue background for interaction
    Success: '#23804aff',             // Green for winning metric/Company 1
    Contrast: '#7c8d9eff',            // Dark Navy/Contrast for Company 2
    Warning: '#e9d99cff',             // Yellow for Tie
    Error: '#E74C3C',
};

// --- STYLES ---
const styles = {
    appWrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: COLORS.PageBackground,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    },
    contentArea: {
        flexGrow: 1, 
        maxWidth: '1200px',
        margin: '50px auto',
        padding: '30px',
        backgroundColor: COLORS.CardBackground,
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        width: 'calc(100% - 40px)', 
        boxSizing: 'border-box',
    },
    title: {
        color: COLORS.PrimaryText, 
        fontSize: '2.5rem',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    sectionTitle: {
        color: COLORS.PrimaryText,
        fontSize: '1.5rem',
        marginTop: '30px',
        marginBottom: '15px',
        borderBottom: `2px solid ${COLORS.InteractiveBg}`,
        paddingBottom: '5px',
    },

    // --- HEADER/FOOTER STYLES ---
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
  userIcon: {
    cursor: 'pointer',
    color: '#4a5568',
    transition: 'color 0.3s ease'
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
    alignItems: 'center',
    gap: '0.5rem'
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
   // --- FOOTER STYLES ---
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
    fontSize: '0.9rem',
    color: '#cbd5e0',
    margin: 0
  },
  footerLink: {
    color: '#FFFFFF',
    textDecoration: 'none',
    transition: 'opacity 0.3s',
  },

  footerRight: {
    flex: 1,
    textAlign: 'right',
  },
  functionsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    marginRight: '8rem',
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
    
    // --- UPLOAD STYLES ---
    uploadContainer: {
        display: 'flex',
        gap: '30px',
        marginBottom: '30px',
        flexWrap: 'wrap',
    },
    fileInputBox: {
        flex: 1,
        minWidth: '300px',
        border: `3px dashed ${COLORS.AccentLight}`,
        borderRadius: '12px',
        padding: '30px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        backgroundColor: COLORS.InteractiveBg,
    },
    fileDetails: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginTop: '15px',
        color: COLORS.Success,
        fontWeight: 'bold',
    },
    submitButton: {
        padding: '15px 30px',
        backgroundColor: COLORS.Accent,
        color: COLORS.TextLight,
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        transition: 'background-color 0.3s, transform 0.1s',
    },

    // --- RESULTS STYLES ---
    verdictBox: (verdict) => {
        const bg = verdict === 'tie' ? COLORS.Warning : COLORS.Accent;
        const text = verdict === 'tie' ? COLORS.PrimaryText : COLORS.TextLight;
        return {
            padding: '25px',
            borderRadius: '12px',
            backgroundColor: bg,
            color: text,
            textAlign: 'center',
            marginBottom: '30px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        };
    },
    verdictText: {
        fontSize: '2.2rem',
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    summaryText: {
        fontSize: '1.1rem',
        marginTop: '10px',
    },
    comparisonTable: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 8px', 
        marginTop: '20px',
    },
    tableHeader: (color) => ({
        backgroundColor: color,
        color: COLORS.TextLight,
        fontWeight: '700',
        textAlign: 'center',
        padding: '15px 8px',
    }),
    tableRow: {
        backgroundColor: COLORS.CardBackground,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s',
    },
    tableCell: {
        padding: '12px 10px',
        textAlign: 'center',
        color: COLORS.PrimaryText,
        border: 'none',
    },
    metricCell: {
        textAlign: 'left',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: COLORS.PrimaryText,
    },
    winnerCell: (winner) => ({
        fontWeight: 'bold',
        color: getWinnerColor(winner),
    }),
};
// ---------------------------------------------------------------------------

// --- MOCK DATA (Retained) ---
const mockComparisonData = {
    "company1": {
        "company_name": "Infosys",
        "fiscal_year_end": "2025-03-31",
        "currency": "INR",
        "balance_sheet": {
            "cash_and_cash_equivalents": 475490000000.0,
            "total_assets": 1489030000000.0,
            "total_liabilities": 527000000000.0,
        },
        "ratios": {
            "debt_to_equity": 0.0,
            "debt_ratio": 0.35392168055714124,
            "working_capital": 0,
            "book_value_per_share": 194.64544138929088,
            "fixed_asset_ratio": 0.08644553837061711,
            "intangibles_percent": 0.08644553837061711,
        }
    },
    "comparison": {
        "verdict": "tie",
        "score": {
            "Infosys (Company 1)": 0,
            "Infosys (Company 2)": 0
        },
        "summary": "Both companies performed similarly across 8 comparable metrics (8 ties).",
        "comparisons": [
            { "metric": "total_assets", "winner": "company2", "preference": "higher", "company1_value": 1489030000000.0, "company2_value": 1489030000000.0 },
            { "metric": "cash_and_cash_equivalents", "winner": "company2", "preference": "higher", "company1_value": 475490000000.0, "company2_value": 475490000000.0 },
            { "metric": "working_capital", "winner": "company2", "preference": "higher", "company1_value": 0, "company2_value": 0 },
            { "metric": "debt_ratio", "winner": "company2", "preference": "lower", "company1_value": 0.35392168055714124, "company2_value": 0.35392168055714124 },
            { "metric": "debt_to_equity", "winner": "company2", "preference": "lower", "company1_value": 0.0, "company2_value": 0.0 },
            { "metric": "book_value_per_share", "winner": "tie", "preference": "higher", "company1_value": 194.64544138929088, "company2_value": 194.64544138929088 },
            { "metric": "fixed_asset_ratio", "winner": "tie", "preference": "higher", "company1_value": 0.08644553837061711, "company2_value": 0.08644553837061711 },
            { "metric": "intangibles_percent", "winner": "tie", "preference": "lower", "company1_value": 0.08644553837061711, "company2_value": 0.08644553837061711 },
            { "metric": "current_ratio", "result": "not_available", "preference": "higher", "company1_value": null, "company2_value": null },
        ],
        "labels": { "company1": "Infosys (Company 1)", "company2": "Infosys (Company 2)" }
    },
    "company2": { /* Same as company 1 in mock */ }
};


// --- HELPER FUNCTIONS (Retained) ---

const formatNumber = (value, currency = '₹') => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' && value.toLowerCase() === 'n/a') return 'N/A';
    
    const numValue = Number(value);
    if (isNaN(numValue)) return 'N/A';

    if (numValue > -1 && numValue < 1 && numValue !== 0) {
        return numValue.toFixed(4);
    }
    
    const absValue = Math.abs(numValue);
    const units = ['', 'K', 'M', 'B', 'T']; 
    let unitIndex = 0;
    let scaledValue = absValue;

    while (scaledValue >= 1000 && unitIndex < units.length - 1) {
        scaledValue /= 1000;
        unitIndex++;
    }

    const formatted = scaledValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const unit = units[unitIndex];
    
    return `${numValue < 0 ? '-' : ''}${currency} ${formatted}${unit}`;
};

const formatMetricName = (metric) => {
    return metric
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const getWinnerColor = (winner) => {
    switch (winner) {
        case 'company1':
            return COLORS.Success;
        case 'company2':
            return COLORS.Contrast;
        case 'tie':
            return COLORS.Warning;
        default:
            return COLORS.SecondaryText;
    }
};

const getWinnerIcon = (winner) => {
    switch (winner) {
        case 'company1':
        case 'company2':
            return '🏆';
        case 'tie':
            return '🤝';
        default:
            return '⚪';
    }
};

const getPreferenceIcon = (preference) => {
    switch (preference) {
        case 'higher':
            return '⬆️';
        case 'lower':
            return '⬇️';
        default:
            return '⚖️';
    }
};

// --- INTERACTIVE ROW COMPONENT (FIX FOR HOOK ERROR) ---
const ComparisonRow = ({ item, comparison, currency }) => {
    // 1. Hook is now called at the top level of this function component
    const [rowHover, setRowHover] = useState(false); 
    
    if (item.result === 'not_available' && item.company1_value === null && item.company2_value === null) return null; 

    const winnerLabel = item.winner === 'tie' ? 'Tie' : comparison.labels[item.winner].replace(/\s\(Company \d\)$/, '');
    const icon = getWinnerIcon(item.winner);

    return (
        <tr 
            style={{
                ...styles.tableRow, 
                // Apply hover effect styles
                transform: rowHover ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: rowHover ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={() => setRowHover(true)}
            onMouseLeave={() => setRowHover(false)}
        >
            <td style={{...styles.tableCell, ...styles.metricCell, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px'}}>
                {getPreferenceIcon(item.preference)} 
                {formatMetricName(item.metric)} 
                {item.preference && <span style={{fontSize: '0.8rem', color: COLORS.SecondaryText}}> ({item.preference} is better)</span>}
            </td>
            <td style={{...styles.tableCell, backgroundColor: item.winner === 'company1' ? COLORS.InteractiveBg : COLORS.CardBackground, color: item.winner === 'company1' ? COLORS.Success : COLORS.PrimaryText}}>
                {formatNumber(item.company1_value, currency)}
            </td>
            <td style={{...styles.tableCell, backgroundColor: item.winner === 'company2' ? COLORS.InteractiveBg : COLORS.CardBackground, color: item.winner === 'company2' ? COLORS.Contrast : COLORS.PrimaryText}}>
                {formatNumber(item.company2_value, currency)}
            </td>
            <td style={{...styles.tableCell, ...styles.winnerCell(item.winner), borderTopRightRadius: '8px', borderBottomRightRadius: '8px'}}>
                {icon} {winnerLabel}
            </td>
        </tr>
    );
};

// --- SUB-COMPONENTS (Retained) ---

const NavLink = ({ label, icon: Icon, path, navigate }) => {
    const [hover, setHover] = useState(false);
    const style = {
        ...styles.navLink,
        color: hover ? COLORS.Accent : COLORS.PrimaryText,
        backgroundColor: hover ? COLORS.InteractiveBg : 'transparent',
    };

    return (
        <span
            style={style}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => navigate(path)}
        >
            {Icon && <Icon size={16} />} 
            {label}
        </span>
    );
};

 const Header = ({ navigate, showDropdown, setShowDropdown, showToolsDropdown, setShowToolsDropdown }) => (
        
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
              style={{
                ...styles.navLink,
              }}
              onClick={() => navigate("/mainpageafterlogin")}
            >
              Home
            </span>
            <span
              className="nav-link"
              style={{
                ...styles.navLink,
              }}
              onClick={() => navigate("/NewsPage")}
            >
              News
            </span>
    
            <span
              className="nav-link"
              style={{
                ...styles.navLink,
              }}
              onClick={() => navigate("/Chatbot")}
            >
              Chatbot
            </span>
    
            <span
              className="nav-link"
              style={{...styles.navLink,
              }}
              onClick={() => navigate("/About_us")}
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
                  
                  <div style={styles.dropdownItem}>
                    <Search size={16} />
                    <span>Search Companies</span>
                  </div>
                  <div style={styles.dropdownItem}
                    onClick={() => navigate("/Trends_KPI")}
                  >
                    <Activity size={16} />
                    <span>Trends & KPIs</span>
                  </div>
                  <div style={styles.dropdownItem}
                    onClick={() => navigate("/blogPage")}
                  >
                    <BookOpen size={16} />
                    <span>Blog Page</span>
                  </div>
                  <div style={styles.dropdownItem}
                     onClick={() => navigate("/FileUploadApp")}
                  >
                    <Cpu size={16} />
                    <span>AI Summary</span>
                  </div>
                  <div style={styles.dropdownItem}>
                    <GitCompare size={16} />
                    <span>Comparison</span>
                  </div>
                  <div style={styles.dropdownItem}
                     onClick={() => navigate("/sectorOverview")}
                  >
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
                  <div style={styles.dropdownItem}
                  onClick={() => navigate("/Profile_page")}   
                  >
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
                  <div style={styles.dropdownItem}
                    onClick={() => {
                      // (Optional) clear user data or tokens here
                      navigate("/homepage_beforelogin");      // Redirect to dashboard on logout
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
              <li style={styles.functionsItem}>search companies</li>
              <li style={styles.functionsItem}>Blog Page</li>
              <li style={styles.functionsItem}>Trends & KPIs</li>
              <li style={styles.functionsItem}>Compare companies</li>
            </ul>
          </div>
        </footer>
      );

// --- MAIN COMPARISON PAGE ---

const ComparisonPage = () => {
    // Hooks are called correctly at the top level of the component
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [comparisonData, setComparisonData] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    const [apiKey, setApiKey] = useState('');
    

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    const handleFileChange = (e, setFile, otherFile) => {
        const file = e.target.files[0];
        e.target.value = null; 
        
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setError(`File size for ${file.name} exceeds the 20MB limit.`);
            setFile(null);
            return;
        }

        if (otherFile && file.name === otherFile.name && file.size === otherFile.size) {
            setError(`Cannot upload duplicate files. "${file.name}" is already selected.`);
            setFile(null);
            return;
        }

        setError(null);
        setFile(file);
    };

    const handleSubmit = async () => {
        if (!file1 || !file2) {
            setError("Please upload exactly two files before comparing.");
            return;
        }
        if (file1.name === file2.name && file1.size === file2.size) {
             setError("Cannot compare the exact same file. Please upload two distinct financial documents.");
             return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            setComparisonData(mockComparisonData); 
            setFile1(null);
            setFile2(null);
        } catch (err) {
            setError("Comparison failed. Please check the API status or file content.");
            setComparisonData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFile1(null);
        setFile2(null);
        setComparisonData(null);
        setIsLoading(false);
        setError(null);
    };

    const renderFileUpload = () => (
        <>
            <h2 style={styles.sectionTitle}>
                <Upload size={20} style={{marginRight: '10px'}} color={COLORS.Accent}/> 
                Upload Two Financial Documents
            </h2>

           <div style={{ 
                margin: '1rem 0', 
                textAlign: 'left',
                padding: '1rem', // Added padding and background for better appearance
                backgroundColor: '#a6b1caff',
                borderRadius: '12px',
                border: '1px solid #9ea8b8',
            }}>
    {/* Container for Label and Button */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ 
            display: 'block', 
            color: '#0b0b0bff', 
            fontWeight: '600', 
            fontSize: '14px',
            margin: 0,
        }}>
            LLM API Key (optional)
        </label>
        
        {/* New Button */}
        <button 
             onClick={() => navigate("/API_key")}
            style={{
                backgroundColor: '#64748b', // Darker color for button
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.6rem',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                transition: 'background-color 0.2s',
            }}
            title="Click for instructions"
        >
            how to get API key? <span style={{fontSize: '14px'}}>🤔</span>
        </button>
    </div>
    
    {/* Input Field */}
    <input 
        type="text" 
        value={apiKey} 
        onChange={(e) => setApiKey(e.target.value)} 
        placeholder="Paste API key here if you want to use a custom key" 
        style={{ 
            width: '100%', 
            padding: '0.65rem', 
            borderRadius: '8px', 
            border: '1px solid #a7a7a7',
            boxSizing: 'border-box'
        }} 
    />
</div>

            <p style={{color: COLORS.SecondaryText}}>
                Please upload two distinct files (e.g., balance sheets) for comparison.
            </p>
            {error && <div style={{ color: COLORS.Error, margin: '15px 0', fontWeight: 'bold' }}>{error}</div>}

            <div style={styles.uploadContainer}>
                {/* File 1 Upload */}
                <label style={styles.fileInputBox} htmlFor="file1">
                    <FileText size={30} color={file1 ? COLORS.Success : COLORS.Accent} />
                    <p style={{fontWeight: 'bold', margin: '5px 0', color: COLORS.PrimaryText}}>
                        {file1 ? 'File 1 Uploaded' : 'Upload File 1 (Company A)'}
                    </p>
                    {file1 && <div style={styles.fileDetails}><CheckCircle size={16} /> {file1.name}</div>}
                    <input 
                        type="file" id="file1" 
                        onChange={(e) => handleFileChange(e, setFile1, file2)} 
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.xlsx,.doc,.xls"
                    />
                </label>

                {/* File 2 Upload */}
                <label style={styles.fileInputBox} htmlFor="file2">
                    <FileText size={30} color={file2 ? COLORS.Success : COLORS.Accent} />
                    <p style={{fontWeight: 'bold', margin: '5px 0', color: COLORS.PrimaryText}}>
                        {file2 ? 'File 2 Uploaded' : 'Upload File 2 (Company B)'}
                    </p>
                    {file2 && <div style={styles.fileDetails}><CheckCircle size={16} /> {file2.name}</div>}
                    <input 
                        type="file" id="file2" 
                        onChange={(e) => handleFileChange(e, setFile2, file1)} 
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.xlsx,.doc,.xls"
                    />
                </label>
            </div>

            <button 
                onClick={handleSubmit} 
                style={styles.submitButton}
                disabled={!file1 || !file2 || isLoading} 
            >
                {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="spin">⟳</span> Analyzing...</span>
                ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Scale size={16} /> Compare Companies</span>
                )}
            </button>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );

    const renderResults = () => {
        if (!comparisonData) return null;

        const { company1, comparison } = comparisonData;
        const currency = company1.currency || '₹'; 
        const verdict = comparison.verdict.toLowerCase();

        return (
            <>
                <div style={styles.verdictBox(verdict)}>
                    <div style={styles.verdictText}>VERDICT: {comparison.verdict.toUpperCase()}</div>
                    <div style={styles.summaryText}>{comparison.summary}</div>
                </div>

                <h3 style={styles.sectionTitle}>
                    <Scale size={18} style={{marginRight: '10px'}} color={COLORS.Accent}/> 
                    Metric Comparison Breakdown
                </h3>
                
                <table style={styles.comparisonTable}>
                    <thead>
                        <tr>
                            <th style={{...styles.tableHeader(COLORS.Contrast), textAlign: 'left', width: '30%', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px'}}>Metric</th>
                            <th style={{...styles.tableHeader(COLORS.Accent), width: '25%'}}>{comparison.labels.company1}</th>
                            <th style={{...styles.tableHeader(COLORS.Contrast), width: '25%'}}>{comparison.labels.company2}</th>
                            <th style={{...styles.tableHeader(COLORS.Contrast), width: '20%', borderTopRightRadius: '8px', borderBottomRightRadius: '8px'}}>Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* FIX: Calling the new ComparisonRow component in the map */}
                        {comparison.comparisons.map((item, index) => (
                            <ComparisonRow 
                                key={index} 
                                item={item} 
                                comparison={comparison} 
                                currency={currency} 
                            />
                        ))}
                    </tbody>
                </table>
                
                <div style={{ marginTop: '50px', textAlign: 'center' }}>
                    <button onClick={handleReset} style={styles.submitButton}>
                        <RefreshCw size={16} style={{marginRight: '8px'}}/> Compare New Files
                    </button>
                </div>
            </>
        );
    };

    return (
        <div style={styles.appWrapper}>
            <Header 
            navigate={navigate}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            showToolsDropdown={showToolsDropdown}
            setShowToolsDropdown={setShowToolsDropdown}
            />
            
            
            <div style={styles.contentArea}>


                <h1 style={styles.title}>
                    <Scale size={40} color={COLORS.Accent} /> Company Financial Comparison
                </h1>

                 
                
                {!comparisonData ? renderFileUpload() : renderResults()}
            </div>

            


            <Footer />
        </div>
    );
};

export default ComparisonPage;