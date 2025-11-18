import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, History, Settings, Wrench, BarChart, TrendingUp, Search, Activity, BookOpen, Cpu, GitCompare, CheckCircle, XCircle, UploadCloud, FileText, X } from "lucide-react";
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import api from '../api';


// --- STYLING CONSTANTS ---
const styles = {
    dashboardWrapper: {
        minHeight: '100vh',
        background: '#f8f8f8',
        fontFamily: '"Bricolage Grotesque", Arial, sans-serif'
    },
    detailPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    dashboardContainer: {
        minHeight: '100vh',
        background: '#f8f8f8',
        fontFamily: '"Bricolage Grotesque", Arial, sans-serif',
        margin: '0 auto'
    },
    dashboardHeaderMain: {
        borderBottom: '2px solid #ddd',
        paddingBottom: '15px',
        marginBottom: '20px',
    },
    colorBlue: '#007bff',
    colorGreen: '#28a745',
    colorRed: '#dc3545',
    colorYellow: '#ffc107',
    colorGrey: '#6c757d',
    colorTextStable: '#6c757d',
    colorActiveRow: '#e6f7ff',

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
    

    summaryCard: {
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
        marginBottom: '30px',
        width: '70%'
    },
    trendsListContainer: {
        background: '#fafafaff',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
        overflowX: 'auto',
        width: '95%',
        margin: '20px auto',
        border: '1px solid #000000'
    },
    mainContentGrid: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '30px',
    },
    chartContainer: {
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #171717ff'
    },
    detailsCard: {
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
    },
    fileUploadContainer: {
        width: '50%',
        margin: '50px auto',
        padding: '15px',
        borderRadius: '24px',
        boxShadow: '0 30px 50px rgba(0, 0, 0, 0.1)',
        background: "linear-gradient(135deg, #CAD3E7, #a6b1caff)",
        flexGrow: 1,
        border: '1px solid #000000'
    },
    dropZone: {
        border: '3px dashed #636363ff',
        borderRadius: '8px',
        padding: '40px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        marginBottom: '20px',
        color: 'white',
        backgroundColor: '#f0f3f9ff'
    },
    badge: {
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '0.75em',
        fontWeight: '600',
        display: 'inline-block',
    },
    badgeGreen: { color: '#28a745' },
    badgeYellow: { color: '#ffc107', color: '#333' },
    badgeRed: { color: '#dc3545' },
    blockquote: {
        margin: '10px 0 10px 10px',
        padding: '10px 15px',
        borderLeft: '4px solid #16212cff',
        
        fontStyle: 'italic',
        borderRadius: '4px',
    },
};

// --- Utility Functions ---
const formatValue = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (Math.abs(num) >= 1.0e12) return (Math.abs(num) / 1.0e12).toFixed(2) + "T";
    if (Math.abs(num) >= 1.0e9) return (Math.abs(num) / 1.0e9).toFixed(2) + "B";
    if (Math.abs(num) >= 1.0e6) return (Math.abs(num) / 1.0e6).toFixed(2) + "M";
    if (Math.abs(num) >= 1.0e3) return (Math.abs(num) / 1.0e3).toFixed(2) + "K";
    return typeof num === 'number' ? num.toFixed(2) : num;
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

// --- CSRF Token Function ---
function getCSRFToken() {
    try {
        const csrfCookie = document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='));
        return csrfCookie ? csrfCookie.split('=')[1] : null;
    } catch (error) {
        console.error('Error getting CSRF token:', error);
        return null;
    }
}


// --- Header Component ---
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
              <div style={styles.dropdownItem}
              onClick={() => navigate("/comparison")}
              >
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

