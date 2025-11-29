// Configuration: prefer env var `REACT_APP_API_URL`, fallback to Render URL
const RAW_BASE = 'http://localhost:8000';
const BASE = RAW_BASE.replace(/\/$/, '');
const DJANGO_API_BASE = BASE;
const API_BASE_URL = BASE;

if (!process.env.REACT_APP_API_URL) {
  console.info('Using default API base URL. To override, set REACT_APP_API_URL in your environment.');
}

// CSRF Token utility functions
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

async function getCSRFToken() {
  let csrfToken = getCookie('csrftoken');
  
  if (!csrfToken) {
    try {
      const response = await fetch(`${DJANGO_API_BASE}/accounts/api/csrf-token/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        csrfToken = data.csrftoken;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }
  }
  
  return csrfToken;
}

async function handleResponse(res) {
  // Handle 204 No Content responses
  if (res.status === 204) {
    return { success: true };
  }

  const text = await res.text().catch(() => '');
  
  // Handle empty responses
  if (!text) {
    if (res.ok) {
      return { success: true };
    } else {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  }

  try {
    const json = JSON.parse(text);
    if (!res.ok) {
      throw new Error(json.error || json.detail || json.message || text || `HTTP ${res.status}`);
    }
    return json;
  } catch (err) {
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    return text;
  }
}

function buildUrl(path, base = BASE) {
  if (!path) return base || '/';
  if (/^https?:\/\//i.test(path)) return path;
  if (base) return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  return path.startsWith('/') ? path : `/${path}`;
}

async function request(path, opts = {}) {
  const url = buildUrl(path);
  const headers = { 
    'Accept': 'application/json', 
    ...(opts.headers || {}) 
  };

  let body = opts.body;
  
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = JSON.stringify(body);
  }

  const fetchOpts = {
    credentials: 'include',
    ...opts,
    headers,
    body,
  };

  try {
    const res = await fetch(url, fetchOpts);
    return handleResponse(res);
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);
    throw error;
  }
}

// Enhanced Django Request function with better error handling
export async function djangoRequest(endpoint, options = {}) {
  // Handle query parameters
  let url = buildUrl(endpoint, DJANGO_API_BASE);
  
  if (options.params && Object.keys(options.params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  // Get CSRF token for state-changing requests
  let csrfToken = null;
  const method = options.method ? options.method.toUpperCase() : 'GET';
  const needsCSRF = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
  
  if (needsCSRF) {
    csrfToken = await getCSRFToken();
    if (!csrfToken) {
      console.warn('CSRF token not available for state-changing request');
    }
  }

  const config = {
    method: method,
    credentials: 'include', // CRITICAL for session authentication
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add CSRF token for state-changing requests
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }

  // Remove params from config to avoid conflicts
  delete config.params;

  // Handle request body - special handling for FormData
  let body = options.body;
  if (body) {
    if (body instanceof FormData) {
      // Don't set Content-Type for FormData - let browser set it with boundary
      config.body = body;
      // Remove Content-Type if it was set to avoid conflicts
      if (config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    } else if (typeof body === 'object') {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    } else {
      config.body = body;
    }
  }

  console.log(`Making ${config.method} request to: ${url}`, { 
    hasCSRF: !!csrfToken,
    hasBody: !!body,
    isFormData: body instanceof FormData,
    credentials: config.credentials 
  });

  try {
    const response = await fetch(url, config);
    
    // Handle authentication errors specifically
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    if (response.status === 403) {
      throw new Error('Access forbidden. You do not have permission to perform this action.');
    }
    
    if (response.status === 404) {
      throw new Error('Resource not found.');
    }

    if (response.status === 405) {
      throw new Error('Method not allowed. This endpoint does not support the requested HTTP method.');
    }
    
    return await handleResponse(response);
    
  } catch (error) {
    console.error(`Django API request to ${url} failed:`, error.message);
    
    // Enhance error message for network issues
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your connection.');
    }
    
    throw error;
  }
}

// Enhanced authentication check function
export const testAuthStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/api/check-auth/`, {
      method: "GET",
      credentials: "include",
    });
    
    if (!response.ok) {
      return { 
        authenticated: false, 
        error: `HTTP ${response.status}` 
      };
    }
    
    const data = await response.json();
    console.log("Auth status response:", data);
    return data;
  } catch (error) {
    console.error("Auth check failed:", error);
    return { 
      authenticated: false, 
      error: error.message 
    };
  }
};

// Enhanced login success handler
export const handleLoginSuccess = async (response, data, identifier, setPopupMessage, setPopupColor, setShowPopup, navigate) => {
  if (response.ok && data.success) {
    console.log("Login successful, checking auth status...");
    
    // Wait a moment for session to be established
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const authStatus = await testAuthStatus();
    console.log("Immediate auth check:", authStatus);
    
    if (authStatus.authenticated) {
      setPopupMessage(`Welcome back, ${data.username || identifier}!`);
      setPopupColor("#4CAF50");
      setShowPopup(true);
      
      setTimeout(() => {
        navigate("/mainpageafterlogin");
      }, 1500);
    } else {
      setPopupMessage('Login successful but session issue detected. Please try again.');
      setPopupColor("#FF9800");
      setShowPopup(true);
    }
  }
};

// ============================================================================
// COMPANY SEARCH API FUNCTIONS - NEW ADDITIONS
// ============================================================================

// Company Search API functions
export async function searchCompany(query) {
  return djangoRequest(`/company-search/search/?q=${encodeURIComponent(query)}`);
}

export async function getPopularSearches() {
  return djangoRequest('/company-search/popular-searches/');
}

export async function getCompanyFinancialData(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/`);
}

export async function getBalanceSheet(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/balance-sheet/`);
}

