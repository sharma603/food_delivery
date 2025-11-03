import axios from 'axios';
import AppConfig from '../config/appConfig';

// Get API URL from centralized config - single source of truth
const API_URL = AppConfig.API.BASE_URL;

// Validate configuration
if (!API_URL || typeof API_URL !== 'string' || !API_URL.startsWith('http')) {
  console.error('❌ Invalid API URL in config:', API_URL);
  console.error('💡 Please update BACKEND_SERVER in src/config/appConfig.js');
  throw new Error('Invalid API configuration. Please check appConfig.js');
}

// Log API configuration (only in development)
if (AppConfig.APP.DEBUG) {
  console.log('🔧 API Configuration:', {
    API_URL: API_URL,
    BACKEND_SERVER: AppConfig.API.BACKEND_SERVER,
    BACKEND_URL: AppConfig.API.BACKEND_URL,
    WEBSOCKET_URL: AppConfig.API.WEBSOCKET_URL,
    ENVIRONMENT: AppConfig.APP.ENVIRONMENT
  });
}

const api = axios.create({
  baseURL: API_URL,
  timeout: AppConfig.API.TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export API_URL for use in other files
export { API_URL };

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Ensure baseURL is always valid - use centralized config
    if (!config.baseURL) {
      config.baseURL = API_URL;
    }
    
    // Construct full URL
    const fullURL = config.baseURL && config.url 
      ? `${config.baseURL.replace(/\/$/, '')}${config.url.startsWith('/') ? config.url : '/' + config.url}`
      : config.url;
    
    // Debug logging
    console.log('📡 API Request:', {
      baseURL: config.baseURL,
      endpoint: config.url,
      fullURL: fullURL,
      method: config.method?.toUpperCase(),
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorUrl = error.config?.baseURL && error.config?.url
      ? `${error.config.baseURL}${error.config.url}`
      : error.config?.url || 'Unknown URL';
    
    console.error('🚨 API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      baseURL: error.config?.baseURL,
      endpoint: error.config?.url,
      fullURL: errorUrl,
      message: error.response?.data?.message || error.message,
      errorType: error.code || error.name
    });
    
    // Log connection errors more clearly
    if (error.code === 'ERR_CONNECTION_REFUSED' || error.message.includes('Network Error')) {
      console.error('❌ Connection Error Details:', {
        attemptedURL: errorUrl,
        baseURL: error.config?.baseURL,
        endpoint: error.config?.url,
        possibleCauses: [
          'Backend server is not running',
          'CORS issue',
          'Firewall blocking connection',
          'Wrong URL in configuration'
        ]
      });
    }
    
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
