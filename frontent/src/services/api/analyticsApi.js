import api from '../../utils/api';

export const getSystemAnalytics = async () => {
  const response = await api.get('/analytics/system');
  return response.data;
};

export const getRevenueData = async () => {
  const response = await api.get('/analytics/revenue');
  return response.data;
};

export const getPerformanceMetrics = async () => {
  const response = await api.get('/analytics/performance');
  return response.data;
};
