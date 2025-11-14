import React, { useState, useRef } from 'react';
import { 
  Search, Filter, PenTool, User, ChevronDown, ArrowLeft, 
  Heart, Share2, Bookmark, X, LogOut, History, Settings,
  Wrench, TrendingUp, Activity, BookOpen, Cpu, GitCompare  // Add these missing icons
} from 'lucide-react';
import fglogo_Wbg from './images/fglogo_Wbg.png';



const FinanceBlog = () => {
  const [activeTab, setActiveTab] = useState('blog');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentView, setCurrentView] = useState('listing'); // 'listing', 'article', 'create'
  const [showDropdown, setShowDropdown] = useState(false);

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
  const [isNewsActive, setIsNewsActive] = useState(false);

 const showNotification = (message) => { 
    setNotification(message); 
    setTimeout(() => setNotification(''), 3000); 
  };
  
  const [blogPosts, setBlogPosts] = useState([
    {
      id: 1,
      title: "Cracking the Code of Stock Market Psychology",
      image: "https://i.pinimg.com/1200x/18/e7/0a/18e70a31251b63c18a0013cb85ae1cf7.jpg",
      snippet: "Understanding investor behavior and market sentiment can be the key to making smarter investment decisions. Explore the psychological factors that drive market movements.",
      author: "Ananya Rao",
      date: "October 13, 2025",
      category: "Market Analysis",
      gradient: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)",
      content: `
        <h2>The Fear-Greed Cycle</h2>
        <p>The stock market is driven by two primary emotions: fear and greed. When markets are rising, greed takes over, causing investors to buy at inflated prices. Conversely, when markets fall, fear dominates, leading to panic selling at the worst possible times.</p>
        <p>Understanding this cycle is crucial for successful investing. The legendary investor Warren Buffett famously said, "Be fearful when others are greedy, and greedy when others are fearful." This contrarian approach has proven successful time and time again.</p>
        
        <h2>The Role of Cognitive Biases</h2>
        <p>Our brains are wired with numerous cognitive biases that can sabotage our investment decisions:</p>
        <ul>
          <li><strong>Confirmation Bias:</strong> We tend to seek information that confirms our existing beliefs while ignoring contradictory evidence.</li>
          <li><strong>Loss Aversion:</strong> The pain of losing money is psychologically twice as powerful as the pleasure of gaining it.</li>
          <li><strong>Herd Mentality:</strong> We feel safer following the crowd, even when the crowd is wrong.</li>
          <li><strong>Recency Bias:</strong> We give too much weight to recent events and assume current trends will continue indefinitely.</li>
        </ul>
        
        <h2>Building a Rational Investor Mindset</h2>
        <p>To overcome these psychological pitfalls, successful investors develop specific habits and strategies:</p>
        <p><strong>1. Have a Plan:</strong> Create a written investment strategy that includes your goals, risk tolerance, and criteria for buying and selling. When emotions run high, refer back to your plan.</p>
        <p><strong>2. Use Systematic Approaches:</strong> Dollar-cost averaging and automatic rebalancing remove emotion from the equation by making investment decisions mechanical.</p>
        <p><strong>3. Keep a Trading Journal:</strong> Document your investment decisions and the reasoning behind them. This helps you identify patterns in your behavior and learn from mistakes.</p>
        <p><strong>4. Focus on the Long Term:</strong> Short-term market volatility is noise. What matters is the long-term trajectory of your investments and the fundamental strength of the companies you own.</p>
        
        <h2>Conclusion</h2>
        <p>Mastering stock market psychology isn't about eliminating emotions—it's about understanding them and not letting them control your decisions. The most successful investors are those who can remain rational and disciplined even when markets are at their most chaotic.</p>
      `,
      likes: 247,
      isLiked: false,
      isBookmarked: false
    },
    {
      id: 2,
      title: "The Rise of Green Finance: Investing for the Planet",
      image: "https://i.pinimg.com/1200x/47/3c/70/473c7030371b165e85647d392b977de3.jpg",
      snippet: "Sustainable investing is no longer a niche market. Discover how ESG criteria are reshaping the investment landscape and creating opportunities for conscious investors.",
      author: "Marcus Chen",
      date: "October 18, 2025",
      category: "Future of Finance",
      gradient: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)",
      content: `
        <h2>What is Green Finance?</h2>
        <p>Green finance refers to financial investments flowing into sustainable development projects and initiatives that encourage the development of a more sustainable economy. This includes renewable energy, energy efficiency, sustainable agriculture, and climate change adaptation.</p>
        
        <h2>The ESG Revolution</h2>
        <p>Environmental, Social, and Governance (ESG) criteria have become mainstream in investment decision-making. Companies with strong ESG practices often demonstrate better risk management, operational efficiency, and long-term value creation.</p>
        
        <h2>Investment Opportunities</h2>
        <p>The green finance sector offers numerous investment opportunities, from green bonds to renewable energy stocks, sustainable agriculture, and clean technology companies. These investments not only contribute to environmental sustainability but also offer competitive financial returns.</p>
      `,
      likes: 189,
      isLiked: false,
      isBookmarked: false
    },
    {
      id: 3,
      title: "How to Build a Smart Budget That Actually Works",
      image: "https://i.pinimg.com/736x/13/b9/cc/13b9cc9cb1fddf08392c21fb68f85c09.jpg",
      snippet: "Budgeting doesn't have to be restrictive. Learn practical strategies to manage your finances while still enjoying life's pleasures.",
      author: "Sarah Johnson",
      date: "October 20, 2025",
      category: "Personal Finance",
      gradient: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)",
      content: `
        <h2>The 50/30/20 Rule</h2>
        <p>A simple and effective budgeting framework: allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.</p>
        
        <h2>Track Your Spending</h2>
        <p>Understanding where your money goes is the first step to better financial management. Use apps or spreadsheets to monitor your expenses and identify areas for improvement.</p>
        
        <h2>Automate Your Savings</h2>
        <p>Set up automatic transfers to your savings account right after payday. This "pay yourself first" approach ensures you're consistently building wealth.</p>
      `,
      likes: 312,
      isLiked: false,
      isBookmarked: false
    },
    {
      id: 4,
      title: "AI Meets Finance: The Future of Algorithmic Trading",
      image: "https://i.pinimg.com/1200x/47/3c/70/473c7030371b165e85647d392b977de3.jpg",
      snippet: "Artificial intelligence is revolutionizing how we trade. From pattern recognition to predictive analytics, discover how AI is changing the game for investors.",
      author: "David Lee",
      date: "October 25, 2025",
      category: "Future of Finance",
      gradient: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)",
      content: `
        <h2>Machine Learning in Trading</h2>
        <p>AI algorithms can analyze vast amounts of market data in milliseconds, identifying patterns and opportunities that human traders might miss. Machine learning models continuously improve their predictions based on new data.</p>
        
        <h2>Risk Management</h2>
        <p>AI-powered systems can assess and manage risk more effectively than traditional methods, helping investors protect their portfolios from unexpected market movements.</p>
        
        <h2>The Future is Now</h2>
        <p>As AI technology continues to advance, its role in finance will only grow. Investors who understand and embrace these tools will have a significant advantage in the markets of tomorrow.</p>
      `,
      likes: 421,
      isLiked: false,
      isBookmarked: false
    },
    {
      id: 5,
      title: "Cryptocurrency Regulations: What's Changing in 2025",
      image: "https://i.pinimg.com/1200x/33/8d/92/338d92cec5fcb758ce0784c463f594e1.jpg",
      snippet: "New regulatory frameworks are emerging worldwide. Stay informed about the latest crypto regulations and how they impact your digital asset portfolio.",
      author: "Emily Roberts",
      date: "October 27, 2025",
      category: "Investments",
      gradient: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)",
      content: `
        <h2>Global Regulatory Landscape</h2>
        <p>Governments worldwide are developing comprehensive frameworks to regulate cryptocurrency markets, balancing innovation with consumer protection.</p>
        
        <h2>Impact on Investors</h2>
        <p>New regulations bring clarity and legitimacy to the crypto market, potentially attracting institutional investors and stabilizing prices.</p>
        
        <h2>Compliance Requirements</h2>
        <p>Understanding KYC (Know Your Customer) and AML (Anti-Money Laundering) requirements is essential for crypto investors in 2025.</p>
      `,
      likes: 276,
      isLiked: false,
      isBookmarked: false
    },
    {
      id: 6,
      title: "Real Estate Investment Trusts: A Beginner's Guide",
      image: "https://i.pinimg.com/1200x/33/8d/92/338d92cec5fcb758ce0784c463f594e1.jpg",
      snippet: "REITs offer a way to invest in real estate without buying property. Learn the fundamentals of REIT investing and how to build a diversified portfolio.",
      author: "Michael Brown",
      date: "October 28, 2025",
      category: "Investments",
      gradient: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)",
      content: `
        <h2>What are REITs?</h2>
        <p>Real Estate Investment Trusts allow individuals to invest in large-scale, income-producing real estate without having to buy, manage, or finance properties themselves.</p>
        
        <h2>Benefits of REIT Investing</h2>
        <p>REITs provide regular income through dividends, portfolio diversification, and the potential for long-term capital appreciation.</p>
        
        <h2>Types of REITs</h2>
        <p>From equity REITs to mortgage REITs and hybrid REITs, each type offers different risk-return profiles suitable for various investment strategies.</p>
      `,
      likes: 198,
      isLiked: false,
      isBookmarked: false
    }
  ]);
  
  //for uploading image
  const MIN_SNIPPET_LENGTH = 50;
  const MIN_CONTENT_LENGTH = 200;
  const [validationError, setValidationError] = useState('');

  const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setNewBlog(prevBlog => ({
                ...prevBlog,
                imageFile: file,
                imageFileName: file.name // Store the name for display
            }));
        }
    };
  const handleCancelImage = () => {
        // 1. Clear the file and name from the state
        setNewBlog(prevBlog => ({
            ...prevBlog,
            imageFile: null,
            imageFileName: '',
        }));

        // 2. Crucially, reset the file input's value so the same file can be uploaded again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

  // New blog form state
  const [newBlog, setNewBlog] = useState({
        title: '',
        category: 'Investments',
        snippet: '',
        content: '',
        imageFile: null,      // Stores the actual File object
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
  'Investments': "https://i.pinimg.com/736x/13/b9/cc/13b9cc9cb1fddf08392c21fb68f85c09.jpg", // Image for Investments
  'Personal Finance': "https://i.pinimg.com/1200x/33/8d/92/338d92cec5fcb758ce0784c463f594e1.jpg", // Image for Personal Finance
  'Market Analysis': "https://i.pinimg.com/1200x/18/e7/0a/18e70a31251b63c18a0013cb85ae1cf7.jpg", // Image for Market Analysis
  'Future of Finance': "https://i.pinimg.com/1200x/47/3c/70/473c7030371b165e85647d392b977de3.jpg", // Image for Future of Finance
  
  // A fallback image for any other category or 'All'
  'default': "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&h=300&fit=crop", 
};
  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setCurrentView('article');
    window.scrollTo(0, 0);
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
      image: ''
    });
  };
  const defaultImage = DEFAULT_CATEGORY_IMAGES[newBlog.category] || DEFAULT_CATEGORY_IMAGES.default;
  const handleSubmitBlog = () => {
    if (newBlog.title && newBlog.snippet && newBlog.content) {
      const blog = {
        id: blogPosts.length + 1,
        title: newBlog.title,
        snippet: newBlog.snippet,
        category: newBlog.category,
        content: newBlog.content,
        image: newBlog.image || defaultImage,
        author: "You",
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        gradient: "linear-gradient(135deg, #D1DFDF 0%, #aac2c2ff 100%)",
        likes: 0,
        isLiked: false,
        isBookmarked: false
      };
      setBlogPosts([blog, ...blogPosts]);
      setCurrentView('listing');
    }
    setValidationError(''); 

    // Validation Check for Short Description
    if (newBlog.snippet.length < MIN_SNIPPET_LENGTH) {
        setValidationError(`Short Description must be at least ${MIN_SNIPPET_LENGTH} characters long.`);
        return;
    }

    // Validation Check for Content
    if (newBlog.content.length < MIN_CONTENT_LENGTH) {
        setValidationError(`Content must be at least ${MIN_CONTENT_LENGTH} characters long.`);
        return;
    }
  };

  const handleLike = (id) => {
    setBlogPosts(blogPosts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
    if (selectedArticle && selectedArticle.id === id) {
      setSelectedArticle({
        ...selectedArticle,
        likes: selectedArticle.isLiked ? selectedArticle.likes - 1 : selectedArticle.likes + 1,
        isLiked: !selectedArticle.isLiked
      });
    }
  };

  const handleBookmark = (id) => {
    setBlogPosts(blogPosts.map(post => {
      if (post.id === id) {
        return { ...post, isBookmarked: !post.isBookmarked };
      }
      return post;
    }));
    if (selectedArticle && selectedArticle.id === id) {
      setSelectedArticle({
        ...selectedArticle,
        isBookmarked: !selectedArticle.isBookmarked
      });
    }
  };

  // Filter and search logic
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           post.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'popular') {
      return b.likes - a.likes;
    }
    return 0;
  });

  const popularPosts = sortedPosts.slice(0, 3);
  const latestPosts = sortedPosts.slice(3, 6);

  return (
    <div style={styles.container}>
      {/* Header ////////////////////////////////////////////////////////////////////////////////////////////////////////////*/}
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
          {/* Home */}
          <span
            style={{
              ...styles.navLink,
              borderBottom:
                location.pathname === "/mainpageafterlogin" ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/mainpageafterlogin")}
          >
            Home
          </span>

          {/* News */}
          <span
            style={{
              ...styles.navLink,
              borderBottom: isNewsActive ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/NewsPage")}
          >
            News
          </span>

          {/* About */}
           <span
            style={{
              ...styles.navLink,
              borderBottom:
                location.pathname === "/AboutUs" ? "2px solid black" : "none",
            }}
            onClick={() => navigate("/AboutUs")}
          >
            About us
          </span>

            {/* Tools Menu */}
            <div
            style={styles.toolsMenu}
            onMouseEnter={() => setShowToolsDropdown(true)}
            onMouseLeave={() => setShowToolsDropdown(false)}
            >
            <Wrench size={24} color="black" style={styles.userIcon} /> 
            {/* <span style={{ marginLeft: "0px", fontWeight: "500" }}>Tools</span> */}

            {showToolsDropdown && (
                <div style={styles.dropdown}>
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
                    <div style={styles.dropdownItem}
                    onClick={() => {
                  // (Optional) clear user data or tokens here
                  navigate("/FileUploadApp"); // Redirect to dashboard on logout
                }}
                    >
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

          {/* User Menu */}
          <div
            style={styles.userMenu}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <User size={24} color="black" style={styles.userIcon} />

            {showDropdown && (
              <div style={styles.dropdown}>
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

               {/* Sign out */}
                 <div
                 style={styles.dropdownItem}
                 onClick={() => {
                   // (Optional) clear user data or tokens here
                   navigate("/homepage_beforelogin");      // Redirect to dashboard on logout
                 }}
               >
                 <LogOut size={16} />
                 <span>Sign out</span>
               </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Sub-Header / Filter Bar //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/}
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
              <label style={styles.label}>Title</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter blog title..."
                value={newBlog.title}
                onChange={(e) => setNewBlog({...newBlog, title: e.target.value})}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
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
              <label style={styles.label}>Short Description</label>
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
              <label style={styles.label}>Content</label>
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

            {/* Image URL Field //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/}
            <div style={styles.formGroup}>
            {/* 1. HIDDEN NATIVE FILE INPUT */}
            <input
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                ref={fileInputRef} 
                                style={{ display: 'none' }}
                            />
                            
                            {/* 2. CONDITIONAL RENDERING (The display) */}
                            {newBlog.imageFileName ? (
                                // A. File selected: Show name and cancel button
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
                                // B. No file selected: Show custom "Add Image" button
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
              <button style={styles.publishButton} onClick={handleSubmitBlog}>
                Publish Blog
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
              <span style={{marginLeft: '8px'}}>{selectedArticle.title}</span>
            </button>
            <div style={styles.articleMeta}>
              <span style={styles.articleAuthor}>{selectedArticle.author}</span>
              <span style={styles.metaSeparator}>•</span>
              <span style={styles.articleDate}>{selectedArticle.date}</span>
            </div>
          </div>

          <div style={styles.articleContent}>
            <div style={{...styles.articleImageWrapper, background: selectedArticle.gradient}}>
              <img src={selectedArticle.image} alt={selectedArticle.title} style={styles.articleImage} />
            </div>
            
            <div style={styles.articleBody} dangerouslySetInnerHTML={{__html: selectedArticle.content}} />
          </div>

          <div style={styles.articleActions}>
            <button 
              style={{...styles.actionButton, color: selectedArticle.isLiked ? '#e74c3c' : '#6c757d'}}
              onClick={() => handleLike(selectedArticle.id)}
            >
              <Heart size={20} fill={selectedArticle.isLiked ? '#e74c3c' : 'none'} />
              <span style={{marginLeft: '6px'}}>{selectedArticle.likes}</span>
            </button>
            <button style={styles.actionButton}>
              <Share2 size={20} />
            </button>
            <button 
              style={{...styles.actionButton, color: selectedArticle.isBookmarked ? '#3498db' : '#6c757d'}}
              onClick={() => handleBookmark(selectedArticle.id)}
            >
              <Bookmark size={20} fill={selectedArticle.isBookmarked ? '#3498db' : 'none'} />
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
              <h2 style={styles.sectionTitle}>Most popular</h2>
              <div style={styles.cardGrid}>
                {popularPosts.length > 0 ? popularPosts.map(post => (
                  <article 
                    key={post.id} 
                    style={{ ...styles.card, backgroundColor: '#e8f0f0ff' }}
                    onClick={() => handleArticleClick(post)}
                  >
                    <div style={styles.cardContent}>
                      {/* 1. Title remains on top */}
                      <h3 style={styles.cardTitle}>{post.title}</h3> 
                      
                      {/* 2. Image is now moved here, right after the title */}
                      <div style={{...styles.cardImageWrapper, background: post.gradient}}>
                        <img src={post.image} alt={post.title} style={styles.cardImage} />
                      </div>

                      {/* 3. The rest of the content follows */}
                      <span style={styles.categoryBadge}>{post.category}</span>
                      <p style={styles.cardSnippet}>{post.snippet}</p>
                      <span style={styles.readMore}>Read more...</span>
                      <div style={styles.cardMeta}>
                        <span style={styles.metaLabel}>Author:</span>
                        <span style={styles.metaValue}>{post.author}</span>
                        <span style={styles.metaSeparator}>|</span>
                        <span style={styles.metaLabel}>Publish Date:</span>
                        <span style={styles.metaValue}>{post.date}</span>
                      </div>
                    </div>
                  </article>
                )) : (
                  <p style={styles.noResults}>No blogs found</p>
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

                      <div style={{...styles.cardImageWrapper, background: post.gradient}}>
                        <img src={post.image} alt={post.title} style={styles.cardImage} />
                      </div>
                      
                      <span style={styles.categoryBadge}>{post.category}</span>
                      <p style={styles.cardSnippet}>{post.snippet}</p>
                      <span style={styles.readMore}>Read more...</span>
                      <div style={styles.cardMeta}>
                        <span style={styles.metaLabel}>Author:</span>
                        <span style={styles.metaValue}>{post.author}</span>
                        <span style={styles.metaSeparator}>|</span>
                        <span style={styles.metaLabel}>Publish Date:</span>
                        <span style={styles.metaValue}>{post.date}</span>
                      </div>
                    </div>
                  </article>
                )) : (
                  <p style={styles.noResults}>No blogs found</p>
                )}
              </div>
            </section>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLeft}>
            <p style={styles.copyright}>
              © 2025 FinGenie | 
              <a href="#" style={styles.footerLink}> About</a> | 
              <a href="#" style={styles.footerLink}> Blog</a> | 
              <a href="#" style={styles.footerLink}> Privacy Policy</a> | 
              <a href="#" style={styles.footerLink}> Contact</a>
            </p>
          </div>
          <div style={styles.footerRight}>
            <h4 style={styles.functionsTitle}>functions</h4>
            <div style={styles.functionLinks}>
              <a href="#" style={styles.functionLink}>AI summary</a>
              <a href="#" style={styles.functionLink}>stock graphs</a>
              <a href="#" style={styles.functionLink}>Debt ratings</a>
              <a href="#" style={styles.functionLink}>search companies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffffff',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
    header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.2rem 3rem',
    backgroundColor: '#ffffffff',
    borderBottom: '1px solid #000000ff',
  },
    headerLink: {
    color: '#000000ff',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.3s',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    //alignItems: 'right',
    justifyContent: 'space-between',
  },
    dropdown: {
    position: 'absolute',
    right: '15px',
    top: '65px',
    color: 'black',
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
    headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  headerNav: {
    display: 'flex',
    gap: '1.5rem',
  },







  logo: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2b2d2f',
    fontFamily: '"Georgia", serif',
    fontStyle: 'italic',
    letterSpacing: '-1px',
  },

  nav: {
    display: 'flex',
    gap: '40px',
    flex: 1,
    justifyContent: 'center',
  },

  navLink: {
    background: 'none',
    border: 'none',
    color: '#3a3f44',
    fontSize: '15px',
    cursor: 'pointer',
    padding: '8px 0',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  navLinkActive: {
    fontWeight: '600',
    color: '#212529',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    borderRadius: '20px',
    padding: '6px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },

  filterBar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #dee2e6',
    padding: '16px 0',
  },
  filterContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  searchSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #252525ff',
    borderRadius: '20px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    padding: '8px',
    width: '200px',
    backgroundColor: 'transparent',
  },
  categoriesButton: {
    backgroundColor: '#ffffffff',
    color: '#000000ff',
    border: '1px solid #000000ff',
    borderRadius: '20px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  filterButton: {
    backgroundColor: '#ffffff',
    color: '#000000ff',
    border: '1px solid #000000ff',
    borderRadius: '20px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  createButton: {
    backgroundColor: '#E6EFB7',
    color: '#3a3f44',
    border: '1px solid #000000ff',
    borderRadius: '20px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    transition: 'background-color 0.2s',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    marginTop: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '180px',
    zIndex: 1000,
  },
  dropdownItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#3a3f44',
    transition: 'background-color 0.2s',
  },
  searchInfo: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '16px 32px 0',
    fontSize: '14px',
    color: '#6c757d',
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 32px 80px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '40px',
  },
  section: {
    backgroundColor: '#ffffffff',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid #000000ff',
    width: '96.3%',
    marginLeft: '-10px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111111ff',
    marginBottom: '28px',
    marginTop: '0',
  },
  
  cardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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

  cardImageWrapper: {
    width: '100%',
    height: '180px',
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0.7',
    mixBlendMode: 'multiply',
  },
  cardContent: {
    padding: '24px',
  },
  cardTitle: {
    fontSize: '25px',
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: '12px',
    marginTop: '0',
    lineHeight: '1.4',
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
    marginTop: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardSnippet: {
    fontSize: '14px',
    color: '#2e3235ff',
    lineHeight: '1.6',
    marginBottom: '14px',
    display: 'block',
  },
  readMore: {
    fontSize: '14px',
    color: '#6c757d',
    textDecoration: 'none',
    fontWeight: '500',
    display: 'inline-block',
    marginBottom: '16px',
    transition: 'color 0.2s',
    textDecoration: 'underline',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#868e96',
    flexWrap: 'wrap',
    gap: '6px',
    justifyContent: 'flex-end',
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
  footer: {
    backgroundColor: '#3a3f44',
    padding: '32px 0',
    marginTop: 'auto',
  },
  footerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  footerLeft: {
    flex: 1,
  },
  copyright: {
    fontSize: '13px',
    color: '#ffffff',
    margin: '0',
  },
  footerLink: {
    color: '#ffffff',
    textDecoration: 'none',
    transition: 'opacity 0.2s',
  },
  footerRight: {
    textAlign: 'right',
  },
  functionsTitle: {
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: '600',
    marginTop: '0',
    marginBottom: '12px',
    textTransform: 'lowercase',
  },
  functionLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  functionLink: {
    fontSize: '13px',
    color: '#ffffff',
    textDecoration: 'none',
    transition: 'opacity 0.2s',
  },
  customImageButton: {
        // Style to mimic the button in the uploaded image
        backgroundColor: '#a5d7b0ff', // Light bluish-gray background
        color: '#3d3d3d',          // Dark text color
        padding: '12px 32px',
        fontSize: '15px',
        borderRadius: '15px',
        fontWeight: '500',
        textAlign: 'center',
        cursor: 'pointer',
        width: 'fit-content',      // Only take up necessary width
        userSelect: 'none',        // Prevent text selection on click
        transition: 'background-color 0.2s',
        ':hover': { 
            backgroundColor: '#628679ff',
        },
    },
    lengthIndicator: {
        display: 'block',
        marginTop: '5px',
        fontSize: '12px',
        color: '#6c757d', // Gray color
        textAlign: 'right',
    },
    errorText: {
        color: '#dc3545', // Red color
        fontWeight: 'bold',
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #dc3545',
        borderRadius: '4px',
        backgroundColor: '#f8d7da',
    },
  
};

export default FinanceBlog;