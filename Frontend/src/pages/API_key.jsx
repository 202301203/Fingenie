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
import Header from "../components/Header";
import Footer from "../components/Footer";
// --- STYLES FOR CONSISTENCY ---
const COLORS = {
    PageBackground: '#f3f1f1ff', 
    CardBackground: '#FFFFFF', 
    PrimaryText: '#151515ff', 
    SecondaryText: '#777777', 
    Accent: '#151625ff', 
    TextLight: '#ffffff',
};

const styles = {
    // Shared Styles
    appWrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: COLORS.PageBackground,
        fontFamily: '"Bricolage Grotesque", Arial, sans-serif',
    },
    contentArea: {
        flexGrow: 1, // Allow content to take up remaining space
        width: '100%',
        margin: '50px auto',
        padding: '30px',
        backgroundColor: COLORS.CardBackground,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        // Ensures content is centered but respects the page padding
        width: 'calc(100% - 40px)', 
        boxSizing: 'border-box',
        border: `1px solid #000000`,
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
    

};

const APIKeyPage = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);

    return (
        <div style={styles.appWrapper}>

            <Header />

            <div style={styles.contentArea}>

                <h1 style={styles.title}>
                    <Key size={40} /> How to Get Your Free Grok API Key
                </h1>

                <p style={styles.paragraph}>
                    FinGenie now supports the <strong>Grok API (xAI API)</strong> for all AI-powered features —
                    including summaries, KPI insights, trend analysis, and company comparisons.
                    To use these features, you must generate a valid <strong>Grok API Key</strong>.
                </p>

                {/* OFFICIAL LINK */}
                <h2 style={styles.sectionTitle}>Official API Key Page</h2>
                <p style={styles.paragraph}>
                    Create your API key from the official xAI (Grok) developer console here:
                </p>

                <div style={styles.linkBox}>
                    <p style={{marginBottom: "5px", color: COLORS.SecondaryText}}>
                        Click below to open the Grok API key dashboard:
                    </p>

                    <a 
                        href="https://console.x.ai/team/3604c4c2-9b59-4cd0-a150-b419d9555e52/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={styles.externalLink}
                    >
                        https://console.x.ai
                    </a>
                </div>

                {/* STEPS */}
                <h2 style={styles.sectionTitle}>Step-by-Step Instructions</h2>

                <ol style={styles.stepList}>

                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>
                            1.
                        </div>
                        <div>
                            <strong style={{color: COLORS.Accent}}>Sign In:</strong>
                            &nbsp;Go to the xAI console and sign in using your X (Twitter) account.
                            If you don’t have an account, you can create one for free.
                        </div>
                    </li>

                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>
                            2.
                        </div>
                        <div>
                            <strong style={{color: COLORS.Accent}}>Select “API Keys”:</strong>
                            &nbsp;Once logged in, open the left sidebar and click
                            <strong> “API Keys”</strong> to manage your credentials.
                        </div>
                    </li>

                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>
                            3.
                        </div>
                        <div>
                            <strong style={{color: COLORS.Accent}}>Click “Create API Key”:</strong>
                            &nbsp;Press the “Create Key” button. You may need to name the key and
                            optionally restrict usage.
                        </div>
                    </li>

                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>
                            4.
                        </div>
                        <div>
                            <strong style={{color: COLORS.Accent}}>Copy the Key:</strong>
                            &nbsp;Your Grok API key will appear once. Copy it immediately — 
                            you will NOT be able to view it again.
                        </div>
                    </li>

                    <li style={styles.stepItem}>
                        <div style={styles.stepIcon}>
                            5.
                        </div>
                        <div>
                            <strong style={{color: COLORS.Accent}}>Use It in FinGenie:</strong>
                            &nbsp;Paste the key in the API Key input box before uploading files 
                            to enable all AI-powered functions.
                        </div>
                    </li>

                </ol>

                {/* WARNING */}
                <div style={styles.securityAlert}>
                    ⚠️ SECURITY WARNING: Never share your Grok API key publicly. Treat it like a password.
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default APIKeyPage;
