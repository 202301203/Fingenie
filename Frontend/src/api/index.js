const BASE = process.env.REACT_APP_API_URL || '';

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

export async function postExtract(formData) {
  const res = await fetch(`${BASE}/dataprocessor/extract/`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function getStockData(ticker, period = '1M') {
  const res = await fetch(`${BASE}/stock/graph-data/${encodeURIComponent(ticker)}/${period}/`);
  return handleResponse(res);
}

export async function getSomeEndpoint() {
  const res = await fetch(`${BASE}/api/some-endpoint/`);
  return handleResponse(res);
}

export default {
  postExtract,
  getStockData,
  getSomeEndpoint,
};
