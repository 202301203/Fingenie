import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate} from "react-router-dom"; 
import { User, LogOut, History, Settings, Wrench, BarChart, TrendingUp, Search, Activity, BookOpen,Cpu,GitCompare,CheckCircle, XCircle, UploadCloud, FileText, ArrowLeft } from "lucide-react";
import fglogo_Wbg from '../images/fglogo_Wbg.png'; // Ensure the logo path is correct
import { color } from 'chart.js/helpers';


// --- STYLING CONSTANTS ---
const styles = {
    // --- LAYOUT & BASE STYLES ---
    dashboardWrapper: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
    },
    dashboardContainer: {
        maxWidth: '1400px',
        marginTop: '20px',
        borderRadius: '24px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: '#f4f7f9',
        color: '#000000ff',
        padding: '20px 20px 50px 20px', 
        flexGrow: 1, 
    },
    dashboardHeaderMain: {
        borderBottom: '2px solid #ddd',
        paddingBottom: '15px',
        marginBottom: '20px',
    },

    // --- COLORS ---
    colorBlue: '#007bff',
    colorGreen: '#28a745',
    colorRed: '#dc3545',
    colorYellow: '#ffc107',
    colorGrey: '#6c757d',
    colorTextStable: '#6c757d',
    // colorDark: '#455a64', // Footer background color
    colorActiveRow: '#e6f7ff', // New color for active selection

    // --- HEADER STYLES ---
    header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 4rem',
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
    backdropFilter: 'blur(10px)',            // Blur background
    WebkitBackdropFilter: 'blur(10px)',      // Safari support
    borderRadius: '15px',
    border: '1px solid rgba(255, 255, 255, 0.3)', // Subtle border
    boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.1)', // Soft glow shadow
    borderBottom: '2px solid black',

    color: 'white',
    },
    
    logo: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    },


    brandName: {
        fontWeight: '600'
    },

    nav: {
        display: 'flex',
        gap: '1.5rem',
        marginTop: '10px',
    },
    
    navLink: {
        cursor: 'pointer',
        color: '#000000',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'opacity 0.3s',
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
    
    toolsMenu: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        marginLeft: "1rem", 
        color: "Black"
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
    
    
    // --- CARD & LIST STYLES (RETAINED FROM PREVIOUS) ---
    summaryCard: {
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
        marginBottom: '30px',
    },
    summaryHeader: {
        display: 'flex',
        alignItems: 'baseline',
        marginBottom: '15px',
    },
    companyName: {
        fontSize: '1.5em',
        fontWeight: '600',
        color: '#007bff',
    },
    tickerSymbol: {
        marginLeft: '10px',
        fontSize: '0.9em',
        color: '#666',
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
    },
    kpiItem: {
        background: '#f8f9fa',
        borderRadius: '6px',
        padding: '15px',
        textAlign: 'center',
        borderLeft: `3px solid #007bff`, 
    },
    kpiValue: {
        display: 'block',
        fontSize: '1.8em',
        fontWeight: '700',
        color: '#007bff',
    },
    kpiLabel: {
        fontSize: '0.9em',
        color: '#555',
    },
    qualityBreakdown: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: '5px',
        alignItems: 'flex-start',
        textAlign: 'left',
        fontSize: '0.85em',
        gap: '3px',
    },

    // Trends List Table
    mainContentGrid: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '30px',
    },
    trendsListContainer: {
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
        overflowX: 'auto',
    },
    trendsTable: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    tableHeader: {
        backgroundColor: '#e9ecef',
        padding: '12px',
        textAlign: 'left',
        cursor: 'pointer',
    },
    tableData: {
        padding: '12px',
        borderBottom: '1px solid #eee',
    },
    tableRowHover: {
        backgroundColor: '#f0f0f0', // Slightly darker hover
    },
    trendRowClickable: {
        cursor: 'pointer',
    },
    numeric: {
        textAlign: 'right',
    },
    
    // Data Quality Badges
    badge: {
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '0.75em',
        fontWeight: '600',
        color: 'white',
        display: 'inline-block',
    },
    badgeGreen: { backgroundColor: '#28a745' },
    badgeYellow: { backgroundColor: '#ffc107', color: '#333' },
    badgeRed: { backgroundColor: '#dc3545' },

    // Detail Panel
    detailPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    chartContainer: {
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
        textAlign: 'center',
    },
    detailsCard: {
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
    },
    detailsHeader: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        paddingBottom: '15px',
        marginBottom: '15px',
        borderBottom: '1px dashed #ddd',
        textAlign: 'center',
    },
    detailsKpi: {
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        padding: '10px',
    },
    detailsValue: {
        display: 'block',
        fontSize: '1.5em',
        fontWeight: '700',
    },
    detailsLabel: {
        fontSize: '0.85em',
        color: '#555',
    },
    detailsSectionH4: {
        color: '#007bff',
        marginTop: '10px',
        marginBottom: '5px',
    },
    blockquote: {
        margin: '10px 0 10px 10px',
        padding: '10px 15px',
        borderLeft: `4px solid #007bff`,
        background: '#f0f8ff',
        fontStyle: 'italic',
        borderRadius: '4px',
    },

     // --- FILE UPLOAD SPECIFIC ---
    fileUploadContainer: {
        maxWidth: '800px', margin: '50px auto', padding: '30px', 
        borderRadius: '24px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#61627bff', flexGrow: 1,
    },
    dropZone: {
        border: '3px dashed #ffffffff', borderRadius: '8px', padding: '40px 20px',
        textAlign: 'center', cursor: 'pointer', transition: 'background-color 0.3s', marginBottom: '20px',
        color: 'white'
    },
    dropZoneActive: { backgroundColor: '#e6f7ff', },
    requirements: {
        backgroundColor: '#D1DFDF', padding: '15px', borderRadius: '8px', 
        marginBottom: '20px',
    },
    fileItem: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px', borderBottom: '1px solid #eeeeeeff',
        color: 'white'
    },
    submitButton: {
        width: '100%', padding: '12px', fontSize: '1.1em', 
        backgroundColor: '#D1DFDF', color: 'Black', border: 'none', 
        borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.3s',
    },
};

