import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure role is set if not present (for backwards compatibility)
        if (!parsedUser.role) {
          parsedUser.role = parsedUser.restaurant ? 'restaurant' : 'superadmin';
        }
        setUser(parsedUser);

        // Set axios default header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role = 'restaurant') => {
    try {
      // Use specific endpoints based on role
      let endpoint;
      let requestData;
      
      if (role === 'superadmin') {
        endpoint = '/auth/superadmin/login';
        requestData = { email, password };
      } else if (role === 'restaurant') {
        endpoint = '/restaurant/auth/login';
        requestData = { email, password };
      } else {
        endpoint = '/auth/login';
        requestData = { email, password, role };
      }

      console.log('Attempting login to:', endpoint, 'with role:', role);

      const response = await api.post(endpoint, requestData);

      console.log('Login response:', response.data);

      const { success, data } = response.data;

      if (!success || !data) {
        throw new Error('Invalid response format: ' + JSON.stringify(response.data));
      }

      // Handle both token formats (data.token or data.accessToken)
      const token = data.accessToken || data.token;

      if (!token) {
        throw new Error('No token received from server');
      }

      // Ensure role is included in user data
      const userDataWithRole = {
        ...data,
        role: role
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userDataWithRole));

      // Set axios default header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userDataWithRole);

      console.log('User logged in successfully:', userDataWithRole);

      return { success: true, role, data: userDataWithRole };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const logout = (redirectPath = null) => {
    const currentUser = user;

    // Clear axios default header
    delete api.defaults.headers.common['Authorization'];

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    // Redirect to appropriate login page based on user role
    if (redirectPath) {
      window.location.href = redirectPath;
    } else if (currentUser?.role === 'superadmin') {
      window.location.href = '/admin/login';
    } else {
      window.location.href = '/restaurant/login';
    }
  };

  // Function to check for unsaved changes (placeholder implementation)
  const checkForUnsavedChanges = () => {
    // This is a placeholder - in a real app, you'd check form states, etc.
    return false;
  };

  // Function to get session duration (placeholder implementation)
  const getSessionDuration = () => {
    // This is a placeholder - in a real app, you'd calculate actual session time
    return '2h 15m';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      checkForUnsavedChanges, 
      getSessionDuration 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
