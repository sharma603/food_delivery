// Currency utility for Nepali Rupees (Rs)
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs. 0';
  }
  
  // Format with 2 decimal places, round properly
  const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;
  
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(roundedAmount).replace('NPR', 'Rs.');
};

// Format currency without symbol (just the number)
export const formatCurrencyNumber = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format currency with Rs. prefix
export const formatCurrencyWithRs = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs. 0';
  }
  
  return `Rs. ${formatCurrencyNumber(amount)}`;
};

// Parse currency string to number
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remove Rs., QAR, commas, and spaces
  const cleaned = currencyString.toString().replace(/Rs\.|QAR|,|\s/g, '');
  return parseFloat(cleaned) || 0;
};

// Format percentage
export const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(1)}%`;
};

// Currency symbols and constants
export const CURRENCY = {
  SYMBOL: 'Rs.',
  CODE: 'NPR',
  NAME: 'Nepali Rupees'
};
