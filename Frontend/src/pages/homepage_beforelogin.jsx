import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, TrendingUp, Search, BookOpen,  User,  Activity, Cpu, GitCompare, History, Settings, LogOut, Wrench} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import fglogo_Wbg from '../images/fglogo_Wbg.png';
const styles = {
container: {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse 80% 60% at bottom, #e0f2f1 0%, #b2dfdb 40%, #f8f8f8 70%)',
  fontFamily: '"Bricolage Grotesque", sans-serif',
},


    header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 2rem',
    backgroundColor: '#ffffff',
    border: '1px solid #000000ff',
    borderRadius: '8px',

    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logo: {
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    fontSize: '15px',
    color: '#37474f',
    textDecoration: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
  },
  mainContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '80px 24px',
  },
  glassSlab: {
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    borderRadius: '28px',
    border: '1px solid #1c1c1c66',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
    padding: '60px 80px 80px',
    maxWidth: '800px',
    width: '100%',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    background: '#fff9c4',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#795548',
  },
  headline: {
    fontSize: '56px',
    fontWeight: '700',
    color: '#0A2540',
    lineHeight: '1.2',
    marginBottom: '24px',
    fontFamily: 'serif',
  },
  subtext: {
    fontSize: '18px',
    color: '#546e7a',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto 40px',
    fontWeight: '400',
  },
  ctaButton: {
    background: '#0A2540',
    color: '#ffffff',
    padding: '16px 48px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(26, 35, 126, 0.3)',
    transition: 'all 0.3s ease',
    marginBottom: '16px',
  },
  signupButton: {
    background: '#3e555fff',
    color: '#ffffff',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(26, 35, 126, 0.3)',
    transition: 'all 0.3s ease',
    marginBottom: '16px',
  },
  exploreLink: {
    display: 'block',
    fontSize: '14px',
    color: '#78909c',
    textDecoration: 'none',
    marginTop: '16px',
    cursor: 'pointer',
  },
};

export default function FinGenieLanding() {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const handleButtonHover = (e) => {
    e.target.style.transform = 'translateY(-2px)';
    e.target.style.boxShadow = '0 6px 20px rgba(26, 35, 126, 0.4)';
  };

  const handleButtonLeave = (e) => {
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 4px 16px rgba(26, 35, 126, 0.3)';
  };

  const handleLinkHover = (e) => {
    e.target.style.color = '#1a237e';
  };

  const handleLinkLeave = (e) => {
    e.target.style.color = '#37474f';
  };
  const Header = () => (
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
        <span style={styles.navLink}>News</span>
        <span style={styles.navLink}>About us</span>
        <button
              onClick={() => navigate("/AuthFlow")}
              style={styles.signupButton}
            >

            Sign up
          </button>
      </nav>
    </header>
  );
  return (
    <div style={styles.container}>
      <Header />

      <main style={styles.mainContent}>
        <div style={styles.glassSlab}>
          <div style={styles.badge}>Modern financial intelligence</div>
          
          <h1 style={styles.headline}>
            Analyze any company in minutes using FinGenie
          </h1>
          
          <p style={styles.subtext}>
            Fingenie brings summaries, debt ratings, KPIs, market trends, and news 
            together so you spend less time researching and more time deciding.
          </p>
          
           <button
              onClick={() => navigate("/AuthFlow")}
              style={styles.ctaButton}
            >

            Get Started
          </button>
          
          <a style={styles.exploreLink}>Explore all tools →</a>
        </div>
      </main>
    </div>
  );
}