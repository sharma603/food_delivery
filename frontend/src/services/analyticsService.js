// Analytics Service - API calls for restaurant analytics
import api from '../utils/api';

const analyticsService = {
  // Get dashboard analytics
  getDashboard: async (params = {}) => {
    const { startDate, endDate, period = 'daily' } = params;
    const queryParams = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      period
    }).toString();
    
    const response = await api.get(`/restaurant/analytics/dashboard?${queryParams}`);
    return response.data;
  },

  // Get sales analytics
  getSales: async (params = {}) => {
    const { startDate, endDate, groupBy = 'day' } = params;
    const queryParams = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      groupBy
    }).toString();
    
    const response = await api.get(`/restaurant/analytics/sales?${queryParams}`);
    return response.data;
  },

  // Get menu performance
  getMenuPerformance: async (params = {}) => {
    const { startDate, endDate, category } = params;
    const queryParams = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(category && { category })
    }).toString();
    
    const response = await api.get(`/restaurant/analytics/menu?${queryParams}`);
    return response.data;
  },

  // Get customer analytics
  getCustomers: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    }).toString();
    
    const response = await api.get(`/restaurant/analytics/customers?${queryParams}`);
    return response.data;
  },

  // Get operational metrics
  getOperations: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    }).toString();
    
    const response = await api.get(`/restaurant/analytics/operations?${queryParams}`);
    return response.data;
  },

  // Export analytics data
  exportData: async (type, params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      type,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    }).toString();
    
    const response = await api.get(`/restaurant/analytics/export?${queryParams}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${type}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response;
  }
};

export default analyticsService;

