export const formatCurrency = (amount: number, currency: string = 'Rs.') => {
  const num = Number(amount || 0);
  return `${currency} ${num.toFixed(0)}`;
};

export const formatDistanceKm = (km: number) => `${Number(km || 0).toFixed(1)} km`;


