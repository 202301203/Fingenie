// Configuration
const RAW_BASE = process.env.REACT_APP_API_URL || '';
const BASE = RAW_BASE.replace(/\/$/, '');
const DJANGO_API_BASE = BASE;

if (!process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production') {
  console.error(' WARNING: REACT_APP_API_URL not set. API calls may fail.');
}

async function handleResponse(res) {
  const text = await res.text().catch(() => '');
  try {
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error || json.detail || text || `HTTP ${res.status}`);
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
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };

  let body = opts.body;
  
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = JSON.stringify(body);
  }

  const fetchOpts = {
    credentials: 'include', // include cookies by default (important for Django session/CSRF)
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

// FIXED: djangoRequest function with proper query parameter handling
async function djangoRequest(endpoint, options = {}) {
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

  const config = {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Remove params from config to avoid conflicts
  delete config.params;

  // Handle request body
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error(`Django API request to ${url} failed:`, error.message);
    throw error;
  }
}

// Data Processor API functions
export async function postExtract(formData) {
  return request('/dataprocessor/api/process/', { method: 'POST', body: formData });
}

export async function getStockData(ticker, period = '1M') {
  return request(`/dataprocessor/api/stock-data/${encodeURIComponent(ticker)}/${period}/`);
}

// Sector Overview Service
class SectorOverviewService {
  // Get sector data
  async getSectorData() {
    return djangoRequest('/sector/api/sector-data/');
  }

  // Get real-time sector overview
  async getSectorOverview() {
    return djangoRequest('/sector/api/sector-overview/');
  }

  // Compare ratios
  async compareRatios(companyRatios, sector) {
    return djangoRequest('/sector/api/compare-ratios/', {
      method: 'POST',
      body: { company_ratios: companyRatios, sector }
    });
  }

  // Sector comparison
  async sectorComparison(companyRatios, sector) {
    return djangoRequest('/sector/api/sector-comparison/', {
      method: 'POST',
      body: { company_ratios: companyRatios, sector }
    });
  }

  // Get specific sector details
  async getSectorDetails(sectorName) {
    return djangoRequest(`/sector/api/sector/${encodeURIComponent(sectorName)}/`);
  }

  // Save custom company group
  async saveCustomGroup(sectorName, companies) {
    return djangoRequest('/sector/api/custom-group/', {
      method: 'POST',
      body: { sector_name: sectorName, companies }
    });
  }

  // Test connection to backend
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

// Blog Service - MOVED BEFORE THE EXPORTS
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
  async createBlogPost(data) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('snippet', data.snippet);
    formData.append('category', data.category);
    if (data.imageFile) {
      formData.append('image', data.imageFile);
    }

    return djangoRequest('/blog/api/posts/', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
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
      body: formData,
      headers: {}
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

  // Test blog connection
  async testConnection() {
    try {
      const response = await this.getBlogPosts();
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

export const sectorOverviewService = new SectorOverviewService();
export const blogService = new BlogService(); // EXPORT HERE

export const apiService = sectorOverviewService;

const apiExports = {
  postExtract,
  getStockData,
  request,
  BASE,
  
  sectorOverviewService,
  apiService,
  blogService, 
  
  getSectorData: sectorOverviewService.getSectorData.bind(sectorOverviewService),
  getSectorOverview: sectorOverviewService.getSectorOverview.bind(sectorOverviewService),
  compareRatios: sectorOverviewService.compareRatios.bind(sectorOverviewService),
  sectorComparison: sectorOverviewService.sectorComparison.bind(sectorOverviewService),
  testConnection: sectorOverviewService.testConnection.bind(sectorOverviewService),

  getBlogPosts: blogService.getBlogPosts.bind(blogService),
  getBlogPost: blogService.getBlogPost.bind(blogService),
  createBlogPost: blogService.createBlogPost.bind(blogService),
  toggleLike: blogService.toggleLike.bind(blogService),
  toggleBookmark: blogService.toggleBookmark.bind(blogService),
  getMyPosts: blogService.getMyPosts.bind(blogService),
  getMyBookmarks: blogService.getMyBookmarks.bind(blogService),
};

export default apiExports;