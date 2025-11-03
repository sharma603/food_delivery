import api from '../../utils/api';

export const getPayouts = async () => {
  const response = await api.get('/payments/payouts');
  return response.data;
};

export const processPayout = async (restaurantId, amount) => {
  const response = await api.post('/payments/payout', { restaurantId, amount });
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await api.get('/payments/history');
  return response.data;
};
