import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://72.60.206.253:5000/api/v1';

// Debug log to check the API URL
console.log('API_URL configured as:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear auth on 401, and avoid redirect loops
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      // Don't redirect if already on a login page
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to appropriate login page
        const redirectPath = currentPath.includes('/admin') ? '/admin/login' : '/restaurant/login';
        window.location.href = redirectPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
