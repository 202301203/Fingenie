import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"; 
import { User, LogOut, History, Settings, Wrench, BarChart, TrendingUp, Search, Activity, BookOpen,Cpu,GitCompare,CheckCircle, XCircle, UploadCloud, FileText, ArrowLeft } from "lucide-react";
import fglogo_Wbg from '../images/fglogo_Wbg.png'; 

// --- COLOR DEFINITIONS (Consistent with previous successful versions) ---
const COLORS = {
//   PageBackground: '#F5F7FA', // Light gray background for the entire page
  CardBackground: '#FFFFFF',    // Pure white for the main content card
  PrimaryText: '#333333',     // Dark gray for most text
  SecondaryText: '#777777',   // Medium gray for labels/secondary info
  Accent: '#9A8C98',         // Muted purple/gray for interactive elements/borders
  AccentDark: '#7C6B7B',      // Darker accent for hover states
  Success: '#10B981',        // Green for correct answers
  Error: '#EF4444',          // Red for incorrect answers
  Border: '#000000ff',          // Light gray for borders
  

};

// --- DUMMY DATA (Mimics the backend output) ---
const mockQuizData = {
    date: "2025-11-05",
    term: "Debt-to-Equity Ratio",
    explanation: "The Debt-to-Equity (D/E) ratio is a financial metric showing how much debt a company uses to finance its assets compared to the value of shareholders' equity. It helps assess a company's financial leverage and solvency. A higher ratio often indicates greater reliance on debt funding, which can mean higher risk, while a lower ratio suggests more equity financing. Investors use it to evaluate risk.",
    question: "What does a high Debt-to-Equity ratio typically indicate for a company?",
    options: [
        "The company has very low financial risk.",
        "The company relies more on equity financing than debt.",
        "The company relies more on debt financing than equity.",
        "The company is guaranteed to be profitable."
    ],
    correct_answer: "The company relies more on debt financing than equity.",
    answer_explanation: "A high Debt-to-Equity ratio means a company uses a large proportion of debt compared to equity to finance its operations, indicating higher financial leverage and potentially higher risk."
};

