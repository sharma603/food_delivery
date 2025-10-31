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
    const user = localStorage.getItem('user');
    
    // Debug logging
    console.log('API Request Debug:', {
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      url: config.url,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
      user: user ? JSON.parse(user) : 'No user',
      headers: config.headers
    });
    
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
    console.error('🚨 API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    });
    
    // Only clear auth on 401, and avoid redirect loops
    if (error.response?.status === 401) {
      console.log('🔓 Token expired or invalid');
      const currentPath = window.location.pathname;

      // Only redirect if NOT on a login page
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to appropriate login page
        const redirectPath = currentPath.includes('/admin') ? '/admin/login' : '/restaurant/login';
        console.log('Redirecting to:', redirectPath);
        window.location.href = redirectPath;
      } else {
        // Already on login page - don't clear anything, just show error
        console.log('Already on login page, keeping local storage');
      }
    } else if (error.response?.status === 403) {
      // Access denied
      console.error('Access denied (403):', error.response?.data?.message);
      console.log('Make sure you are logged in as a superadmin user');
    }
    return Promise.reject(error);
  }
);

export default api;
