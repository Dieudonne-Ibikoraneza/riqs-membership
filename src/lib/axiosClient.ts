import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authDataRaw = localStorage.getItem('riqs.auth.token');
      if (authDataRaw) {
        config.headers.Authorization = `Bearer ${authDataRaw}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle global errors (e.g., 401s)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('riqs.auth');
        localStorage.removeItem('riqs.auth.token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