export async function getIncomeStatement(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/income-statement/`);
}

export async function getCashFlow(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/cash-flow/`);
}

export async function getStockPrice(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/stock-price/`);
}

export async function getCompanyInfo(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/info/`);
}

export async function getHistoricalData(symbol, period = '1y', interval = '1d') {
  return djangoRequest(`/company-search/company/${symbol}/historical/?period=${period}&interval=${interval}`);
}

export async function getMarketSummary() {
  return djangoRequest('/company-search/market-summary/');
}

// Data Processor API functions
export async function postExtract(formData) {
  return djangoRequest('/dataprocessor/api/process/', { 
    method: 'POST', 
    body: formData 
  });
}

export async function getStockData(ticker, period = '1M') {
  return djangoRequest(`/dataprocessor/api/stock-data/${encodeURIComponent(ticker)}/${period}/`);
}

// Report API functions
export async function getReport(reportId) {
  return djangoRequest(`/dataprocessor/api/reports/${reportId}/`);
}

export async function getLatestReport() {
  return djangoRequest('/dataprocessor/api/latest-report/');
}

// Sector Overview Service
class SectorOverviewService {
  async getSectorData() {
    return djangoRequest('/sector/api/sector-data/');
  }

  async getSectorOverview() {
    return djangoRequest('/sector/api/sector-overview/');
  }

  async compareRatios(companyRatios, sector) {
    return djangoRequest('/sector/api/compare-ratios/', {
      method: 'POST',
      body: { company_ratios: companyRatios, sector }
    });
  }

  async sectorComparison(companyRatios, sector) {
    return djangoRequest('/sector/api/sector-comparison/', {
      method: 'POST',
      body: { company_ratios: companyRatios, sector }
    });
  }

  async getSectorDetails(sectorName) {
    return djangoRequest(`/sector/api/sector/${encodeURIComponent(sectorName)}/`);
  }

  async saveCustomGroup(sectorName, companies) {
    return djangoRequest('/sector/api/custom-group/', {
      method: 'POST',
      body: { sector_name: sectorName, companies }
    });
  }

