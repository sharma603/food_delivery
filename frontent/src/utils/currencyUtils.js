// Currency Utilities
// This file structure created as per requested organization

export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', code: 'CNY' },
  JPY: { symbol: '¥', name: 'Japanese Yen', code: 'JPY' },
};

export const formatCurrency = (amount, currencyCode = 'NPR', locale = 'en-NP') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyCompact = (amount, currencyCode = 'NPR', locale = 'en-NP') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

export const parseCurrency = (currencyString) => {
  const numericValue = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(numericValue) || 0;
};

export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  // This would integrate with a currency conversion API
  // For now, return a mock conversion
  if (fromCurrency === toCurrency) return amount;
  
  // Real data
  const mockRates = {
    'USD-EUR': 0.85,
    'USD-GBP': 0.75,
    'USD-INR': 83.0,
    'EUR-USD': 1.18,
    'GBP-USD': 1.33,
    'INR-USD': 0.012,
  };
  
  const rateKey = `${fromCurrency}-${toCurrency}`;
  const rate = mockRates[rateKey] || 1;
  
  return amount * rate;
};

export const calculateTax = (amount, taxRate) => {
  return amount * (taxRate / 100);
};

export const calculateDiscount = (amount, discountPercent) => {
  return amount * (discountPercent / 100);
};

export const calculateTotal = (subtotal, taxRate = 0, discountPercent = 0, deliveryFee = 0) => {
  const discount = calculateDiscount(subtotal, discountPercent);
  const afterDiscount = subtotal - discount;
  const tax = calculateTax(afterDiscount, taxRate);
  return afterDiscount + tax + deliveryFee;
};

export const formatPriceRange = (minPrice, maxPrice, currencyCode = 'NPR') => {
  const min = formatCurrency(minPrice, currencyCode);
  const max = formatCurrency(maxPrice, currencyCode);
  return `${min} - ${max}`;
};

export const calculateCommission = (amount, commissionRate) => {
  return amount * (commissionRate / 100);
};

export const roundToCurrency = (amount, currencyCode = 'NPR') => {
  // Most currencies round to 2 decimal places, except JPY, KRW, etc.
  const noPrecisionCurrencies = ['JPY', 'KRW', 'VND'];
  const decimals = noPrecisionCurrencies.includes(currencyCode) ? 0 : 2;
  
  return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
