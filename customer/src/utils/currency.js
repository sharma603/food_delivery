import { APP_CONFIG } from './constants';

// Currency formatting utilities for Nepal (NPR)
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) {
    return `${APP_CONFIG.CURRENCY_SYMBOL} 0`;
  }
  
  // Handle string amounts (remove currency symbols if present)
  let numericAmount = amount;
  if (typeof amount === 'string') {
    numericAmount = amount.replace(/[^0-9.-]/g, ''); // Remove non-numeric characters
    numericAmount = parseFloat(numericAmount);
  }
  
  if (isNaN(numericAmount)) {
    return `${APP_CONFIG.CURRENCY_SYMBOL} 0`;
  }
  
  // Format with commas for thousands separator
  const formattedAmount = numericAmount.toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${APP_CONFIG.CURRENCY_SYMBOL} ${formattedAmount}`;
};

// Convert USD prices to NPR (approximate rate: 1 USD = 133 NPR)
export const convertToNPR = (usdAmount) => {
  const exchangeRate = 133; // Approximate USD to NPR rate
  return Math.round(usdAmount * exchangeRate);
};

// Format price for Nepal with proper NPR formatting
export const formatPriceForNepal = (amount, isUSD = false) => {
  if (isUSD) {
    amount = convertToNPR(amount);
  }
  return formatCurrency(amount);
};

// Sample Nepalese food prices (converted from USD)
export const SAMPLE_PRICES = {
  PAKODA: 50,              // Rs 50
  MOMO_PER_PIECE: 15,      // Rs 15 per piece
  MOMO_PER_PLATE: 120,     // Rs 120 per plate
  CHOWMEIN: 150,           // Rs 150
  BHIRAJI: 200,            // Rs 200
  THALI: 250,              // Rs 250
  CHICKEN_CURRY: 300,      // Rs 300
  MASALA_TEA: 25,          // Rs 25
  LASSI: 60,               // Rs 60
};

// Delivery fee in NPR
export const DELIVERY_FEE = {
  STANDARD: 50,        // Rs 50 standard delivery
  FREE_THRESHOLD: 500, // Free delivery above Rs 500
};
