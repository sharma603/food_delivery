// Centralized Server Configuration
// Change these values to match your server setup

export const SERVER_CONFIG = {
  // Server IP Address
  // For local development: 'localhost' or '127.0.0.1'
  // For physical devices: Your computer's IP address (e.g., '192.168.18.38')
  // For Android emulator: '10.0.2.2'
  IP: '192.168.18.38',
  
  // Server Port
  PORT: '5000',
  
  // Protocol
  PROTOCOL: 'http',
  
  // Auto-generated URLs (don't change these)
  get BASE_URL() {
    return `${this.PROTOCOL}://${this.IP}:${this.PORT}`;
  },
  
  get API_BASE_URL() {
    return `${this.BASE_URL}/api/v1`;
  },
  
  get MOBILE_API_BASE_URL() {
    return `${this.API_BASE_URL}/mobile`;
  }
};

// Environment variable overrides (optional)
export const SERVER_IP = process.env.EXPO_PUBLIC_SERVER_IP || SERVER_CONFIG.IP;
export const SERVER_PORT = process.env.EXPO_PUBLIC_SERVER_PORT || SERVER_CONFIG.PORT;

// Legacy support - these will be removed in future versions
export const API_CONFIG = {
  BASE_URL: `${SERVER_CONFIG.PROTOCOL}://${SERVER_IP}:${SERVER_PORT}/api/v1`,
  TIMEOUT: 10000,
  VERSION: 'v1'
};

// API Endpoints
export const API_ENDPOINTS = {
  CUSTOMER_AUTH: `${API_CONFIG.BASE_URL}/customer/auth`,
  
  // Mobile API endpoints (dedicated for mobile app)
  MOBILE_AUTH: `${API_CONFIG.BASE_URL}/mobile/auth`,
  MOBILE_RESTAURANTS: `${API_CONFIG.BASE_URL}/mobile/restaurants`,
  MOBILE_MENU_ITEMS: `${API_CONFIG.BASE_URL}/mobile/menu-items`,
  MOBILE_CATEGORIES: `${API_CONFIG.BASE_URL}/mobile/categories`,
  
  // Legacy endpoints (for backward compatibility)
  RESTAURANTS: `${API_CONFIG.BASE_URL}/restaurants`,
  ORDERS: `${API_CONFIG.BASE_URL}/orders`,
  PAYMENTS: `${API_CONFIG.BASE_URL}/payments`,
  MENU_ITEMS: `${API_CONFIG.BASE_URL}/menu-items`,
};

// Auth endpoints specifically
export const AUTH_ENDPOINTS = {
  REGISTER: `${API_ENDPOINTS.CUSTOMER_AUTH}/register`,
  LOGIN: `${API_ENDPOINTS.CUSTOMER_AUTH}/login`,
  PROFILE: `${API_ENDPOINTS.CUSTOMER_AUTH}/me`,
  UPDATE_PROFILE: `${API_ENDPOINTS.CUSTOMER_AUTH}/profile`,
  CHANGE_PASSWORD: `${API_ENDPOINTS.CUSTOMER_AUTH}/change-password`,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  USER_PREFERENCES: 'userPreferences',
  APP_SETTINGS: 'appSettings',
  CART_DATA: 'cartData',
};

// Color Theme - Swiggy/Zomato inspired
export const COLORS = {
  PRIMARY: '#fc8019',         // Swiggy Orange (main brand color)
  PRIMARY_DARK: '#e66100',    // Darker orange for hover states
  PRIMARY_LIGHT: '#ff9a3d',   // Light orange for accents
  SECONDARY: '#ff6b35',       // Secondary orange-red
  WHITE: '#ffffff',
  BLACK: '#000000',
  TEXT_PRIMARY: '#1a1a1a',     // Dark gray for main text
  TEXT_SECONDARY: '#666666',   // Medium gray for secondary text
  TEXT_LIGHT: '#999999',      // Light gray for placeholder text
  BACKGROUND: '#f7f7f7',      // Light gray background
  CARD_BACKGROUND: '#ffffff',
  BORDER: '#e5e5e5',          // Medium gray border
  SUCCESS: '#26a69a',         // Teal green for success
  WARNING: '#ff9800',         // Orange for warnings
  ERROR: '#f44336',           // Red for errors
  SHADOW: 'rgba(0, 0, 0, 0.1)',
  
  // Food category colors
  FOOD_BG: '#fff3e0',         // Food item background
  PRICE_COLOR: '#ff4444',     // Price highlighting
  RATING_COLOR: '#ffe135',    // Star rating color
  RESTAURANT_CARD: '#ffffff',  // Restaurant card background
};

// App Constants
export const APP_CONFIG = {
  APP_NAME: 'HypeBridge',
  CURRENCY: 'NPR',
  CURRENCY_SYMBOL: 'Rs',
  CURRENCY_CODE: 'NPR',
  COUNTRY: 'Nepal',
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  LOGIN_FAILED: 'Login failed. Please check your credentials and try again.',
  REGISTER_FAILED: 'Registration failed. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
};

// Map & Navigation API Keys
export const MAP_API_KEYS = {
  GRAPHHOPPER_API_KEY: '11923cb4-8130-4905-9737-ef6b60696823',
  GRAPHHOPPER_BASE_URL: 'https://graphhopper.com/api/1',
};