// --- FILE UPLOAD PAGE ---
const FileUploadPage = ({ onUploadSuccess }) => {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();
    const [apiKey, setApiKey] = useState('');
    

    const MIN_FILES = 3;
    const MAX_FILES = 10;
    const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

    const isFileCountValid = files.length >= MIN_FILES && files.length <= MAX_FILES;
    const isReadyToSubmit = isFileCountValid && files.length > 0;

    const handleFileChange = (newFiles) => {
        let newFileList = [...files];
        let error = '';

        // Validate file types
        const allowedTypes = ['.pdf', '.xlsx', '.xls'];
        for (const file of newFiles) {
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(fileExt)) {
                error = `File "${file.name}" has unsupported format. Please upload PDF or Excel files.`;
                break;
            }

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
        } else if (!error) {
            setValidationError('');
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

    const handleSubmit = async () => {
        if (!isReadyToSubmit) {
            if (files.length < MIN_FILES) {
                setValidationError(`You must upload a minimum of ${MIN_FILES} files.`);
            }
            return;
        }

        setIsUploading(true);
        setValidationError('');

        try {
            const formData = new FormData();

            // Add files to FormData
            files.forEach(file => {
                formData.append('files', file);
            });

            // Add API key if needed
            formData.append('api_key', 'AIzaSyDTz-Yi25lpP-foIQJkn2FpJEOMxO3kUFg'); // Replace with actual API key

            const response = await fetch('http://localhost:8000/trends/api/process-financial-statements/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                },
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                }
                throw new Error(errorData.error || `Upload failed with status ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                onUploadSuccess(files, result);
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            setValidationError(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={styles.dashboardWrapper}>

            <Header
                navigate={navigate}
                location={location}
                setShowToolsDropdown={setShowToolsDropdown}
                showToolsDropdown={showToolsDropdown}
                setShowDropdown={setShowDropdown}
                showDropdown={showDropdown}
            />
            <div style={styles.fileUploadContainer}>
                <h2 style={{ color: 'Black', textAlign: 'center', marginBottom: '20px' }}>Upload Financial Documents</h2>

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

                <div style={{ backgroundColor: '#ba8686ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Upload Requirements:</p>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ fontSize: '0.9em' }}>Minimum {MIN_FILES} files, Maximum {MAX_FILES} files.</li>
                        <li style={{ fontSize: '0.9em' }}>Each file size must be less than {MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.</li>
                        <li style={{ fontSize: '0.9em' }}>Supported files: PDF, Excel files.</li>
                    </ul>
                </div>

                <div
                    style={{
                        ...styles.dropZone,
                        ...(isDragging ? { backgroundColor: 'rgba(255, 255, 255, 0.1)' } : {})
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input').click()}
                >
                    <UploadCloud size={48} color="#3e3e3eff" style={{ marginBottom: '10px' }} />
                    <p style={{ color: "#3e3e3eff" }}>
                        Drag & drop your files here, or click to browse.
                    </p>
                    <input
                        type="file"
                        id="file-input"
                        multiple
                        accept=".pdf,.xlsx,.xls"
                        onChange={(e) => handleFileChange(Array.from(e.target.files))}
                        style={{ display: 'none' }}
                    />
                </div>

                {validationError && (
                    <p style={{ color: styles.colorRed, textAlign: 'center', fontWeight: 'bold', margin: '10px 0' }}>
                        {validationError}
                    </p>
                )}

                {files.length > 0 && (
                    <div>
                        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', color: 'white' }}>
                            Uploaded Files ({files.length} / {MAX_FILES})
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {files.map((file, index) => (
                                <li key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FileText size={16} color='black' />
                                        <span style={{ color: '#000000' }}>{file.name}</span>
                                        <span style={{ fontSize: '0.8em', color: '#565656ff' }}>
                                            ({formatFileSize(file.size)})
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.name); }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: styles.colorRed,
                                            cursor: 'pointer',
                                            opacity: isUploading ? 0.5 : 1
                                        }}
                                        disabled={isUploading}
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
                    disabled={!isReadyToSubmit || isUploading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '1.1em',
                        backgroundColor: (isReadyToSubmit && !isUploading) ? '#414355ff' : styles.colorTextStable,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (isReadyToSubmit && !isUploading) ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.3s',
                        marginTop: '20px'
                    }}
                >
                    {isUploading ? (
                        'Processing...'
                    ) : isReadyToSubmit ? (
                        <> <CheckCircle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Analyze Trends & Charts </>
                    ) : (
                        `Upload ${Math.max(0, MIN_FILES - files.length)} more file${MIN_FILES - files.length !== 1 ? 's' : ''} to proceed`
                    )}
                </button>
            </div>
            <Footer />
        </div>
    );
};

// --- Dashboard Components ---

// Summary Card Component
const SummaryCard = ({ summary, metadata, styles }) => (
    <div style={{ ...styles.trendsListContainer, marginBottom: '20px' }}>
        <h2 style={{ color: "#23214eff", borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
            {metadata.company_name || (metadata.file_summaries && metadata.file_summaries[0]?.company_name) || 'Company'} - Executive Summary
        </h2>

        <p style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '10px' }}>
            Overall Assessment:
        </p>
        <p style={styles.blockquote}>
            {summary.overall_assessment || summary.focus?.replace(/_/g, ' ') || 'No assessment available.'}
        </p>

        {summary.executive_summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>

                {/* Key Strengths */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #DEE6E6, #fafafaff)",
                        padding: "10px 15px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <div>
                        <h4 style={{ color: styles.colorGreen, marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                            <CheckCircle size={18} style={{ marginRight: '5px' }} />Key Strengths
                        </h4>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {summary.executive_summary.key_strengths && summary.executive_summary.key_strengths.length > 0 ? (
                                summary.executive_summary.key_strengths.map((item, index) => <li key={index}>{item}</li>)
                            ) : (
                                <li>No significant strengths noted.</li>
                            )}
                        </ul>
                    </div>
                </div>
                {/* Major Concerns */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #DEE6E6, #fafafaff)",
                        padding: "10px 15px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                <div>
                    <h4 style={{ color: styles.colorRed, marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                        <XCircle size={18} style={{ marginRight: '5px' }} />Major Concerns
                    </h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {summary.executive_summary.major_concerns && summary.executive_summary.major_concerns.length > 0 ? (
                            summary.executive_summary.major_concerns.map((item, index) => <li key={index}>{item}</li>)
                        ) : (
                            <li>No major concerns noted.</li>
                        )}
                    </ul>
                </div>
                        </div>
                {/* Strategic Recommendations */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #DEE6E6, #fafafaff)",
                        padding: "10px 15px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                <div>
                    <h4 style={{ color: styles.colorBlue, marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                        <TrendingUp size={18} style={{ marginRight: '5px' }} />Recommendations
                    </h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {summary.executive_summary.strategic_recommendations && summary.executive_summary.strategic_recommendations.length > 0 ? (
                            summary.executive_summary.strategic_recommendations.map((item, index) => <li key={index}>{item}</li>)
                        ) : (
                            <li>No specific recommendations.</li>
                        )}
                    </ul>
                </div>
                </div>
            </div>
        )}

        <p style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '0.9em', color: styles.colorTextStable }}>
            Processed {summary.files_processed} files. {summary.total_metrics_found} metrics found, {summary.critical_metrics_analyzed} critical metrics analyzed.
        </p>
    </div>
);

// Trends List Component
const TrendsList = ({ trends, setSelectedMetric, search, setSearch, selectedMetricName }) => {
    const [sortBy, setSortBy] = useState('importance_score');
    const [sortDirection, setSortDirection] = useState('desc');
    const [hoveredRow, setHoveredRow] = useState(null);

    const filteredTrends = useMemo(() => {
        if (!search) return trends;
        const lowerCaseSearch = search.toLowerCase();
        return trends.filter(trend =>
            trend.metric.toLowerCase().includes(lowerCaseSearch)
        );
    }, [trends, search]);

    const sortedTrends = useMemo(() => {
        const sortableTrends = [...filteredTrends];
        sortableTrends.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (sortBy === 'growth_rate' || sortBy === 'importance_score') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
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
                <h3 style={{ margin: 0 }}>Financial Trend Metrics ({filteredTrends.length} of {trends.length})</h3>
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th
                            style={{
                                backgroundColor: '#e9ecef',
                                padding: '12px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderBottom: '2px solid #ddd'
                            }}
                            onClick={() => handleSort('metric')}
                        >
                            Metric {getSortIndicator('metric')}
                        </th>
                        <th
                            style={{
                                backgroundColor: '#e9ecef',
                                padding: '12px',
                                textAlign: 'right',
                                cursor: 'pointer',
                                borderBottom: '2px solid #ddd'
                            }}
                            onClick={() => handleSort('growth_rate')}
                        >
                            Growth Rate {getSortIndicator('growth_rate')}
                        </th>
                        <th
                            style={{
                                backgroundColor: '#e9ecef',
                                padding: '12px',
                                textAlign: 'left',
                                borderBottom: '2px solid #ddd'
                            }}
                        >
                            Trend
                        </th>
                        <th
                            style={{
                                backgroundColor: '#e9ecef',
                                padding: '12px',
                                textAlign: 'right',
                                cursor: 'pointer',
                                borderBottom: '2px solid #ddd'
                            }}
                            onClick={() => handleSort('importance_score')}
                        >
                            Importance {getSortIndicator('importance_score')}
                        </th>
                        <th
                            style={{
                                backgroundColor: '#e9ecef',
                                padding: '12px',
                                textAlign: 'left',
                                borderBottom: '2px solid #ddd'
                            }}
                        >
                            Data Quality
                        </th>
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
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? styles.colorActiveRow : (hoveredRow === index ? '#f0f0f0' : 'white'),
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><strong>{trend.metric}</strong></td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right', color: getGrowthColor(trend.growth_rate) }}>
                                    {trend.growth_rate?.toFixed(2)}%
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                    {getTrendIcon(trend.trend_direction)} {trend.trend_direction}
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                    {trend.importance_score}
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                    <span style={getQualityStyle(trend.data_quality)}>
                                        {trend.data_quality?.charAt(0).toUpperCase() + trend.data_quality?.slice(1)}
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

// Trend Chart Component
const TrendChart = ({ trend }) => {
    // Debug logging
    console.log('TrendChart received trend:', trend);

    if (!trend) {
        return (
            <div style={styles.chartContainer}>
                <p>Select a metric from the table to view its trend chart.</p>
            </div>
        );
    }

    if (!trend.yearly_values || Object.keys(trend.yearly_values).length === 0) {
        return (
            <div style={styles.chartContainer}>
                <p>No yearly data available for {trend.metric}.</p>
                <p style={{ fontSize: '0.9em', color: styles.colorGrey }}>
                    Available data: {JSON.stringify(trend.yearly_values)}
                </p>
            </div>
        );
    }

    // Transform data for Recharts
    const chartData = Object.entries(trend.yearly_values)
        .map(([year, value]) => ({
            year: year.toString(),
            value: parseFloat(value) || 0
        }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    console.log('Chart Data:', chartData);

    return (
        <div style={styles.chartContainer}>
            <h3>Trend Analysis: {trend.metric}</h3>
            <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                            dataKey="year"
                            stroke="#333"
                            label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                            tickFormatter={formatValue}
                            stroke="#333"
                            label={{
                                value: 'Value',
                                angle: -90,
                                position: 'insideLeft',
                                style: { textAnchor: 'middle' }
                            }}
                        />
                        <Tooltip
                            formatter={(value) => [`${formatValue(value)}`, 'Value']}
                            labelFormatter={(label) => `Year: ${label}`}
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={getGrowthColor(trend.growth_rate)}
                            strokeWidth={2}
                            dot={{ r: 4, fill: getGrowthColor(trend.growth_rate) }}
                            activeDot={{ r: 6, fill: getGrowthColor(trend.growth_rate) }}
                            name={trend.metric}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {chartData.length > 0 && (
                <p style={{ fontSize: '0.9em', color: styles.colorGrey, marginTop: '10px' }}>
                    Showing {chartData.length} data points from {chartData[0].year} to {chartData[chartData.length - 1].year}
                </p>
            )}
        </div>
    );
};

// Metric Details Card Component
const MetricDetailsCard = ({ trend }) => {

    if (!trend) return (
        <div style={styles.detailsCard}>
            <p>Select a metric to view detailed analysis.</p>
        </div>
    );

    const growthColor = getGrowthColor(trend.growth_rate);

    return (
        <div style={styles.detailsCard}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: '10px',
                paddingBottom: '15px',
                marginBottom: '15px',
                borderBottom: '1px dashed #ddd',
                textAlign: 'center'
            }}>
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '4px', padding: '10px' }}>
                    <span style={{ display: 'block', fontSize: '1.5em', fontWeight: '700', color: growthColor }}>
                        {trend.growth_rate?.toFixed(2)}%
                    </span>
                    <span style={{ fontSize: '0.85em', color: '#555' }}>Annual Growth Rate</span>
                </div>
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '4px', padding: '10px' }}>
                    <span style={{ display: 'block', fontSize: '1.5em', fontWeight: '700', color: styles.colorBlue }}>
                        {trend.importance_score}
                    </span>
                    <span style={{ fontSize: '0.85em', color: '#555' }}>Importance Score</span>
                </div>
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '4px', padding: '10px' }}>
                    <span style={getQualityStyle(trend.data_quality)}>
                        {trend.data_quality?.charAt(0).toUpperCase() + trend.data_quality?.slice(1)}
                    </span>
                    <div style={{ fontSize: '0.85em', color: '#555', marginTop: '5px' }}>Data Quality</div>
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ color: styles.colorBlue, marginTop: '10px', marginBottom: '5px' }}>Interpretation</h4>
                <p style={{ margin: 0 }}>{trend.interpretation}</p>
            </div>

            <div>
                <h4 style={{ color: styles.colorBlue, marginTop: '10px', marginBottom: '5px' }}>Strategic Indication</h4>
                <blockquote style={{
                    margin: '10px 0 10px 10px',
                    padding: '10px 15px',
                    borderLeft: `4px solid ${growthColor}`,
                    background: '#f0f8ff',
                    fontStyle: 'italic',
                    borderRadius: '4px',
                    color: growthColor
                }}>
                    {trend.indication}
                </blockquote>
            </div>
        </div>
    );
};

// --- Dashboard Component ---
function FinancialTrendsDashboard({ uploadedFiles, backendData, onGoBack }) {
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();
    // Use backend data instead of hardcoded data
    const trends = backendData?.trends?.financial_trends || [];
    const initialMetric = trends.length > 0 ? trends[0].metric : null;
    const [selectedMetricName, setSelectedMetricName] = useState(initialMetric);

    const selectedTrend = trends.find(t => t.metric === selectedMetricName);

    return (
        <div style={styles.dashboardWrapper}>
            <Header
                navigate={navigate}
                location={location}
                setShowToolsDropdown={setShowToolsDropdown}
                showToolsDropdown={showToolsDropdown}
                setShowDropdown={setShowDropdown}
                showDropdown={showDropdown}
            />

            <div style={styles.dashboardContainer}>
                <header style={{
                    display: "flex",               // ⭐ Fix spacing
    justifyContent: "space-between", // ⭐ Spread h1 and button evenly
    alignItems: "center",   
                    width:'97%',
                    margin: "0 auto",     // centers header content
                }}>
                    <h1>Critical Financial Trends Dashboard</h1>
                <button
                onClick={onGoBack}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px",
                    backgroundColor: "#e4e4e4ff",
                    color: 'black',
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    overflow: "hidden",
                    width: "40px",
                    height: "40px",
                    transition: "width 0.3s ease, background-color 0.2s ease",
                    whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.width = "170px";
                    e.currentTarget.style.backgroundColor = "#a5a9b9ff";
                    e.currentTarget.querySelector(".btn-text").style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.width = "40px";
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.querySelector(".btn-text").style.opacity = "0";
                }}
                >
                <X size={16} color='#000000' style={{ flexShrink: 0 }} />
                <span
                    className="btn-text"
                    style={{
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                    }} 
                >
                    Back to Upload
                </span>
                </button>


                </header>

                {backendData ? (
                    <>
                        <SummaryCard
                            summary={backendData.summary}
                            metadata={backendData.metadata}
                            styles={styles}
                        />

                        <div style={styles.mainContentGrid}>
                            <TrendsList
                                trends={trends}
                                setSelectedMetric={setSelectedMetricName}
                                search={search}
                                setSearch={setSearch}
                                selectedMetricName={selectedMetricName}
                            />

                            <div style={styles.detailPanel}>
                                <TrendChart trend={selectedTrend} />
                                <MetricDetailsCard trend={selectedTrend} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading dashboard data...</p>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

// --- Main App Flow Component ---
function AppFlow() {
    const [page, setPage] = useState('upload');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [backendData, setBackendData] = useState(null);

    const handleUploadSuccess = (files, result) => {
        setUploadedFiles(files);
        setBackendData(result);
        setPage('dashboard');
    };

    if (page === 'upload') {
        return <FileUploadPage onUploadSuccess={handleUploadSuccess} />;
    }

    if (page === 'dashboard') {
        return (
            <FinancialTrendsDashboard
                uploadedFiles={uploadedFiles}
                backendData={backendData}
                onGoBack={() => setPage('upload')}
            />
        );
    }

    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading application...</div>;
}

export default AppFlow;