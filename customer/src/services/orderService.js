import axios from 'axios';
import { API_CONFIG } from '../utils/constants';

// Create axios instance for order operations
const orderAxios = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
orderAxios.interceptors.request.use(
  async (config) => {
    try {
      console.log('Making order API request to:', config.url);
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const { STORAGE_KEYS } = await import('../utils/constants');
      const token = await AsyncStorage.default.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting auth token for order:', error);
    }
    return config;
  },
  (error) => {
    console.log('Order request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
orderAxios.interceptors.response.use(
  (response) => {
    console.log('Order API Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('Order API Error:', error.message);
    console.log('Order Error details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

class OrderService {
  // Create a new order
  async createOrder(orderData) {
    try {
      console.log('Creating order with data:', orderData);
      
      // Use mobile API endpoint for customer orders
      const response = await orderAxios.post('/mobile/orders', orderData);
      
      console.log('Order created successfully:', response.data);
      return {
        success: true,
        data: response.data,
        orderId: response.data.data?.orderNumber || response.data.data?._id || response.data._id
      };
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw { message: 'Network error. Please check your internet connection.' };
      }
      
      throw error.response?.data || { message: 'Failed to create order' };
    }
  }

  // Get order by ID
  async getOrderById(orderId) {
    try {
      console.log('Fetching order:', orderId);
      
      // Use authenticated endpoint for order details
      const response = await orderAxios.get(`/orders/${orderId}`);
      
      console.log('Order fetched successfully:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw { message: 'Network error. Please check your internet connection.' };
      }
      
      throw error.response?.data || { message: 'Failed to fetch order' };
    }
  }

  // Get user's orders
  async getUserOrders(userId, params = {}) {
    try {
      console.log('Fetching user orders for:', userId);
      
      const response = await orderAxios.get(`/orders/user/${userId}`, { params });
      
      console.log('User orders fetched successfully:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching user orders:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw { message: 'Network error. Please check your internet connection.' };
      }
      
      throw error.response?.data || { message: 'Failed to fetch user orders' };
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, additionalData = {}) {
    try {
      console.log('Updating order status:', orderId, status);
      
      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData
      };
      
      const response = await orderAxios.patch(`/orders/${orderId}/status`, updateData);
      
      console.log('Order status updated successfully:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw { message: 'Network error. Please check your internet connection.' };
      }
      
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  }

  // Cancel order
  async cancelOrder(orderId, reason = '') {
    try {
      console.log('Cancelling order:', orderId);
      
      const cancelData = {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString()
      };
      
      const response = await orderAxios.patch(`/orders/${orderId}/cancel`, cancelData);
      
      console.log('Order cancelled successfully:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw { message: 'Network error. Please check your internet connection.' };
      }
      
      throw error.response?.data || { message: 'Failed to cancel order' };
    }
  }

  // Get order statistics
  async getOrderStats(userId) {
    try {
      console.log('Fetching order statistics for:', userId);
      
      const response = await orderAxios.get(`/orders/stats/${userId}`);
      
      console.log('Order statistics fetched successfully:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw { message: 'Network error. Please check your internet connection.' };
      }
      
      throw error.response?.data || { message: 'Failed to fetch order statistics' };
    }
  }
}

// Helper function to format order data for mobile API
export const formatOrderData = (cartData, locationData, userData = {}, paymentMethod = 'cash_on_delivery') => {
  const restaurantEntries = Object.entries(cartData.restaurants);
  
  if (restaurantEntries.length === 0) {
    throw new Error('Cart is empty');
  }

  // Format delivery address for mobile API
  const deliveryAddress = {
    street: locationData?.address || 'Location not specified',
    city: locationData?.city || '',
    state: locationData?.state || '',
    zipCode: locationData?.zipCode || '',
    coordinates: {
      latitude: locationData?.latitude || 0,
      longitude: locationData?.longitude || 0
    }
  };

  // Handle multiple restaurants by creating separate orders
  if (restaurantEntries.length === 1) {
    // Single restaurant order
    const [restaurantId, restaurantData] = restaurantEntries[0];
    
    const items = restaurantData.items.map(item => ({
      itemId: item._id,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions || ''
    }));

    const orderData = {
      restaurantId: restaurantId,
      items: items,
      deliveryAddress: deliveryAddress,
      specialInstructions: '',
      paymentMethod: paymentMethod,
      deliveryFee: locationData?.totalCalculatedDeliveryFee || 0
    };

    console.log('Formatted single restaurant order:', orderData);
    return orderData;
  } else {
    // Multiple restaurants - create order with all restaurants
    const orders = restaurantEntries.map(([restaurantId, restaurantData]) => {
      const items = restaurantData.items.map(item => ({
        itemId: item._id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      }));

      return {
        restaurantId: restaurantId,
        items: items,
        deliveryAddress: deliveryAddress,
        specialInstructions: '',
        paymentMethod: paymentMethod,
        deliveryFee: restaurantData.deliveryFee || 0
      };
    });

    console.log('Formatted multi-restaurant orders:', orders);
    return {
      multipleOrders: true,
      orders: orders,
      totalDeliveryFee: locationData?.totalCalculatedDeliveryFee || 0
    };
  }
};

export default new OrderService();
