// Configuration
const RAW_BASE = process.env.REACT_APP_API_URL || '';
const BASE = RAW_BASE.replace(/\/$/, '');
const DJANGO_API_BASE = BASE;  // ✅ USE BASE, not hardcoded localhost

// ✅ NEW: Validate environment on startup
if (!process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production') {
  console.error('⚠️ WARNING: REACT_APP_API_URL not set. API calls may fail.');
}

// Generic response handler
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

// URL builder for different base URLs
function buildUrl(path, base = BASE) {
  if (!path) return base || '/';
  // If path is absolute (starts with http) return as-is
  if (/^https?:\/\//i.test(path)) return path;
  // Respect explicit base if provided, otherwise use relative path
  if (base) return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  return path.startsWith('/') ? path : `/${path}`;
}

// Generic request function
async function request(path, opts = {}) {
  const url = buildUrl(path);
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };

  // If body is plain object and not FormData, stringify and set Content-Type
  let body = opts.body;
  
  // ✅ FIXED: Don't manually set Content-Type for FormData
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

// Django-specific request function
async function djangoRequest(endpoint, options = {}) {
  const url = buildUrl(endpoint, DJANGO_API_BASE);
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Handle request body
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // More detailed error information
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
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

// ✅ FIXED: Sector Overview API endpoint paths
class SectorOverviewService {
  // Get sector data
  async getSectorData() {
    return djangoRequest('/sector/api/sector-data/');  // ✅ FIXED: Removed /sector prefix
  }

  // Get real-time sector overview
  async getSectorOverview() {
    return djangoRequest('/sector/api/sector-overview/');  // ✅ FIXED: Removed /sector prefix
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

// Create and export service instance
export const sectorOverviewService = new SectorOverviewService();

// Legacy exports for backward compatibility
export const apiService = sectorOverviewService;

// Default export with all functions
const apiExports = {
  // Data processor functions
  postExtract,
  getStockData,
  request,
  BASE,
  
  // Sector overview functions (via service)
  sectorOverviewService,
  apiService,
  
  // Direct method access for convenience
  getSectorData: sectorOverviewService.getSectorData.bind(sectorOverviewService),
  getSectorOverview: sectorOverviewService.getSectorOverview.bind(sectorOverviewService),
  compareRatios: sectorOverviewService.compareRatios.bind(sectorOverviewService),
  sectorComparison: sectorOverviewService.sectorComparison.bind(sectorOverviewService),
  testConnection: sectorOverviewService.testConnection.bind(sectorOverviewService),
};

export default apiExports;