import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, History, Settings, Wrench, BarChart, TrendingUp, Search, Activity, BookOpen,Cpu,GitCompare } from "lucide-react";
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import { color } from "chart.js/helpers";
import Default_photo from '../images/default_news.png';

const NewsPage = () => {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Dummy static news data
  const newsArticles = [
    {
      title: "Nigeria Firms Seen Mending Balance Sheets as Profits, Economy Recover",
      author: "Bloomberg",
      source: "Biztoc",
      publishedAt: "2025-10-28T15:47:00Z",
      urlToImage: "https://biztoc.com/x/39c9a9c5fab03ce_s.webp",
      url: "https://biztoc.com/",
    },
    {
      title: "How to identify good companies to invest in? Learn to analyse balance sheets",
      author: "Sameer Bhardwaj",
      source: "The Times of India",
      publishedAt: "2025-10-27T01:00:00Z",
      urlToImage:
        "https://img.etimg.com/thumb/width-1200,height-900,imgsize-71006,resizemode-75,msid-124798097/wealth/invest/how-to-identify-good-companies-to-invest-in-learn-to-analyse-balance-sheets.jpg",
      url: "https://economictimes.indiatimes.com/",
    },
    {
      title: "AI’s Move From Banking Back Offices to Balance Sheets Warrants Caution",
      author: "PYMNTS",
      source: "Biztoc",
      publishedAt: "2025-10-26T20:30:00Z",
      urlToImage: "https://biztoc.com/x/b2c06614397f06_s.webp",
      url: "https://biztoc.com/",
    },
    {
      title: "Nigeria Firms Seen Mending Balance Sheets as Profits, Economy Recover",
      author: "Bloomberg",
      source: "Biztoc",
      publishedAt: "2025-10-28T15:47:00Z",
      urlToImage: "https://biztoc.com/x/39c9a9c5fab03ce_s.webp",
      url: "https://biztoc.com/",
    },
    {
      title: "How to identify good companies to invest in? Learn to analyse balance sheets",
      author: "Sameer Bhardwaj",
      source: "The Times of India",
      publishedAt: "2025-10-27T01:00:00Z",
      urlToImage:
        "https://img.etimg.com/thumb/width-1200,height-900,imgsize-71006,resizemode-75,msid-124798097/wealth/invest/how-to-identify-good-companies-to-invest-in-learn-to-analyse-balance-sheets.jpg",
      url: "https://economictimes.indiatimes.com/",
    },
    {
      title: "AI’s Move From Banking Back Offices to Balance Sheets Warrants Caution",
      author: "PYMNTS",
      source: "Biztoc",
      publishedAt: "2025-10-26T20:30:00Z",
      urlToImage: "https://biztoc.com/x/b2c06614397f06_s.webp",
      url: "https://biztoc.com/",
    },
    {
      title: "Nigeria Firms Seen Mending Balance Sheets as Profits, Economy Recover",
      author: "Bloomberg",
      source: "Biztoc",
      publishedAt: "2025-10-28T15:47:00Z",
      urlToImage: "https://biztoc.com/x/39c9a9c5fab03ce_s.webp",
      url: "https://biztoc.com/",
    },
    {
      title: "How to identify good companies to invest in? Learn to analyse balance sheets",
      author: "Sameer Bhardwaj",
      source: "The Times of India",
      publishedAt: "2025-10-27T01:00:00Z",
      urlToImage:
        "https://img.etimg.com/thumb/width-1200,height-900,imgsize-71006,resizemode-75,msid-124798097/wealth/invest/how-to-identify-good-companies-to-invest-in-learn-to-analyse-balance-sheets.jpg",
      url: "https://economictimes.indiatimes.com/",
    },
    {
      title: "AI’s Move From Banking Back Offices to Balance Sheets Warrants Caution",
      author: "PYMNTS",
      source: "Biztoc",
      publishedAt: "2025-10-26T20:30:00Z",
      urlToImage: "https://biztoc.com/x/b2c06614397f06_s.webp",
      url: "https://biztoc.com/",
    },
  ];

  //  Filter news based on search text
  const filteredArticles = newsArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.author.toLowerCase().includes(search.toLowerCase()) ||
      article.source.toLowerCase().includes(search.toLowerCase())
  );

  //  Check if we are on News page (for underline)
  const isNewsActive = location.pathname === "/NewsPage";
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
            style={styles.navLink}
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
                location.pathname === "/AboutUs" ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/AboutUs")}
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
                  <TrendingUp size={16} />
                  <span>Debt Ratings</span>
                </div>
                <div style={styles.dropdownItem}>
                  <Search size={16} />
                  <span>Search Companies</span>
                </div>
                <div style={styles.dropdownItem}>
                  <Activity size={16} />
                  <span>Trends & KPIs</span>
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
                <div style={styles.dropdownItem}>
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
            <li style={styles.functionsItem}>Debt ratings</li>
            <li style={styles.functionsItem}>search companies</li>
            <li style={styles.functionsItem}>Blog Page</li>
            <li style={styles.functionsItem}>Trends & KPIs</li>
            <li style={styles.functionsItem}>Compare companies</li>
          </ul>
        </div>
      </footer>
    );
  return (
    <>
      {/*  HEADER SECTION */}
      <Header />

      {/* 📰 MAIN NEWS SECTION */}
      <div style={styles.container}>
        

        {/* Search Bar */}
        <div style={{ position: "relative", width: "900px" }}>
            <Search
                size={20}
                color="gray"
                style={{
                position: "absolute",
                left: "10px",
                top: "30%",
                transform: "translateY(-50%)",
                }}
            />
            <input
                type="text"
                placeholder="Search news..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                ...styles.search,
                paddingLeft: "35px", //  make space for the icon
                }}
            />
            </div>
