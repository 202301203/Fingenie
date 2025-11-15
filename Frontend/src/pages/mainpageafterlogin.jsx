import React, { useState, useEffect } from 'react';
import { Bot, TrendingUp, PieChart, Search, BookOpen, Award, User, Menu, X, Activity, Cpu, GitCompare, History, Settings, LogOut, Wrench } from 'lucide-react';
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import mainlogo from '../images/mainlogo.png';
import { useNavigate,useLocation  } from "react-router-dom";



const features = [
  {
    title: 'AI Summary Generator',
    description: 'Instantly create financial summaries for any company using artificial intelligence.',
    icon: Bot,
    bgColor: '#DBDEDF',
    bordercolor: '#4D5C61',
    route: '/FileUploadApp'
  },
  {
    title: 'Comparison',
    description: 'Compare companies financial data side by side.',
    icon: TrendingUp,
    bgColor: '#D7D7D7',
    bordercolor: '#383838',
    route: '/comparison'
  },
  {
    title: 'Trends & KPIs',
    description: 'Visualize company performance with interactive charts and real-time metrics.',
    icon: PieChart,
    bgColor: '#F6F9F9',
    bordercolor: '#B5D1D1',
    route: '/Trends_KPI'
  },
  {
    title: 'Search Public Companies',
    description: 'Find detailed reports on any listed company in seconds.',
    icon: Search,
    bgColor: '#FCFDF5',
    bordercolor: '#EEF4CE',
    route: '/companySearch'
  },
  {
    title: 'Blog Page',
    description: 'Share your thoughts about finance and write the blogs.',
    icon: BookOpen,
    bgColor: '#DCDCE0',
    bordercolor: '#515266',
    route: '/blog'
  },
  {
    title: 'Debt Ratings',
    description: 'Get accurate and transparent debt analysis for smarter investment decisions.',
    icon: Award,
    bgColor: '#DCDCE0',
    bordercolor: '#515266',
    route: '/debtRatings'
  },
  {
    title: 'Sector Overview',
    description: 'Analyze industry sectors with comprehensive data and insights.',
    icon: Bot,
    bgColor: '#DBDEDF',
    bordercolor: '#4D5C61',
    route: '/sectorOverview'
  }
];


const WaveSVG = ({ color }) => (
  <svg style={styles.cardWave} viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path
      d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
      fill="none"
      stroke={color}
      strokeWidth="4"
    />
  </svg>
);

