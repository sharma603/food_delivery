import api from '../../utils/api';

// Zone Management API
export const zoneApi = {
  // Get all zones
  getAllZones: async (params = {}) => {
    const response = await api.get('/superadmin/delivery/zones', { params });
    return response.data;
  },

  // Get zone by ID
  getZoneById: async (zoneId) => {
    const response = await api.get(`/superadmin/delivery/zones/${zoneId}`);
    return response.data;
  },

  // Create new zone
  createZone: async (zoneData) => {
    const response = await api.post('/superadmin/delivery/zones', zoneData);
    return response.data;
  },

  // Update zone
  updateZone: async (zoneId, zoneData) => {
    const response = await api.put(`/superadmin/delivery/zones/${zoneId}`, zoneData);
    return response.data;
  },

  // Delete zone
  deleteZone: async (zoneId) => {
    const response = await api.delete(`/superadmin/delivery/zones/${zoneId}`);
    return response.data;
  },

  // Get zone statistics
  getZoneStats: async () => {
    const response = await api.get('/superadmin/delivery/zones/stats');
    return response.data;
  }
};

// Personnel Management API
export const personnelApi = {
  // Get all personnel
  getAllPersonnel: async () => {
    const response = await api.get('/superadmin/delivery/personnel');
    return response.data;
  },

  // Get personnel by ID
  getPersonnelById: async (personnelId) => {
    const response = await api.get(`/superadmin/delivery/personnel/${personnelId}`);
    return response.data;
  },

  // Create new personnel
  createPersonnel: async (personnelData) => {
    const response = await api.post('/superadmin/delivery/personnel', personnelData);
    return response.data;
  },

  // Update personnel
  updatePersonnel: async (personnelId, personnelData) => {
    const response = await api.put(`/superadmin/delivery/personnel/${personnelId}`, personnelData);
    return response.data;
  },

  // Delete personnel
  deletePersonnel: async (personnelId) => {
    const response = await api.delete(`/superadmin/delivery/personnel/${personnelId}`);
    return response.data;
  },

  // Update personnel status
  updatePersonnelStatus: async (personnelId, status) => {
    const response = await api.put(`/superadmin/delivery/personnel/${personnelId}/status`, { status });
    return response.data;
  },

  // Get personnel statistics
  getPersonnelStats: async () => {
    const response = await api.get('/superadmin/delivery/personnel/stats');
    return response.data;
  }
};

// Live Tracking API
export const trackingApi = {
  // Get active deliveries
  getActiveDeliveries: async () => {
    const response = await api.get('/superadmin/delivery/tracking/active');
    return response.data;
  },

  // Get delivery by ID
  getDeliveryById: async (deliveryId) => {
    const response = await api.get(`/superadmin/delivery/tracking/${deliveryId}`);
    return response.data;
  },

  // Update delivery status
  updateDeliveryStatus: async (deliveryId, status) => {
    const response = await api.put(`/superadmin/delivery/tracking/${deliveryId}/status`, { status });
    return response.data;
  },

  // Get tracking statistics
  getTrackingStats: async () => {
    const response = await api.get('/superadmin/delivery/tracking/stats');
    return response.data;
  },

  // Get delivery history
  getDeliveryHistory: async (filters = {}) => {
    const response = await api.get('/superadmin/delivery/tracking/history', { params: filters });
    return response.data;
  }
};

// Performance Analytics API
export const analyticsApi = {
  // Get overall performance stats
  getOverallStats: async (dateRange = 'week') => {
    const response = await api.get('/superadmin/delivery/analytics/overall', { 
      params: { dateRange } 
    });
    return response.data;
  },

  // Get zone performance
  getZonePerformance: async (dateRange = 'week') => {
    const response = await api.get('/superadmin/delivery/analytics/zones', { 
      params: { dateRange } 
    });
    return response.data;
  },

  // Get personnel performance
  getPersonnelPerformance: async (dateRange = 'week') => {
    const response = await api.get('/superadmin/delivery/analytics/personnel', { 
      params: { dateRange } 
    });
    return response.data;
  },

  // Get time analytics
  getTimeAnalytics: async (dateRange = 'week') => {
    const response = await api.get('/superadmin/delivery/analytics/time', { 
      params: { dateRange } 
    });
    return response.data;
  },

  // Get delivery trends
  getDeliveryTrends: async (dateRange = 'week') => {
    const response = await api.get('/superadmin/delivery/analytics/trends', { 
      params: { dateRange } 
    });
    return response.data;
  },

  // Get top performing zones
  getTopZones: async (limit = 10) => {
    const response = await api.get('/superadmin/delivery/analytics/top-zones', { 
      params: { limit } 
    });
    return response.data;
  },

  // Get top performing personnel
  getTopPersonnel: async (limit = 10) => {
    const response = await api.get('/superadmin/delivery/analytics/top-personnel', { 
      params: { limit } 
    });
    return response.data;
  }
};

// Export all APIs
export default {
  zoneApi,
  personnelApi,
  trackingApi,
  analyticsApi
};
