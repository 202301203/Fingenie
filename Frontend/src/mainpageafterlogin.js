import React from 'react';
import { ChartCandlestick , BarChart3, PieChart, Search, Bot , HandCoins} from 'lucide-react';
import CustomTiltCard from './components/ui/CustomTiltCard';
import Orb from './Orb';


export default function FinGenieLanding() {
  return (
    <div style={styles.container}>
      {/* Background Arc */}
         <div style={{ left: '-300px',top: '-200px',width: '7000px',height: '7000px', position: 'absolute' }}>
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
        />
        </div>
      {/* Header/Navigation */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <img src="secondarylogo.png" style={{ height: "80px", width: "auto" }} />
        </div>
        <nav style={styles.nav}>
          <a href="#" style={styles.navLink}>Blog page</a>
          <a href="#" style={styles.navLink}>Log In</a>
          <a href="#" style={styles.navLink}>Chat Bot</a>
          <a href="#" style={styles.navLink}>About Us</a>
        </nav>
      </header>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left Section */}
        <div style={styles.leftSection}>
          <h1 style={styles.mainTitle}>Fingenie</h1>
          <h2 style={styles.tagline}>Your Smart Financial Assistant</h2>
          <p style={styles.description}>
            Get company summaries, analyze debt ratings, view stock graphs & KPIs, and stay updated with the latest financial news – all in one powerful platform.
          </p>
        </div>

        {/* Right Section - Feature Blocks */}
        <div style={styles.rightSection}>
          {/* Top Row */}
          <div style={styles.topRow}>
            {/* AI Summary Generator */}
            <CustomTiltCard rotateAmplitude={15}>

            <div style={{  ...styles.aiBlock }}>
              
              <h1 style={{...styles.blockTitle, position: 'relative' }}>AI Summary Generator</h1>
              <p style={{...styles.blockText, position: 'relative' }}>
                Instantly create financial summaries and reports using artificial intelligence.
              </p>
              <div style={styles.iconBackground}>
                <Bot size={300} color="#405055" />
              </div>
            </div>
            </CustomTiltCard>
            
            {/* Debt Ratings */}
            <CustomTiltCard rotateAmplitude={15}>
            <div style={{...styles.debtBlock }}>
              <div style={styles.iconBackground}>
                <HandCoins  size={270} color="#44455A" />
              </div>
              <h3 style={styles.blockTitle}>Debt Ratings</h3>
              <p style={styles.blockText}>
                Get accurate and transparent debt analysis for smarter investment decisions.
              </p>
            </div>
            </CustomTiltCard>
          </div>
          
          {/* Middle Row */}
          

          <div style={styles.middleRow}>
            <CustomTiltCard rotateAmplitude={15}>
            {/* Stock Graphs */}
            <div style={{ ...styles.stockBlock }}>
              <div style={styles.iconBackground}>
                <ChartCandlestick  size={270} color="#2B2B2B" />
              </div>
              <h3 style={styles.blockTitle}>Stock Graphs</h3>
              <p style={styles.blockText}>
                Analyze company stock trends, historical data, and technical indicators.
              </p>
            </div>
            </CustomTiltCard>
            {/* Charts & KPIs */}
            <CustomTiltCard rotateAmplitude={15}>
            <div style={{...styles.chartsBlock }}>
              <div style={styles.iconBackground}>
                <PieChart size={260} color="#BBD0D0" />
              </div>
              <h3 style={{ ...styles.blockTitle, color: '#1a1a1a' }}>Charts & KPIs</h3>
              <p style={{ ...styles.blockText, color: '#1a1a1a' }}>
                Visualize company performance with interactive charts and real-time metrics.
              </p>
            </div>
            </CustomTiltCard>
          </div>

          {/* Bottom Section */}
          <div style={styles.bottomRow}>
            {/* Search Public Companies */}
            <CustomTiltCard rotateAmplitude={15}>
            <div style={{...styles.searchBlock }}>
              <div style={styles.iconBackground}>
                <Search size={300} color="#E6EFB7" />
              </div>
              <h3 style={{ ...styles.blockTitle, color: '#383838' }}>Search Public Companies</h3>
              <p style={{ ...styles.blockText, color: '#383838' }}>
                Find detailed reports on any listed company in seconds.
              </p>
            </div>
            </CustomTiltCard>
          </div>
        </div>
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
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    fontFamily: '"Bricolage Grotesque", Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },

  arctop: {
    position: 'absolute',
    left: '-400px',                     // move a bit more to the left
    top: '-200px',
    width: '1106px',                      // make bigger
    height: '900px',
    borderRadius: '50%',
    border: '5px solid transparent', // thicker border, but transparent
    background: `
      linear-gradient(#f6f6f6, #eeeeee) padding-box, 
      linear-gradient(135deg, #9DAAC6, #1F2634) border-box
    `,
    backgroundClip: 'padding-box, border-box',
    boxShadow: '0 0 40px rgba(0, 0, 0, 0.1)',
    zIndex: 0
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
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: 'bold',
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
    transition: 'opacity 0.3s',
  },

  mainContent: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '4rem 4rem',
    position: 'relative',
    zIndex: 5,
    maxWidth: '1400px',
    margin: '0 auto',
    gap: '4rem',
  },

  leftSection: {
    flex: 1,
    paddingTop: '2rem',
  },

  mainTitle: {
    fontSize: '64px',
    fontWeight: 'bold',
    color: '#000000',
    margin: 0,
    marginBottom: '0.5rem',
    lineHeight: 1.2,
  },

  tagline: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#000000',
    margin: 0,
    marginBottom: '2rem',
    lineHeight: 1.3,
  },

  description: {
    fontSize: '14px',
    color: '#666666',
    lineHeight: 1.8,
    maxWidth: '400px',
    margin: 0,
  },

  rightSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  topRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },

  middleRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },

  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1.5rem',
  },
  
    iconBackground: {
    position: 'absolute',
    top: '50%',
    left: '100px',
    transform: 'translateY(-50%)',
    opacity: 0.50,        // soft transparency
    zIndex: 1,            // stays above background, below text
    pointerEvents: 'none',
  },
  
  aiBlock: {
    padding: '2rem',
    borderRadius: '16px',
    minHeight: '210px',
    display: 'flex',
    right:'30px',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    position: 'relative', 
    overflow: 'hidden',
    backgroundColor: '#4D5C61',
    backgroundImage: 'linear-gradient(135deg, #4D5C61 0%, #5a6b72 100%)',
  },

  debtBlock: {
    padding: '2rem',
    borderRadius: '16px',
    minHeight: '170px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    position: 'relative', 
    overflow: 'hidden', 
    backgroundColor: '#515266',
    backgroundImage: 'linear-gradient(135deg, #515266 0%, #5d6375 100%)',
  },

  stockBlock: {
    padding: '2rem',
    borderRadius: '16px',
    minHeight: '200px',
    display: 'flex',
    right:'100px',
    top:'40px',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    position: 'relative', 
    overflow: 'hidden', 
    backgroundColor: '#383838',
    backgroundImage: 'linear-gradient(135deg, #383838 0%, #454545 100%)',
  },

  chartsBlock: {
    padding: '2rem',
    borderRadius: '16px',
    minHeight: '200px',
    display: 'flex',
    left:'10px',
    top:'40px',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    position: 'relative', 
    overflow: 'hidden', 
    backgroundColor: '#D1DFDF',
    backgroundImage: 'linear-gradient(135deg, #D1DFDF 0%, #e1ecec 100%)',
  },

  searchBlock: {
    padding: '2rem',
    borderRadius: '16px',
    minHeight: '200px',
    minWidth: '200px',
    display: 'flex',
    right:'500px',
    top:'60px',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    position: 'relative', 
    overflow: 'hidden', 
    backgroundColor: '#EEF4CE',
    backgroundImage: 'linear-gradient(135deg, #EEF4CE 0%, #f5fbe0 100%)',
    maxWidth: '500px',
  },

  blockHeader: {
    marginBottom: '1rem',
    opacity: 0.9,
    zIndex: 2
  },

  blockTitle: {
    fontSize: '30px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: 0,
    marginBottom: '0.75rem',
    zIndex: 2
  },

  blockText: {
    fontSize: '13px',
    color: '#FFFFFF',
    margin: 0,
    lineHeight: 1.6,
    opacity: 0.95,
    zIndex: 2
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
    textTransform: 'lowercase',
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
  },
};