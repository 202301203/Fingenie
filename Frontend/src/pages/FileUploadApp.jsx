import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  ArrowLeft,
  User,
  History,
  Settings,
  LogOut,
  Wrench,
  TrendingUp,
  Search,
  Activity,
  BookOpen,
  Cpu,
  GitCompare
} from 'lucide-react';
import '../App.css';
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import UploadImage from '../images/uploadimage_Wbg.png';
import { useNavigate } from "react-router-dom";
import api from '../api';

const FileUploadApp = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('first'); 
  const [numberOfFiles, setNumberOfFiles] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleFileChange = (e) => handleFiles(Array.from(e.target.files));
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFiles = (files) => {
    const validFiles = [];
    const errors = [];
    files.forEach(file => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/pdf'
      ];
      const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
      const isAllowed = allowedTypes.includes(file.type) || allowedExtensions.some(ext => file.name.endsWith(ext));
      const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);

      if (!isAllowed) errors.push(`${file.name}: Only PDF, CSV, XLS, XLSX files allowed`);
      else if (!isValidSize) errors.push(`${file.name}: File size (${fileSizeMB}MB) exceeds ${MAX_FILE_SIZE_MB}MB`);
      else validFiles.push(file);
    });

    if (errors.length > 0) alert('Upload errors:\n\n' + errors.join('\n\n'));

    if (validFiles.length > 0) {
      setUploadedFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const newFiles = validFiles
          .filter(file => !existingNames.has(file.name))
          .map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(1) + " MB",
            file,
            uploaded: true
          }));
        return [...prev, ...newFiles].slice(0, numberOfFiles);
      });
    }
  };

  const removeFile = (id) => setUploadedFiles(prev => prev.filter(file => file.id !== id));
  const goToUpload = () => {
    if (numberOfFiles < 1 || numberOfFiles > 4) return alert('Please enter a number between 1 and 4');
    setCurrentPage('upload');
  };
  const goBack = () => { setCurrentPage('first'); setUploadedFiles([]); };

  // Header Component
  const Header = () => (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <div style={styles.logo}>
          <img src={fglogo_Wbg} style={{ height: "80px", width: "auto" }} alt="logo" />
        </div>
      </div>

      <nav style={styles.nav}>
        <span style={styles.navLink} onClick={() => navigate("/mainpageafterlogin")}>Home</span>
        <span style={styles.navLink} onClick={() => navigate("/NewsPage")}>News</span>
        <span style={styles.navLink} onClick={() => navigate("/AboutUs")}>About us</span>

        {/* Tools Menu */}
        <div style={styles.toolsMenu} onMouseEnter={() => setShowToolsDropdown(true)} onMouseLeave={() => setShowToolsDropdown(false)}>
          <Wrench size={24} color="black" style={styles.userIcon} />
          {showToolsDropdown && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownItem}><TrendingUp size={16} /><span>Debt Ratings</span></div>
              <div style={styles.dropdownItem}><Search size={16} /><span>Search Companies</span></div>
              <div style={styles.dropdownItem}><Activity size={16} /><span>Charts & KPIs</span></div>
              <div style={styles.dropdownItem}><BookOpen size={16} /><span>Blog Page</span></div>
              <div style={styles.dropdownItem}><Cpu size={16} /><span>AI Summary</span></div>
              <div style={styles.dropdownItem}><GitCompare size={16} /><span>Comparison</span></div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div style={styles.userMenu} onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
          <User size={24} color="black" style={styles.userIcon} />
          {showDropdown && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownItem}><User size={16} /><span>Profile</span></div>
              <div style={styles.dropdownItem}><History size={16} /><span>History</span></div>
              <div style={styles.dropdownItem}><Settings size={16} /><span>Settings</span></div>
              <div style={styles.dropdownItem} onClick={() => navigate("/homepage_beforelogin")}><LogOut size={16} /><span>Sign out</span></div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );

  if (currentPage === 'first') {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.mainContent}>
          <div style={styles.card}>
            <div style={styles.cardContent}>
              <div style={styles.iconContainer}><FileText size={32} color="white" /></div>
              <h1 style={styles.title}>Please upload the financial report file here to generate a simplified financial report.</h1>
              <div style={styles.formSection}>
                <label style={styles.label}>Enter the number of files (1-4) to upload.</label>
                <input type="number" min="1" max="4" value={numberOfFiles} onChange={(e) => setNumberOfFiles(parseInt(e.target.value) || 1)} style={styles.input} />
                <button onClick={goToUpload} style={styles.uploadButton}>Upload Files</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'upload') {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.mainContent1}>
          <div style={{ ...styles.card1, maxWidth: '800px' }}>
            <div style={styles.cardContent1}>
              <div style={styles.uploadHeader}>
                <button onClick={goBack} style={styles.backButton}><ArrowLeft size={20} /><span>Back</span></button>
                <div style={styles.fileCounter}>Upload {numberOfFiles} file{numberOfFiles > 1 ? 's' : ''}</div>
              </div>

              <div style={{ margin: '1rem 0', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#D1DFDF' }}>LLM API Key (optional)</label>
                <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste API key here if you want to use a custom key" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #a7a7a7' }} />
              </div>

              <div style={styles.uploadTitle}><h1 style={styles.title}>Upload Your Files</h1></div>

              {/* Upload Area */}
              <div style={{...styles.uploadArea, ...(dragActive ? styles.uploadAreaActive : {}), ...(uploadedFiles.length >= numberOfFiles || isProcessing ? styles.uploadAreaDisabled : {})}}
                   onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <input type="file" multiple accept=".xlsx,.xls,.csv,.pdf" onChange={handleFileChange} style={styles.fileInput} disabled={uploadedFiles.length >= numberOfFiles || isProcessing} />
                <div style={styles.uploadContent}>
                  <div style={styles.uploadIcon}><img src={UploadImage} alt="Upload Icon" style={{ width: '80px', height: '70px' }} /></div>
                  <div>
                    <p style={styles.uploadText}>Drag & drop files</p>
                    <p style={styles.uploadSubtext}>Only .xlsx/.xls/.csv/.pdf files supported (Max {MAX_FILE_SIZE_MB}MB per file)</p>
                  </div>
                  <button type="button" style={{ ...styles.chooseButton, ...(uploadedFiles.length >= numberOfFiles || isProcessing ? styles.chooseButtonDisabled : {}) }} disabled={uploadedFiles.length >= numberOfFiles || isProcessing}>Choose Files</button>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div style={styles.filesSection}>
                  <h3 style={styles.filesTitle}>Uploaded Files:</h3>
                  {uploadedFiles.map((file) => (
                    <div key={file.id} style={styles.fileItem}>
                      <div style={styles.fileInfo}><CheckCircle size={20} color="#10b981" />
                        <div><p style={styles.fileName}>{file.name}</p><p style={styles.fileSize}>{file.size}</p></div>
                      </div>
                      <button onClick={() => removeFile(file.id)} style={styles.removeButton} disabled={isProcessing}>Remove</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Generate Button */}
              {uploadedFiles.length === numberOfFiles && (
                <div style={styles.generateSection}>
                  <button
                    style={{ ...styles.generateButton, opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                    disabled={isProcessing}
                    onClick={async () => {
                      if (isProcessing) return;
                      setIsProcessing(true);
                      try {
                        const fileObj = uploadedFiles[0];
                        if (!fileObj?.file) { alert('No file ready to upload.'); return; }

                        const formData = new FormData();
                        formData.append('file', fileObj.file);
                        if (apiKey?.trim()) formData.append('api_key', apiKey.trim());

                        const json = await api.postExtract(formData);

                        if (json?.report_id) localStorage.setItem('currentReportId', json.report_id);
                        if (apiKey?.trim()) localStorage.setItem('userApiKey', apiKey.trim());
                        else if (json?.api_key) localStorage.setItem('userApiKey', json.api_key);

                        navigate('/summary_page', { state: json });
                      } catch (err) {
                        console.error('Upload error', err);
                        alert('An error occurred while uploading. Check console for details.');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                  >
                    {isProcessing ? 'Processing…' : 'Generate Financial Report'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};


// CSS Styles 
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 50%, #ffffffff 100%)',
    fontFamily: '"Bricolage Grotesque", Arial, sans-serif'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 4rem',
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
    backdropFilter: 'blur(10px)',            // Blur background
    WebkitBackdropFilter: 'blur(10px)',      // Safari support
    borderRadius: '15px',
    border: '1px solid rgba(255, 255, 255, 0.3)', // Subtle border
    boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.1)', // Soft glow shadow
    borderBottom: '2px solid black',

    color: 'white',
  },


  logo: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  brandName: {
    fontWeight: '600'
  },

  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginTop: "10px",
  },

  navLink: {
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'color 0.2s',
    color: 'Black'
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

  mainContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 80px)',
    marginTop: '-70px'
  },

  card: {
    backgroundColor: '#515266',
    backdropFilter: 'blur(10px)',
    borderRadius: '30px',
    boxShadow: '0 -4px 10px rgba(255, 255, 255, 0.1), 0 -1px 3px rgba(0, 0, 0, 0.08)',
    padding: '2rem',
    width: '100%',
    maxWidth: '1300px'
  },

  cardContent: {
    textAlign: 'center'
  },

  iconContainer: {
    width: '64px',
    height: '64px',
    backgroundColor: '#515266',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem'
  },

  title: {
    fontSize: '1.7rem',
    fontWeight: 'bold',
    color: '#D1DFDF',
    margin: '0 0 3rem 0'
  },


  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '350px',
    margin: '0 auto'
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#D1DFDF',
    marginBottom: '0.5rem'
  },

  input: {
    width: '60%',
    height: '30px',
    padding: '0.75rem',
    border: '1px solid #a7a7a7ff',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box'
  },

  uploadButton: {
    width: '100%',
    backgroundColor: '#fbfbfeff',
    color: 'black',
    fontWeight: '600',
    padding: '1rem 1.5rem',
    marginTop: '0.5rem',
    border: 'none',
    borderRadius: '30px',
    boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.1), 2px 2px 5px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '1.2rem'
  },

  uploadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'Black',
    marginBottom: '1.5rem'
  
  },

  //for 2nd page 

  mainContent1: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 80px)'
  },

  card1: {
    backgroundColor: '#515266ff',
    backdropFilter: 'blur(10px)',
    borderRadius: '30px',
    boxShadow: '0 -4px 100px rgba(0, 0, 0, 0.1), 0 -1px 3px rgba(0, 0, 0, 0.08)',
    padding: '2rem',
    width: '100%',
    maxWidth: '1000px'
  },

  cardContent1: {
    textAlign: 'center'
  },


  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#D1DFDF',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },

  fileCounter: {
    fontSize: '14px',
    color: '#D1DFDF'
  },

  uploadTitle: {
    marginBottom: '1.5rem'
  },

  uploadArea: {
    position: 'relative',
    border: '2px dashed #25344F',
    backgroundColor: '#fbfbfeff',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center',
    transition: 'all 0.2s',
    cursor: 'pointer',
    marginBottom: '1rem'
  },

  uploadAreaActive: {
    borderColor: '#64748b',
    backgroundColor: '#f8fafc'
  },

  uploadAreaDisabled: {
    opacity: '0.5',
    pointerEvents: 'none'
  },

  fileInput: {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    opacity: '0',
    cursor: 'pointer'
  },

  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },

  uploadIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  uploadText: {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: '#374151',
    margin: '0'
  },

  uploadSubtext: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0.25rem 0 0 0'
  },

  chooseButton: {
    backgroundColor: '#64748b',
    color: 'white',
    padding: '0.5rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },

  chooseButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },

  progressIndicator: {
    textAlign: 'center',
    marginBottom: '1.5rem'
  },

  progressText: {
    fontSize: '14px',
    color: '#D1DFDF'
  },

  filesSection: {
    marginBottom: '1.5rem'
  },

  filesTitle: {
    fontWeight: '600',
    color: '#D1DFDF',
    margin: '0 0 0.75rem 0',
    textAlign: 'left'
  },

  fileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#dde1e9ff',
    border: '1px solid #404a5eff',
    borderRadius: 24,
    marginBottom: '0.35rem'
  },

  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },

  fileName: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#000000',
    margin: '0'
  },

  fileSize: {
    fontSize: '10px',
    color: '#030303ff',
    margin: '0'
  },

  removeButton: {
    color: '#040404ff',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    transition: 'color 0.2s'
  },

  generateSection: {
    paddingTop: '1rem'
  },

  generateButton: {
    width: '100%',
    backgroundColor: '#D1DFDF',
    color: 'Black',
    fontSize:'20px',
    fontWeight: '600',
    padding: '1.00rem 1.5rem',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },

  processingOverlay: {
    position: 'fixed',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 2000
  },

  processingBox: {
    backgroundColor: 'white',
    padding: '1rem 1.25rem',
    borderRadius: 8,
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
  },

  spinner: {
    width: 18,
    height: 18,
    border: '3px solid #ddd',
    borderTop: '3px solid #0A2540',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  toolsMenu: {
  position: "relative",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  marginLeft: "1rem",
  color: "Black"
},
};

export default FileUploadApp;

