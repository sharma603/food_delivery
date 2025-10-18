import axios from 'axios';
import { API_CONFIG } from '../utils/constants';

// Create axios instance for mobile restaurant APIs
const restaurantAxios = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/mobile/restaurants`,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
restaurantAxios.interceptors.request.use(
  async (config) => {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const token = await AsyncStorage.default.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Restaurant API functions
const restaurantService = {
  // Get all restaurants with optional filters
  async getRestaurants(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        cuisine,
        search,
        latitude,
        longitude,
        radius = 10,
        sortBy = 'rating.average',
        sortOrder = 'desc'
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      
      if (cuisine) queryParams.append('cuisine', cuisine);
      if (search) queryParams.append('search', search);
      if (latitude) queryParams.append('latitude', latitude.toString());
      if (longitude) queryParams.append('longitude', longitude.toString());
      if (radius) queryParams.append('radius', radius.toString());

      const response = await restaurantAxios.get(`/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch restaurants' };
    }
  },

  // Get single restaurant by ID with menu
  async getRestaurant(restaurantId) {
    try {
      const response = await restaurantAxios.get(`/${restaurantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch restaurant' };
    }
  },

  // Search restaurants by name/cuisine
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

  // Get nearby restaurants
  async getNearbyRestaurants(latitude, longitude, radius = 10) {
    try {
      const params = {
        latitude,
        longitude,
        radius,
        sortBy: 'address.coordinates'
      };
      return await this.getRestaurants(params);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch nearby restaurants' };
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
  },

  // Get restaurants by delivery options
  async getRestaurantsByDelivery(deliveryTime) {
    try {
      const params = {
        sortBy: 'delivery.time',
        sortOrder: 'asc'
      };
      if (deliveryTime) {
        params.maxDeliveryTime = deliveryTime;
      }
      return await this.getRestaurants(params);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch restaurants by delivery' };
    }
  }
};

// Menu API functions
const menuService = {
  // Get menu for a restaurant
  async getMenu(restaurantId) {
    try {
      const response = await restaurantAxios.get(`/${restaurantId}`);
      return response.data.data.menu;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch menu' };
    }
  },

  // Get menu categories
  async getMenuCategories(restaurantId) {
    try {
      const menu = await this.getMenu(restaurantId);
      return menu?.categories || [];
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch menu categories' };
    }
  },

  // Get menu items
  async getMenuItems(restaurantId, categoryId = null) {
    try {
      const menu = await this.getMenu(restaurantId);
      if (!menu) return [];
      
      let items = menu.items || [];
      if (categoryId) {
        items = items.filter(item => item.category === categoryId);
      }
      return items;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch menu items' };
    }
  },

  // Search menu items
  async searchMenuItems(restaurantId, searchQuery) {
    try {
      const items = await this.getMenuItems(restaurantId);
      const query = searchQuery.toLowerCase();
      return items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search menu items' };
    }
  },

  // Get popular menu items
  async getPopularMenuItems(restaurantId, limit = 10) {
    try {
      const items = await this.getMenuItems(restaurantId);
      return items
        .filter(item => item.isActive)
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, limit);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch popular items' };
    }
  },

  // Get featured menu items
  async getFeaturedMenuItems(restaurantId, limit = 10) {
    try {
      const items = await this.getMenuItems(restaurantId);
      return items
        .filter(item => item.isActive && item.isFeatured)
        .slice(0, limit);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch featured items' };
    }
  }
};

// Additional menu API functions
const menuAggregateService = {
  // Get all menu items from all restaurants
  async getAllMenuItems(params = {}) {
    try {
      const restaurantAxios = require('axios').create({
        baseURL: `${API_CONFIG.BASE_URL}/mobile/menu-items`,
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const {
        page = 1,
        limit = 20,
        category,
        search,
        cuisine,
        isVeg,
        sortBy = 'name',
        sortOrder = 'asc'
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      
      if (category) queryParams.append('category', category);
      if (search) queryParams.append('search', search);
      if (cuisine) queryParams.append('cuisine', cuisine);
      if (isVeg !== undefined) queryParams.append('isVeg', isVeg);

      const response = await restaurantAxios.get(`/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch menu items' };
    }
  },

  // Get menu items by category
  async getMenuItemsByCategory(category, filters = {}) {
    return await this.getAllMenuItems({ category, ...filters });
  },

  // Search menu items across all restaurants
  async searchMenuItems(searchQuery, filters = {}) {
    return await this.getAllMenuItems({ search: searchQuery, ...filters });
  },

  // Get vegetarian menu items
  async getVegetarianMenuItems(filters = {}) {
    return await this.getAllMenuItems({ isVeg: true, ...filters });
  },

  // Get menu items by cuisine
  async getMenuItemsByCuisine(cuisine, filters = {}) {
    return await this.getAllMenuItems({ cuisine, ...filters });
  },

  // Get popular menu items (assuming we add popularity stats)
  async getPopularMenuItems(filters = {}) {
    return await this.getAllMenuItems({ sortBy: 'popularity', sortOrder: 'desc', ...filters });
  }
};

// Export services
export const restaurantAPI = restaurantService;
export const menuAPI = menuService;
export const menuAggregatorAPI = menuAggregateService;
export default restaurantService;
