import api from '../../utils/api';

export const getCommissionSettings = async () => {
  const response = await api.get('/settings/commission');
  return response.data;
};

export const updateCommissionSettings = async (settings) => {
  const response = await api.put('/settings/commission', settings);
  return response.data;
};

export const getSystemSettings = async () => {
  const response = await api.get('/settings/system');
  return response.data;
};

export const updateSystemSettings = async (settings) => {
  const response = await api.put('/settings/system', settings);
  return response.data;
};
