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
        
        // Validate user data
        if (!parsedUser.role) {
          console.warn('User data missing role, clearing storage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }

        setUser(parsedUser);
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
      // Determine endpoint based on role
      let endpoint;
      let requestData;
      
      switch (role) {
        case 'superadmin':
        case 'super_admin':
          endpoint = '/auth/superadmin/login';
          requestData = { email, password };
          break;
        case 'restaurant':
          endpoint = '/restaurant/auth/login';
          requestData = { email, password };
          break;
        case 'delivery':
          endpoint = '/delivery/auth/login';
          requestData = { email, password };
          break;
        default:
          endpoint = '/auth/login';
          requestData = { email, password, role };
      }

      console.log('🔐 Login attempt:', { role, endpoint, email });

      console.log('📡 Sending login request to:', endpoint);
      
      const response = await api.post(endpoint, requestData);
      console.log('📥 Login response:', response.data);
      
      // Handle response
      const { success, data, message } = response.data;
      
      if (!success || !data) {
        throw new Error(message || 'Invalid response from server');
      }

      // Extract token - it's directly in the data object
      const authToken = data.token;
      console.log('🎫 Token received:', authToken ? 'Yes' : 'No');
      console.log('📋 Response data structure:', { 
        hasToken: !!authToken, 
        dataKeys: Object.keys(data || {}),
        tokenLocation: 'data.token'
      });
      
      if (!authToken) {
        throw new Error('No authentication token received');
      }

      // Prepare user data - token is in data object along with user info
      let userData;
      
      if (role === 'super_admin' || role === 'superadmin') {
        // For super admin: data contains { _id, name, email, role, permissions, token, ... }
        // Remove token and password from user info
        const { token: _, password: __, ...cleanUserData } = data;
        userData = {
          ...cleanUserData,
          role: data.role || 'super_admin' // Ensure role is set correctly
        };
      } else {
        // For restaurant/delivery login
        const { token: _, password: __, ...restaurantData } = data;
        userData = {
          ...restaurantData,
          role: role
        };
      }

      // Store authentication data
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      // Update state immediately
      setUser(userData);

      console.log('✅ Login successful');
      console.log('👤 User data stored:', { 
        role: userData.role, 
        email: userData.email,
        name: userData.name 
      });
      
      return { success: true, data: userData };
    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message: errorMessage };
    }
  };

  const logout = (redirectPath = null) => {
    const currentUser = user;

    // Clear authentication data
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    // Redirect based on user role or provided path
    if (redirectPath) {
      window.location.href = redirectPath;
    } else if (currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin') {
      window.location.href = '/admin/login';
    } else if (currentUser?.role === 'delivery') {
      window.location.href = '/delivery/login';
    } else {
      window.location.href = '/restaurant/login';
    }
  };

  // Check if user has required role
  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.name || user.restaurantName || user.email || 'User';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      hasRole,
      isAuthenticated,
      getUserDisplayName
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
