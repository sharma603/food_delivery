import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_ENDPOINTS, STORAGE_KEYS, API_CONFIG } from '../utils/constants';

// Base URL for the backend API  
const BASE_URL = AUTH_ENDPOINTS.LOGIN.replace('/login', '');

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Customer Registration
  async register(userData) {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Customer Login
  async login(credentials) {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get Customer Profile
  async getProfile() {
    try {
      const response = await api.get('/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  // Update Customer Profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },


  // Change Password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },
};

// Address API functions
export const addressAPI = {
  // Get all addresses
  async getAllAddresses() {
    try {
      const response = await api.get('/customer/auth/addresses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch addresses' };
    }
  },

  // Get single address
  async getAddress(addressId) {
    try {
      const response = await api.get(`/customer/auth/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch address' };
    }
  },

  // Add new address
  async addAddress(addressData) {
    try {
      const response = await api.post('/customer/auth/addresses', addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add address' };
    }
  },

  // Update address
  async updateAddress(addressId, addressData) {
    try {
      const response = await api.put(`/customer/auth/addresses/${addressId}`, addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update address' };
    }
  },

  // Delete address
  async deleteAddress(addressId) {
    try {
      const response = await api.delete(`/customer/auth/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete address' };
    }
  },
};

export default api;

