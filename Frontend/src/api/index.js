const RAW_BASE = process.env.REACT_APP_API_URL || '';
const BASE = RAW_BASE.replace(/\/$/, '');

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

function buildUrl(path) {
  if (!path) return BASE || '/';
  // If path is absolute (starts with http) return as-is
  if (/^https?:\/\//i.test(path)) return path;
  // Respect explicit BASE if provided, otherwise use relative path
  if (BASE) return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  return path.startsWith('/') ? path : `/${path}`;
}

async function request(path, opts = {}) {
  const url = buildUrl(path);
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };

  // If body is plain object and not FormData, stringify and set Content-Type
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

  const res = await fetch(url, fetchOpts);
  return handleResponse(res);
}

export async function postExtract(formData) {
  return request('/dataprocessor/api/process/', { method: 'POST', body: formData });
}

// Most components expect the dataprocessor stock-data endpoint
export async function getStockData(ticker, period = '1M') {
  return request(`/dataprocessor/api/stock-data/${encodeURIComponent(ticker)}/${period}/`);
}

export async function getSomeEndpoint() {
  return request('/api/some-endpoint/');
}

export default {
  postExtract,
  getStockData,
  getSomeEndpoint,
  request,
  BASE,
};
