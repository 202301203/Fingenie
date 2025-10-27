import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from "react-router-dom"; 
import PixelBlast from '../components/PixelBlast';
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import mainlogo from '../images/mainlogo.png';


// Floating Menu Component
const FloatingMenu = ({
  triggerText = 'Menu',
  items,
  className = '',
  triggerColor = '#181717ff',
  triggerBg = 'transparent',
  triggerStyle = {},
  ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useLayoutEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    

    
    if (isOpen) {
      cards.forEach((card, i) => {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
        }, i * 80);
      });
    } else {
      cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px) scale(0.95)';
      });
    }
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <>
      <button
        className={`menu-trigger ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        style={{ 
          ...triggerStyle,
          backgroundColor: triggerBg,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: triggerColor // Use prop for color
        }}
      >
        {triggerText}
        <span style={{
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'inline-block',
          fontSize: '14px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>↓</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '1rem',
          minWidth: '700px',
          zIndex: 1000
        }} ref={containerRef}>
          {(items || []).slice(0, 5).map((item, idx) => (
            // The entire card is now an anchor tag <a>
            <a
              key={`${item.label}-${idx}`}
              href={item.cardHref || item.links?.[0]?.href || '#'} // Use a new 'cardHref' or the first link's href
              ref={setCardRef(idx)}
              onClick={() => setIsOpen(false)} // Close menu on click
              style={{ 
                flex: 1,
                borderRadius: '1rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                opacity: 0,
                transform: 'translateY(20px) scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                minHeight: '180px',
                backgroundColor: item.bgColor, 
                color: item.textColor, 
                textDecoration: 'none', // Remove underline from anchor tag
                cursor: 'pointer' // Ensure cursor indicates clickability
              }}
            >
              <div style={{
                fontSize: '22px',
                fontWeight: '500',
                letterSpacing: '-0.5px'
              }}>{item.label}</div>
              <div style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                // Added a divider to visually separate the main link from sub-links
                borderTop: item.links?.length ? `1px solid ${item.textColor}44` : 'none',
                paddingTop: item.links?.length ? '1rem' : '0'
              }}>
                
                {item.links?.map((lnk, i) => (
                  <span 
                    key={`${lnk.label}-${i}`} 
                    
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      textDecoration: 'none',
                      color: 'inherit',
                      fontSize: '15px',
                      opacity: '0.7' // Reduced opacity for sub-links
                    }}
                  >
                    <ArrowUpRight size={16} style={{ flexShrink: 0 }} />
                    {lnk.label}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
};

// Main Component
export default function FingenieRippleLanding() {
  const navigate = useNavigate(); 
  const items = [
    {
      label: "AI Summary Generator",
      bgColor: "#4D5C61",
      textColor: "#fff",
      cardHref: "/ai-summary-page",
      links: [
        { label: "About Tool", ariaLabel: "About tool", href: "#company" },
        
      ]
    },
        {
      label: "Debt Ratings",
      bgColor: "#515266",
      textColor: "#fff",
      links: [
        { label: "About Tool", ariaLabel: "About tool", href: "#company" },
      ]
    },
        {
      label: "Stock Graphs",
      bgColor: "#383838",
      textColor: "#fff",
      links: [
        { label: "About Tool", ariaLabel: "About tool", href: "#company" },
      ]
    },
    {
      label: "Charts & KPIs", 
      bgColor: "#D1DFDF",
      textColor: "#2a2929ff",
      links: [
        { label: "About Tool", ariaLabel: "About tool", href: "#company" },
      ]
    },
    {
      label: "Search Public Companies",
      bgColor: "#EEF4CE", 
      textColor: "#4a4a4aff",
      links: [
        { label: "About Tool", ariaLabel: "About tool", href: "#company" },
      ]
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.backgroundEffect}>
         <PixelBlast
          variant="circle"
          pixelSize={6}
          color="#a2a2afff"
          patternScale={4}
          patternDensity={1.5}
          pixelSizeJitter={0.6}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.6}
          edgeFade={0.25}
          transparent
        />
      </div>
      <div style={styles.contentOverlay}>
        {/* Header/Navigation */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>
              <img src={fglogo_Wbg} style={{ height: "80px", width: "auto" }} />
            </div>
          </div>
          <nav style={styles.nav}>
            <a href="#" style={styles.navLink}>Blog page</a>
            <button
              onClick={() => navigate("/AuthFlow")}
              style={{ ...styles.navLink, background: "none", border: "none", cursor: "pointer" }}
            >
              Log In
            </button>
            <a href="#" style={styles.navLink}>Chat Bot</a>
            <FloatingMenu
              triggerText="Tools"
              items={items}
              triggerStyle={styles.navLink}
              triggerBg="transparent"
            />
          </nav>
        </header>

        <div style={styles.horizontalLine}></div>

        {/* Main Content - Centered */}
        <main style={styles.mainContent}>
          <div style={styles.contentWrapper}>
            <h1 style={styles.mainTitle}><img src={mainlogo} style={{ height: "100px", width: "auto" }} /></h1>
            <h2 style={styles.tagline}>Your Smart Financial Assistant</h2>
            <p style={styles.description}>
              Get company summaries, analyze debt ratings, view stock graphs & KPIs, and stay updated with the latest financial news – all in one powerful platform.
            </p>

            {/* Call-to-Action Buttons */}
            <div style={styles.buttonContainer}>
              {/* <button style={styles.primaryButton}>Get Started</button>  */}
              <button
              onClick={() => navigate("/AuthFlow")}
              style={styles.primaryButton}
            >
              Get Started
            </button>
              <button style={styles.secondaryButton}>Learn more</button>
            </div>
          </div>
        </main>
      </div>
      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <p style={styles.copyright}>
            © 2025 FinGenie | <a href="#" style={styles.footerLink}>About</a> | <a href="#" style={styles.footerLink}>Blog</a> | <a href="#" style={styles.footerLink}>Privacy Policy</a> | <a href="#" style={styles.footerLink}>Contact</a>
          </p>
        </div>
        <div style={styles.footerRight}>
          <h4 style={styles.functionsTitle}>functions</h4>
          <ul style={styles.functionsList}>
            <li style={styles.functionsItem}>AI summary</li>
            <li style={styles.functionsItem}>Debt ratings</li>
            <li style={styles.functionsItem}>stock graphs</li>
            <li style={styles.functionsItem}>search companies</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}


const styles = {

  container: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },

  backgroundEffect: {
    position: 'absolute',
    top: -20,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },

  contentOverlay: {
    position: 'relative',
    zIndex: 5,
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  rippleBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',  
    zIndex: 0,              // Behind everything
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 4rem',
    position: 'relative',
    zIndex: 10,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },

  logo: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

    // ... other styles ...
    cardNavPosition: {
        position: 'absolute',
        top: '2em', // Matches the original .card-nav-container top
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '800px',
        zIndex: 99,
        pointerEvents: 'none', // Allow clicks through the empty space
    },

  nav: {
    display: 'flex',
    gap: '2rem',
  },

  navLink: {
    color: '#000000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'Arial, sans-serif',
    transition: 'opacity 0.3s',
  },

  horizontalLine: {
    width: '100%',
    height: '1px',
    backgroundColor: '#000000',
    position: 'relative',
    zIndex: 5,
  },
    cardNavOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
  mainContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    position: 'relative',
  },

  contentWrapper: {
    textAlign: 'center',
    maxWidth: '700px',
  },

  mainTitle: {
    fontSize: '72px',
    fontWeight: 'bold',
    color: '#2D3748',
    margin: 0,
    marginBottom: '0.5rem',
    lineHeight: 1.2,
  },

  tagline: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#2D3748',
    margin: 0,
    marginBottom: '2rem',
    lineHeight: 1.3,
    textShadow: '1px 1px 0 #FFFFFF, -1px 1px 0 #FFFFFF, 1px -1px 0 #FFFFFF, -1px -1px 0 #FFFFFF',
  },

description: {
  fontSize: '16px',
  color: '#4A4A4A',
  lineHeight: 1.8,
  margin: '0 auto 3rem',
  maxWidth: '600px',
  fontFamily: '"Bricolage Grotesque", Arial, sans-serif',
  // Added white border effect using textShadow
  textShadow: '1px 1px 0 #FFFFFF, -1px 1px 0 #FFFFFF, 1px -1px 0 #FFFFFF, -1px -1px 0 #FFFFFF',
},

  buttonContainer: {
    display: 'flex',
    gap: '1.5rem',
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButton: {
    backgroundColor: '#5F596F',
    color: '#FFFFFF',
    padding: '0.875rem 2.5rem',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Arial, sans-serif',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    color: '#5F596F',
    padding: '0.875rem 2.5rem',
    fontSize: '16px',
    fontWeight: '600',
    border: '2px solid #5F596F',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Arial, sans-serif',
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
  },

  copyright: {
    fontSize: '13px',
    margin: 0,
    lineHeight: 1.8,
    fontFamily: 'Arial, sans-serif',
  },

  footerLink: {
    color: '#FFFFFF',
    textDecoration: 'none',
    transition: 'opacity 0.3s',
  },

  footerRight: {
    textAlign: 'right',
  },

  functionsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    margin: '0 0 0.75rem 0',
    fontFamily: 'Arial, sans-serif',
  },

  functionsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  functionsItem: {
    fontSize: '13px',
    margin: 0,
    fontFamily: '"Bricolage Grotesque", Arial, sans-serif',
  },
};