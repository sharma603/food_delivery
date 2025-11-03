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
  // TODO: Integrate with actual currency conversion API (e.g., ExchangeRate API, Fixer.io)
  // For now, returns 1:1 conversion as placeholder
  // When implementing, call: const response = await fetch(`API_URL/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`);
  
  if (fromCurrency === toCurrency) return amount;
  
  // Placeholder: Returns same amount until API integration
  // Replace with actual API call when currency conversion service is available
  console.warn('Currency conversion not yet implemented - using 1:1 rate');
  return amount;
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
