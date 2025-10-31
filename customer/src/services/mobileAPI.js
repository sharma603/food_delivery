import axios from 'axios';
import { SERVER_CONFIG } from '../config/serverConfig';
import { API_CONFIG, STORAGE_KEYS, AUTH_ENDPOINTS } from '../utils/constants';

// Network connectivity test function
const testNetworkConnectivity = async () => {
  try {
    // Use centralized server configuration
    const healthUrl = `${SERVER_CONFIG.BASE_URL}/health`;
    
    const response = await axios.get(healthUrl, {
      timeout: 5000
    });
    return true;
  } catch (error) {
    // Try alternative endpoints
    try {
      const altUrl = `${SERVER_CONFIG.API_BASE_URL}/mobile/restaurants`;
      await axios.get(altUrl, { timeout: 3000 });
      return true;
    } catch (altError) {
      return false;
    }
  }
};

// Create axios instance for mobile APIs
const mobileAxios = axios.create({
  baseURL: SERVER_CONFIG.MOBILE_API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
mobileAxios.interceptors.request.use(
  async (config) => {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const token = await AsyncStorage.default.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Silently handle error
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
mobileAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // For login/registration errors, preserve the exact backend error
    // Don't modify the error - let it be handled by the calling code
    if (error.response?.data?.message) {
      // Re-throw with the backend's specific message
      return Promise.reject(new Error(error.response.data.message));
    }
    
    // For other errors, provide default messages
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      return Promise.reject(new Error('Authentication failed. Please login again.'));
    } else if (error.response?.status === 403) {
      return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
    } else if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    } else if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }
    
    return Promise.reject(error);
  }
);

