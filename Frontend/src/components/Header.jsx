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
              currentPath === "/Chatbot" ? "2px solid black" : "none",
          }}
          onClick={() => navigate("/Chatbot")}
        >
          Chatbot
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
    </header>)
  };
const styles = {
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
};

export default Header;