// --- Your Data (pasted directly for demonstration) ---
const financialData = {
    "success": true,
    "summary": {
        "files_processed": 7,
        "total_metrics_found": 131,
        "critical_metrics_analyzed": 10,
        "analysis_source": "enhanced_manual_analysis",
        "data_quality_summary": {
            "fair": 3,
            "estimated": 3,
            "poor": 2,
            "excellent": 2
        },
        "focus": "10_critical_financial_trends",
        // ⭐ ADD THIS NEW FIELD TO THE SUMMARY OBJECT ⭐
       "overall_assessment": "Overall, Life Insurance Corporation of India presents a mixed financial picture, with stable revenue streams and consistent profitability, while drastic liability reduction warrants strategic review. (analysis limited by data availability).",
        "executive_summary": {
            // Note: The main component uses summary.overall_assessment, so this sub-field is redundant but kept for completeness
            "overall_assessment": "Life Insurance Corporation of India faces significant financial challenges requiring immediate attention.", 
            "key_strengths": [],
            "major_concerns": [
                "Drastic liability reduction (-66.04% change)"
            ],
            "strategic_recommendations": [
                "Maintain current financial strategy with continued monitoring"
            ],
            "outlook": "Challenging outlook requiring strategic intervention"
        }
    },
    "trends": {
        "financial_trends": [
            {
                "metric": "Total Assets",
                "yearly_values": { "2019": 31337772086000, "2020": 32809559252000 },
                "growth_rate": 4.7,
                "interpretation": "Total Assets grew from $31337.8B to $32809.6B over 2 years, representing 4.7% annual growth",
                "indication": "This indicates consistent financial structure and stable operational scale. Maintaining steady levels suggests predictable business environment and balanced strategy. The company demonstrates reliability in financial management.",
                "trend_direction": "stable",
                "importance_score": 100,
                "data_quality": "fair"
            },
            {
                "metric": "Total Liabilities",
                "yearly_values": { "2017": 28327317225, "2018": 30558843373, "2019": 32800694568000, "2020": 35839356960939, "2021": 36976257259.159996, "2022": 429294279.7900001, "2023": 4283247.55, "2024": 4650025.29, "2025": 5011584.81 },
                "growth_rate": -66.04,
                "interpretation": "Total Liabilities declined from $28.3B to $5.0M over 9 years, representing 66.04% annual decrease",
                "indication": "This indicates improving debt management and reduced financial risk. Significantly declining liabilities enhance financial flexibility and lower interest costs. This reflects prudent financial management and stronger balance sheet position.",
                "trend_direction": "strongly decreasing",
                "importance_score": 95,
                "data_quality": "estimated"
            },
            {
                "metric": "Total Revenue/Income",
                "yearly_values": { "2017": 5000000, "2018": 5250000, "2019": 5512500, "2020": 5788125, "2021": 6077531.25, "2022": 6381407.8125, "2023": 6700478.203125, "2024": 7035502.11328125, "2025": 7387277.218945313 },
                "growth_rate": 5,
                "interpretation": "Total Revenue/Income grew from $5.0M to $7.4M over 9 years, representing 5.0% annual growth",
                "indication": "This reflects stable business performance and predictable financial results. Consistent metrics indicate market stability and effective operational controls. The company should explore growth opportunities while maintaining performance.",
                "trend_direction": "stable",
                "importance_score": 90,
                "data_quality": "poor"
            },
            {
                "metric": "Net Profit",
                "yearly_values": { "2017": 500000, "2018": 525000, "2019": 551250, "2020": 578812.5, "2021": 607753.125, "2022": 638140.78125, "2023": 670047.8203125, "2024": 703550.211328125, "2025": 738727.7218945313 },
                "growth_rate": 5,
                "interpretation": "Net Profit grew from $500.0K to $738.7K over 9 years, representing 5.0% annual growth",
                "indication": "This reflects stable business performance and predictable financial results. Consistent metrics indicate market stability and effective operational controls. The company should explore growth opportunities while maintaining performance.",
                "trend_direction": "stable",
                "importance_score": 90,
                "data_quality": "poor"
            },
            {
                "metric": "Shareholders Equity",
                "yearly_values": { "2017": 2000000, "2018": 2040000, "2019": 2080800, "2020": 2122416, "2021": 2164864.32, "2022": 2208161.6064, "2023": 2252324.838528, "2024": 2297371.3352985596, "2025": 2343318.762004531 },
                "growth_rate": 2,
                "interpretation": "Shareholders Equity grew from $2.0M to $2.3M over 9 years, representing 2.0% annual growth",
                "indication": "This indicates consistent financial structure and stable operational scale. Maintaining steady levels suggests predictable business environment and balanced strategy. The company demonstrates reliability in financial management.",
                "trend_direction": "stable",
                "importance_score": 85,
                "data_quality": "estimated"
            },
            {
                "metric": "Total Investments",
                "yearly_values": { "2022": 2262056.11, "2023": 26309.54, "2024": 35257.82, "2025": 48311.99 },
                "growth_rate": -72.26,
                "interpretation": "Total Investments declined from $2.3M to $48.3K over 4 years, representing 72.26% annual decrease",
                "indication": "This indicates potential divestment or strategic reallocation of investment portfolio. Significantly declining investments may reflect liquidity needs or portfolio optimization. Investment strategy alignment with business objectives should be reviewed.",
                "trend_direction": "strongly decreasing",
                "importance_score": 80,
                "data_quality": "excellent"
            },
            {
                "metric": "Cash & Equivalents",
                "yearly_values": { "2021": 3029325.45, "2022": 3743214.07 },
                "growth_rate": 23.57,
                "interpretation": "Cash & Equivalents grew from $3.0M to $3.7M over 2 years, representing 23.57% annual growth",
                "indication": "This indicates strengthening liquidity position and improved cash management. Significantly growing cash reserves enhance financial flexibility and emergency funding capacity. This supports operational continuity and strategic investment opportunities.",
                "trend_direction": "strongly increasing",
                "importance_score": 80,
                "data_quality": "fair"
            },
            {
                "metric": "Reserves & Surplus",
                "yearly_values": { "2021": 1293403.13, "2022": 1291595.29, "2023": 15678.07, "2024": 15594.06, "2025": 15669.67 },
                "growth_rate": -66.82,
                "interpretation": "Reserves & Surplus declined from $1.3M to $15.7K over 5 years, representing 66.82% annual decrease",
                "indication": "This may indicate utilization of reserves for investments or covering losses. Significantly declining reserves require analysis of utilization purpose and sustainability. Reserve adequacy for business risks should be assessed.",
                "trend_direction": "strongly decreasing",
                "importance_score": 75,
                "data_quality": "excellent"
            },
            {
                "metric": "Loans Portfolio",
                "yearly_values": { "2021": 14890777.5, "2022": 15368569.78 },
                "growth_rate": 3.21,
                "interpretation": "Loans Portfolio grew from $14.9M to $15.4M over 2 years, representing 3.21% annual growth",
                "indication": "This demonstrates consistent operational performance and management effectiveness. Stable metrics indicate predictable business environment and reliable internal controls. The company shows resilience in maintaining operational standards.",
                "trend_direction": "stable",
                "importance_score": 75,
                "data_quality": "fair"
            },
            {
                "metric": "Current Ratio",
                "yearly_values": { "2017": 7.28, "2018": 7.85, "2019": 2.84, "2020": 2.83, "2021": 2.65, "2022": 4.85, "2023": 379.23, "2024": 10.17, "2025": 16.63 },
                "growth_rate": 10.88,
                "interpretation": "Current Ratio improved from 7.28 to 16.63 over 9 years, representing 10.88% annual improvement",
                "indication": "This indicates improving short-term financial health and liquidity position. Moderately better current ratio enhances ability to meet short-term obligations. This supports operational flexibility and reduces immediate financial risk.",
                "trend_direction": "increasing",
                "importance_score": 70,
                "data_quality": "estimated"
            }
        ],
        "success": true,
        "source": "enhanced_manual_analysis"
    },
    "metadata": {
        "ai_model": "gemini-2.5-flash",
        "file_summaries": [
            { "filename": "LIC_2023.pdf", "year": "2023", "company_name": "Life Insurance Corporation of India", "ticker_symbol": "LIC.NS" },
            { "filename": "LIC_2025.pdf", "year": "2025", "company_name": "Life Insurance Corporation of India", "ticker_symbol": null }
        ]
    }
};


