import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SERVER_CONFIG from '../config/serverConfig';

// Use centralized server configuration from serverConfig.ts
const BASE_URL = SERVER_CONFIG.BASE_URL;

// Production API configuration

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: SERVER_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('delivery_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Robust refresh token handling with request queueing
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
const pendingRequests: Array<(token: string | null) => void> = [];

const scheduleRequestRetry = (cb: (token: string | null) => void) => pendingRequests.push(cb);
const resolvePendingRequests = (token: string | null) => {
  while (pendingRequests.length) {
    const cb = pendingRequests.shift();
    try { cb && cb(token); } catch {}
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    if (status !== 401) return Promise.reject(error);

    // Do not try to refresh for auth endpoints
    const url = originalRequest.url || '';
    if (url.includes('/login') || url.includes('/refresh') || url.includes('/logout')) return Promise.reject(error);

    // Queue requests while a refresh is in progress
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        const storedRefresh = await AsyncStorage.getItem('delivery_refresh_token');
        if (!storedRefresh) {
          // Silently fail if no refresh token - user needs to login again
          console.warn('No refresh token available, user needs to login');
          return null;
        }
        const resp = await api.post('/delivery/auth/refresh', { refreshToken: storedRefresh });
        if (!resp.data?.success) throw new Error('Refresh failed');
        const { accessToken, refreshToken: newRefresh } = resp.data.data;
        await AsyncStorage.setItem('delivery_token', accessToken);
        await AsyncStorage.setItem('delivery_refresh_token', newRefresh);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        resolvePendingRequests(accessToken);
        return accessToken;
      })()
        .catch(async (e) => {
          console.warn('Token refresh failed:', e);
          // Don't logout automatically - let the app handle authentication state
          return null;
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    return new Promise((resolve, reject) => {
      scheduleRequestRetry((token: string | null) => {
        if (!token) {
          // No refresh token available, reject the request
          reject(new Error('No refresh token available'));
          return;
        }
        try {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api.request(originalRequest));
        } catch (e) {
          reject(e);
        }
      });
      refreshPromise?.catch(reject);
    });
  }
);

// API endpoints for delivery person
export const deliveryAPI = {
  // Authentication
  login: (email: string, password: string) =>
    api.post('/delivery/auth/login', { email, password }),
  
  // Password Reset
  forgotPassword: (email: string) =>
    api.post('/delivery/auth/forgot-password', { email }),
  
  verifyOTP: (email: string, otp: string) =>
    api.post('/delivery/auth/verify-otp', { email, otp }),
  
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/delivery/auth/reset-password', { email, otp, newPassword }),
  
  // Profile
  getProfile: () => api.get('/delivery/profile'),
  updateProfile: (data: any) => api.put('/delivery/profile', data),
  
  // Status and Location
  updateStatus: (status: string, isOnline: boolean) =>
    api.put('/delivery/status', { status, isOnline }),
  updateLocation: (latitude: number, longitude: number) =>
    api.put('/delivery/location', { latitude, longitude }),
  
  // Orders - Mobile delivery routes base is /mobile/delivery
  getAvailableOrders: () => api.get('/mobile/delivery?status=ready'),
  getMyOrders: (status?: string) => api.get(`/mobile/delivery${status ? `?status=${status}` : ''}`),
  getOrderDetails: (orderId: string) => api.get(`/mobile/delivery/${orderId}`),
  acceptOrder: (orderId: string) => api.post(`/mobile/delivery/${orderId}/accept`),
  pickupOrder: (orderId: string) => api.put(`/mobile/delivery/${orderId}/status`, { status: 'picked_up' }),
  deliverOrder: (orderId: string) => api.put(`/mobile/delivery/${orderId}/status`, { status: 'delivered' }),
  cancelOrder: (orderId: string, reason: string) =>
    api.post(`/delivery/orders/${orderId}/cancel`, { reason }),
  submitOrderProof: (orderId: string, payload: { otp?: string; photos?: { uri: string; name?: string; type?: string }[]; type: 'pickup' | 'delivery'; }) => {
    const data = new FormData();
    data.append('type', payload.type);
    if (payload.otp) data.append('otp', payload.otp);
    (payload.photos || []).forEach((p, idx) => {
      const name = p.name || `photo_${idx}.jpg`;
      const type = p.type || 'image/jpeg';
      // @ts-ignore RN FormData file
      data.append('photos', { uri: p.uri, name, type });
    });
    return api.post(`/mobile/delivery/${orderId}/proof`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Order OTP
  sendOrderOtp: (orderId: string) => api.post(`/mobile/delivery/${orderId}/send-otp`),
  resendOrderOtp: (orderId: string) => api.post(`/mobile/delivery/${orderId}/resend-otp`),
  verifyOrderOtp: (orderId: string, otp: string) => api.post(`/mobile/delivery/${orderId}/otp/verify`, { otp }),
  
  // Earnings
  getEarnings: (period: string = 'week') => api.get(`/delivery/earnings?period=${period}`),
  getEarningsHistory: () => api.get('/delivery/earnings/history'),
  
  // Analytics
  getPerformance: () => api.get('/delivery/performance'),
  getStats: () => api.get('/mobile/delivery/stats'),
  
  // Dashboard
  getDashboard: () => api.get('/delivery/dashboard'),
  
  // Notifications
  getNotifications: () => api.get('/delivery/notifications'),
  markNotificationRead: (notificationId: string) =>
    api.put(`/delivery/notifications/${notificationId}/read`),
  
  // Media uploads
  uploadProfilePhoto: (uri: string) => {
    const data = new FormData();
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    // @ts-ignore - React Native FormData file
    data.append('avatar', { uri, name: filename, type: mime });
    return api.post('/delivery/profile/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
