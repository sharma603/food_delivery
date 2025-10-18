import axios from 'axios';
import { SERVER_IP, SERVER_PORT } from '../utils/constants';

// Test API connection
const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}/api/v1/customer/auth`;

export const testAPIConnection = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test registration endpoint
    const testUser = {
      name: 'Mobile Test User',
      email: `testmobile${Date.now()}@example.com`,
      password: 'password123',
      phone: `1234567${Date.now().toString().slice(-3)}`
    };

    console.log('Testing registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    console.log('Registration successful:', registerResponse.data);

    // Test login endpoint
    console.log('Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('Login successful:', loginResponse.data);

    return {
      success: true,
      message: 'API connection test passed!',
      data: {
        register: registerResponse.data,
        login: loginResponse.data
      }
    };

  } catch (error) {
    console.error('API connection test failed:', error);
    return {
      success: false,
      message: 'API connection test failed',
      error: error.message,
      details: error.response?.data
    };
  }
};

export default testAPIConnection;
