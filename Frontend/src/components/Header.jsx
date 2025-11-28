import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import fglogo_Wbg from "../images/fglogo_Wbg.png";
import { User, LogOut, Settings, History, Wrench, Search, Activity, BookOpen, Cpu, GitCompare } from "lucide-react";
  const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();  // 👈 FIX
  const currentPath = location.pathname;
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = React.useState(false);
    return (
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
            borderBottom: currentPath === "/mainpageafterlogin" ? "2px solid black" : "none",
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
              currentPath === "/AiInsights" ? "2px solid black" : "none",
          }}
          onClick={() => navigate("/AiInsights")}
        >
          Ai Insights
        </span>

          {/* --- WordOfTheDay --- */}
          <span
              className="nav-link"
              style={{
                ...styles.navLink,
                borderBottom:
                  currentPath === "/wordOfTheDay" ? "2px solid black" : "none",
              }}
              onClick={() => navigate("/wordOfTheDay")}
          >
              Word of the Day
          </span>
        <span
          className="nav-link"
          style={{
            ...styles.navLink,
            borderBottom:
              currentPath === "/About_us" ? "2px solid black" : "none",
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
              
              <div style={styles.dropdownItem}
              onClick={() => navigate("/CompanySearch")}>
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
          <User size={24} color="black" style={styles.userIcon} onClick={() => navigate("/Profile_page")}/>
          
        </div>
      </nav>
    </header>)
  };
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 1rem",
    backgroundColor: "#DEE6E6",
    border: "1px solid #000",
    borderRadius: "8px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexWrap: "wrap",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  },

  navLink: {
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    color: "#333",
    textDecoration: "none",
  },

  userIcon: {
    cursor: "pointer",
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

  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    padding: "0.5rem 0",
    minWidth: "200px",
    zIndex: 2000,
  },

  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.6rem 1rem",
    cursor: "pointer",
    fontSize: "0.9rem",
  },

  // 📱 MOBILE RESPONSIVENESS
  "@media (max-width: 768px)": {
    nav: {
      gap: "1rem",
    },
    navLink: {
      fontSize: "0.85rem",
    },
    header: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "0.75rem",
    },
  },

  "@media (max-width: 480px)": {
    nav: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "0.5rem",
    },
    navLink: {
      fontSize: "0.8rem",
    },
    headerLeft: {
      width: "100%",
      justifyContent: "center",
    },
  },
};


export default Header;