// --- STYLES DEFINITION ---
const styles = {
    appWrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: COLORS.PageBackground, 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    
     // --- HEADER STYLES ---
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
    

    // --- QUIZ CONTENT LAYOUT (MODIFIED FOR SEPARATE BLOCKS) ---
    mainContent: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column', // Stack the cards vertically
        justifyContent: 'center',
        alignItems: 'center', // Center the stack of cards
        padding: '40px 20px',
    },
    // Renamed from quizCard to contentCard and added marginBottom
    contentCard1: {
        width: '100%',
        maxWidth: '1200px',
        backgroundColor: '#d9dfb766',
        borderRadius: '24px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        padding: '40px',
        marginBottom: '20px', // Spacing between the two cards
    },

    contentCard2: {
        width: '100%',
        maxWidth: '1200px',
        backgroundColor: '#34252533',
        borderRadius: '24px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        padding: '40px',
        marginBottom: '20px', // Spacing between the two cards
    },
    // Word of the Day Section
    wordTitle: {
        fontSize: '2.5em',
        fontWeight: '900',
        color: COLORS.PrimaryText,
        marginBottom: '5px',
    },
    dateHeader: {
        fontSize: '1em',
        color: COLORS.SecondaryText,
        marginBottom: '20px',
        fontWeight: '500',
    },
    explanationText: {
        fontSize: '1.1em',
        lineHeight: '1.6',
        color: COLORS.PrimaryText,
        padding: '0', // Removed internal padding
        borderTop: `none`, // Removed internal border
        marginBottom: '0', // Removed internal margin
    },
    // Quiz Section (Modified to remove internal separators)
    quizSection: {
        marginTop: '0px',
        paddingTop: '0px',
        borderTop: `none`,
    },
    questionText: {
        fontSize: '1.3em',
        fontWeight: 'bold',
        color: COLORS.PrimaryText,
        marginBottom: '20px',
    },
    optionItem: {
        padding: '15px',
        margin: '10px 0',
        borderRadius: '8px',
        border: `2px solid ${COLORS.Border}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: COLORS.CardBackground,
    },
    optionItemHover: {
        borderColor: COLORS.AccentDark,
    },
    optionItemSelected: {
        borderColor: COLORS.AccentDark,
        // backgroundColor: COLORS.AccentDark + '10', // Light accent background
        backgroundColor: '#00000033',
    },
    // Submit Button
    submitButton: {
        marginTop: '30px',
        padding: '12px 30px',
        backgroundColor: COLORS.Accent,
        color: COLORS.TextLight,
        border: 'none',
        borderRadius: '8px',
        fontSize: '1.1em',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    submitButtonHover: {
        backgroundColor: COLORS.AccentDark,
    },
    // Result/Explanation Area
    resultArea: {
        marginTop: '30px',
        padding: '20px',
        borderRadius: '8px',
        borderLeft: `5px solid ${COLORS.Success}`,
        backgroundColor: '#F0FFF4', // Light green background
    },
    resultCorrect: {
        borderLeftColor: COLORS.Success,
        backgroundColor: '#F0FFF4',
    },
    resultIncorrect: {
        borderLeftColor: COLORS.Error,
        backgroundColor: '#FFF0F0', // Light red background
    },
    resultStatus: {
        fontWeight: 'bold',
        marginBottom: '10px',
        fontSize: '1.2em',
    },
    explanationTitle: {
        fontWeight: 'bold',
        marginTop: '15px',
        marginBottom: '5px',
        color: COLORS.PrimaryText,
    },
    explanationBody: {
        fontSize: '1em',
        lineHeight: '1.5',
        color: COLORS.SecondaryText,
    },
    // Option Item highlighting after submission
    correctOption: {
        border: `2px solid ${COLORS.Success}`,
        backgroundColor: COLORS.Success + '20',
        fontWeight: 'bold',
    },
    incorrectOption: {
        border: `2px solid ${COLORS.Error}`,
        backgroundColor: COLORS.Error + '20',
        color: COLORS.Error,
    },

    // New style for the error message
    errorMessage: {
        color: COLORS.Error,
        fontWeight: '600',
        marginTop: '10px',
        fontSize: '0.95em',
        padding: '8px 15px',
        backgroundColor: COLORS.Error + '15', // Very light red background
        borderRadius: '6px',
        border: `1px solid ${COLORS.Error}`,
    }
};
 
// --- Header component (Updated to accept props) ---
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
// --- MAIN QUIZ APPLICATION COMPONENT ---
export default function QuizPage() {
    const navigate = useNavigate(); // FIX 1: Define useNavigate hook
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);
    const [errorMsg, setErrorMsg] = useState(''); // New state for error message
    // FIX 2 & 3: Define state for dropdown menus
    const [showDropdown, setShowDropdown] = useState(false); 
    const [showToolsDropdown, setShowToolsDropdown] = useState(false); 

    const data = mockQuizData; // Use mock data for now, replace with API fetch later
    
    const handleSubmit = () => {
        if (selectedOption !== null) {
            setIsSubmitted(true);
            setErrorMsg(''); // Clear error on successful submit
        } else {
            // Set the error message instead of using alert()
            setErrorMsg("⚠️ Please select an option before submitting the quiz.");
            // Optionally, clear the error after a few seconds
            setTimeout(() => setErrorMsg(''), 5000); 
        }
    };
    
    const handleReset = () => {
        setSelectedOption(null);
        setIsSubmitted(false);
        setHoveredOption(null);
        setErrorMsg(''); // Clear error on reset
    };
    
    // Clear error when an option is selected
    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        if (errorMsg) {
            setErrorMsg(''); 
        }
    };
    // --- Dynamic Style Handlers for Options ---
    const getOptionStyle = (option) => {
        let style = styles.optionItem;

        if (hoveredOption === option) {
            style = { ...style, ...styles.optionItemHover };
        }
        if (selectedOption === option) {
            style = { ...style, ...styles.optionItemSelected };
        }
        
        // Post-submission highlighting
        if (isSubmitted) {
            if (option === data.correct_answer) {
                style = { ...style, ...styles.correctOption };
            } else if (selectedOption === option) {
                style = { ...style, ...styles.incorrectOption };
            } else {
                // Ensure non-selected incorrect options are de-emphasized
                style = { ...style, borderColor: COLORS.Border };
            }
        }

        return style;
    };

    // --- Result Block Style ---
    const getResultStyle = () => {
        if (!isSubmitted) return {};
        const isCorrect = selectedOption === data.correct_answer;
        return isCorrect ? styles.resultCorrect : styles.resultIncorrect;
    };


    return (
        <div style={styles.appWrapper}>
            <Header 
              navigate={navigate} // Pass navigate
              showDropdown={showDropdown} // Pass state
              setShowDropdown={setShowDropdown} // Pass setter
              showToolsDropdown={showToolsDropdown} // Pass state
              setShowToolsDropdown={setShowToolsDropdown} // Pass setter
            />
            <div style={styles.mainContent}>
                
                {/* --- 1. WORD OF THE DAY BLOCK (New Separate Block) --- */}
                <div style={styles.contentCard1}>
                    <div style={styles.wordSection}>
                        <h1 style={styles.wordTitle}>Word of the Day</h1>
                        <h2 style={styles.questionText}>{data.term}</h2>
                        <p style={styles.dateHeader}>{data.date}</p>
                        {/* Added a separator to mimic the original look */}
                        <hr style={{borderTop: `1px solid ${COLORS.Border}`, margin: '20px 0'}}/> 
                        <p style={styles.explanationText}>{data.explanation}</p>
                    </div>
                </div>

                {/* --- 2. QUIZ BLOCK (New Separate Block) --- */}
                <div style={styles.contentCard2}>
                    <div style={styles.quizSection}>
                        <h1 style={styles.wordTitle}>Quiz Time!</h1>
                        <h2 style={styles.questionText}>{data.question}</h2>
                        
                        {data.options.map((option, index) => (
                            <div
                                key={index}
                                style={getOptionStyle(option)}
                                onClick={() => !isSubmitted && handleOptionSelect(option)} // Updated to use handler
                                onMouseEnter={() => setHoveredOption(option)}
                                onMouseLeave={() => setHoveredOption(null)}
                            >
                                {option}
                            </div>
                        ))}

                        {/* Display Error Message here */}

                        {errorMsg && (
                            <p style={styles.errorMessage}>{errorMsg}</p>

                        )}

                        <div style={{ display: 'flex', gap: '15px' }}>
                             {!isSubmitted ? (
                                <button 
                                    style={{ ...styles.submitButton, ...((hoveredOption === 'submit') && styles.submitButtonHover) }}
                                    onClick={handleSubmit}
                                    onMouseEnter={() => setHoveredOption('submit')}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    Submit Answer
                                </button>
                            ) : (
                                <button 
                                    style={{ ...styles.submitButton, backgroundColor: COLORS.SecondaryText, ...((hoveredOption === 'reset') && styles.submitButtonHover) }}
                                    onClick={handleReset}
                                    onMouseEnter={() => setHoveredOption('reset')}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    Retry Quiz
                                </button>
                            )}
                        </div>
                    </div>

                    {/* --- Result and Explanation Section (Stays with the quiz block) --- */}
                    {isSubmitted && (
                        <div style={{ ...styles.resultArea, ...getResultStyle() }}>
                            <p style={{ ...styles.resultStatus, color: selectedOption === data.correct_answer ? COLORS.Success : COLORS.Error }}>
                                {selectedOption === data.correct_answer ? '✅ Correct Answer!' : '❌ Incorrect. Try Again!'}
                            </p>
                            
                            <hr style={{borderTop: `1px dashed ${COLORS.Border}`, margin: '15px 0'}}/>

                            <p style={styles.explanationTitle}>The Correct Answer Was: <span style={{fontWeight: 'normal'}}>{data.correct_answer}</span></p>
                            <p style={styles.explanationTitle}>Explanation:</p>
                            <p style={styles.explanationBody}>{data.answer_explanation}</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}