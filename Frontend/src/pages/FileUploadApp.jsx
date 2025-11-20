import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  ArrowLeft,
  Key
} from 'lucide-react';
import '../App.css';
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import UploadImage from '../images/uploadimage_Wbg.png';
import { useNavigate, useLocation } from "react-router-dom";
import api from '../api';
import Header from "../components/Header";
import Footer from "../components/Footer";
const FileUploadApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showApiPopup, setShowApiPopup] = useState(false);

  const [currentPage, setCurrentPage] = useState('first');
  const [numberOfFiles, setNumberOfFiles] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [apiKey, setApiKey] = useState('');

  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      setUploadedFiles([
        {
          id: Date.now(),
          name: validFiles[0].name,
          size: (validFiles[0].size / 1024 / 1024).toFixed(1) + " MB",
          file: validFiles[0],
          uploaded: true
        }
      ]);
    }
  };


  const removeFile = (id) => setUploadedFiles(prev => prev.filter(file => file.id !== id));
  const goToUpload = () => {
    if (numberOfFiles < 1 || numberOfFiles > 4) return alert('Please enter a number between 1 and 4');


    if (!apiKey.trim()) {
      setShowApiPopup(true);
      return;
    }


    setCurrentPage('upload');
  };
  const goBack = () => {
    setCurrentPage('first');
    setUploadedFiles([]);
    setApiKey('');
    setShowApiKeyInput(false);
  };



  if (currentPage === 'first') {
    return (
      <div style={styles.container}>
        <Header />
        {showApiPopup && (
          <div style={popupStyles.overlay}>
            <div style={popupStyles.box}>
              <h3 style={{ marginBottom: '10px' }}>Missing API Key</h3>
              <p>Please enter your API key to continue.</p>

              <button
                onClick={() => setShowApiPopup(false)}
                style={popupStyles.button}
              >
                Okay
              </button>
            </div>
          </div>
        )}
        <div style={styles.mainContent}>
          <div style={styles.card}>
            <div style={styles.cardContent}>
              <div style={styles.iconContainer}><FileText size={32} color="white" /></div>
              <h1 style={styles.title}>Upload the BALANCE SHEET here to generate a simplified financial report.</h1>
              {/* API Key Toggle */}
              <div style={{
                  margin: '1rem 10rem',
                  textAlign: 'left',
                  padding: '1rem', // Added padding and background for better appearance
                  backgroundColor: '#a6b1caff',
                  borderRadius: '12px',
                  border: '1px solid #9ea8b8',
                  width: '90%',
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
                      Enter API Key
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
                      How to get API key? 
                    </button>
                  </div>

                  {/* Input Field */}
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste API key here"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #a7a7a7',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              <div style={styles.formSection}>

                
                
                {/* Number of Files Input */}
                <button onClick={goToUpload} style={styles.uploadButton}>Upload Files</button>
              </div>
            </div>
          </div>
          <div style={styles.aiWarning}>
            <strong>Note:</strong> AI-generated summaries may contain inaccuracies. Always cross-verify with original documents.
          </div>
        </div>
        <Footer />
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
                <div style={styles.fileCounter}>Upload 1 file (required)</div>
              </div>

              {/* API Key Input Section */}
              {showApiKeyInput && (
                <div style={styles.apiKeySectionUpload}>
                  <div style={styles.apiKeyHeader}>
                    <Key size={20} />
                    <span>Custom API Key</span>
                  </div>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your API key here for enhanced processing"
                    style={styles.apiKeyInputUpload}
                  />
                  <p style={styles.apiKeyNote}>
                    Your API key will be used for this processing session only
                  </p>
                </div>
              )}

              <div style={styles.uploadTitle}><h1 style={styles.title}>Upload Your Files</h1></div>

              {/* Upload Area */}
              <div style={{ ...styles.uploadArea, ...(dragActive ? styles.uploadAreaActive : {}), ...(uploadedFiles.length == 1 || isProcessing ? styles.uploadAreaDisabled : {}) }}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <input type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={handleFileChange} style={styles.fileInput} />


                <div style={styles.uploadContent}>
                  <div style={styles.uploadIcon}><img src={UploadImage} alt="Upload Icon" style={{ width: '80px', height: '70px' }} /></div>
                  <div>
                    <p style={styles.uploadText}>Drag & drop files</p>
                    <p style={styles.uploadSubtext}>Only .xlsx/.xls/.csv/.pdf files supported (Max {MAX_FILE_SIZE_MB}MB per file)</p>
                  </div>
                  <button type="button" style={{ ...styles.chooseButton, ...(uploadedFiles.length >= 1 || isProcessing ? styles.chooseButtonDisabled : {}) }} disabled={uploadedFiles.length >= 1 || isProcessing}>Choose Files</button>
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
              {uploadedFiles.length === 1 && (
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

                        // Add API key mandatory check
                        if (!apiKey.trim()) {
                          alert("Please enter your API key before generating the report.");
                          setIsProcessing(false);
                          return;
                        }

                        formData.append("api_key", apiKey.trim());

                        const json = await api.postExtract(formData);

                        if (json?.report_id) localStorage.setItem('currentReportId', json.report_id);

                        // Store API key in localStorage if provided
                        if (apiKey?.trim()) {
                          localStorage.setItem('userApiKey', apiKey.trim());
                          localStorage.setItem('groq_api_key', apiKey.trim());
                        } else if (json?.api_key) {
                          localStorage.setItem('userApiKey', json.api_key);
                          localStorage.setItem('groq_api_key', json.api_key);
                        }

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
        <Footer />
      </div>
    );
  }

  return null;
};

// CSS Styles - Add these new styles to your existing styles object
const styles = {
  // ... your existing styles remain the same ...

  // New API Key styles
  apiKeySection: {
    width: '100%',
    marginBottom: '1rem',
  },

  apiKeyToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    border: '1px solid #515266',
    color: '#515266',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    width: '100%',
    justifyContent: 'center',
  },

  apiKeyInputContainer: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
  },

  apiKeyLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#495057',
    marginBottom: '0.5rem',
  },

  apiKeyInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },

  apiKeyHelp: {
    fontSize: '12px',
    color: '#6c757d',
    margin: '0.5rem 0 0 0',
    fontStyle: 'italic',
  },

  apiKeySectionUpload: {
    margin: '1rem 0',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    textAlign: 'left',
  },

  apiKeyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '0.5rem',
    fontSize: '14px',
  },

  apiKeyInputUpload: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    marginBottom: '0.5rem',
  },

  apiKeyNote: {
    fontSize: '12px',
    color: '#6c757d',
    margin: '0',
    fontStyle: 'italic',
  },

  container: {
    minHeight: '100vh',
    background: '#f8f8f8',
    fontFamily: '"Bricolage Grotesque", Arial, sans-serif'
  },


  mainContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(110vh - 80px)',
    //marginTop: '-70px'
    flexDirection: 'column',
  },

  card: {
    background: "linear-gradient(135deg, #CAD3E7, #a6b1caff)",

    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    boxShadow: '0 -4px 10px rgba(255, 255, 255, 0.1), 0 -1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #191919ff',
    padding: '2rem',
    width: '70%',
    maxWidth: '1300px'
  },

  cardContent: {
    display: 'flex',          // ⭐ required
    flexDirection: 'column',  // so inputs stack vertically
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
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
    color: '#212121ff',
    margin: '0 0 2rem 0'
  },


  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '30%',
    margin: '0 auto'
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#474747ff',
    marginBottom: '0.5rem'
  },

  input: {
    width: '50%',
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
    backgroundColor: '#515266',
    color: 'white',
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
  aiWarning: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeeba',
    borderRadius: '8px',
    color: '#856404',
    fontSize: '14px'
  },


  //for 2nd page 

  mainContent1: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 80px)'
  },

  card1: {
    background: "linear-gradient(135deg, #CAD3E7, #a6b1caff)",

    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    boxShadow: '0 20px 100px rgba(0, 0, 0, 0.1), 0 -1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #191919ff',
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
    color: '#1e1e1eff',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },

  fileCounter: {
    fontSize: '14px',
    color: '#434343ff'
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
    borderRadius: '20%',
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
    color: '#131313ff',
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
    backgroundColor: '#25344F',
    color: 'white',
    fontSize: '20px',
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
const popupStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    backdropFilter: "blur(3px)"
  },
  box: {
    background: "white",
    padding: "1.5rem 2rem",
    borderRadius: "12px",
    textAlign: "center",
    width: "320px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    border: "1px solid #ddd"
  },
  button: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    background: "#25344F",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600"
  }
};

export default FileUploadApp;