<h1 style={styles.heading}>Latest News</h1>

        {/* News Grid */}
        <div style={styles.grid}>
          {filteredArticles.map((article, index) => (
            <div key={index} style={styles.card}>
              <img
                src={article.urlToImage || Default_photo}
                alt="news"
                style={styles.image}
                onError={(e) => {
                e.target.onerror = null; // avoid infinite loop
                e.target.src = Default_photo; // fallback to default image
                }}
              />
              <h3 style={styles.title}>{article.title}</h3>
              <p style={styles.source}>
                {article.source} — <em>{article.author}</em>
              </p>
              <p style={styles.date}>
                {new Date(article.publishedAt).toLocaleString()}
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                Read more →
              </a>
            </div>
          ))}
        </div>
      </div>
<Footer />
    </>
  );
};


/* CSS */
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


 logo: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },


  brandName: {
    fontWeight: '600'
  },

  nav: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '10px',
  },

 navLink: {
    cursor: 'pointer',
    color: '#000000',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'opacity 0.3s',
  },

  userMenu: {
    position: 'relative',
    cursor: 'pointer',
    color: 'Black'
  },

  userIcon: {
    transition: 'color 0.2s'
  },

  dropdown: {
    position: 'absolute',
    right: '0',
    top: '32px',
    backgroundColor: '#D9D9D9',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(245, 238, 238, 0.2)',
    padding: '0.5rem',
    minWidth: '120px',
    zIndex: 1000
  },

  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '14px'
  },
  
  container: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1rem',
  },

  heading: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  search: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "2rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "linear-gradient(135deg, #e6ecf7ff, #ffffff)",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "1rem",
    transition: "transform 0.2s",
    border: "1px solid #1e1e1eff",
  },
  image: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    marginTop: "0.5rem",
  },
  source: {
    fontSize: "14px",
    color: "#555",
  },
  date: {
    fontSize: "12px",
    color: "#999",
    marginBottom: "0.5rem",
  },
  link: {
    textDecoration: "none",
    color: "#007bff",
    fontWeight: "500",
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
    fontSize: '13px',
    marginBottom: 0,
    lineHeight: 1.8,
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
  
  toolsMenu: {
  position: "relative",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  marginLeft: "1rem", 
  color: "Black"
},

};

export default NewsPage;
