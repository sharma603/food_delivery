import ApiService from '../api';

class SuperAdminApiService extends ApiService {
  constructor() {
    super();
    this.baseURL = this.baseURL + '/superadmin';
  }

  // SuperAdmin Dashboard
  async getDashboardData() {
    return this.get('/dashboard');
  }

  // SuperAdmin Orders Management
  async getAllOrders(params = {}) {
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

  async bulkUpdateOrderStatus(orderIds, status) {
    return this.put('/orders/bulk-update', { orderIds, status });
  }

  async exportOrders(filters = {}) {
    return this.post('/orders/export', filters);
  }

  async processRefund(orderId, amount, reason) {
    return this.post('/orders/refunds', { orderId, amount, reason });
  }

  async getOrderStats() {
    return this.get('/orders/stats');
  }

  async getOrderAnalytics(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/orders/analytics${queryString ? `?${queryString}` : ''}`);
  }

  // SuperAdmin Restaurant Management
  async getAllRestaurants(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/restaurants${queryString ? `?${queryString}` : ''}`);
  }

  async getRestaurantById(restaurantId) {
    return this.get(`/restaurants/${restaurantId}`);
  }

  async createRestaurant(restaurantData) {
    return this.post('/restaurants', restaurantData);
  }

  async updateRestaurant(restaurantId, restaurantData) {
    return this.put(`/restaurants/${restaurantId}`, restaurantData);
  }

  async deleteRestaurant(restaurantId) {
    return this.delete(`/restaurants/${restaurantId}`);
  }

  async approveRestaurant(restaurantId) {
    return this.put(`/restaurants/${restaurantId}/approve`);
  }

  async suspendRestaurant(restaurantId) {
    return this.put(`/restaurants/${restaurantId}/suspend`);
  }

  // SuperAdmin User Management
  async getAllUsers(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUserById(userId) {
    return this.get(`/users/${userId}`);
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }

  async suspendUser(userId) {
    return this.put(`/users/${userId}/suspend`);
  }

  async activateUser(userId) {
    return this.put(`/users/${userId}/activate`);
  }

  // SuperAdmin Analytics
  async getAnalytics(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/analytics${queryString ? `?${queryString}` : ''}`);
  }

  async getRevenueAnalytics(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/analytics/revenue${queryString ? `?${queryString}` : ''}`);
  }

  async getSystemAnalytics() {
    return this.get('/analytics/system');
  }

  async getRestaurantAnalytics() {
    return this.get('/analytics/restaurants');
  }

  // SuperAdmin Dispute Management
  async getAllDisputes(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/disputes${queryString ? `?${queryString}` : ''}`);
  }

  async getDisputeById(disputeId) {
    return this.get(`/disputes/${disputeId}`);
  }

  async updateDisputeStatus(disputeId, status, resolution, adminNotes) {
    return this.put(`/disputes/${disputeId}/status`, {
      disputeStatus: status,
      resolution,
      adminNotes
    });
  }

  async assignDispute(disputeId, assignedTo) {
    return this.put(`/disputes/${disputeId}/assign`, { assignedTo });
  }

  async addDisputeComment(disputeId, comment, isInternal = false) {
    return this.post(`/disputes/${disputeId}/comments`, { comment, isInternal });
  }

  async resolveDispute(disputeId, resolutionData) {
    return this.post(`/disputes/${disputeId}/resolve`, resolutionData);
  }

  async getDisputeAnalytics(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/disputes/analytics${queryString ? `?${queryString}` : ''}`);
  }

  async exportDisputes(filters = {}) {
    return this.post('/disputes/export', { filters });
  }

  // SuperAdmin Payments
  async getAllPayments(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/payments${queryString ? `?${queryString}` : ''}`);
  }

  async getPaymentStats() {
    return this.get('/payments/stats');
  }

  async getPaymentById(paymentId) {
    return this.get(`/payments/${paymentId}`);
  }

  async processPayout(payoutData) {
    return this.post('/payments/payouts', payoutData);
  }

  async getPayoutHistory(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/payments/payouts${queryString ? `?${queryString}` : ''}`);
  }

  async getTransactionHistory(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/payments/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async exportPayments(filters = {}) {
    return this.post('/payments/export', filters);
  }

  async getPaymentAnalytics(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/payments/analytics${queryString ? `?${queryString}` : ''}`);
  }

  // SuperAdmin Financial Management
  async getFinancialDashboard() {
    return this.get('/financial/dashboard');
  }

  async getCommissionRates(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/financial/commissions${queryString ? `?${queryString}` : ''}`);
  }

  async createCommissionRate(commissionData) {
    return this.post('/financial/commissions', commissionData);
  }

  async updateCommissionRate(commissionId, commissionData) {
    return this.put(`/financial/commissions/${commissionId}`, commissionData);
  }

  async deleteCommissionRate(commissionId) {
    return this.delete(`/financial/commissions/${commissionId}`);
  }

  async calculateCommission(orderAmount, commissionRate) {
    return this.post('/financial/commissions/calculate', { orderAmount, commissionRate });
  }

  async getSettlements(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/financial/settlements${queryString ? `?${queryString}` : ''}`);
  }

  async processSettlement(settlementId) {
    return this.post(`/financial/settlements/${settlementId}/process`);
  }

  async getSettlementById(settlementId) {
    return this.get(`/financial/settlements/${settlementId}`);
  }

  async getSettlementStats() {
    return this.get('/financial/settlements/stats');
  }

  async exportSettlements(filters = {}) {
    return this.post('/financial/settlements/export', filters);
  }

  // SuperAdmin Notifications
  async getAllNotifications() {
    return this.get('/notifications');
  }

  async createNotification(notificationData) {
    return this.post('/notifications', notificationData);
  }

  async sendBroadcastNotification(notificationData) {
    return this.post('/notifications/broadcast', notificationData);
  }

  // SuperAdmin System
  async getSystemSettings() {
    return this.get('/system');
  }

  async updateSystemSettings(settings) {
    return this.put('/system', settings);
  }

  // SuperAdmin Cash Collection Management
  async getDeliveryPersonnelCash(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `/cash/delivery-personnel${queryString ? `?${queryString}` : ''}`;
    console.log('Calling endpoint:', endpoint);
    const response = await this.get(endpoint);
    console.log('Raw API response:', response);
    return response;
  }

  async getPendingSubmissions(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/cash/pending${queryString ? `?${queryString}` : ''}`);
  }

  async reconcileCash(collectionId, data) {
    return this.post(`/cash/reconcile/${collectionId}`, data);
  }

  async getCashReport(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    return this.get(`/cash/report${queryString ? `?${queryString}` : ''}`);
  }
}

export const superadminApi = new SuperAdminApiService();
export default SuperAdminApiService;
