/* ===== CLIENTE API YUYU ===== */
const API_URL = (function () {
  const h = location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
  if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
  if (/^10\./.test(h)) return 'http://' + h + ':3000';
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
  return 'https://yuyu-backend-1b4x.onrender.com';
})();

/* ===== CLIENTE API YUYU ===== */

const Api = {
  /* --- Token / Admin --- */
  getToken() { return localStorage.getItem('yuyu_admin_token'); },
  setToken(t) { localStorage.setItem('yuyu_admin_token', t); },
  clearToken() { localStorage.removeItem('yuyu_admin_token'); },

  getAdmin() {
    try { return JSON.parse(localStorage.getItem('yuyu_admin') || 'null'); }
    catch { return null; }
  },
  setAdmin(a) { localStorage.setItem('yuyu_admin', JSON.stringify(a)); },
  clearAdmin() { localStorage.removeItem('yuyu_admin'); },

  /* --- Requisição genérica --- */
  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = this.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const isForm = options.body instanceof FormData;
    if (!isForm && options.body) headers['Content-Type'] = 'application/json';

    const res = await fetch(API_URL + path, { ...options, headers });

    let data = null;
    try { data = await res.json(); } catch (_) {}

    if (res.status === 401 && !path.includes('/login')) {
      this.clearToken();
      this.clearAdmin();
      location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      const err = new Error((data && data.error) || ('Erro ' + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  get(p) { return this.request(p); },
  post(p, body) {
    const isForm = body instanceof FormData;
    return this.request(p, { method: 'POST', body: isForm ? body : JSON.stringify(body) });
  },
  put(p, body) {
    const isForm = body instanceof FormData;
    return this.request(p, { method: 'PUT', body: isForm ? body : JSON.stringify(body) });
  },
  patch(p, body) {
    return this.request(p, { method: 'PATCH', body: JSON.stringify(body) });
  },
  del(p) { return this.request(p, { method: 'DELETE' }); },

  /* --- Helpers de auth --- */
  login(username, password) {
    return this.post('/api/auth/login', { username, password });
  },
  me() { return this.get('/api/auth/me'); },
  logout() {
    this.clearToken();
    this.clearAdmin();
    location.href = 'login.html';
  }
};

window.Api = Api;