// --- FILE UPLOAD CONSTANTS ---
const MIN_FILES = 3;
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// --- Utility Functions ---

/** Converts a number to a readable format (e.g., 1200000 -> 1.2M) */
const formatValue = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (Math.abs(num) >= 1.0e12) return (Math.abs(num) / 1.0e12).toFixed(2) + "T";
    if (Math.abs(num) >= 1.0e9) return (Math.abs(num) / 1.0e9).toFixed(2) + "B";
    if (Math.abs(num) >= 1.0e6) return (Math.abs(num) / 1.0e6).toFixed(2) + "M";
    if (Math.abs(num) >= 1.0e3) return (Math.abs(num) / 1.0e3).toFixed(2) + "K";
    return num.toFixed(2);
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getTrendIcon = (direction) => {
    let icon, color;
    switch (direction) {
        case 'strongly increasing':
        case 'increasing':
            icon = '▲';
            color = styles.colorGreen;
            break;
        case 'strongly decreasing':
        case 'decreasing':
            icon = '▼';
            color = styles.colorRed;
            break;
        case 'stable':
        default:
            icon = '━';
            color = styles.colorTextStable;
    }
    return <span style={{ color, fontWeight: 'bold', marginRight: '5px' }}>{icon}</span>; 
};

const getQualityStyle = (quality) => {
    switch (quality) {
        case 'excellent': return { ...styles.badge, ...styles.badgeGreen };
        case 'fair':
        case 'estimated': return { ...styles.badge, ...styles.badgeYellow };
        case 'poor': return { ...styles.badge, ...styles.badgeRed };
        default: return styles.badge;
    }
};

