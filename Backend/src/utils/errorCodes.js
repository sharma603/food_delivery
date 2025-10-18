// Error Codes
// This file structure created as per requested organization

export const ERROR_CODES = {
  // Authentication Errors (1000-1099)
  INVALID_CREDENTIALS: 1001,
  ACCOUNT_LOCKED: 1002,
  ACCOUNT_INACTIVE: 1003,
  TOKEN_EXPIRED: 1004,
  TOKEN_INVALID: 1005,
  INSUFFICIENT_PERMISSIONS: 1006,
  TWO_FACTOR_REQUIRED: 1007,

  // User Management Errors (1100-1199)
  USER_NOT_FOUND: 1101,
  USER_ALREADY_EXISTS: 1102,
  EMAIL_ALREADY_EXISTS: 1103,
  PHONE_ALREADY_EXISTS: 1104,
  INVALID_USER_TYPE: 1105,

  // Restaurant Errors (1200-1299)
  RESTAURANT_NOT_FOUND: 1201,
  RESTAURANT_INACTIVE: 1202,
  RESTAURANT_NOT_VERIFIED: 1203,
  RESTAURANT_SUSPENDED: 1204,
  INVALID_RESTAURANT_CREDENTIALS: 1205,

  // Order Errors (1300-1399)
  ORDER_NOT_FOUND: 1301,
  ORDER_CANCELLED: 1302,
  ORDER_ALREADY_ACCEPTED: 1303,
  ORDER_CANNOT_BE_MODIFIED: 1304,
  INVALID_ORDER_STATUS: 1305,
  ORDER_PAYMENT_FAILED: 1306,

  // Payment Errors (1400-1499)
  PAYMENT_FAILED: 1401,
  PAYMENT_GATEWAY_ERROR: 1402,
  INSUFFICIENT_FUNDS: 1403,
  REFUND_FAILED: 1404,
  INVALID_PAYMENT_METHOD: 1405,
  PAYOUT_FAILED: 1406,

  // Menu Errors (1500-1599)
  MENU_ITEM_NOT_FOUND: 1501,
  MENU_ITEM_UNAVAILABLE: 1502,
  CATEGORY_NOT_FOUND: 1503,
  INVALID_PRICE: 1504,
  MENU_ITEM_OUT_OF_STOCK: 1505,

  // Validation Errors (1600-1699)
  REQUIRED_FIELD_MISSING: 1601,
  INVALID_EMAIL_FORMAT: 1602,
  INVALID_PHONE_FORMAT: 1603,
  INVALID_DATE_FORMAT: 1604,
  INVALID_FILE_TYPE: 1605,
  FILE_TOO_LARGE: 1606,
  INVALID_COORDINATES: 1607,

  // System Errors (1700-1799)
  DATABASE_ERROR: 1701,
  EXTERNAL_SERVICE_ERROR: 1702,
  RATE_LIMIT_EXCEEDED: 1703,
  MAINTENANCE_MODE: 1704,
  FEATURE_DISABLED: 1705,

  // Business Logic Errors (1800-1899)
  DELIVERY_AREA_NOT_SUPPORTED: 1801,
  RESTAURANT_CLOSED: 1802,
  MINIMUM_ORDER_NOT_MET: 1803,
  COUPON_EXPIRED: 1804,
  COUPON_USAGE_EXCEEDED: 1805,
  PROMOTION_NOT_APPLICABLE: 1806,

  // Third Party Service Errors (1900-1999)
  SMS_SERVICE_ERROR: 1901,
  EMAIL_SERVICE_ERROR: 1902,
  PUSH_NOTIFICATION_ERROR: 1903,
  MAP_SERVICE_ERROR: 1904,
  STORAGE_SERVICE_ERROR: 1905
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Account is temporarily locked',
  [ERROR_CODES.ACCOUNT_INACTIVE]: 'Account is inactive',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Authentication token has expired',
  [ERROR_CODES.TOKEN_INVALID]: 'Invalid authentication token',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ERROR_CODES.TWO_FACTOR_REQUIRED]: 'Two-factor authentication required',

  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.USER_ALREADY_EXISTS]: 'User already exists',
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'Email already registered',
  [ERROR_CODES.PHONE_ALREADY_EXISTS]: 'Phone number already registered',
  [ERROR_CODES.INVALID_USER_TYPE]: 'Invalid user type',

  [ERROR_CODES.RESTAURANT_NOT_FOUND]: 'Restaurant not found',
  [ERROR_CODES.RESTAURANT_INACTIVE]: 'Restaurant is inactive',
  [ERROR_CODES.RESTAURANT_NOT_VERIFIED]: 'Restaurant is not verified',
  [ERROR_CODES.RESTAURANT_SUSPENDED]: 'Restaurant is suspended',
  [ERROR_CODES.INVALID_RESTAURANT_CREDENTIALS]: 'Invalid restaurant credentials',

  [ERROR_CODES.ORDER_NOT_FOUND]: 'Order not found',
  [ERROR_CODES.ORDER_CANCELLED]: 'Order has been cancelled',
  [ERROR_CODES.ORDER_ALREADY_ACCEPTED]: 'Order has already been accepted',
  [ERROR_CODES.ORDER_CANNOT_BE_MODIFIED]: 'Order cannot be modified',
  [ERROR_CODES.INVALID_ORDER_STATUS]: 'Invalid order status',
  [ERROR_CODES.ORDER_PAYMENT_FAILED]: 'Order payment failed',

  [ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed',
  [ERROR_CODES.PAYMENT_GATEWAY_ERROR]: 'Payment gateway error',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds',
  [ERROR_CODES.REFUND_FAILED]: 'Refund processing failed',
  [ERROR_CODES.INVALID_PAYMENT_METHOD]: 'Invalid payment method',
  [ERROR_CODES.PAYOUT_FAILED]: 'Payout processing failed',

  [ERROR_CODES.MENU_ITEM_NOT_FOUND]: 'Menu item not found',
  [ERROR_CODES.MENU_ITEM_UNAVAILABLE]: 'Menu item is currently unavailable',
  [ERROR_CODES.CATEGORY_NOT_FOUND]: 'Category not found',
  [ERROR_CODES.INVALID_PRICE]: 'Invalid price',
  [ERROR_CODES.MENU_ITEM_OUT_OF_STOCK]: 'Menu item is out of stock',

  [ERROR_CODES.REQUIRED_FIELD_MISSING]: 'Required field is missing',
  [ERROR_CODES.INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ERROR_CODES.INVALID_PHONE_FORMAT]: 'Invalid phone number format',
  [ERROR_CODES.INVALID_DATE_FORMAT]: 'Invalid date format',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Invalid file type',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds limit',
  [ERROR_CODES.INVALID_COORDINATES]: 'Invalid coordinates',

  [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ERROR_CODES.MAINTENANCE_MODE]: 'System is under maintenance',
  [ERROR_CODES.FEATURE_DISABLED]: 'This feature is currently disabled',

  [ERROR_CODES.DELIVERY_AREA_NOT_SUPPORTED]: 'Delivery not available in this area',
  [ERROR_CODES.RESTAURANT_CLOSED]: 'Restaurant is currently closed',
  [ERROR_CODES.MINIMUM_ORDER_NOT_MET]: 'Minimum order amount not met',
  [ERROR_CODES.COUPON_EXPIRED]: 'Coupon has expired',
  [ERROR_CODES.COUPON_USAGE_EXCEEDED]: 'Coupon usage limit exceeded',
  [ERROR_CODES.PROMOTION_NOT_APPLICABLE]: 'Promotion is not applicable',

  [ERROR_CODES.SMS_SERVICE_ERROR]: 'SMS service error',
  [ERROR_CODES.EMAIL_SERVICE_ERROR]: 'Email service error',
  [ERROR_CODES.PUSH_NOTIFICATION_ERROR]: 'Push notification error',
  [ERROR_CODES.MAP_SERVICE_ERROR]: 'Map service error',
  [ERROR_CODES.STORAGE_SERVICE_ERROR]: 'File storage error'
};

export const createError = (code, customMessage = null, details = {}) => {
  const error = new Error(customMessage || ERROR_MESSAGES[code] || 'Unknown error');
  error.code = code;
  error.details = details;
  return error;
};

export default {
  ERROR_CODES,
  ERROR_MESSAGES,
  createError
};
