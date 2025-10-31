/**
 * Server Configuration
 * Centralized configuration for API endpoints
 * 
 * IMPORTANT: Update these values based on your environment
 */

export const SERVER_CONFIG = {
  // Development (Local Machine)
  IP: '192.168.18.38',
  PORT: '5000',
  PROTOCOL: 'http',
  
  // API Base URLs
  get BASE_URL() {
    return `${this.PROTOCOL}://${this.IP}:${this.PORT}/api/v1`;
  },
  
  // Full API Endpoints
  get AUTH_ENDPOINT() {
    return `${this.BASE_URL}/delivery/auth`;
  },
  
  get DELIVERY_ENDPOINT() {
    return `${this.BASE_URL}/mobile/delivery`;
  },
  
  // Timeout settings
  TIMEOUT: 10000, // 10 seconds
  
  // Other configurations
  NODE_ENV: 'development', // development | production
};

// Instructions:
// 1. Update IP address to your computer's IP address for mobile testing
// 2. For production, update IP to your domain/IP and PROTOCOL to 'https'
// 3. Change PORT if your backend uses a different port
// 4. All API calls will automatically use these settings

export default SERVER_CONFIG;
