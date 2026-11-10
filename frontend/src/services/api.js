import axios from 'axios';

// Smart resolution of backend API URL:
// 1. Use configured VITE_API_URL if provided
// 2. In production (on onrender.com or custom domain), fall back to deployed backend https://turisthub-ai-1.onrender.com
// 3. In local development, fall back to http://localhost:3001
const rawBaseUrl = (import.meta.env.VITE_API_URL || '').trim() || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://turisthub-ai-1.onrender.com'
    : 'http://localhost:3001');

const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const baseURL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Automatically strip redundant '/api' prefix if provided in url
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }

    const token = localStorage.getItem('touristhub_token');

    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh token on 401 if refresh is available and not already retrying
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        if (refreshRes.data?.success && refreshRes.data.token) {
          const newToken = refreshRes.data.token;
          localStorage.setItem('touristhub_token', newToken);
          if (refreshRes.data.user) {
            localStorage.setItem('touristhub_user', JSON.stringify(refreshRes.data.user));
          }
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('touristhub_token');
        localStorage.removeItem('touristhub_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('touristhub:session_expired'));
        }
      }
    } else if (
      error.response?.status === 401 &&
      (originalRequest?.url?.includes('/auth/refresh') || !originalRequest)
    ) {
      localStorage.removeItem('touristhub_token');
        localStorage.removeItem('touristhub_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('touristhub:session_expired'));
        }
    }

    return Promise.reject(error);
  }
);

export default api;
