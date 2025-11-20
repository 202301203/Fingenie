import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, History, Settings, Wrench, BarChart, TrendingUp, Search, Activity, BookOpen,Cpu,GitCompare } from "lucide-react";
import Default_photo from '../images/default_news.png';
import Header from "../components/Header";
import Footer from "../components/Footer";
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
  

};

export default NewsPage;
