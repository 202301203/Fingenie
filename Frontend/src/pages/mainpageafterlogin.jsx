import React, { useState, useEffect ,useRef, useId,useMemo} from 'react';
import { Bot, TrendingUp, PieChart, Search, BookOpen, Award, User, Menu, X, Activity, Cpu, GitCompare, History, Settings, LogOut, Wrench, BarChart3,ArrowRight } from 'lucide-react';
import mainlogo from '../images/mainlogo.png';
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";


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
    bgColor: '#dceaeaff',
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
    route: '/blogPage'
  },

  {
    title: 'Sector Overview',
    description: 'Analyze industry sectors with comprehensive data and insights.',
    icon: BarChart3,
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

const FeatureCard = ({ feature, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = feature.icon;
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onClick={() => navigate(feature.route)}   // ⭐ navigation here
      style={{
        ...styles.featureCard,
        background: `linear-gradient(135deg, ${feature.bgColor}, #f1eeee6e)`,

       // background: "linear-gradient(135deg, #e1ececff, #f1eeee6e)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.1s ease ${index * 0.1}s, transform 0.25s ease, box-shadow 0.25s ease`,
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        borderRadius: '15px',
        border: '1px solid #1c1c1c66',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
        cursor: 'pointer'                        // pointer required
      }}
      className="feature-card-hover"
    >
      
      <WaveSVG color={feature.bgColor === '#fef9e7' ? '#f9e79f' : '#1d3851ff'} />
      <div style={styles.cardContent}>
        <div style={styles.cardIcon}>
          <Icon size={42} color="#000000ff" strokeWidth={1.5} />
        </div>
        <h1 style={styles.cardTitle}>{feature.title}</h1>
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
  const [hoverExplore, setHoverExplore] = useState(false);



  return (
    <div style={styles.pageContainer}>
      <div style={styles.creativeBG} /> 
      <Header />

      {/* <a style={styles.navLink} className="nav-link" href="#home">Home</a> */}
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
            background: #D1DFDF !important;
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
            
          }
        `}
      </style>

      {/* Hero Section 
        {/*<RotatingCircles />*/}
      <div style={styles.heroContent}>
        <h1 style={styles.mainTitle}><img src={mainlogo} style={{ height: "100px", width: "auto" }} /></h1>
        <p style={styles.heroSubtitle} className="hero-subtitle">Your Smart Financial Assistant</p>
        
      </div>

      <div style={styles.moreToolContent}>
      <div
  style={{
    ...styles.exploreButton,
    ...(hoverExplore ? styles.exploreButtonHover : {}),
  }}
  onClick={() => navigate("/FeaturesPage")}
  onMouseEnter={() => setHoverExplore(true)}
  onMouseLeave={() => setHoverExplore(false)}
>
  <span>Explore all tools</span>
  <ArrowRight size={18} />
</div>

      </div>

      {/* Features Grid */}
<section style={styles.featuresSection} className="features-section">

  <div style={styles.featuresGrid} className="features-grid">
    {features.map((feature, index) => (
      <FeatureCard key={index} feature={feature} index={index} />
    ))}
  </div>

</section>

<div style={styles.fullWidthBox}
onClick={() => navigate("/wordoftheday")}
>
  {/* 🔥 Curved animation here */}
  {/* ⭐ Static text that does NOT move */}
  <div style={styles.quizText}
>
    Take a fun quiz!
    
  </div>

</div>


      {/* Footer */}
      <Footer />
    </div>
  );
};

const styles = {
  creativeBG: {
    zIndex: 0,
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100vw', height: '100vh',
    background: 'radial-gradient(ellipse 80% 50% at top, #e0f2f1 0%, #DEE6E6 40%, #f8f8f8 70%)',
    pointerEvents: 'none'
  },
  pageContainer: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Inter", "Montserrat", "Bricolage Grotesque", sans-serif',
    color: '#2d3748',
    zIndex: 1,
    overflowX: 'hidden',
    background: 'none', // overlayed above
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
  
  hamburger: {
    display: 'none',
    cursor: 'pointer',
    color: '#4a5568'
  },

exploreButton: {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "1rem",
  fontWeight: "500",
  color: "#3b3b3d",
  padding: "6px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.25s ease",
  position: "relative",
},

exploreButtonHover: {
  backgroundColor: "#D1DFDF",
  boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
},



  heroContent: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center'
  },
  
  heroSubtitle: {
    fontSize: '1.35rem',
    color: '#1e1f22ff',
    fontWeight: '400'
  },
  moreToolContent: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'left',
    padding: '0rem 4rem',
  },
  exploreTools: {
    fontSize: '1.2rem',
    color: '#3b3b3dff',
    fontWeight: '200',
    marginRight: 'auto'
  },
  featuresSection: {
    padding: '2rem 3rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem'
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
    fontSize: '1.7rem',
    fontWeight: '800',
    color: '#2d3748',
    marginBottom: '0.75rem'
  },
  cardDescription: {
    fontSize: '1rem',
    color: '#718096',
    lineHeight: '1.6'
  },

fullWidthBox: {
  width: "50%",
  position: "relative",
  borderRadius: '15px',
margin: '2rem auto',
  padding: "1.5rem 0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0rem",   // space between curved text and quiz text
  background: "linear-gradient(135deg, #eef4ce66, #d9dfb766)", // ⭐ gradient added
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #969a7fff',
    cursor: 'pointer'
},
quizText: {
  fontSize: "1.4rem",
  fontWeight: 600,
  color: "#1a1a1a",
  fontFamily: '"Bricolage Grotesque", sans-serif',
  textTransform: "uppercase",
  letterSpacing: "1px",
  cursor: "pointer",
},


};

export default FinGenieLanding;