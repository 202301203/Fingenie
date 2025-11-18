import React, { useState, useEffect ,useRef, useId,useMemo} from 'react';
import { Bot, TrendingUp, PieChart, Search, BookOpen, Award, User, Menu, X, Activity, Cpu, GitCompare, History, Settings, LogOut, Wrench, BarChart3,ArrowRight } from 'lucide-react';
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import mainlogo from '../images/mainlogo.png';
import { useNavigate, useLocation } from "react-router-dom";

// Add this import at the top with your other imports


// Add the CurvedLoop component inside your file (before FinGenieLanding component)
// const CurvedLoop = ({
//   marqueeText = 'Explore Our Features',
//   speed = 2,
//   curveAmount = 0,
//   direction = 'left',
//   interactive = true
// }) => {
//   const text = useMemo(() => {
//     const hasTrailing = /\s|\u00A0$/.test(marqueeText);
//     return (hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText) + '\u00A0';
//   }, [marqueeText]);

//   const measureRef = useRef(null);
//   const textPathRef = useRef(null);
//   const pathRef = useRef(null);
//   const [spacing, setSpacing] = useState(0);
//   const [offset, setOffset] = useState(0);
//   const uid = useId();
//   const pathId = `curve-${uid}`;
//   const pathD = `M-100,40 Q500,${40 + curveAmount} 1540,40`;

//   const dragRef = useRef(false);
//   const lastXRef = useRef(0);
//   const dirRef = useRef(direction);
//   const velRef = useRef(0);

//   const textLength = spacing;
//   const totalText = textLength
//     ? Array(Math.ceil(1800 / textLength) + 2)
//         .fill(text)
//         .join('')
//     : text;
//   const ready = spacing > 0;

//   useEffect(() => {
//     if (measureRef.current) {
//       const length = measureRef.current.getComputedTextLength();
//       console.log('Text length:', length); // Debug
//       setSpacing(length);
//     }
//   }, [text]);

//   useEffect(() => {
//     if (!spacing) return;
//     if (textPathRef.current) {
//       const initial = -spacing;
//       textPathRef.current.setAttribute('startOffset', initial + 'px');
//       setOffset(initial);
//     }
//   }, [spacing]);

//   useEffect(() => {
//     if (!spacing || !ready) return;
//     let frame = 0;
//     const step = () => {
//       if (!dragRef.current && textPathRef.current) {
//         const delta = dirRef.current === 'right' ? speed : -speed;
//         const currentOffset = parseFloat(textPathRef.current.getAttribute('startOffset') || '0');
//         let newOffset = currentOffset + delta;

//         const wrapPoint = spacing;
//         if (newOffset <= -wrapPoint) newOffset += wrapPoint;
//         if (newOffset > 0) newOffset -= wrapPoint;

//         textPathRef.current.setAttribute('startOffset', newOffset + 'px');
//         setOffset(newOffset);
//       }
//       frame = requestAnimationFrame(step);
//     };
//     frame = requestAnimationFrame(step);
//     return () => cancelAnimationFrame(frame);
//   }, [spacing, speed, ready]);

//   const onPointerDown = e => {
//     if (!interactive) return;
//     dragRef.current = true;
//     lastXRef.current = e.clientX;
//     velRef.current = 0;
//     e.target.setPointerCapture(e.pointerId);
//   };

//   const onPointerMove = e => {
//     if (!interactive || !dragRef.current || !textPathRef.current) return;
//     const dx = e.clientX - lastXRef.current;
//     lastXRef.current = e.clientX;
//     velRef.current = dx;

//     const currentOffset = parseFloat(textPathRef.current.getAttribute('startOffset') || '0');
//     let newOffset = currentOffset + dx;

//     const wrapPoint = spacing;
//     if (newOffset <= -wrapPoint) newOffset += wrapPoint;
//     if (newOffset > 0) newOffset -= wrapPoint;

//     textPathRef.current.setAttribute('startOffset', newOffset + 'px');
//     setOffset(newOffset);
//   };

//   const endDrag = () => {
//     if (!interactive) return;
//     dragRef.current = false;
//     dirRef.current = velRef.current > 0 ? 'right' : 'left';
//   };

//   const cursorStyle = interactive ? 'grab' : 'auto';

