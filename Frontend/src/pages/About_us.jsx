import React, {useState} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { User, Code, LayoutDashboard, Brain, ScrollText, GitBranch, Home, GraduationCap, Wrench, LogOut, Settings, History, TrendingUp, Search, Activity, BookOpen, Cpu, GitCompare, Users } from "lucide-react";
import fglogo_Wbg from '../images/fglogo_Wbg.png'; 
// Generic image placeholder for demonstration
const PHOTO_STYLE_OVERRIDE = {
    backgroundColor: 'transparent', // Don't show the colored div background under the image
    objectFit: 'cover',             // Ensure the image covers the circular container
};

// Assuming COLORS are imported or defined locally for consistency
const COLORS = {
  PageBackground: '#f3f1f1ff', 
  CardBackground: '#FFFFFF',  
  PrimaryText: '#151515ff',     
  SecondaryText: '#777777',   
  Accent: '#515266', 
  TextLight: '#ffffff',
};

const styles = {
    appWrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: COLORS.PageBackground,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
   
    mainContent: {
        flexGrow: 1,
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '40px',
        backgroundColor: COLORS.CardBackground,
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: '2em',
        fontWeight: 'bold',
        color: COLORS.Accent,
        marginBottom: '20px',
        borderBottom: `2px solid ${COLORS.PageBackground}`,
        paddingBottom: '10px',
    },
    projectInfo: {
        marginBottom: '40px',
        lineHeight: 1.6,
        color: COLORS.PrimaryText,
    },
    memberGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px',
        marginTop: '30px',
    },
    memberCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: COLORS.PageBackground,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        textAlign: 'center',
    },
    // Style for the circular container (used for both icon and img)
    memberIcon: { 
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: COLORS.Accent, // Default background for icon
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
        color: COLORS.TextLight,
        overflow: 'hidden', // Crucial for images
    },
    memberName: {
        fontSize: '1.1em',
        fontWeight: '600',
        color: COLORS.PrimaryText,
        marginBottom: '5px',
    },
    memberId: {
        fontSize: '0.9em',
        color: COLORS.SecondaryText,
        marginBottom: '5px',
    },
    memberTeam: {
        fontSize: '0.95em',
        fontWeight: 'bold',
        color: COLORS.Accent,
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        marginTop: '5px',
    },
};

// const isAboutus = location.pathname === "/About_us";

// --- DUMMY TEAM MEMBER DATA (10 Members) ---
const members = [
 { name: "Dhruvinee Tandel", id: "202301203", team: "Project Lead & Backend", icon: GitBranch, photoUrl: null },          
 { name: "Jayadity Shah", id: "202301254", team: "Backend", icon: Code, photoUrl: null },
  { name: "Priyanka Garg", id: "202301262", team: "Backend", icon: Code, photoUrl: null },
    { name: "Rutu Chaudhari", id: "202301235", team: "Frontend", icon: LayoutDashboard, photoUrl: null },
    { name: "Kresha Vora", id: "202301231", team: "Frontend ", icon: LayoutDashboard, photoUrl: null },
    { name: "Jayansh Gaadhe", id: "202301232", team: "Backend", icon: Code, photoUrl: null},
    { name: "Manan Chhabhaya", id: "202301222", team: "Backend", icon: Code, photoUrl: null },
    { name: "Meet Gandhi", id: "202301219", team: "Backend", icon: Code, photoUrl: null },
    { name: "Ajaykumar Rathod", id: "202301221", team: "Frontend", icon: LayoutDashboard, photoUrl: null },
    // { name: "Nakum Ayush", id: "202301233", team: "", icon: Users, photoUrl: null }, // Explicitly null/empty to show default icon
];

// --- Header component (Updated to accept props) ---
const Header = ({ navigate, showDropdown, setShowDropdown, showToolsDropdown, setShowToolsDropdown, currentPath }) => (
    
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
             borderBottom: 
            currentPath === "/mainpageafterlogin" ? "2px solid black" : "none",          }}
          onClick={() => navigate("/mainpageafterlogin")}
        >
          Home
        </span>
        <span
          className="nav-link"
          style={{
            ...styles.navLink,
            borderBottom: 
                currentPath === "/NewsPage" ? "2px solid black" : "none",
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
                currentPath === "/Chatbot" ? "2px solid black" : "none",
          }}
          onClick={() => navigate("/Chatbot")}
        >
          Chatbot
        </span>

        <span
          className="nav-link"
          style={{
            ...styles.navLink,
            borderBottom: currentPath === "/About_us" ? "2px solid black" : "none",          }}
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
              <div style={styles.dropdownItem}>
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

