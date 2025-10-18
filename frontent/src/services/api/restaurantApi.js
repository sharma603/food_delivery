import ApiService from '../api';

class RestaurantApiService extends ApiService {
  constructor() {
    super();
    this.baseURL = this.baseURL + '/restaurant';
  }

  // Restaurant Dashboard
  async getDashboardData() {
    return this.get('/dashboard');
  }

  // Restaurant Orders
  async getRestaurantOrders(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getOrderById(orderId) {
    return this.get(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId, status) {
    return this.put(`/orders/${orderId}`, { status });
  }

  async acceptOrder(orderId) {
    return this.put(`/orders/${orderId}/accept`);
  }

  async rejectOrder(orderId) {
    return this.put(`/orders/${orderId}/reject`);
  }

  async markAsReady(orderId) {
    return this.put(`/orders/${orderId}/ready`);
  }

  // Restaurant Menu
  async getRestaurantMenu() {
    return this.get('/menu');
  }

  async createMenuItem(itemData) {
    return this.post('/menu', itemData);
  }

  async updateMenuItem(itemId, itemData) {
    return this.put(`/menu/${itemId}`, itemData);
  }

  async deleteMenuItem(itemId) {
    return this.delete(`/menu/${itemId}`);
  }

  // Restaurant Profile
  async getRestaurantProfile() {
    return this.get('/profile');
  }

  async updateRestaurantProfile(profileData) {
    return this.put('/profile', profileData);
  }

  // Restaurant Analytics
  async getRestaurantAnalytics(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/analytics${queryString ? `?${queryString}` : ''}`);
  }

  // Restaurant Reviews
  async getRestaurantReviews(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/reviews${queryString ? `?${queryString}` : ''}`);
  }

  async respondToReview(reviewId, response) {
    return this.put(`/reviews/${reviewId}/respond`, { response });
  }

  // Restaurant Earnings
  async getRestaurantEarnings(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/earnings${queryString ? `?${queryString}` : ''}`);
  }

  async requestPayout(amount) {
    return this.post('/earnings/payouts', { amount });
  }

  // Restaurant Settings
  async getRestaurantSettings() {
    return this.get('/settings');
  }

  async updateRestaurantSettings(settings) {
    return this.put('/settings', settings);
  }

  async updatePassword(passwordData) {
    return this.put('/settings/password', passwordData);
  }
}

export const restaurantApi = new RestaurantApiService();
export default RestaurantApiService;