// Mobile Restaurant API functions
const mobileRestaurantService = {
  // Get all restaurants for mobile app
  async getRestaurants(params = {}) {
    try {
      // Test network connectivity first
      const isConnected = await testNetworkConnectivity();
      if (!isConnected) {
        throw { message: 'Network error. Please check your internet connection and server status.' };
      }

      const {
        page = 1,
        limit = 20,
        cuisine,
        search,
        city,
        sortBy = 'rating.average',
        sortOrder = 'desc',
        onlyOpen = true // Default to only show open restaurants
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      
      if (cuisine) queryParams.append('cuisine', cuisine);
      if (search) queryParams.append('search', search);
      if (city) queryParams.append('city', city);
      if (onlyOpen) queryParams.append('isOpen', 'true');

      const response = await mobileAxios.get(`/restaurants/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error') || !error.response) {
        throw { message: 'Network error. Please check your internet connection and server status.' };
      }
      throw error.response?.data || { message: 'Failed to fetch restaurants' };
    }
  },

  // Get single restaurant with menu for mobile app
  async getRestaurant(restaurantId) {
    try {
      const response = await mobileAxios.get(`/restaurants/${restaurantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch restaurant' };
    }
  },

  // Search restaurants
  async searchRestaurants(query, filters = {}) {
    try {
      const params = {
        search: query,
        ...filters
      };
      return await this.getRestaurants(params);
    } catch (error) {
      throw error.response?.data || { message: 'Search failed' };
    }
  },

  // Get restaurants by cuisine
  async getRestaurantsByCuisine(cuisine, filters = {}) {
    try {
      const params = {
        cuisine: Array.isArray(cuisine) ? cuisine.join(',') : cuisine,
        ...filters
      };
      return await this.getRestaurants(params);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch restaurants by cuisine' };
    }
  },

  // Get popular restaurants
  async getPopularRestaurants(limit = 20) {
    try {
      const params = {
        sortBy: 'rating.average',
        sortOrder: 'desc',
        limit
      };
      return await this.getRestaurants(params);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch popular restaurants' };
    }
  }
};

// Mobile Menu API functions
const mobileMenuService = {
  // Get all menu items for mobile app
  async getMenuItems(params = {}) {
    try {
      // Test network connectivity first
      const isConnected = await testNetworkConnectivity();
      if (!isConnected) {
        throw { message: 'Network error. Please check your internet connection and server status.' };
      }

      const {
        page = 1,
        limit = 20,
        search,
        category,
        restaurantId,
        cuisine,
        isVeg,
        sortBy = 'name',
        sortOrder = 'asc',
        onlyOpen = true // Default to only show items from open restaurants
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (restaurantId) queryParams.append('restaurantId', restaurantId);
      if (cuisine) queryParams.append('cuisine', cuisine);
      if (isVeg !== undefined) queryParams.append('isVeg', isVeg);
      if (onlyOpen) queryParams.append('restaurantIsOpen', 'true');

      const response = await mobileAxios.get(`/menu-items/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw { message: 'Network error. Please check your internet connection.' };
      }
      throw error.response?.data || { message: 'Failed to fetch menu items' };
    }
  },

  // Get single menu item for mobile app
  async getMenuItem(itemId) {
    try {
      const response = await mobileAxios.get(`/menu-items/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch menu item' };
    }
  },

  // Get restaurant menu for mobile app
  async getRestaurantMenu(restaurantId, params = {}) {
    try {
      const { category, search } = params;
      const queryParams = new URLSearchParams();
      
      if (category) queryParams.append('category', category);
      if (search) queryParams.append('search', search);

      const response = await mobileAxios.get(`/menu-items/restaurants/${restaurantId}/menu?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch restaurant menu' };
    }
  },

  // Search menu items
  async searchMenuItems(searchQuery, filters = {}) {
    try {
      const params = {
        search: searchQuery,
        ...filters
      };
      return await this.getMenuItems(params);
    } catch (error) {
      throw error.response?.data || { message: 'Search failed' };
    }
  },

  // Get vegetarian menu items
  async getVegetarianMenuItems(filters = {}) {
    try {
      const params = {
        isVeg: true,
        ...filters
      };
      return await this.getMenuItems(params);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch vegetarian items' };
    }
  },

  // Get menu items by category
  async getMenuItemsByCategory(category, filters = {}) {
    try {
      const params = {
        category,
        ...filters
      };
      return await this.getMenuItems(params);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch menu items by category' };
    }
  }
};

// Mobile Category API functions
const mobileCategoryService = {
  // Get all categories for mobile app
  async getCategories(params = {}) {
    try {
      const { restaurantId } = params;
      const queryParams = new URLSearchParams();
      
      if (restaurantId) queryParams.append('restaurantId', restaurantId);

      const response = await mobileAxios.get(`/categories/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  },

  // Get popular categories for mobile app
  async getPopularCategories(limit = 10) {
    try {
      const response = await mobileAxios.get(`/categories/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch popular categories' };
    }
  },

  // Get menu items by category for mobile app
  async getCategoryMenuItems(categoryId, params = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        restaurantId,
        sortBy = 'name',
        sortOrder = 'asc'
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      
      if (restaurantId) queryParams.append('restaurantId', restaurantId);

      const response = await mobileAxios.get(`/categories/${categoryId}/menu-items?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch category menu items' };
    }
  }
};

// Mobile Authentication API functions
const mobileAuthService = {
  // Forgot password
  async forgotPassword(emailData) {
    try {
      const response = await mobileAxios.post('/auth/forgot-password', emailData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reset email' };
    }
  },

  // Verify OTP
  async verifyOTP(email, otp) {
    try {
      const response = await mobileAxios.post('/auth/verify-otp', {
        email: email,
        otp: otp
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to verify OTP' };
      const errorObj = new Error(errorData.message);
      errorObj.response = error.response;
      throw errorObj;
    }
  },

  // Reset password with OTP
  async resetPassword(email, otp, newPassword) {
    try {
      const response = await mobileAxios.post('/auth/reset-password', {
        email: email,
        otp: otp,
        newPassword: newPassword
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to reset password' };
      const errorObj = new Error(errorData.message);
      errorObj.response = error.response;
      throw errorObj;
    }
  },

  // Register customer
  async register(userData) {
    try {
      // Test network connectivity first
      const isConnected = await testNetworkConnectivity();
      if (!isConnected) {
        throw { message: 'Network error. Please check your internet connection and server status.' };
      }
      
      const response = await mobileAxios.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error') || !error.response) {
        throw { message: 'Network error. Please check your internet connection and server status.' };
      }
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login customer
  async login(credentials) {
    try {
      const response = await mobileAxios.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      // Preserve the detailed error message from backend
      const errorData = error.response?.data || error.response?.data?.message || { message: 'Login failed' };
      
      // Create error with detailed message
      if (typeof errorData === 'string') {
        throw new Error(errorData);
      } else if (errorData.message) {
        throw new Error(errorData.message);
      } else {
        throw error;
      }
    }
  },

  // Get customer profile
  async getProfile() {
    try {
      const response = await mobileAxios.get('/auth/profile');
      return response.data;
    } catch (error) {
      // If it's already a processed error (has message), throw it as-is
      if (error.message && error.message !== 'Failed to get profile') {
        throw error;
      }
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  // Update customer profile
  async updateProfile(profileData) {
    try {
      const response = await mobileAxios.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await mobileAxios.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to change password' };
      const errorObj = new Error(errorData.message);
      errorObj.response = error.response;
      throw errorObj;
    }
  },

  // Logout
  async logout() {
    try {
      const response = await mobileAxios.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Logout failed' };
    }
  }
};

// Mobile Orders API functions
const mobileOrderService = {
  // Get customer orders
  async getOrders(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      
      if (status) queryParams.append('status', status);

      const response = await mobileAxios.get(`/orders/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  // Get single order
  async getOrder(orderId) {
    try {
      const response = await mobileAxios.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch order' };
    }
  },

  // Create new order
  async createOrder(orderData) {
    try {
      const response = await mobileAxios.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create order' };
    }
  },

  // Cancel order
  async cancelOrder(orderId) {
    try {
      const response = await mobileAxios.put(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel order' };
    }
  },

  // Get orders by status
  async getOrdersByStatus(status, filters = {}) {
    try {
      const params = {
        status,
        ...filters
      };
      return await this.getOrders(params);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders by status' };
    }
  }
};

// Mobile Offers API functions
const mobileOfferService = {
  async getOffers(params = {}) {
    try {
      const response = await mobileAxios.get('/offers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getOffer(offerId) {
    try {
      const response = await mobileAxios.get(`/offers/${offerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getCoupons(params = {}) {
    try {
      const response = await mobileAxios.get('/offers/coupons/list', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async validateCoupon(couponData) {
    try {
      const response = await mobileAxios.post('/offers/coupons/validate', couponData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getRestaurantOffers(restaurantId) {
    try {
      const response = await mobileAxios.get(`/offers/restaurants/${restaurantId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Export services
export const mobileRestaurantAPI = mobileRestaurantService;
export const mobileMenuAPI = mobileMenuService;
export const mobileCategoryAPI = mobileCategoryService;
export const mobileAuthAPI = mobileAuthService;
export const mobileOrderAPI = mobileOrderService;
export const mobileOfferAPI = mobileOfferService;

// Default export for backward compatibility
export default {
  restaurants: mobileRestaurantService,
  menu: mobileMenuService,
  categories: mobileCategoryService,
  auth: mobileAuthService,
  orders: mobileOrderService,
  offers: mobileOfferService
};
