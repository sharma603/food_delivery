/**
 * Centralized Application Configuration
 * All configuration settings in one place
 */

const AppConfig = {
  // ============================================
  // API Configuration
  // ⚠️ CHANGE BACKEND URL HERE - This will update everywhere
  // ============================================
  API: {
    // 🔧 SINGLE PLACE TO CHANGE BACKEND URL
    // Change this value and it will update everywhere in the app
    BACKEND_SERVER: 'http://localhost:5000', // Change this to your backend URL
    
    // Base API URL (with /api/v1)
    get BASE_URL() {
      return `${this.BACKEND_SERVER}/api/v1`;
    },
    
    // Backend base URL (without /api/v1) - for images and uploads
    get BACKEND_URL() {
      return this.BACKEND_SERVER;
    },
    
    // Full backend URL with protocol and port (alias for BACKEND_URL)
    get BACKEND_BASE_URL() {
      return this.BACKEND_SERVER;
    },
    
    // WebSocket URL - converts http to ws
    get WEBSOCKET_URL() {
      return this.BACKEND_SERVER.replace('http://', 'ws://').replace('https://', 'wss://');
    },
    
    // Timeout settings
    TIMEOUT: 30000, // 30 seconds
    
    // Retry settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
  },

  // ============================================
  // API Endpoints
  // ============================================
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      VERIFY_EMAIL: '/auth/verify-email',
    },
    
    // Super Admin Auth
    SUPERADMIN_AUTH: {
      LOGIN: '/auth/superadmin/login',
      LOGOUT: '/auth/superadmin/logout',
      REGISTER: '/auth/superadmin/register',
      PROFILE: '/auth/superadmin/me',
    },
    
    // Admin Auth
    ADMIN_AUTH: {
      LOGIN: '/admin/auth/login',
      LOGOUT: '/admin/auth/logout',
    },
    
    // Customer Auth
    CUSTOMER_AUTH: {
      LOGIN: '/customer/auth/login',
      REGISTER: '/customer/auth/register',
      PROFILE: '/customer/auth/me',
    },
    
    // Restaurant Auth
    RESTAURANT_AUTH: {
      LOGIN: '/restaurant/auth/login',
      REGISTER: '/restaurant/auth/register',
      PROFILE: '/restaurant/auth/me',
    },
    
    // Delivery Auth
    DELIVERY_AUTH: {
      LOGIN: '/delivery/auth/login',
      PROFILE: '/delivery/profile',
    },
    
    // Users
    USERS: {
      GET_ALL: '/users',
      GET_BY_ID: (id) => `/users/${id}`,
      CREATE: '/users',
      UPDATE: (id) => `/users/${id}`,
      DELETE: (id) => `/users/${id}`,
      PROFILE: '/users/me',
    },
    
    // Restaurants
    RESTAURANTS: {
      GET_ALL: '/restaurants',
      GET_BY_ID: (id) => `/restaurants/${id}`,
      CREATE: '/restaurants',
      UPDATE: (id) => `/restaurants/${id}`,
      DELETE: (id) => `/restaurants/${id}`,
      SEARCH: '/restaurants/search',
    },
    
    // Super Admin - Restaurants
    SUPERADMIN_RESTAURANTS: {
      GET_ALL: '/superadmin/restaurants',
      GET_BY_ID: (id) => `/superadmin/restaurants/${id}`,
      CREATE: '/superadmin/restaurants',
      UPDATE: (id) => `/superadmin/restaurants/${id}`,
      DELETE: (id) => `/superadmin/restaurants/${id}`,
      UPDATE_STATUS: (id) => `/superadmin/restaurants/${id}/status`,
      VERIFY: (id) => `/superadmin/restaurants/${id}/verify`,
    },
    
    // Menu Items
    MENU: {
      GET_ALL: '/superadmin/menu',
      GET_BY_ID: (id) => `/superadmin/menu/${id}`,
      CREATE: '/superadmin/menu',
      UPDATE: (id) => `/superadmin/menu/${id}`,
      DELETE: (id) => `/superadmin/menu/${id}`,
      TOGGLE: (id) => `/superadmin/menu/${id}/toggle`,
      GET_BY_RESTAURANT: (restaurantId) => `/restaurants/${restaurantId}/menu`,
    },
    
    // Restaurant Menu
    RESTAURANT_MENU: {
      GET_ALL: '/restaurant/menu',
      CREATE: '/restaurant/menu',
      UPDATE: (id) => `/restaurant/menu/${id}`,
      DELETE: (id) => `/restaurant/menu/${id}`,
    },
    
    // Orders
    ORDERS: {
      GET_ALL: '/orders',
      GET_BY_ID: (id) => `/orders/${id}`,
      CREATE: '/orders',
      UPDATE: (id) => `/orders/${id}`,
      UPDATE_STATUS: (id) => `/orders/${id}/status`,
      CANCEL: (id) => `/orders/${id}/cancel`,
      MY_ORDERS: '/orders/my-orders',
    },
    
    // Super Admin - Orders
    SUPERADMIN_ORDERS: {
      GET_ALL: '/superadmin/orders',
      GET_BY_ID: (id) => `/superadmin/orders/${id}`,
    },
    
    // Payments
    PAYMENTS: {
      GET_ALL: '/payments',
      GET_BY_ID: (id) => `/payments/${id}`,
      CREATE: '/payments',
      PROCESS: (id) => `/payments/${id}/process`,
    },
    
    // Addresses
    ADDRESSES: {
      GET_ALL: '/address',
      GET_BY_ID: (id) => `/address/${id}`,
      CREATE: '/address',
      UPDATE: (id) => `/address/${id}`,
      DELETE: (id) => `/address/${id}`,
    },
    
    // Analytics
    ANALYTICS: {
      DASHBOARD: '/analytics/dashboard',
      REVENUE: '/analytics/revenue',
      ORDERS: '/analytics/orders',
      USERS: '/analytics/users',
      RESTAURANTS: '/analytics/restaurants',
    },
    
    // Super Admin - Analytics
    SUPERADMIN_ANALYTICS: {
      DASHBOARD: '/superadmin/analytics/dashboard',
      RESTAURANTS: '/superadmin/analytics/restaurants',
      ORDERS: '/superadmin/analytics/orders',
      REVENUE: '/superadmin/analytics/revenue',
    },
    
    // Delivery
    DELIVERY: {
      AVAILABLE_ORDERS: '/delivery/orders/available',
      MY_ORDERS: '/delivery/orders/my-orders',
      ACCEPT_ORDER: (id) => `/delivery/orders/${id}/accept`,
      UPDATE_LOCATION: '/delivery/location',
      EARNINGS: '/delivery/earnings',
    },
    
    // Categories
    CATEGORIES: {
      GET_ALL: '/superadmin/categories',
      GET_BY_ID: (id) => `/superadmin/categories/${id}`,
      CREATE: '/superadmin/categories',
      UPDATE: (id) => `/superadmin/categories/${id}`,
      DELETE: (id) => `/superadmin/categories/${id}`,
    },
  },

  // ============================================
  // Image & Media Configuration
  // ============================================
  IMAGES: {
    // Base URL for uploaded images
    get BASE_URL() {
      return AppConfig.API.BACKEND_BASE_URL;
    },
    
    // Upload endpoint
    UPLOAD_URL: '/uploads',
    
    // Get full image URL
    getImageUrl: (imagePath) => {
      if (!imagePath) return '';
      if (imagePath.startsWith('http')) return imagePath;
      const baseUrl = AppConfig.IMAGES.BASE_URL.replace(/\/$/, '');
      const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `${baseUrl}${path}`;
    },
    
    // Default image placeholder
    PLACEHOLDER: '/images/placeholder.jpg',
    
    // Max file size (5MB)
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    
    // Allowed image types
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  },

  // ============================================
  // Application Settings
  // ============================================
  APP: {
    NAME: 'Food Delivery System',
    VERSION: '1.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'production',
    DEBUG: process.env.NODE_ENV === 'development',
  },

  // ============================================
  // Routes Configuration
  // ============================================
  ROUTES: {
    // Public routes
    HOME: '/',
    LOGIN: '/login',
    
    // Admin routes
    ADMIN: {
      LOGIN: '/admin/login',
      DASHBOARD: '/admin/dashboard',
    },
    
    // Super Admin routes
    SUPERADMIN: {
      LOGIN: '/admin/login',
      DASHBOARD: '/admin/dashboard',
      RESTAURANTS: '/admin/restaurants',
      MENU: '/admin/menu',
      ORDERS: '/admin/orders',
      USERS: '/admin/users',
      ANALYTICS: '/admin/analytics',
      SETTINGS: '/admin/settings',
    },
    
    // Restaurant routes
    RESTAURANT: {
      LOGIN: '/restaurant/login',
      DASHBOARD: '/restaurant/dashboard',
      MENU: '/restaurant/menu',
      ORDERS: '/restaurant/orders',
      ANALYTICS: '/restaurant/analytics',
      PROFILE: '/restaurant/profile',
    },
    
    // Customer routes
    CUSTOMER: {
      LOGIN: '/login',
      REGISTER: '/register',
      DASHBOARD: '/dashboard',
      ORDERS: '/orders',
      PROFILE: '/profile',
    },
  },

  // ============================================
  // Storage Keys
  // ============================================
  STORAGE: {
    TOKEN: 'token',
    USER: 'user',
    THEME: 'theme',
    LANGUAGE: 'language',
    CART: 'cart',
    PREFERENCES: 'preferences',
  },

  // ============================================
  // Pagination & Limits
  // ============================================
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZES: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100,
  },

  // ============================================
  // Validation Rules
  // ============================================
  VALIDATION: {
    PASSWORD: {
      MIN_LENGTH: 6,
      MAX_LENGTH: 50,
      REQUIRE_UPPERCASE: false,
      REQUIRE_LOWERCASE: false,
      REQUIRE_NUMBER: false,
      REQUIRE_SPECIAL: false,
    },
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PHONE: {
      PATTERN: /^[0-9]{10}$/,
    },
  },

  // ============================================
  // Notification Settings
  // ============================================
  NOTIFICATION: {
    DEFAULT_DURATION: 3000, // 3 seconds
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 5000,
    WARNING_DURATION: 4000,
    INFO_DURATION: 3000,
  },

  // ============================================
  // Currency Settings
  // ============================================
  CURRENCY: {
    SYMBOL: '₹',
    CODE: 'INR',
    NAME: 'Indian Rupee',
    DECIMAL_PLACES: 2,
  },

  // ============================================
  // Helper Functions
  // ============================================
  HELPERS: {
    // Get full API URL
    getApiUrl: (endpoint) => {
      const baseUrl = AppConfig.API.BASE_URL.replace(/\/$/, '');
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return `${baseUrl}${path}`;
    },
    
    // Get image URL
    getImageUrl: (imagePath) => {
      return AppConfig.IMAGES.getImageUrl(imagePath);
    },
    
    // Get storage item
    getStorageItem: (key) => {
      try {
        const item = localStorage.getItem(AppConfig.STORAGE[key] || key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        return localStorage.getItem(AppConfig.STORAGE[key] || key);
      }
    },
    
    // Set storage item
    setStorageItem: (key, value) => {
      try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(AppConfig.STORAGE[key] || key, stringValue);
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    },
    
    // Remove storage item
    removeStorageItem: (key) => {
      localStorage.removeItem(AppConfig.STORAGE[key] || key);
    },
  },
};

export default AppConfig;