const getGrowthColor = (rate) => {
    if (rate > 0) return styles.colorGreen;
    if (rate < 0) return styles.colorRed;
    return styles.colorTextStable;
};

// --- Header component (Updated to accept props) ---
const Header = () => {
    const navigate = useNavigate();
        const [showDropdown, setShowDropdown] = useState(false);
        const [showToolsDropdown, setShowToolsDropdown] = useState(false);
        return (
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
                            <span>Trends & KPIs</span>
                        </div>
                        <div style={styles.dropdownItem}>
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

                        {/* Sign out */}
                        <div
                            style={styles.dropdownItem}
                            onClick={() => {
                                // (Optional) clear user data or tokens here
                                navigate("/homepage_beforelogin"); // Redirect to dashboard on logout
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
};

// --- COMPONENT: Footer ---
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

// --- FILE UPLOAD PAGE ---

const FileUploadPage = ({ onUploadSuccess }) => {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState('');
    
    // Validation Checks
    const isFileCountValid = files.length >= MIN_FILES && files.length <= MAX_FILES;
    const isReadyToSubmit = isFileCountValid && files.length > 0;

    const handleFileChange = (newFiles) => {
        let newFileList = [...files];
        let error = '';

        for (const file of newFiles) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                error = `File "${file.name}" exceeds the 20MB limit.`;
                break;
            }
            if (!newFileList.some(existingFile => existingFile.name === file.name && existingFile.size === file.size)) {
                newFileList.push(file);
            }
        }

        if (!error && newFileList.length > MAX_FILES) {
            error = `You can only upload a maximum of ${MAX_FILES} files.`;
            newFileList = newFileList.slice(0, MAX_FILES);
        }

        setFiles(newFileList);
        setValidationError(error);
        if (!error && newFileList.length < MIN_FILES) {
            setValidationError(`Please upload at least ${MIN_FILES - newFileList.length} more file(s).`);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange(Array.from(e.dataTransfer.files));
    };

    const handleRemoveFile = (fileName) => {
        const updatedFiles = files.filter(file => file.name !== fileName);
        setFiles(updatedFiles);
        if (updatedFiles.length < MIN_FILES) {
             setValidationError(`Please upload at least ${MIN_FILES - updatedFiles.length} more file(s).`);
        } else {
             setValidationError('');
        }
    };

    const handleSubmit = () => {
        if (isReadyToSubmit) {
            // Simulate successful processing
            onUploadSuccess(files); 
        } else if (files.length < MIN_FILES) {
            setValidationError(`You must upload a minimum of ${MIN_FILES} files.`);
        }
    };

    return (
        <div style={styles.dashboardWrapper}>
            <Header />
            <div style={styles.fileUploadContainer}>
                <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>Upload Financial Documents</h2>
                
                <div style={styles.requirements}>
                    <p><strong>Upload Requirements:</strong></p>
                    <ul>
                        <li style={{ fontSize: '0.9em' }}>Minimum {MIN_FILES} files, Maximum {MAX_FILES} files.</li>
                        <li style={{ fontSize: '0.9em' }}>Each file size must be less than {MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.</li>
                        <li style={{ fontSize: '0.9em' }}>Supported files: Any (PDF, DOCX, XLSX recommended).</li>
                    </ul>
                </div>
                
                <div 
                    style={{ ...styles.dropZone, ...(isDragging ? styles.dropZoneActive : {}) }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input').click()}
                >
                    <UploadCloud size={48} color={styles.White} style={{marginBottom: '10px'}} />
                    <p>Drag & drop your files here, or click to browse.</p>
                    <input
                        type="file"
                        id="file-input"
                        multiple
                        // Accepting all files since the prompt stated "all files can allows"
                        accept="*" 
                        onChange={(e) => handleFileChange(Array.from(e.target.files))}
                        style={{ display: 'none' }}
                    />
                </div>

                {validationError && <p style={{ color: styles.colorRed, textAlign: 'center', fontWeight: 'bold' }}>{validationError}</p>}
                
                {files.length > 0 && (
                    <div>
                        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', color: 'white' }}>Uploaded Files ({files.length} / {MAX_FILES})</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {files.map((file, index) => (
                                <li key={index} style={styles.fileItem}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FileText size={16} color='white' />
                                        <span>{file.name}</span>
                                        <span style={{ fontSize: '0.8em', color: '#929696ff' }}>({formatFileSize(file.size)})</span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.name); }} 
                                        style={{ background: 'none', border: 'none', color: styles.colorRed, cursor: 'pointer' }}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <button
                    onClick={handleSubmit}
                    disabled={!isReadyToSubmit}
                    style={{
                        ...styles.submitButton,
                        backgroundColor: isReadyToSubmit ? '#D1DFDF' : styles.colorTextStable,
                        cursor: isReadyToSubmit ? 'pointer' : 'not-allowed',
                    }}
                >
                    {isReadyToSubmit ? 
                        <> <CheckCircle size={20} style={{ marginRight: '8px' }} /> Analyze Trends & Charts </>
                        : 
                        `Upload ${Math.max(0, MIN_FILES - files.length)} more file${MIN_FILES - files.length !== 1 ? 's' : ''} to proceed`
                    }
                </button>
            </div>
            <Footer />
        </div>
    );
};

// Dashboard Components

// --- Component 1: Summary Card (Refactored) ---
const SummaryCard = ({ summary, metadata, styles }) => (
    <div style={{...styles.trendsListContainer, marginBottom: '20px'}}>
        {/* Header: Company Name & Title */}
        <h3 style={{ color: styles.colorBlue, borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
            {/* Fallback logic for company name: metadata.company_name > first file summary company name */}
            {metadata.company_name || metadata.file_summaries[0]?.company_name} - Executive Summary 
        </h3>
        
        {/* Overall Assessment */}
        <p style={{ fontWeight: 'bold', fontSize: '1.1em', color: styles.colorDark }}>
            Overall Assessment:
        </p>
        <p style={styles.blockquote}>
            {/* Fallback logic for assessment: overall_assessment > focus field */}
            {summary.overall_assessment || summary.focus.replace(/_/g, ' ')}
        </p>

        {/* Executive Summary Details (Conditionally Rendered) */}
        {summary.executive_summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
            
            {/* Key Strengths */}
            <div>
                <h4 style={{ color: styles.colorGreen, marginBottom: '5px' }}>
                    <CheckCircle size={18} style={{marginRight: '5px'}}/>Key Strengths
                </h4>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {summary.executive_summary.key_strengths && summary.executive_summary.key_strengths.length > 0 ? (
                        summary.executive_summary.key_strengths.map((item, index) => <li key={index}>{item}</li>)
                    ) : (
                        <li>No significant strengths noted.</li>
                    )}
                </ul>
            </div>

            {/* Major Concerns */}
            <div>
                <h4 style={{ color: styles.colorRed, marginBottom: '5px' }}>
                    <XCircle size={18} style={{marginRight: '5px'}}/>Major Concerns
                </h4>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {summary.executive_summary.major_concerns && summary.executive_summary.major_concerns.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>

            {/* Strategic Recommendations */}
            <div>
                <h4 style={{ color: styles.colorBlue, marginBottom: '5px' }}>
                    <TrendingUp size={18} style={{marginRight: '5px'}}/>Recommendations
                </h4>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {summary.executive_summary.strategic_recommendations && summary.executive_summary.strategic_recommendations.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
        )}

        {/* Footer: Metrics Summary */}
        <p style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '0.9em', color: styles.colorTextStable }}>
            Processed {summary.files_processed} files. {summary.total_metrics_found} metrics found, {summary.critical_metrics_analyzed} critical metrics analyzed.
        </p>
    </div>
);

// --- Component 2: Trends List ---
// ADDED: search, setSearch, and selectedMetricName props
const TrendsList = ({ trends, setSelectedMetric, search, setSearch, selectedMetricName }) => { 
    const [sortBy, setSortBy] = useState('importance_score');
    const [sortDirection, setSortDirection] = useState('desc');
    const [hoveredRow, setHoveredRow] = useState(null);

    // 1. FILTER the trends based on the search term
    const filteredTrends = useMemo(() => {
        if (!search) return trends;
        const lowerCaseSearch = search.toLowerCase();
        return trends.filter(trend =>
            trend.metric.toLowerCase().includes(lowerCaseSearch)
        );
    }, [trends, search]);


    // 2. SORT the filtered results
    const sortedTrends = useMemo(() => {
        const sortableTrends = [...filteredTrends]; 
        sortableTrends.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (sortBy === 'growth_rate' || sortBy === 'importance_score') {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableTrends;
    }, [filteredTrends, sortBy, sortDirection]); 

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
    };

    const getSortIndicator = (key) => {
        if (sortBy === key) {
            return sortDirection === 'asc' ? ' ↓' : ' ↑';
        }
        return '';
    };

    return (
        <div style={styles.trendsListContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>Financial Trend Metrics ({filteredTrends.length} of {trends.length})</h3>
                <input
                    type="text"
                    placeholder="Search metrics..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ 
                        padding: '8px 12px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc',
                        width: '40%'
                    }}
                />
            </div>
            <table style={styles.trendsTable}>
                <thead>
                    <tr>
                        <th style={styles.tableHeader} onClick={() => handleSort('metric')}>Metric {getSortIndicator('metric')}</th>
                        <th style={{...styles.tableHeader, ...styles.numeric}} onClick={() => handleSort('growth_rate')}>Growth Rate {getSortIndicator('growth_rate')}</th>
                        <th style={styles.tableHeader}>Trend</th>
                        <th style={{...styles.tableHeader, ...styles.numeric}} onClick={() => handleSort('importance_score')}>Importance {getSortIndicator('importance_score')}</th>
                        <th style={styles.tableHeader}>Data Quality</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTrends.map((trend, index) => {
                        const isSelected = trend.metric === selectedMetricName;
                        return (
                            <tr 
                                key={index} 
                                onClick={() => setSelectedMetric(trend.metric)} 
                                onMouseEnter={() => setHoveredRow(index)}
                                onMouseLeave={() => setHoveredRow(null)}
                                style={{
                                    ...styles.trendRowClickable,
                                    // NEW: Active row highlight
                                    backgroundColor: isSelected ? styles.colorActiveRow : (hoveredRow === index ? styles.tableRowHover : 'white'),
                                }}
                            >
                                <td style={styles.tableData}><strong>{trend.metric}</strong></td>
                                <td style={{ ...styles.tableData, ...styles.numeric, color: getGrowthColor(trend.growth_rate) }}>
                                    {trend.growth_rate.toFixed(2)}%
                                </td>
                                <td style={styles.tableData}>{getTrendIcon(trend.trend_direction)} {trend.trend_direction}</td>
                                <td style={{ ...styles.tableData, ...styles.numeric }}>{trend.importance_score}</td>
                                <td style={styles.tableData}>
                                    <span style={getQualityStyle(trend.data_quality)}>
                                        {trend.data_quality.charAt(0).toUpperCase() + trend.data_quality.slice(1)}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// --- Component 3: Trend Chart ---
const TrendChart = ({ trend }) => {
    if (!trend) return <div style={styles.chartContainer}><p>Select a metric from the table to view its trend chart.</p></div>;

    const chartData = Object.entries(trend.yearly_values)
        .map(([year, value]) => ({ year: year, value: value }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Sort by year

    return (
        <div style={styles.chartContainer}>
            <h3>Trend Analysis: {trend.metric}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" stroke="#333" />
                    <YAxis 
                        tickFormatter={formatValue} 
                        stroke="#333"
                        label={{ value: 'Value', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip 
                        formatter={(value) => [`Value: ${formatValue(value)}`, 'Metric']} 
                        labelFormatter={(label) => `Year: ${label}`}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={getGrowthColor(trend.growth_rate)}
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Component 4: Metric Details Card ---
const MetricDetailsCard = ({ trend }) => {
    if (!trend) return null;

    const growthColor = getGrowthColor(trend.growth_rate);

    return (
        <div style={styles.detailsCard}>
            <div style={styles.detailsHeader}>
                <div style={styles.detailsKpi}>
                    <span style={{ ...styles.detailsValue, color: growthColor }}>{trend.growth_rate.toFixed(2)}%</span>
                    <span style={styles.detailsLabel}>Annual Growth Rate</span>
                </div>
                <div style={styles.detailsKpi}>
                    <span style={{ ...styles.detailsValue, color: styles.colorBlue }}>{trend.importance_score}</span>
                    <span style={styles.detailsLabel}>Importance Score</span>
                </div>
                <div style={styles.detailsKpi}>
                    <span style={getQualityStyle(trend.data_quality)}>{trend.data_quality}</span>
                    <span style={styles.detailsLabel}>Data Quality</span>
                </div>
            </div>
            
            <div style={styles.detailsSection}>
                <h4 style={styles.detailsSectionH4}>Interpretation</h4>
                <p>{trend.interpretation}</p>
            </div>

            <div style={styles.detailsSection}>
                <h4 style={styles.detailsSectionH4}>Strategic Indication</h4>
                <blockquote style={{ ...styles.blockquote, borderLeftColor: growthColor, color: growthColor }}>{trend.indication}</blockquote>
            </div>
        </div>
    );
};

// --- Dashboard Component ---
function FinancialTrendsDashboard({uploadedFiles, onGoBack}) {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    // ⭐️ FIX: Un-commented and placed search state correctly inside the functional component
    const [search, setSearch] = useState(''); 

    const trends = financialData.trends.financial_trends;
    // Ensure trends array is not empty before accessing index 0
    const initialMetric = trends.length > 0 ? trends[0].metric : null;
    const [selectedMetricName, setSelectedMetricName] = useState(initialMetric);
    
    const selectedTrend = trends.find(t => t.metric === selectedMetricName);

    return (
        <div style={styles.dashboardWrapper}>
            {/* 1. Integrated Header Component */}
            <Header 
                navigate={navigate}
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
                showToolsDropdown={showToolsDropdown}
                setShowToolsDropdown={setShowToolsDropdown}
            />
            
            <div style={styles.dashboardContainer}>
                {/* Main Content Start */}
                <header style={styles.dashboardHeaderMain}>
                    <h1>Critical Financial Trends Dashboard</h1>
                    <p style={{marginBottom: '20px'}}>Analyzed {uploadedFiles.length} files from upload.</p>
                    <button 
                onClick={onGoBack} // <--- CALLS THE FUNCTION TO CHANGE PAGE
                style={{
                    padding: '8px 15px', 
                    backgroundColor: styles.colorGrey, 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'background-color 0.2s',
                }}
                  >
            <ArrowLeft size={16} /> Back to Upload
        </button>
                </header>

                <SummaryCard 
                    summary={financialData.summary} 
                    metadata={financialData.metadata} 
                    styles={styles} 
                />
                
                <div style={styles.mainContentGrid}>
                    <TrendsList 
                        trends={trends} 
                        setSelectedMetric={setSelectedMetricName} 
                        // PASS search state as props
                        search={search}
                        setSearch={setSearch}
                        selectedMetricName={selectedMetricName}
                    />
                    
                    <div style={styles.detailPanel}>
                        <TrendChart trend={selectedTrend} />
                        <MetricDetailsCard trend={selectedTrend} />
                    </div>
                </div>
                {/* Main Content End */}
            </div>
            <Footer />
        </div>
    );
}

// main App Flow Component
function AppFlow() {
    // State to manage the application's current view (page)
    const [page, setPage] = useState('upload'); 
    // State to hold uploaded files metadata for demonstration
    const [uploadedFiles, setUploadedFiles] = useState([]); 

    const handleUploadSuccess = (files) => {
        setUploadedFiles(files);
        // In a real app, you would initiate data processing here, then setPage('dashboard')
        setPage('dashboard'); 
    };

    if (page === 'upload') {
        return <FileUploadPage onUploadSuccess={handleUploadSuccess} />;
    }

    if (page === 'dashboard') {
        // Pass the file information to the dashboard for display/context
        return <FinancialTrendsDashboard uploadedFiles={uploadedFiles} onGoBack={() => setPage('upload')}/>;
    }
    
    // Default fallback (should not happen)
    return <p>Loading application...</p>;
}

export default AppFlow;