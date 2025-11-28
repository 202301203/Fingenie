import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Filter, PenTool, User, ChevronDown, ArrowLeft, 
  Heart, Share2, Bookmark,
  Loader
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { blogService } from '../api/index';
import Header from "../components/Header";
import Footer from "../components/Footer";



const FinanceBlog = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('listing');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategories, setShowCategories] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  const [notification, setNotification] = useState(''); 
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [featuredImage, setFeaturedImage] = useState(null); 
  //const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  // State for blog posts from backend
  const [blogPosts, setBlogPosts] = useState([]);
  
  // Validation constants
  const MIN_SNIPPET_LENGTH = 50;
  const MIN_CONTENT_LENGTH = 200;
  const [validationError, setValidationError] = useState('');

  // New blog form state
  const [newBlog, setNewBlog] = useState({
    title: '',
    category: 'Investments',
    snippet: '',
    content: '',
    imageFile: null,
    imageFileName: '',
  });

  const categories = [
    'All',
    'Investments',
    'Personal Finance',
    'Market Analysis',
    'Future of Finance'
  ];

  const DEFAULT_CATEGORY_IMAGES = {
    'Investments': "https://i.pinimg.com/736x/13/b9/cc/13b9cc9cb1fddf08392c21fb68f85c09.jpg",
    'Personal Finance': "https://i.pinimg.com/1200x/33/8d/92/338d92cec5fcb758ce0784c463f594e1.jpg",
    'Market Analysis': "https://i.pinimg.com/1200x/18/e7/0a/18e70a31251b63c18a0013cb85ae1cf7.jpg",
    'Future of Finance': "https://i.pinimg.com/1200x/47/3c/70/473c7030371b165e85647d392b977de3.jpg",
    'default': "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&h=300&fit=crop", 
  };

  // Fetch blog posts from backend
  const fetchBlogPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      
      const response = await blogService.getBlogPosts(params);
      
      // Handle Django response format
      console.log('Blog API Response:', response); // Debug log
      
      let posts = [];
      if (response.success) {
        // Django success format
        posts = response.posts || response.data || [];
      } else if (Array.isArray(response)) {
        // Direct array
        posts = response;
      } else {
        // Other formats
        posts = response.data || response.results || response.posts || [];
      }
      
      setBlogPosts(posts);
    } catch (err) {
      setError('Failed to fetch blog posts');
      console.error('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load blog posts on component mount and when filters change
  useEffect(() => {
    fetchBlogPosts();
  }, [searchQuery, selectedCategory, sortBy]);

  const showNotification = (message) => { 
    setNotification(message); 
    setTimeout(() => setNotification(''), 3000); 
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewBlog(prevBlog => ({
        ...prevBlog,
        imageFile: file,
        imageFileName: file.name
      }));
    }
  };

  const handleCancelImage = () => {
    setNewBlog(prevBlog => ({
      ...prevBlog,
      imageFile: null,
      imageFileName: '',
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleArticleClick = async (article) => {
    setLoading(true);
    try {
      const response = await blogService.getBlogPost(article.id);
      const articleData = response.data || response;
      setSelectedArticle(articleData);
      setCurrentView('article');
      window.scrollTo(0, 0);
    } catch (err) {
      setError('Failed to load article');
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToListing = () => {
    setCurrentView('listing');
    setSelectedArticle(null);
  };

  const handleCreateBlog = () => {
    setCurrentView('create');
    setNewBlog({
      title: '',
      snippet: '',
      category: 'Investments',
      content: '',
      imageFile: null,
      imageFileName: '',
    });
    setValidationError('');
  };

  const handleSubmitBlog = async () => {
    // Validation
    if (!newBlog.title || !newBlog.snippet || !newBlog.content) {
      setValidationError('Please fill in all required fields');
      return;
    }

    if (newBlog.snippet.length < MIN_SNIPPET_LENGTH) {
      setValidationError(`Short Description must be at least ${MIN_SNIPPET_LENGTH} characters long.`);
      return;
    }

    if (newBlog.content.length < MIN_CONTENT_LENGTH) {
      setValidationError(`Content must be at least ${MIN_CONTENT_LENGTH} characters long.`);
      return;
    }

    setLoading(true);
    setError('');
    setValidationError('');
    
    try {
      // Test authentication first
      const authCheck = await blogService.testAuth();
      console.log('Auth check result:', authCheck);
      
      if (!authCheck.authenticated) {
        setError('You need to be logged in to create a blog post. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Creating blog post as user:', authCheck.user);
      
      // Create FormData for proper file upload
      const formData = new FormData();
      formData.append('title', newBlog.title);
      formData.append('category', newBlog.category);
      formData.append('snippet', newBlog.snippet);
      formData.append('content', newBlog.content);
      
      // Add image if present
      if (newBlog.imageFile) {
        formData.append('image', newBlog.imageFile);
      }
      
      console.log('Sending blog data...');
      
      // Send the request
      const result = await blogService.createBlogPost(formData);
      console.log('Blog creation result:', result);
      
      showNotification('Blog post created successfully!');
      setCurrentView('listing');
      
      // Reset form
      setNewBlog({
        title: '',
        category: 'Investments',
        snippet: '',
        content: '',
        imageFile: null,
        imageFileName: '',
      });
      
      // Refresh the blog posts
      await fetchBlogPosts();
    } catch (err) {
      console.error('Full error creating blog post:', err);
      console.error('Error response:', err.response);
      
      // Better error messages
      if (err.response) {
        const errorMsg = err.response.data?.detail || 
                        err.response.data?.message || 
                        JSON.stringify(err.response.data);
        setError(`Failed to create blog post: ${errorMsg}`);
      } else if (err.request) {
        setError('Network error: Could not reach the server. Please check your connection.');
      } else {
        setError('Failed to create blog post: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id) => {
    try {
      const response = await blogService.toggleLike(id);
      const responseData = response.data || response;
      
      setBlogPosts(blogPosts.map(post => 
        post.id === id 
          ? { 
              ...post, 
              likes: responseData.likes_count || post.likes,
              is_liked: responseData.liked 
            }
          : post
      ));
      
      if (selectedArticle && selectedArticle.id === id) {
        setSelectedArticle({
          ...selectedArticle,
          likes: responseData.likes_count || selectedArticle.likes,
          is_liked: responseData.liked
        });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmark = async (id) => {
    try {
      const response = await blogService.toggleBookmark(id);
      const responseData = response.data || response;
      
      setBlogPosts(blogPosts.map(post => 
        post.id === id 
          ? { ...post, is_bookmarked: responseData.bookmarked }
          : post
      ));
      
      if (selectedArticle && selectedArticle.id === id) {
        setSelectedArticle({
          ...selectedArticle,
          is_bookmarked: responseData.bookmarked
        });
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  // Filter and sort posts
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.snippet?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           post.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
    } else if (sortBy === 'popular') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return 0;
  });

  const popularPosts = sortedPosts.slice(0, 3);
  const latestPosts = sortedPosts.slice(3, 6);

  // Helper function to format date from backend
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get default image based on category
  const getDefaultImage = (category) => {
    return DEFAULT_CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGES.default;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
     <Header/>

      {/* Notification */}
      {notification && (
        <div style={styles.notification}>
          {notification}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={styles.errorText}>
          {error}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <Loader size={32} style={styles.spinner} />
          <span>Loading...</span>
        </div>
      )}

      {/* Sub-Header / Filter Bar */}
      {currentView === 'listing' && (
        <div style={styles.filterBar}>
          <div style={styles.filterContent}>
            <div style={styles.searchSection}>
              <Search size={20} color="#6c757d" style={{ marginLeft: '12px' }}/>
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={{position: 'relative'}}>
              <button 
                style={styles.categoriesButton}
                onClick={() => setShowCategories(!showCategories)}
              >
                Categories
              </button>
              {showCategories && (
                <div style={styles.dropdown}>
                  {categories.map(cat => (
                    <div
                      key={cat}
                      style={styles.dropdownItem}
                      onClick={() => {
                        setSelectedCategory(cat.toLowerCase());
                        setShowCategories(false);
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{position: 'relative'}}>
              <button 
                style={styles.filterButton}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filter
              </button>
              {showFilters && (
                <div style={styles.dropdown}>
                  <div
                    style={styles.dropdownItem}
                    onClick={() => {
                      setSortBy('recent');
                      setShowFilters(false);
                    }}
                  >
                    Most Recent
                  </div>
                  <div
                    style={styles.dropdownItem}
                    onClick={() => {
                      setSortBy('popular');
                      setShowFilters(false);
                    }}
                  >
                    Most Popular
                  </div>
                </div>
              )}
            </div>
            <button 
              style={styles.createButton}
              onClick={handleCreateBlog}
            >
              <PenTool size={16} color="#3a3f44" />
              <span style={{marginLeft: '8px'}}>Create</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Blog View */}
      {currentView === 'create' && (
        <div style={styles.createContainer}>
          <div style={styles.createHeader}>
            <button style={styles.backButton} onClick={handleBackToListing}>
              <ArrowLeft size={20} />
              <span style={{marginLeft: '8px'}}>Back to Blogs</span>
            </button>
            <h1 style={styles.createTitle}>Create New Blog Post</h1>
          </div>
          
          <div style={styles.createForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter blog title..."
                value={newBlog.title}
                onChange={(e) => setNewBlog({...newBlog, title: e.target.value})}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category *</label>
              <select
                style={styles.select}
                value={newBlog.category}
                onChange={(e) => setNewBlog({...newBlog, category: e.target.value})}
              >
                <option>Investments</option>
                <option>Personal Finance</option>
                <option>Market Analysis</option>
                <option>Future of Finance</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Short Description *</label>
              <textarea
                style={{...styles.input, minHeight: '80px'}}
                placeholder={`Brief description of your blog (Min ${MIN_SNIPPET_LENGTH} characters)...`}
                value={newBlog.snippet}
                onChange={(e) => setNewBlog({...newBlog, snippet: e.target.value})}
              />
              <span style={styles.lengthIndicator}>
                {newBlog.snippet.length} / {MIN_SNIPPET_LENGTH} characters
              </span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Content *</label>
              <textarea
                style={{...styles.input, minHeight: '300px', fontFamily: 'inherit'}}
                placeholder={`Write your blog content here (Min ${MIN_CONTENT_LENGTH} characters)...`}
                value={newBlog.content}
                onChange={(e) => setNewBlog({...newBlog, content: e.target.value})}
              />
              <span style={styles.lengthIndicator}>
                {newBlog.content.length} / {MIN_CONTENT_LENGTH} characters
              </span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Featured Image</label>
              <input
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                ref={fileInputRef} 
                style={{ display: 'none' }}
              />
              {newBlog.imageFileName ? (
                <div style={styles.uploadedFileContainer}>
                  <span style={styles.uploadedFileName}>
                    {newBlog.imageFileName}
                  </span>
                  <button 
                    style={styles.cancelImageButton} 
                    onClick={handleCancelImage} 
                    title="Remove image"
                  >
                    &times; 
                  </button>
                </div>
              ) : (
                <div 
                  style={styles.customImageButton}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  Add Image
                </div>
              )}
            </div>

            {validationError && (
              <div style={styles.errorText}>
                {validationError}
              </div>
            )}

            <div style={styles.formActions}>
              <button style={styles.cancelButton} onClick={handleBackToListing}>
                Cancel
              </button>
              <button 
                style={styles.publishButton} 
                onClick={handleSubmitBlog}
                disabled={loading}
              >
                {loading ? 'Publishing...' : 'Publish Blog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article View */}
      {currentView === 'article' && selectedArticle && (
        <div style={styles.articleContainer}>
          <div style={styles.articleHeader}>
            <button style={styles.backButton} onClick={handleBackToListing}>
              <ArrowLeft size={20} />
              <span style={{marginLeft: '8px'}}>Back to Blogs</span>
            </button>
            <div style={styles.articleMeta}>
              <span style={styles.articleAuthor}>
                {selectedArticle.author_name || selectedArticle.author?.username || 'Unknown Author'}
              </span>
              <span style={styles.metaSeparator}>•</span>
              <span style={styles.articleDate}>
                {formatDate(selectedArticle.created_at)}
              </span>
            </div>
          </div>

          <div style={styles.articleContent}>
            <div style={{...styles.articleImageWrapper, background: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)"}}>
              <img 
                src={selectedArticle.image || getDefaultImage(selectedArticle.category)} 
                alt={selectedArticle.title} 
                style={styles.articleImage} 
                onError={(e) => {
                  e.target.src = getDefaultImage(selectedArticle.category);
                }}
              />
            </div>
            
            <div style={styles.articleBody}>
              <h1 style={{fontSize: '2.5rem', marginBottom: '1rem'}}>{selectedArticle.title}</h1>
              <div style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
                {selectedArticle.content}
              </div>
            </div>
          </div>

          <div style={styles.articleActions}>
            <button 
              style={{...styles.actionButton, color: selectedArticle.is_liked ? '#e74c3c' : '#6c757d'}}
              onClick={() => handleLike(selectedArticle.id)}
            >
              <Heart size={20} fill={selectedArticle.is_liked ? '#e74c3c' : 'none'} />
              <span style={{marginLeft: '6px'}}>{selectedArticle.likes || 0}</span>
            </button>
          </div>
        </div>
      )}

      {/* Listing View */}
      {currentView === 'listing' && (
        <main style={styles.main}>
          {searchQuery && (
            <div style={styles.searchInfo}>
              Showing results for "{searchQuery}" 
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </div>
          )}
          
          <div style={styles.contentGrid}>
            {/* Most Popular Section */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Most Popular</h2>
              <div style={styles.cardGrid}>
                {popularPosts.length > 0 ? popularPosts.map(post => (
                  <article 
                    key={post.id} 
                    style={{ ...styles.card, backgroundColor: '#e8f0f0ff' }}
                    onClick={() => handleArticleClick(post)}
                  >
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{post.title}</h3>
                      <div style={{...styles.cardImageWrapper, background: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)"}}>
                        <img 
                          src={post.image || getDefaultImage(post.category)} 
                          alt={post.title} 
                          style={styles.cardImage} 
                          onError={(e) => {
                            e.target.src = getDefaultImage(post.category);
                          }}
                        />
                      </div>
                      <span style={styles.categoryBadge}>{post.category}</span>
                      <p style={styles.cardSnippet}>{post.snippet}</p>
                      <span style={styles.readMore}>Read more...</span>
                      <div style={styles.cardMeta}>
                        <span style={styles.metaLabel}>Author:</span>
                        <span style={styles.metaValue}>{post.author_name || post.author?.username || 'Unknown'}</span>
                        <span style={styles.metaSeparator}>|</span>
                        <span style={styles.metaLabel}>Date:</span>
                        <span style={styles.metaValue}>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </article>
                )) : (
                  !loading && <p style={styles.noResults}>No blogs found</p>
                )}
              </div>
            </section>

            {/* Latest Section */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Latest</h2>
              <div style={styles.cardGrid}>
                {latestPosts.length > 0 ? latestPosts.map(post => (
                  <article 
                    key={post.id} 
                    style={{ ...styles.card, backgroundColor: '#F8FAF1' }}
                    onClick={() => handleArticleClick(post)}
                  >
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{post.title}</h3>
                      <div style={{...styles.cardImageWrapper, background: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)"}}>
                        <img 
                          src={post.image || getDefaultImage(post.category)} 
                          alt={post.title} 
                          style={styles.cardImage} 
                          onError={(e) => {
                            e.target.src = getDefaultImage(post.category);
                          }}
                        />
                      </div>
                      <span style={styles.categoryBadge}>{post.category}</span>
                      <p style={styles.cardSnippet}>{post.snippet}</p>
                      <span style={styles.readMore}>Read more...</span>
                      <div style={styles.cardMeta}>
                        <span style={styles.metaLabel}>Author:</span>
                        <span style={styles.metaValue}>{post.author_name || post.author?.username || 'Unknown'}</span>
                        <span style={styles.metaSeparator}>|</span>
                        <span style={styles.metaLabel}>Date:</span>
                        <span style={styles.metaValue}>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </article>
                )) : (
                  !loading && <p style={styles.noResults}>No blogs found</p>
                )}
              </div>
            </section>
          </div>
        </main>
      )}

      {/* Footer */}
       <Footer/>


    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffffff',
    fontFamily: '"Bricolage Grotesque", sans-serif',
  },

  filterBar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #dee2e6',
    padding: '16px 0',
  },

  filterContent: {
    width: '90%',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',           // allow wrapping on small screens
  },

  searchSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #252525ff',
    borderRadius: '20px',
    flex: 1,
    minWidth: '200px',
    maxWidth: '300px',
  },

  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    padding: '8px',
    width: '100%',
    backgroundColor: 'transparent',
  },

  categoriesButton: {
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    borderRadius: '20px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },

  filterButton: {
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    borderRadius: '20px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },

  createButton: {
    backgroundColor: '#E6EFB7',
    color: '#3a3f44',
    border: '1px solid #000',
    borderRadius: '20px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },

  /* --- RESPONSIVE MEDIA QUERIES --- */
  '@media (max-width: 900px)': {
    filterContent: {
      padding: '0 16px',
      gap: '12px',
    },
    createButton: {
      marginLeft: 0,   // no forced push to right
      width: '100%',   // full width on tablet
      justifyContent: 'center',
    },
  },

  '@media (max-width: 600px)': {
    filterContent: {
      flexDirection: 'column',  // stack vertically
      alignItems: 'stretch',
      gap: '12px',
    },
    searchSection: {
      maxWidth: '100%',
      minWidth: '100%',
    },
    categoriesButton: {
      width: '100%',
      textAlign: 'center',
    },
    filterButton: {
      width: '100%',
      textAlign: 'center',
    },
    createButton: {
      width: '100%',
      justifyContent: 'center',
    },
  },

  notification: {
    position: 'fixed',
    top: '100px',
    right: '20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '4px',
    zIndex: 1001,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  errorText: {
    color: '#dc3545',
    fontWeight: 'bold',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #dc3545',
    borderRadius: '4px',
    backgroundColor: '#f8d7da',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 32px 80px',
  },
  searchInfo: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '16px 32px 0',
    fontSize: '14px',
    color: '#6c757d',
  },
  contentGrid: {
     display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },

  section: {
    backgroundColor: '#ffffffff',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid #000000ff',
  },

  sectionTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111111ff',
    marginBottom: '28px',
    marginTop: '0',

    '@media (max-width: 600px)': {
      fontSize: '22px',
      marginBottom: '20px',
    },
  },

  cardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',

    '@media (max-width: 600px)': {
      gap: '18px',
    },
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1.5px solid #000000ff',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },

  cardContent: {
    padding: '24px',

    '@media (max-width: 600px)': {
      padding: '16px',
    },
  },

  cardTitle: {
    fontSize: '25px',
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: '12px',
    marginTop: '0',
    lineHeight: '1.4',

    '@media (max-width: 600px)': {
      fontSize: '20px',
    },
  },

  cardImageWrapper: {
    width: '100%',
    height: '180px',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: '12px',

    '@media (max-width: 600px)': {
      height: '140px', // adjust height for small screens
    },
  },

  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0.7',
    mixBlendMode: 'multiply',
  },

  categoryBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#404951ff',
    backgroundColor: '#c9cfd5ff',
    padding: '4px 12px',
    borderRadius: '12px',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',

    '@media (max-width: 600px)': {
      fontSize: '10px',
      padding: '3px 10px',
    },
  },

  cardSnippet: {
    fontSize: '14px',
    color: '#2e3235ff',
    lineHeight: '1.6',
    marginBottom: '14px',
    display: 'block',

    '@media (max-width: 600px)': {
      fontSize: '13px',
    },
  },

  readMore: {
    fontSize: '14px',
    color: '#6c757d',
    textDecoration: 'underline',
    fontWeight: '500',
    display: 'inline-block',
    marginBottom: '16px',
    transition: 'color 0.2s',

    '@media (max-width: 600px)': {
      fontSize: '13px',
    },
  },

  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#868e96',
    flexWrap: 'wrap',
    gap: '6px',
    justifyContent: 'flex-end',

    '@media (max-width: 600px)': {
      justifyContent: 'flex-start',
      fontSize: '11px',
    },
  },
  metaLabel: {
    color: '#868e96',
    fontWeight: '500',
  },
  metaValue: {
    color: '#58616aff',
    fontWeight: '400',
  },
  metaSeparator: {
    color: '#dee2e6',
    margin: '0 4px',
  },
  noResults: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '16px',
    padding: '40px 0',
  },
  articleContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 32px 80px',
  },
  articleHeader: {
    marginBottom: '32px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: '#3a3f44',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '16px',
    transition: 'color 0.2s',
  },
  articleMeta: {
    fontSize: '14px',
    color: '#6c757d',
  },
  articleAuthor: {
    fontWeight: '600',
    color: '#495057',
  },
  articleDate: {
    color: '#6c757d',
  },
  articleContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '32px',
  },
  articleImageWrapper: {
    width: '100%',
    height: '400px',
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0.7',
    mixBlendMode: 'multiply',
  },
  articleBody: {
    padding: '40px',
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#2b2d2f',
  },
  articleActions: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: '#6c757d',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '12px 20px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  createContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 32px 80px',
  },
  createHeader: {
    marginBottom: '32px',
  },
  createTitle: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#2b2d2f',
    marginTop: '16px',
  },
  createForm: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
  },
  formGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '600',
    color: '#2b2d2f',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  lengthIndicator: {
    display: 'block',
    marginTop: '5px',
    fontSize: '12px',
    color: '#6c757d',
    textAlign: 'right',
  },
  uploadedFileContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
  },
  uploadedFileName: {
    flex: 1,
    fontSize: '14px',
    color: '#495057',
  },
  cancelImageButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#dc3545',
    padding: '0 5px',
  },
  customImageButton: {
    backgroundColor: '#a5d7b0ff',
    color: '#3d3d3d',
    padding: '12px 32px',
    fontSize: '15px',
    borderRadius: '15px',
    fontWeight: '500',
    textAlign: 'center',
    cursor: 'pointer',
    width: 'fit-content',
    userSelect: 'none',
    transition: 'background-color 0.2s',
    border: 'none',
  },
  formActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-end',
    marginTop: '32px',
  },
  cancelButton: {
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6c757d',
    backgroundColor: '#ffffff',
    border: '1px solid #dee2e6',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  publishButton: {
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#539763ff',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },


};

// Add CSS for spinner animation
const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = spinnerStyles;
  document.head.appendChild(styleSheet);
}

export default FinanceBlog;