//   return (
//     <div
//       style={{
//         width: '100%',
//         height: '100px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         cursor: cursorStyle,
//         position: 'relative',
//         zIndex: 1,
//         marginTop: '0.5rem',     // 🔥 bigger top margin
//   marginBottom: '-2rem',
//       }}
//       onPointerDown={onPointerDown}
//       onPointerMove={onPointerMove}
//       onPointerUp={endDrag}
//       onPointerLeave={endDrag}
//     >
//       <svg 
//         style={{
//           userSelect: 'none',
//           WebkitUserSelect: 'none',
//           MozUserSelect: 'none',
//           width: '100%',
//           height: '200px',
//           height: '150px',
//           overflow: 'visible',
//           display: 'block'
//         }}
//         viewBox="0 0 1440 120"
//         preserveAspectRatio="xMidYMid meet"
//       >
//         <defs>
//           <path ref={pathRef} id={pathId} d={pathD} fill="none" stroke="transparent" />
//         </defs>
        
//         <text 
//           ref={measureRef} 
//           style={{ 
//             visibility: 'hidden', 
//             opacity: 0, 
//             pointerEvents: 'none',
//             fontSize: '2rem',
//             fontWeight: 400,
//             fontFamily: '"Bricolage Grotesque", sans-serif'
//           }}
//         >
//           {text}
//         </text>
        
//         {ready && (
//           <text 
//             style={{
//               fontSize: '2rem',
//               fontWeight: 400,
//               fill: '#191733ff',
//               fontFamily: '"Bricolage Grotesque", sans-serif',
//               textTransform: 'uppercase',
//                   filter: 'drop-shadow(0 0 12px #eef4ceaa) drop-shadow(0 0 20px #eef4ce55)'

//             }}
//           >
//             <textPath 
//               ref={textPathRef} 
//               href={`#${pathId}`} 
//               startOffset={offset + 'px'}
//             >
//               {totalText}
//             </textPath>
//           </text>
//         )}
//       </svg>
//     </div>
//   );
// };

// Then in your FinGenieLanding component, add it before the features section:

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
        transition: `all 0.5s ease ${index * 0.1}s, transform 0.25s ease, box-shadow 0.25s ease`,
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
  const location = useLocation();

  const isHomeActive = location.pathname === "/mainpageafterlogin";
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

        <span
          className="nav-link"
          style={{
            ...styles.navLink,
            borderBottom:
              location.pathname === "/Chatbot" ? "2px solid black" : "none",
          }}
          onClick={() => navigate("/Chatbot")}
        >
          Chatbot
        </span>

        <span
          className="nav-link"
          style={{
            ...styles.navLink,
            borderBottom:
              location.pathname === "/About_us" ? "2px solid black" : "none",
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
            
            .circles-container {
              width: 400px !important;
              height: 400px !important;
            }
            
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

          {/* --- WordOfTheDay --- */}
          <span
              className="nav-link"
              style={{
                ...styles.navLink,
                borderBottom:
                  location.pathname === "/wordOfTheDay" ? "2px solid black" : "none",
              }}
              onClick={() => navigate("/wordOfTheDay")}
          >
              Word of the Day
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

      {/* Hero Section 
        {/*<RotatingCircles />*/}
      <div style={styles.heroContent}>
        <h1 style={styles.mainTitle}><img src={mainlogo} style={{ height: "100px", width: "auto" }} /></h1>
        <p style={styles.heroSubtitle} className="hero-subtitle">Your Smart Financial Assistant</p>
        
      </div>

      <div style={styles.moreToolContent}>
      <p style={styles.exploreTools} className="hero-subtitle">Explore all tools
        <ArrowRight size={18} style={{ marginLeft: "6px", verticalAlign: "middle" }} />
      </p>
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
  hamburger: {
    display: 'none',
    cursor: 'pointer',
    color: '#4a5568'
  },


  /*circlesContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    pointerEvents: 'none'
  },
circleLayer: {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  top: '-250px',
  width: '1520px',
  height: '695px',

  borderRadius: '50%',
  border: '5px solid transparent',

  background: `
    linear-gradient(#f6f6f6, #eeeeee) padding-box,
    linear-gradient(135deg, #9DAAC6, #1F2634) border-box
  `,
  backgroundClip: 'padding-box, border-box',
  //boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',

  zIndex: 0,
},*/


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
    gap: '1rem'
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
    fontWeight: '800',
    color: '#2d3748',
    marginBottom: '0.75rem'
  },
  cardDescription: {
    fontSize: '0.95rem',
    color: '#718096',
    lineHeight: '1.6'
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