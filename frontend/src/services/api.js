import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('touristhub_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      // Only clear if token was actually present
      if (localStorage.getItem('touristhub_token')) {
        localStorage.removeItem('touristhub_token');
        localStorage.removeItem('touristhub_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
