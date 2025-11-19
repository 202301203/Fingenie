import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, History, Settings, Wrench, Search, Activity, BookOpen, Cpu, GitCompare, ChevronLeft, ChevronRight } from "lucide-react";
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import Default_photo from '../images/default_news.png';

// --- Configuration ---
// Base URL for your Django API (Adjust this if your frontend and backend are on different ports/hosts)
const API_BASE_URL = "http://localhost:8000/news"; // Assuming Django runs on port 8000

const NewsPage = () => {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  
  // API Data State
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    next_page: null,
    prev_page: null,
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page from URL query parameter, default to 1
  const getPageFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return parseInt(params.get('page')) || 1;
  };

  const [currentPage, setCurrentPage] = useState(getPageFromQuery());

  // --- Data Fetching Function ---
  const fetchArticles = useCallback(async (pageNumber) => {
    setLoading(true);
    setError(null);
    
    // Construct the URL with the page query parameter
    const url = `${API_BASE_URL}/api/articles/?page=${pageNumber}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        // Check for HTTP errors (4xx or 5xx)
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Update state with fetched data
      setArticles(data.articles || []);
      setPagination({
        page: data.page,
        total_pages: data.total_pages,
        next_page: data.next_page,
        prev_page: data.prev_page,
      });
      
      // Update the URL in the browser
      navigate(`/NewsPage?page=${pageNumber}`, { replace: true });

    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError(err.message || "Could not fetch financial news articles.");
      setArticles([]); // Clear articles on error
      setPagination({ page: pageNumber, total_pages: 1, next_page: null, prev_page: null });
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Add navigate to dependency array

  // Effect to fetch articles when the component mounts or currentPage changes
  useEffect(() => {
    fetchArticles(currentPage);
  }, [currentPage, fetchArticles]);

  // Handler for search filtering (now applied to fetched articles)
  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      (article.author && article.author.toLowerCase().includes(search.toLowerCase())) ||
      (article.source && article.source.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination Handlers
  const goToPage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= pagination.total_pages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
    }
  };
  
  // Check if we are on News page (for underline)
  const isNewsActive = location.pathname === "/NewsPage" || location.pathname.startsWith("/NewsPage?");

  // --- Components ---
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
            borderBottom: 
            location.pathname === "/mainpageafterlogin" ? "2px solid black" : "none",
          }}
          onClick={() => navigate("/mainpageafterlogin")}
        >
          Home
        </span>
        <span
          className="nav-link"
          style={{
            ...styles.navLink,
            borderBottom: isNewsActive ? "2px solid black" : "none",
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
                  navigate("/homepage_beforelogin");      // Redirect to dashboard on logout
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

  const NewsContent = () => {
    if (loading) {
      return <div style={styles.infoMessage}>📈 Loading financial news...</div>;
    }

    if (error) {
      return <div style={styles.infoMessageError}>❌ Error fetching news: {error}</div>;
    }

    if (articles.length === 0) {
      return <div style={styles.infoMessage}>🤷 No articles found matching your search.</div>;
    }

    return (
      <>
        <div style={styles.grid}>
          {filteredArticles.map((article, index) => (
            <div key={index} style={styles.card}>
              <img
                // Check if article.urlToImage is null/empty and if the nested source object exists
                src={(article.urlToImage || Default_photo)}
                alt="news"
                style={styles.image}
                onError={(e) => {
                  e.target.onerror = null; // avoid infinite loop
                  e.target.src = Default_photo; // fallback to default image
                }}
              />
              <h3 style={styles.title}>{article.title}</h3>
              <p style={styles.source}>
                {/* Assuming source is an object { id, name } */}
                {article.source?.name || 'Unknown Source'} — <em>{article.author || 'No Author'}</em>
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
      </>
    );
  };

  const PaginationControls = () => (
    <div style={styles.paginationContainer}>
      <button
        onClick={() => goToPage(pagination.prev_page)}
        disabled={!pagination.prev_page || loading}
        style={{ ...styles.paginationButton, marginRight: '1rem' }}
      >
        <ChevronLeft size={20} /> Previous
      </button>
      <span style={styles.paginationInfo}>
        Page **{pagination.page}** of **{pagination.total_pages}** ({pagination.total_results || 0} results)
      </span>
      <button
        onClick={() => goToPage(pagination.next_page)}
        disabled={!pagination.next_page || loading}
        style={{ ...styles.paginationButton, marginLeft: '1rem' }}
      >
        Next <ChevronRight size={20} />
      </button>
    </div>
  );
  
  // --- Main Render ---
  return (
    <>
      <Header />

      <div style={styles.container}>
        
        {/* Search Bar */}
        <div style={{ position: "relative", width: "100%", maxWidth: "900px", margin: "0 auto" }}>
          <Search
            size={20}
            color="gray"
            style={styles.searchIcon}
          />
          <input
            type="text"
            placeholder="Search news by title, author, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...styles.search,
              paddingLeft: "35px", // make space for the icon
            }}
            disabled={loading || error}
          />
        </div>

        <h1 style={styles.heading}>Latest Financial News</h1>
        
        {/* News Grid */}
        <NewsContent />

        {/* Pagination */}
        {!loading && articles.length > 0 && <PaginationControls />}

      </div>
      
      <Footer />
    </>
  );
};


/* CSS - Added/Modified styles for new components */
const styles = {
  // Existing styles (omitted for brevity, assume they are still there)
  // ...
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
  
  container: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1rem',
  },

  heading: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "1rem",
    textAlign: "center",
    marginTop: "2rem",
  },
  search: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "2rem",
    boxSizing: 'border-box', // Added for better layout
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none", // Ensures the input is clickable
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
    display: 'flex',
    flexDirection: 'column',
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
    flexGrow: 1, // Allows titles to push the link down
  },
  source: {
    fontSize: "14px",
    color: "#555",
    marginTop: '0.25rem',
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
    marginTop: '0.5rem',
    display: 'inline-block',
  },
  
  // --- New Styles for API Interaction and Pagination ---
  infoMessage: {
    textAlign: 'center',
    fontSize: '1.2rem',
    padding: '3rem',
    color: '#4a5568',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    margin: '2rem auto',
  },
  infoMessageError: {
    textAlign: 'center',
    fontSize: '1.2rem',
    padding: '3rem',
    color: '#e53e3e',
    backgroundColor: '#fee2e2',
    border: '1px solid #fc8181',
    borderRadius: '8px',
    margin: '2rem auto',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '2rem',
    marginBottom: '2rem',
  },
  paginationButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    cursor: 'pointer',
    backgroundColor: '#4D5C61',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.2s',
    gap: '0.5rem',
  },
  paginationInfo: {
    fontSize: '1rem',
    color: '#4a5568',
    fontWeight: '500',
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
};

export default NewsPage;
