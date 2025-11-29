import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  User,
  LogOut,
  History,
  Settings,
  Wrench,
  BarChart,
  TrendingUp,
  Search,
  Activity,
  BookOpen,
  Cpu,
  GitCompare,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import api from '../api/index';

// Use centralized backend base from api module (falls back to render URL)
const API_BASE_URL = api.DJANGO_API_BASE || 'https://fingenie-siu7.onrender.com';
const Default_photo =
  "https://i.pinimg.com/1200x/45/d4/87/45d487585543758244ed9774b7c83d1e.jpg";
const NewsPage = () => {
  // UI state
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  // Data state
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

  // Extract page number from URL
  const getPageFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return parseInt(params.get("page")) || 1;
  };

  const [currentPage, setCurrentPage] = useState(getPageFromQuery());

  // Fetch Articles Function
  const fetchArticles = useCallback(
    async (pageNumber) => {
      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE_URL}/api/articles/?page=${pageNumber}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error fetching articles");
        }

        const data = await response.json();

        setArticles(data.articles || []);
        setPagination({
          page: data.page,
          total_pages: data.total_pages,
          next_page: data.next_page,
          prev_page: data.prev_page,
        });

        navigate(`/NewsPage?page=${pageNumber}`, { replace: true });
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not fetch news.");
        setArticles([]);
      }

      setLoading(false);
    },
    [navigate]
  );

  // Run fetch when page changes
  useEffect(() => {
    fetchArticles(currentPage);
  }, [currentPage, fetchArticles]);

  // Filtered articles based on search
  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      (article.author &&
        article.author.toLowerCase().includes(search.toLowerCase())) ||
      (article.source?.name &&
        article.source.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination handler
  const goToPage = (page) => {
    if (page && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Pagination Component
  const PaginationControls = () => (
    <div style={styles.paginationContainer}>
      <button
        onClick={() => goToPage(pagination.prev_page)}
        disabled={!pagination.prev_page || loading}
        style={styles.paginationButton}
      >
        <ChevronLeft size={20} /> Previous
      </button>

      <span style={styles.paginationInfo}>
        Page {pagination.page} of {pagination.total_pages}
      </span>

      <button
        onClick={() => goToPage(pagination.next_page)}
        disabled={!pagination.next_page || loading}
        style={styles.paginationButton}
      >
        Next <ChevronRight size={20} />
      </button>
    </div>
  );

  return (
    <>
      <Header />

      <div style={styles.container}>
      
        <h1 style={styles.heading}>Latest Financial News</h1>
        {/* 🔍 Search */}
        <div style={styles.searchWrapper}>
  <Search size={20} color="gray" style={styles.searchIcon} />
  <input
    type="text"
    placeholder="Search news by title, author, or source..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={styles.search}
    disabled={loading || error}
  />
</div>
        {/* 📰 News Grid */}
        {loading ? (
          <p>Loading news...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : filteredArticles.length === 0 ? (
          <p>No articles match your search.</p>
        ) : (
          <div style={styles.grid}>
            {filteredArticles.map((article, index) => (
              <div key={index} style={styles.card}>
                <img
                  src={article.urlToImage || Default_photo}
                  alt="news"
                  style={styles.image}
                  onError={(e) => (e.target.src = Default_photo)}
                />

                <h3 style={styles.title}>{article.title}</h3>
                <p style={styles.source}>
                  {article.source?.name || "Unknown Source"} —{" "}
                  <em>{article.author || "No Author"}</em>
                </p>

                <p style={styles.date}>
                  {new Date(article.publishedAt).toLocaleString()}
                </p>

                <a href={article.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  Read more →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && articles.length > 0 && <PaginationControls />}
      </div>

      <Footer />
    </>
  );
};

const styles = {
  container: {
    margin: "2rem auto",
    padding: "0 1rem",
  },
  heading: {
    fontSize: "32px",
    textAlign: "center",
    fontWeight: "bold",
    marginTop: "2rem",
    marginBottom: "2rem",
  },
  search: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "2rem",
  },
searchWrapper: {
  position: "relative",
  width: "70%",
  margin: "2rem auto",
},

searchIcon: {
  position: "absolute",
  left: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
},

search: {
  width: "100%",
  padding: "12px 15px",
  paddingLeft: "40px",   // space for icon
  borderRadius: "12px",
  border: "1px solid #ccc",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
},

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "linear-gradient(135deg, #e6ecf7ff, #ffffff)",
    borderRadius: "10px",
    border: "1px solid #1e1e1e",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  image: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  title: {
    marginTop: "0.5rem",
    fontSize: "18px",
    fontWeight: "600",
  },
  source: {
    marginTop: "0.25rem",
    fontSize: "14px",
    color: "#555",
  },
  date: {
    marginTop: "0.25rem",
    fontSize: "12px",
    color: "#999",
  },
  link: {
    textDecoration: "none",
    fontWeight: "500",
    color: "#007bff",
    marginTop: "0.5rem",
    display: "inline-block",
  },
  paginationContainer: {
    marginTop: "2rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
  },
  paginationButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    cursor: "pointer",
    background: "#f8f9fa",
  },
  paginationInfo: {
    fontSize: "16px",
    fontWeight: "500",
  },
};

export default NewsPage;
