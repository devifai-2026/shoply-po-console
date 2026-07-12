import { API_URL as BASE } from '../config';

const getToken = () => localStorage.getItem('owner_token');

const req = async (method, path, body) => {
  const token = getToken();
  const headers = {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && path !== '/login') {
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_user');
    window.dispatchEvent(new Event('auth:logout'));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

const get   = (path)       => req('GET',   path);
const post  = (path, body) => req('POST',  path, body);
const put   = (path, body) => req('PUT',   path, body);
const patch = (path, body) => req('PATCH', path, body);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  login: (body) => post('/login', body),
};

// ─── Overview ────────────────────────────────────────────────────────────────
export const overview = {
  get: () => get('/overview'),
};

// ─── Tenants ─────────────────────────────────────────────────────────────────
export const tenants = {
  list:          ()             => get('/tenants'),
  get:           (slug)         => get(`/tenants/${slug}`),
  create:        (body)         => post('/tenants', body),
  suspend:       (slug)         => patch(`/tenants/${slug}/suspend`),
  reactivate:    (slug)         => patch(`/tenants/${slug}/reactivate`),
  rotateSecrets: (slug, body)   => put(`/tenants/${slug}/secrets`, body),
  queueBuild:    (slug, body)   => post(`/tenants/${slug}/builds`, body),
  getAdminCredentials:    (slug) => get(`/tenants/${slug}/admin-credentials`),
  rotateAdminCredentials: (slug) => post(`/tenants/${slug}/admin-credentials/rotate`),
};

// ─── Builds ──────────────────────────────────────────────────────────────────
export const builds = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/builds${qs ? `?${qs}` : ''}`);
  },
};

// ─── Metrics ─────────────────────────────────────────────────────────────────
export const metrics = {
  get: () => get('/metrics'),
};

// ─── Platform analytics (time series) ────────────────────────────────────────
export const platform = {
  analytics:     (window = '24h')                    => get(`/analytics?window=${encodeURIComponent(window)}`),
  queueBuild:    (slug, { app = 'buyer', artifact }) => post(`/tenants/${slug}/builds`, { app, artifact }),
  buildDownload: (id)                                => get(`/builds/${id}/download`),
};

// ─── Keystore (Android signing) ──────────────────────────────────────────────
export const keystore = {
  get:      ()     => get('/keystore'),
  upload:   (body) => post('/keystore/upload', body),
  generate: (body) => post('/keystore/generate', body),
};
