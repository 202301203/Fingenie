import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, History, Settings, Wrench, TrendingUp, Search, Activity, BookOpen, Cpu, GitCompare } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
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
        fontFamily: '"Bricolage Grotesque", sans-serif',
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
        width: '85%',
        background: `
    radial-gradient(
      circle at top right,
      rgba(255, 255, 146, 0.45) 0%,
      rgba(255, 255, 255, 0.15) 35%,
      rgba(255, 255, 255, 0) 70%
    ),
    #d9dfb766
  `,
        borderRadius: '15px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        padding: '40px',
        marginBottom: '50px',
        border: '1px solid #222222ff',
    },


    contentCard2: {
        width: '85%',
        backgroundColor: '#34252533',
        borderRadius: '15px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        padding: '40px',
        marginBottom: '50px',
        border: '1px solid #222222ff',
    },
    // Word of the Day Section
    wordTitle: {
        fontSize: '2em',
        fontWeight: '800',
        color: COLORS.PrimaryText,
        marginBottom: '2px',
    },
    wordText: {
        fontSize: '2.4em',
        fontWeight: 'bold',
        color: COLORS.PrimaryText,
        marginBottom: '20px',
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
        fontSize: '1.5em',
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


// --- MAIN QUIZ APPLICATION COMPONENT ---
export default function QuizPage() {
    const navigate = useNavigate(); // FIX 1: Define useNavigate hook
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);
    const [errorMsg, setErrorMsg] = useState(''); // New state for error message
    // FIX 2 & 3: Define state for dropdown menus
    const location = useLocation();


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
            <Header />
            <div style={styles.mainContent}>

                {/* --- 1. WORD OF THE DAY BLOCK (New Separate Block) --- */}
                <div style={styles.contentCard1}>
                    <div style={styles.wordSection}>
                        <h1 style={styles.wordTitle}>Word of the Day</h1>
                        <h2 style={styles.wordText}>{data.term}</h2>
                        <p style={styles.dateHeader}>{data.date}</p>
                        {/* Added a separator to mimic the original look */}
                        <hr style={{ borderTop: `1px solid ${COLORS.Border}`, margin: '20px 0' }} />
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

                            <hr style={{ borderTop: `1px dashed ${COLORS.Border}`, margin: '15px 0' }} />

                            <p style={styles.explanationTitle}>The Correct Answer Was: <span style={{ fontWeight: 'normal' }}>{data.correct_answer}</span></p>
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