// --- MAIN ABOUT US COMPONENT ---
const AboutUs = () => {
         const navigate = useNavigate(); 
         const location = useLocation(); // <-- FIX: Use the useLocation hook
         const currentPath = location.pathname; // <-- Get the path safely
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
         currentPath={currentPath}
        />
            
            <div style={styles.mainContent}>
                <h1 style={{...styles.sectionTitle, textAlign: 'center', fontSize: '2.5em', marginBottom: '30px'}}>
                    About FinGenie 💡
                </h1>

               {/* Project Information Section */}
<div style={styles.projectInfo}>
    <h2 style={styles.sectionTitle}>Project Overview</h2>
    <p>
        FinGenie is a comprehensive financial intelligence platform developed as the final project for the Software Engineering (IT314) course at DA-IICT Gandhinagar. Our mission is to provide users with powerful tools for financial analysis, including AI-driven document summarization, trend tracking, key performance indicator (KPI) comparisons, and corporate debt ratings.
    </p>
    <p>
        The application is built using modern web technologies to deliver a responsive, intuitive, and secure user experience, helping individuals and small businesses make data-backed financial decisions.
    </p>

    {/* New Section for Features */}
    <h3 style={styles.sectionTitle}> Features</h3>
    <ul style={{ paddingLeft: '20px' }}>
        <li>Balance Sheet Analysis: Upload balance sheets to get an immediate summary and key financial ratios.</li>
        <li>Trend Analysis: Tools to generate trends analysis for companies and sectors.</li>
        <li>Sector Overview Dashboard: A dedicated dashboard providing a high-level sector overview.</li>
        <li>Dual Chatbot Integration: Includes one chatbot for document summary questions and one for general inquiries.</li>
        <li>Financial News: A curated feed providing the latest and most relevant financial news.</li>
        <li>Blog Page: A section for articles and insights on finance and investment topics.</li>
        <li>Company Details: Ability to search a company to see its financial details.</li>
        <li>Sector Comparison: Tool to compare a company against its sector peers on performance metrics.</li>
        <li>Learning Tools: Features a Word of the Day (learnings) section, complete with a Quiz based on the word.</li>
    </ul>
</div>
                <hr style={{border: `1px solid ${COLORS.PageBackground}`}}/>

                {/* Course and Faculty Information Section */}
                <div style={styles.projectInfo}>
                    <h2 style={styles.sectionTitle}>Course Details</h2>
                    <p style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <GraduationCap size={20} color={COLORS.Accent}/>
                        Course: Software Engineering (IT314)
                    </p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <User size={20} color={COLORS.Accent}/>
                        Professor: Sourabh Tiwari
                    </p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <Home size={20} color={COLORS.Accent}/>
                        Institution: DAU Gandhinagar
                    </p>
                </div>

                <hr style={{border: `1px solid ${COLORS.PageBackground}`}}/>

                {/* Team Information Section */}
                <h2 style={styles.sectionTitle}>Meet the Development Team 👨‍💻</h2>
                <div style={styles.memberGrid}>
                    {members.map((member, index) => {
                        const Icon = member.icon;
                        const hasPhoto = member.photoUrl && member.photoUrl.length > 0;
                        
                        return (
                            <div key={index} style={styles.memberCard}>
                                {/* Conditionally render image or default icon */}
                                {hasPhoto ? (
                                    <img 
                                        src={member.photoUrl} 
                                        alt={member.name} 
                                        // Combine memberIcon style for size/shape, and override background/fit
                                        style={{...styles.memberIcon, ...PHOTO_STYLE_OVERRIDE}} 
                                    />
                                ) : (
                                    <div style={styles.memberIcon}>
                                        <User size={30} />
                                    </div>
                                )}
                                
                                <span style={styles.memberName}>{member.name}</span>
                                <span style={styles.memberId}>ID: {member.id}</span>
                                <span style={styles.memberTeam}>
                                    <Icon size={16} />
                                    {member.team}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default AboutUs;