const FeatureCard = ({ feature, index, navigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = feature.icon;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div 
      onClick={() => navigate(feature.route)}
      style={{
        ...styles.featureCard,
        backgroundColor: feature.bgColor,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.5s ease ${index * 0.1}s, transform 0.25s ease, box-shadow 0.25s ease`,
        border: `2px solid ${feature.bordercolor}`,
        cursor: 'pointer'
      }}
      className="feature-card-hover"
    >
      <WaveSVG color={feature.bgColor === '#fef9e7' ? '#f9e79f' : '#1d3851ff'} />
      <div style={styles.cardContent}>
        <div style={styles.cardIcon}>
          <Icon size={42} color="#000000ff" strokeWidth={1.5} />
        </div>
        <h3 style={styles.cardTitle}>{feature.title}</h3>
        <p style={styles.cardDescription}>{feature.description}</p>
      </div>
    </div>
  );
};

const FinGenieLanding = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHomeActive = location.pathname === "/mainpageafterlogin";

  return (
    <div style={styles.pageContainer}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
          
          .nav-link:hover {
            color: #4a90e2;
          }
          
          .nav-link::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 2px;
            background-color: #000000ff;
            transition: width 0.3s ease;
          }
          
          .nav-link:hover::after {
            width: 100%;
          }
        
          .user-icon:hover {
            color: #4a90e2;
          }
          
          .feature-card-hover:hover {
            transform: translateY(-6px) !important;
            box-shadow: 0 10px 28px rgba(0,0,0,0.15) !important;
          }
          
          .footer-link:hover {
            color: #4fd1c5;
          }
          
          .functions-item::before {
            content: '•';
            position: absolute;
            left: 0;
            color: #81e6d9;
          }

          @media (max-width: 1024px) {
            .features-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }

          @media (max-width: 768px) {
            .features-grid {
              grid-template-columns: 1fr !important;
            }
            
            .nav-center {
              display: none !important;
            }
            
            .hamburger {
              display: block !important;
            }
            
            .navbar {
              padding: 1rem 1.5rem !important;
            }
            
            .hero-logo {
              font-size: 3rem !important;
            }
            
            .hero-subtitle {
              font-size: 1.1rem !important;
            }
            
            .features-section {
              padding: 3rem 1.5rem !important;
            }
            
            .circles-container {
              width: 400px !important;
              height: 400px !important;
            }
            
            .circle1 { width: 320px !important; height: 320px !important; }
            .circle2 { width: 360px !important; height: 360px !important; }
            .circle3 { width: 400px !important; height: 400px !important; }
          }
        `}
      </style>

      {/* Navbar */}
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
              borderBottom: isHomeActive ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/mainpageafterlogin")}
          >
            Home
          </span>

          {/* News */}
          <span
            className="nav-link"
            style={{
              ...styles.navLink,
              borderBottom:
                location.pathname === "/NewsPage" ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/NewsPage")}
          >
            News
          </span>

          {/* About */}
          <span
            className="nav-link"
            style={{
              ...styles.navLink,
              borderBottom:
                location.pathname === "/AboutUs" ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/AboutUs")}
          >
            About us
          </span>
        
        <div
          style={styles.toolsMenu}
          onMouseEnter={() => setShowToolsDropdown(true)}
          onMouseLeave={() => setShowToolsDropdown(false)}
        >
          <Wrench size={24} color="black" style={styles.userIcon} />
          {showToolsDropdown && (
            <div style={styles.HFdropdown}>
              <div style={styles.dropdownItem}>
                <TrendingUp size={16} />
                <span>Debt Ratings</span>
              </div>
              <div style={styles.dropdownItem}>
                <Search size={16} />
                <span>Search Companies</span>
              </div>
              <div style={styles.dropdownItem}>
                <Activity size={16} />
                <span>Charts & KPIs</span>
              </div>
              <div style={styles.dropdownItem}>
                <BookOpen size={16} />
                <span>Blog Page</span>
              </div>
              <div style={styles.dropdownItem}>
                <Cpu size={16} />
                <span>AI Summary</span>
              </div>
              <div style={styles.dropdownItem}>
                <GitCompare size={16} />
                <span>Comparison</span>
              </div>
            </div>
          )}
        </div>

        <div
          style={styles.userMenu}
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <User size={24} color="black" style={styles.userIcon} />
          {showDropdown && (
            <div style={styles.HFdropdown}>
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
              <div style={styles.dropdownItem}
              onClick={() => {
                    navigate("/homepage_beforelogin");
                  }}>
                <LogOut size={16} />
                <span>Sign out</span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.mainTitle}><img src={mainlogo} style={{ height: "100px", width: "auto" }} /></h1>
          <p style={styles.heroSubtitle} className="hero-subtitle">Your Smart Financial Assistant</p>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection} className="features-section">
        <div style={styles.featuresGrid} className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              feature={feature} 
              index={index} 
              navigate={navigate}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLeft}>
            <p style={styles.copyright}>
              © 2025 FinGenie | {' '}
              <a href="#about" style={styles.footerLink} className="footer-link">About</a> | {' '}
              <a href="#blog" style={styles.footerLink} className="footer-link">Blog</a> | {' '}
              <a href="#privacy" style={styles.footerLink} className="footer-link">Privacy Policy</a> | {' '}
              <a href="#contact" style={styles.footerLink} className="footer-link">Contact</a>
            </p>
          </div>
          
          <div style={styles.footerRight}>
            <h4 style={styles.functionsTitle}>functions</h4>
            <ul style={styles.functionsList}>
              <li style={styles.functionsItem} className="functions-item">AI summary</li>
              <li style={styles.functionsItem} className="functions-item">Debt ratings</li>
              <li style={styles.functionsItem} className="functions-item">stock graphs</li>
              <li style={styles.functionsItem} className="functions-item">search companies</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Montserrat', 'Inter', sans-serif",
    backgroundColor: '#F8F8F8',
    color: '#2d3748'
  },
  
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 3rem',
    position: 'sticky',
    borderRadius: '8px',
    top: 0,
    zIndex: 100
  },
  header: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid #000000ff',
  position: 'relative',
  top: 0,
  width: '100%',
  zIndex: 999
},
    headerLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center'
  },
    toolsMenu: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  navCenter: {
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'center'
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
  hamburger: {
    display: 'none',
    cursor: 'pointer',
    color: '#4a5568'
  },


  heroSection: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '2px',
    padding: '0.5rem 2rem',
    overflow: 'hidden',
    backgroundColor: '#F8F8F8'
  },
  
  heroContent: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center'
  },
  heroLogo: {
    fontSize: '4rem',
    fontWeight: '700',
    color: '#4a90e2',
    marginBottom: '0.5rem',
    letterSpacing: '-0.03em'
  },
  heroSubtitle: {
    fontSize: '1.35rem',
    color: '#718096',
    fontWeight: '400'
  },
  featuresSection: {
    padding: '4rem 3rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem'
  },
  featureCard: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    opacity: 0,
    border: '1px solid #ffffffff',
    transform: 'translateY(20px)'
  },
  cardWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '60%',
    opacity: 0.08,
    pointerEvents: 'none'
  },
  cardContent: {
    position: 'relative',
    zIndex: 1
  },
  cardIcon: {
    marginBottom: '1.5rem',
    display: 'inline-block'
  },
  cardTitle: {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '0.75rem'
  },
  cardDescription: {
    fontSize: '0.95rem',
    color: '#718096',
    lineHeight: '1.6'
  },
  footer: {
    backgroundColor: '#2d3748',
    color: '#e2e8f0',
    padding: '3rem',
    marginTop: 'auto'
  },
  footerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '2rem'
  },
  footerLeft: {
    flex: 1
  },
  copyright: {
    fontSize: '0.9rem',
    color: '#cbd5e0',
    margin: 0
  },
  footerLink: {
    color: '#81e6d9',
    textDecoration: 'none',
    transition: 'color 0.3s ease'
  },
  footerRight: {
    flex: 1,
    maxWidth: '250px'
  },
  functionsTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  functionsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  functionsItem: {
    fontSize: '0.9rem',
    color: '#cbd5e0',
    marginBottom: '0.5rem',
    paddingLeft: '1rem',
    position: 'relative'
  }
  
};

export default FinGenieLanding;