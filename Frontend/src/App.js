import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, ArrowLeft, User, History, Settings, LogOut } from 'lucide-react';
import './App.css';

const FileUploadApp = () => {
  const [currentPage, setCurrentPage] = useState('first'); // 'first' or 'upload'
  const [numberOfFiles, setNumberOfFiles] = useState(2);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Handle file input change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  };

  // Process uploaded files
  const handleFiles = (files) => {
    const excelFiles = files.filter(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );

    if (excelFiles.length === 0) {
      alert('Please upload only Excel files (.xlsx or .xls)');
      return;
    }

    const newFiles = excelFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      file: file,
      uploaded: true
    }));

    setUploadedFiles(prev => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, numberOfFiles); // Limit to specified number
    });
  };

  // Remove uploaded file
  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  // Navigate to upload page
  const goToUpload = () => {
    if (numberOfFiles < 2 || numberOfFiles > 4) {
      alert('Please enter a number between 1 and 4');
      return;
    }
    setCurrentPage('upload');
  };

  // Go back to first page
  const goBack = () => {
    setCurrentPage('first');
    setUploadedFiles([]);
  };

  // Header component
  const Header = () => (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <div style={styles.logo}>
            <img src="image.png" style={{ height: "50px", width: "auto" }} />

        </div>
        
      </div>
      <nav style={styles.nav}>
        <span style={styles.navLink}>Chatbot</span>
        <span style={styles.navLink}>Blog page</span>
        <div 
          style={styles.userMenu}
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <User size={24} style={styles.userIcon} />
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

  // First page - Number input
  if (currentPage === 'first') {
    return (
      <div style={styles.container}>
        <Header />
        
        <div style={styles.mainContent}>
          <div style={styles.card}>
            <div style={styles.cardContent}>
              <div style={styles.iconContainer}>
                <FileText size={32} color="white" />
              </div>
              
              <h1 style={styles.title}>
                Excel File Upload
              </h1>
              
              <p style={styles.description}>
                Please enter the number of Excel sheets you want to upload to generate a simplified financial report.
              </p>
              
              <div style={styles.formSection}>
                <div>
                  <label style={styles.label}>
                    Number of files (2-4):
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="4"
                    value={numberOfFiles}
                    onChange={(e) => setNumberOfFiles(parseInt(e.target.value) || 2)}
                    style={styles.input}
                    placeholder="Enter number (2-4)"
                  />
                </div>
                
                <button
                  onClick={goToUpload}
                  style={styles.uploadButton}
                >
                  <Upload size={20} />
                  <span>Upload Files</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload page
  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.mainContent}>
        <div style={{...styles.card, maxWidth: '800px'}}>
          <div style={styles.cardContent}>
            <div style={styles.uploadHeader}>
              <button
                onClick={goBack}
                style={styles.backButton}
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
              
              <div style={styles.fileCounter}>
                Upload {numberOfFiles} file{numberOfFiles > 2 ? 's' : ''}
              </div>
            </div>
            
            <div style={styles.uploadTitle}>
              <h1 style={styles.title}>
                Upload Your Excel Files
              </h1>
              <p style={styles.description}>
                Drag & drop your Excel files here or click to browse
              </p>
            </div>

            {/* Upload Area */}
            <div
              style={{
                ...styles.uploadArea,
                ...(dragActive ? styles.uploadAreaActive : {}),
                ...(uploadedFiles.length >= numberOfFiles ? styles.uploadAreaDisabled : {})
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={styles.fileInput}
                disabled={uploadedFiles.length >= numberOfFiles}
              />
              
              <div style={styles.uploadContent}>
                <div style={styles.uploadIcon}>
                  <Upload size={32} color="#64748b" />
                </div>
                
                <div>
                  <p style={styles.uploadText}>
                    Drag & drop files
                  </p>
                  <p style={styles.uploadSubtext}>
                    Only .xlsx files supported
                  </p>
                </div>
                
                <button
                  type="button"
                  style={{
                    ...styles.chooseButton,
                    ...(uploadedFiles.length >= numberOfFiles ? styles.chooseButtonDisabled : {})
                  }}
                  disabled={uploadedFiles.length >= numberOfFiles}
                >
                  Choose Files
                </button>
              </div>
            </div>

            {/* Progress indicator */}
            <div style={styles.progressIndicator}>
              <div style={styles.progressText}>
                {uploadedFiles.length} of {numberOfFiles} files uploaded
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div style={styles.filesSection}>
                <h3 style={styles.filesTitle}>Uploaded Files:</h3>
                {uploadedFiles.map((file) => (
                  <div key={file.id} style={styles.fileItem}>
                    <div style={styles.fileInfo}>
                      <CheckCircle size={20} color="#10b981" />
                      <div>
                        <p style={styles.fileName}>{file.name}</p>
                        <p style={styles.fileSize}>{file.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Generate Report Button */}
            {uploadedFiles.length === numberOfFiles && (
              <div style={styles.generateSection}>
                <button style={styles.generateButton}>
                  Generate Financial Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #9DAAC6 0%, #9DAAC6 50%, #9DAAC6 100%)',
    fontFamily: '"Bricolage Grotesque", Arial, sans-serif'
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#9DAAC6',
    color: 'white'
  },
  
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  
  logo: {
    width: '32px',
    height: '32px',
    backgroundColor: 'white',
    borderRadius: '4px',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  
  brandName: {
    fontWeight: '600'
  },
  
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  
  navLink: {
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  
  userMenu: {
    position: 'relative',
    cursor: 'pointer'
  },
  
  userIcon: {
    transition: 'color 0.2s'
  },
  
  dropdown: {
    position: 'absolute',
    right: '0',
    top: '32px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
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
    padding: '1rem'
  },
  
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px'
  },
  
  cardContent: {
    textAlign: 'center'
  },
  
  iconContainer: {
    width: '64px',
    height: '64px',
    backgroundColor: '#3C507D',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem'
  },
  
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0 0 1rem 0'
  },
  
  description: {
    color: '#64748b',
    lineHeight: '1.6',
    margin: '0 0 1.5rem 0'
  },
  
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  
  input: {
    width: '60%',
    height: '30px',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box'
  },
  
  uploadButton: {
    width: '100%',
    backgroundColor: '#3C507D',
    color: 'white',
    fontWeight: '600',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  
  uploadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#64748b',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  
  fileCounter: {
    fontSize: '14px',
    color: '#64748b'
  },
  
  uploadTitle: {
    marginBottom: '1.5rem'
  },
  
  uploadArea: {
    position: 'relative',
    border: '2px dashed #d1d5db',
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
    backgroundColor: '#f1f5f9',
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
    color: '#64748b'
  },
  
  filesSection: {
    marginBottom: '1.5rem'
  },
  
  filesTitle: {
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 0.75rem 0',
    textAlign: 'left'
  },
  
  fileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#9DAAC6',
    border: '1px solid #404a5eff',
    borderRadius: '8px',
    marginBottom: '0.75rem'
  },
  
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  
  fileName: {
    fontWeight: '500',
    color: '#000000',
    margin: '0'
  },
  
  fileSize: {
    fontSize: '14px',
    color: '#3C507D',
    margin: '0'
  },
  
  removeButton: {
    color: '#3C507D',
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
    backgroundColor: '#3C507D',
    color: 'white',
    fontWeight: '600',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default FileUploadApp;
