export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  RESTAURANTS: {
    LIST: '/restaurants',
    CREATE: '/restaurants',
    UPDATE: '/restaurants/:id',
    DELETE: '/restaurants/:id',
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    UPDATE: '/orders/:id',
    DELETE: '/orders/:id',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
  },
  MENU: {
    LIST: '/menu',
    CREATE: '/menu',
    UPDATE: '/menu/:id',
    DELETE: '/menu/:id',
  },
};

export const USER_ROLES = {
  ADMIN: 'admin',
  RESTAURANT: 'restaurant',
  CUSTOMER: 'customer',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const ROUTES = {
  HOME: '/',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  RESTAURANT_LOGIN: '/restaurant/login',
  RESTAURANT_DASHBOARD: '/restaurant/dashboard',
  CUSTOMER_LOGIN: '/login',
  CUSTOMER_REGISTER: '/register',
};
