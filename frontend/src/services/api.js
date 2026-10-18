
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/+$/, '')}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach the saved JWT to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('touristhub_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      localStorage.getItem('touristhub_token')
    ) {
      localStorage.removeItem('touristhub_token');
      localStorage.removeItem('touristhub_user');
    }

    return Promise.reject(error);
  }
);

export default api;