  async testConnection() {
    try {
      const response = await djangoRequest('/sector/api/sector-data/');
      return {
        success: true,
        message: 'Connected to Django backend',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Blog Service
class BlogService {
  // Get all blog posts with filters
  async getBlogPosts(params = {}) {
    return djangoRequest('/blog/api/posts/', { 
      method: 'GET',
      params 
    });
  }

  // Get single blog post
  async getBlogPost(id) {
    return djangoRequest(`/blog/api/posts/${id}/`);
  }

  // Create new blog post
  async createBlogPost(formData) {
    console.log('BlogService: Creating blog post with FormData');
    return djangoRequest('/blog/api/posts/', {
      method: 'POST',
      body: formData
    });
  }

  // Update blog post
  async updateBlogPost(id, data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    return djangoRequest(`/blog/api/posts/${id}/`, {
      method: 'PUT',
      body: formData
    });
  }

  // Partial update blog post
  async partialUpdateBlogPost(id, data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    return djangoRequest(`/blog/api/posts/${id}/`, {
      method: 'PATCH',
      body: formData
    });
  }

  // Delete blog post
  async deleteBlogPost(id) {
    return djangoRequest(`/blog/api/posts/${id}/`, {
      method: 'DELETE'
    });
  }

  // Like/Unlike post
  async toggleLike(id) {
    return djangoRequest(`/blog/api/posts/${id}/toggle_like/`, {
      method: 'POST'
    });
  }

  // Bookmark/Unbookmark post
  async toggleBookmark(id) {
    return djangoRequest(`/blog/api/posts/${id}/toggle_bookmark/`, {
      method: 'POST'
    });
  }

  // Get user's posts
  async getMyPosts() {
    return djangoRequest('/blog/api/posts/my_posts/');
  }

  // Get user's bookmarks
  async getMyBookmarks() {
    return djangoRequest('/blog/api/posts/my_bookmarks/');
  }

  // Increment views
  async incrementViews(id) {
    return djangoRequest(`/blog/api/posts/${id}/increment_views/`, {
      method: 'GET'
    });
  }

  // Test authentication status
  async testAuth() {
    try {
      const response = await testAuthStatus();
      return response;
    } catch (error) {
      console.warn('Auth test failed:', error.message);
      return { 
        authenticated: false,
        error: error.message 
      };
    }
  }

  // Test blog connection
  async testConnection() {
    try {
      const response = await this.getBlogPosts({ limit: 1 });
      return {
        success: true,
        message: 'Connected to Blog API',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Blog API: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Account Service
class AccountService {
  async login(credentials) {
    return djangoRequest('/accounts/api/login/', {
      method: 'POST',
      body: credentials
    });
  }

  async logout() {
    return djangoRequest('/accounts/api/logout/', {
      method: 'POST'
    });
  }

  async register(userData) {
    return djangoRequest('/accounts/api/register/', {
      method: 'POST',
      body: userData
    });
  }

  async getProfile() {
    return djangoRequest('/accounts/api/profile/');
  }

  async updateProfile(userData) {
    return djangoRequest('/accounts/api/profile/', {
      method: 'PUT',
      body: userData
    });
  }
}

export async function getSearchSuggestions(query) {
  return djangoRequest(`/company-search/search-suggestions/?q=${encodeURIComponent(query)}`);
}


export async function getCompanyAnalysis(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/analysis/`);
}

export async function getFinancialRatios(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/ratios/`);
}

export async function getQuarterlyResults(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/quarterly/`);
}

export async function getPeerAnalysis(symbol) {
  return djangoRequest(`/company-search/company/${symbol}/peer-analysis/`);
}

export async function searchCustomPeers(symbol, requestData) {
  return djangoRequest(`/company-search/company/${symbol}/custom-peers/`, {
    method: 'POST',
    body: requestData
  });
}

// Update CompanySearchService


// Company Search Service - NEW SERVICE
class CompanySearchService {

  

  async getSearchSuggestions(query) {
    return getSearchSuggestions(query);
  }

  async search(query) {
    return searchCompany(query);
  }

  async getPeerAnalysis(symbol) {
  return getPeerAnalysis(symbol);
}
 

  async getCompanyAnalysis(symbol) {
    return getCompanyAnalysis(symbol);
  }

  async getFinancialRatios(symbol) {
    return getFinancialRatios(symbol);
  }

  async getQuarterlyResults(symbol) {
    return getQuarterlyResults(symbol);
  }

  async getPopularSearches() {
    return getPopularSearches();
  }

  async getCompanyData(symbol) {
    return getCompanyFinancialData(symbol);
  }

  async getBalanceSheet(symbol) {
    return getBalanceSheet(symbol);
  }

  async getIncomeStatement(symbol) {
    return getIncomeStatement(symbol);
  }

  async getCashFlow(symbol) {
    return getCashFlow(symbol);
  }

  async getStockPrice(symbol) {
    return getStockPrice(symbol);
  }

  async getCompanyInfo(symbol) {
    return getCompanyInfo(symbol);
  }

  async getHistoricalData(symbol, period = '1y', interval = '1d') {
    return getHistoricalData(symbol, period, interval);
  }

  async searchCustomPeers(symbol, requestData) {
  return searchCustomPeers(symbol, requestData);
}

  async getMarketSummary() {
    return getMarketSummary();
  }

  async testConnection() {
    try {
      const response = await this.getPopularSearches();
      return {
        success: true,
        message: 'Connected to Company Search API',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Company Search API: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Create service instances
export const sectorOverviewService = new SectorOverviewService();
export const blogService = new BlogService();
export const accountService = new AccountService();
export const companySearchService = new CompanySearchService(); // NEW
export const apiService = sectorOverviewService;

// Export utility functions
export { getCSRFToken, getCookie, request };

// Main exports object
const apiExports = {
  // Core functions
  request,
  djangoRequest,
  getCSRFToken,
  getCookie,
  testAuthStatus,
  handleLoginSuccess,
  
  // Configuration
  BASE,
  DJANGO_API_BASE,
  API_BASE_URL,
  
  // Data processor functions
  postExtract,
  getStockData,
  getReport,
  getLatestReport,
  
  // Company Search functions - NEW
  searchCompany,
  getPopularSearches,
  getCompanyFinancialData,
  getBalanceSheet,
  getIncomeStatement,
  getCashFlow,
  getStockPrice,
  getCompanyInfo,
  getHistoricalData,
  getMarketSummary,
  
  // Service instances
  sectorOverviewService,
  blogService,
  accountService,
  companySearchService, // NEW
  apiService,
  
  // Convenience methods
  getSectorData: sectorOverviewService.getSectorData.bind(sectorOverviewService),
  getSectorOverview: sectorOverviewService.getSectorOverview.bind(sectorOverviewService),
  compareRatios: sectorOverviewService.compareRatios.bind(sectorOverviewService),
  sectorComparison: sectorOverviewService.sectorComparison.bind(sectorOverviewService),
  
  // Company Search convenience methods - NEW
  search: companySearchService.search.bind(companySearchService),
  getCompanyData: companySearchService.getCompanyData.bind(companySearchService),
  
  getBlogPosts: blogService.getBlogPosts.bind(blogService),
  getBlogPost: blogService.getBlogPost.bind(blogService),
  createBlogPost: blogService.createBlogPost.bind(blogService),
  toggleLike: blogService.toggleLike.bind(blogService),
  toggleBookmark: blogService.toggleBookmark.bind(blogService),
  
  login: accountService.login.bind(accountService),
  logout: accountService.logout.bind(accountService),
  register: accountService.register.bind(accountService),
  
  // Test methods
  testConnection: sectorOverviewService.testConnection.bind(sectorOverviewService),
  testCompanySearchConnection: companySearchService.testConnection.bind(companySearchService), // NEW
  testAuth: blogService.testAuth.bind(blogService),
};

export default apiExports;