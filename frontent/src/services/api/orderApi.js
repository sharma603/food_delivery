import ApiService from '../api';

class OrderApiService extends ApiService {
  constructor() {
    super();
    this.baseURL = '/superadmin/orders';
  }

  // Get all orders with pagination and filters
  async getAllOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await this.get(`${this.baseURL}?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const response = await this.get(`${this.baseURL}/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, notes = '') {
    try {
      const response = await this.put(`${this.baseURL}/${orderId}/status`, {
        status,
        notes
      });
      return response;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Bulk update order status
  async bulkUpdateOrderStatus(orderIds, status, notes = '') {
    try {
      const response = await this.put(`${this.baseURL}/bulk-status`, {
        orderIds,
        status,
        notes
      });
      return response;
    } catch (error) {
      console.error('Error bulk updating order status:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId, reason = '') {
    try {
      const response = await this.put(`${this.baseURL}/${orderId}/cancel`, {
        reason
      });
      return response;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Get order statistics
  async getOrderStats(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await this.get(`${this.baseURL}/stats?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }
  }

  // Get order analytics
  async getOrderAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await this.get(`${this.baseURL}/analytics?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      throw error;
    }
  }

  // Export orders
  async exportOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await this.get(`${this.baseURL}/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting orders:', error);
      throw error;
    }
  }

  // Get restaurants for filtering
  async getRestaurants() {
    try {
      const response = await this.get('/api/restaurants');
      return response;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(orderId, amount, reason = '') {
    try {
      const response = await this.post(`${this.baseURL}/${orderId}/refund`, {
        amount,
        reason
      });
      return response;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get order disputes
  async getOrderDisputes(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await this.get(`${this.baseURL}/disputes?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching order disputes:', error);
      throw error;
    }
  }

  // Resolve dispute
  async resolveDispute(disputeId, resolution, resolutionType) {
    try {
      const response = await this.put(`${this.baseURL}/disputes/${disputeId}/resolve`, {
        resolution,
        resolutionType
      });
      return response;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    }
  }

  // Get refunds
  async getRefunds(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await this.get(`${this.baseURL}/refunds?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching refunds:', error);
      throw error;
    }
  }

  // Process refund
  async processRefundRequest(refundId, amount, type, notes = '') {
    try {
      const response = await this.put(`${this.baseURL}/refunds/${refundId}/process`, {
        amount,
        type,
        notes
      });
      return response;
    } catch (error) {
      console.error('Error processing refund request:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const orderApi = new OrderApiService();
export { orderApi };