import React, { useState } from 'react';
import { useNavigate} from "react-router-dom";
import {
  Key, LogIn, Code, Copy, Lock,
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
} from 'lucide-react'
import fglogo_Wbg from '../images/fglogo_Wbg.png';

// --- STYLES FOR CONSISTENCY ---
const COLORS = {
    PageBackground: '#f3f1f1ff', 
    CardBackground: '#FFFFFF', 
    PrimaryText: '#151515ff', 
    SecondaryText: '#777777', 
    Accent: '#515266', 
    TextLight: '#ffffff',
};

const styles = {
    // Shared Styles
    appWrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: COLORS.PageBackground,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    },
    contentArea: {
        flexGrow: 1, // Allow content to take up remaining space
        maxWidth: '1200px',
        margin: '50px auto',
        padding: '30px',
        backgroundColor: COLORS.CardBackground,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        // Ensures content is centered but respects the page padding
        width: 'calc(100% - 40px)', 
        boxSizing: 'border-box',
    },
    title: {
        color: COLORS.Accent,
        fontSize: '2.5rem',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    // ... (rest of the styles object for sectionTitle, paragraph, linkBox, stepList, etc.)
    sectionTitle: {
        color: COLORS.PrimaryText,
        fontSize: '1.5rem',
        marginTop: '30px',
        marginBottom: '15px',
        borderBottom: `2px solid ${COLORS.PageBackground}`,
        paddingBottom: '5px',
    },
    paragraph: {
        color: COLORS.PrimaryText,
        lineHeight: '1.6',
        marginBottom: '15px',
    },
    linkBox: {
        backgroundColor: '#e6f0ff',
        border: `1px solid ${COLORS.Accent}`,
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'center',
        margin: '20px 0',
    },
    externalLink: {
        color: COLORS.Accent,
        fontSize: '1.1rem',
        fontWeight: 'bold',
        textDecoration: 'none',
        wordBreak: 'break-all',
    },
    stepList: {
        listStyle: 'none',
        padding: 0,
    },
    stepItem: {
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: COLORS.PageBackground,
        borderRadius: '8px',
    },
    stepIcon: {
        marginRight: '15px',
        color: COLORS.Accent,
        flexShrink: 0,
        fontSize: '1.2rem',
        fontWeight: 'bold',
        paddingTop: '3px',
    },
    securityAlert: {
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#ffdddd',
        borderLeft: `5px solid #cc0000`,
        borderRadius: '4px',
        color: '#cc0000',
        fontWeight: 'bold',
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

};
// ---------------------------------------------------------------------------

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

// MAIN PAGE COMPONENT
const APIKeyPage = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
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
                    <Key size={40} /> How to Get Your Free Gemini API Key
                </h1>
                
                <p style={styles.paragraph}>
                    As FinGenie utilizes the power of Generative AI, you will need a valid Gemini API Key to enable its LLM features (like the AI summary Generator, See the Trends & KPIs and Compare the Companies sector...). Google offers a generous Free Tier suitable for development and personal projects.
                </p>

                <h2 style={styles.sectionTitle}>Official API Key Link</h2>
                <p style={styles.paragraph}>
                    The API Key must be generated through the official Google AI Studio developer console:
                </p>
                
                <div style={styles.linkBox}>
                    <p style={{marginBottom: '5px', color: COLORS.SecondaryText}}>
                        Click the link below to go to the key creation page:
                    </p>
                    <a 
                        href="https://ai.google.dev/gemini-api/docs/api-key" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.externalLink}
                    >
                        https://ai.google.dev/gemini-api/docs/api-key
                    </a>
                </div>

                <h2 style={styles.sectionTitle}>Step-by-Step Instructions</h2>
                <ol style={styles.stepList}>
                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>1. <LogIn /></div>
                        <div>
                            <span style={{fontWeight: 'bold', color: COLORS.Accent}}>Sign In:</span> Use your Google Account to sign in to the Google AI Studio page. Accept any required Terms of Service if prompted.
                        </div>
                    </li>
                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>2. <Code /></div>
                        <div>
                            <span style={{fontWeight: 'bold', color: COLORS.Accent}}>Find the Creation Button:</span> On the dashboard, look for the "Create API Key" button (or navigate to the "API Keys" section).
                        </div>
                    </li>
                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>3. <Key /></div>
                        <div>
                            <span style={{fontWeight: 'bold', color: COLORS.Accent}}>Generate the Key:</span> Click the button. You may be asked to select or create a Google Cloud Project. Once done, your unique API key will be generated instantly.
                        </div>
                    </li>
                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>4. <Copy /></div>
                        <div>
                            <span style={{fontWeight: 'bold', color: COLORS.Accent}}>Copy and Save:</span> The full key will be displayed. Copy the key immediately and store it in a secure location. You will not be able to view the full key again.
                        </div>
                    </li>
                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>5. <Lock /></div>
                        <div>
                            <span style={{fontWeight: 'bold', color: COLORS.Accent}}>Configuration:</span> Provide this key to the FinGenie application to enable all AI related features.
                        </div>
                    </li>
                </ol>

                <div style={styles.securityAlert}>
                    ⚠️ SECURITY WARNING: Treat your API Key like a password. Do not share it publicly.
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default APIKeyPage;