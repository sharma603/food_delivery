const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://72.60.206.253:5000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      
      // Check if response is HTML (indicates server error or 404)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlText = await response.text();
        console.error('Server returned HTML instead of JSON:', htmlText.substring(0, 200));
        throw new Error(`Server returned HTML (${response.status}). Backend may not be running or endpoint doesn't exist.`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        // Create an error object that mimics axios error structure
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          data: data
        };
        throw error;
      }

      // Return data in axios-compatible format
      return {
        data: data,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request URL:', url);
      console.error('Request config:', config);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

const apiService = new ApiService();
export default ApiService;
export { apiService };
