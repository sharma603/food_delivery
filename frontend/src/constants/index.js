export const ORDER_STATUSES = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  ON_THE_WAY: 'on the way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  RESTAURANT_OWNER: 'restaurant_owner',
  DELIVERY_PARTNER: 'delivery_partner',
  CUSTOMER: 'customer',
};

export const RESTAURANT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_APPROVAL: 'pending_approval',
  SUSPENDED: 'suspended',
};

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  CASH_ON_DELIVERY: 'cash_on_delivery',
  DIGITAL_WALLET: 'digital_wallet',
};

export const CUISINE_TYPES = [
  { value: 'italian', label: 'Italian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'indian', label: 'Indian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'american', label: 'American' },
  { value: 'thai', label: 'Thai' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'french', label: 'French' },
  { value: 'greek', label: 'Greek' },
];

export const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export const DELIVERY_ZONES = [
  { value: 'zone1', label: 'Zone 1 (0-5 km)' },
  { value: 'zone2', label: 'Zone 2 (5-10 km)' },
  { value: 'zone3', label: 'Zone 3 (10-15 km)' },
  { value: 'zone4', label: 'Zone 4 (15+ km)' },
];

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    GET_ALL: '/users',
    GET_BY_ID: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
  },
  RESTAURANTS: {
    GET_ALL: '/restaurants',
    GET_BY_ID: '/restaurants/:id',
    CREATE: '/restaurants',
    UPDATE: '/restaurants/:id',
    DELETE: '/restaurants/:id',
  },
  ORDERS: {
    GET_ALL: '/orders',
    GET_BY_ID: '/orders/:id',
    CREATE: '/orders',
    UPDATE: '/orders/:id',
    UPDATE_STATUS: '/orders/:id/status',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    REVENUE: '/analytics/revenue',
    ORDERS: '/analytics/orders',
    USERS: '/analytics/users',
  },
};
