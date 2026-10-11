const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'postbag_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, { method = 'GET', body } = {}) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the API is running.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 401 on any call except login itself means the session ended
    if (res.status === 401 && path !== '/auth/login') onUnauthorized();
    throw new Error(data.message || `Request failed (${res.status}).`);
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  sendMail: (payload) => request('/mail/send', { method: 'POST', body: payload }),
  listMail: ({ page = 1, status = '' } = {}) => request(`/mail?page=${page}&limit=10${status ? `&status=${status}` : ''}`),
  getMail: (id) => request(`/mail/${id}`),
  deleteMail: (id) => request(`/mail/${id}`, { method: 'DELETE' }),
};
