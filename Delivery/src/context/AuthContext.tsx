import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { socketService } from '../services/socketService';

// Navigation will be handled by the layout based on authentication state

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  status: 'active' | 'inactive' | 'on_duty' | 'off_duty' | 'suspended';
  zone: string | any; // Can be ObjectId or populated object
  zoneName?: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel?: string;
  vehicleYear?: number;
  rating: number;
  totalDeliveries: number;
  completedDeliveries?: number;
  earnings: number;
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    lastUpdated?: string;
  };
  role: string;
  accessToken?: string;
  refreshToken?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
  toggleOnlineStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('delivery_token');
      const storedRefreshToken = await AsyncStorage.getItem('delivery_refresh_token');
      const storedUser = await AsyncStorage.getItem('delivery_user');
      
      console.log('Loading stored auth:', { 
        hasToken: !!storedToken, 
        hasRefreshToken: !!storedRefreshToken,
        hasUser: !!storedUser 
      });
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        // Connect socket for instant updates
        socketService.connect();
        console.log('Success: Restored authentication from storage');
      } else {
        console.log('No stored authentication found');
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      console.log('Attempting login with:', { email, hasPassword: !!password });
      console.log('API Base URL:', api.defaults.baseURL);
      
      // Make API call to backend authentication
      const response = await api.post('/delivery/auth/login', {
        email: email.toLowerCase().trim(),
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.data) {
        const responseData = response.data.data;
        // Handle both 'accessToken' and 'token' field names
        const accessToken = responseData.accessToken || responseData.token;
        const refreshToken = responseData.refreshToken;
        
        // Extract user data excluding token fields
        const { accessToken: _, token: __, refreshToken: ___, ...userData } = responseData;
        
        // Validate required fields
        if (!accessToken) {
          console.error('No token found in response:', responseData);
          return { success: false, message: 'Invalid response: No token received' };
        }
        
        if (!refreshToken) {
          console.error('No refresh token found in response:', responseData);
          return { success: false, message: 'Invalid response: No refresh token received' };
        }
        
        // Set token and user data
        setToken(accessToken);
        setUser(userData);
        
        // Store in AsyncStorage
        await AsyncStorage.setItem('delivery_token', accessToken);
        await AsyncStorage.setItem('delivery_refresh_token', refreshToken);
        await AsyncStorage.setItem('delivery_user', JSON.stringify(userData));
        
        // Set authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        // Connect socket after login
        socketService.connect();
        
        console.log('Login successful for:', userData.name);
        console.log('Token set:', accessToken ? 'Yes' : 'No');
        console.log('Refresh token stored:', refreshToken ? 'Yes' : 'No');
        console.log('User data:', userData);
        return { success: true };
      } else {
        const errorMsg = response.data.message || 'Unknown error';
        console.error('Login failed:', errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      console.error('=== LOGIN ERROR DETAILS ===');
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response headers:', error.response.headers);
        
        if (error.response.status === 401) {
          errorMessage = error.response.data?.message || 'Invalid email or password';
        } else if (error.response.status === 404) {
          errorMessage = error.response.data?.message || 'Server endpoint not found. Please check server configuration.';
        } else if (error.response.status === 429) {
          errorMessage = error.response.data?.message || 'Too many requests. Please try again later.';
        } else if (error.response.status >= 500) {
          errorMessage = error.response.data?.message || 'Server error. Please try again later.';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        console.error('Request was made but no response received');
        console.error('Request config:', error.config);
        console.error('Request URL:', error.config?.url);
        console.error('Request baseURL:', api.defaults.baseURL);
        errorMessage = 'Network error. Please check your connection and ensure the server is running at ' + (api.defaults.baseURL || 'unknown URL');
      } else {
        console.error('Error setting up request:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      console.error('=== END LOGIN ERROR ===');
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('=== STARTING LOGOUT PROCESS ===');
      
      // Call backend logout API if user is authenticated
      if (token && user) {
        try {
          await api.post('/delivery/auth/logout');
          console.log('✓ Backend logout successful');
        } catch (error) {
          console.log('⚠ Warning: Backend logout failed, but continuing with local logout:', error);
        }
      }
      
      // Clear local storage
      await AsyncStorage.removeItem('delivery_token');
      await AsyncStorage.removeItem('delivery_refresh_token');
      await AsyncStorage.removeItem('delivery_user');
      
      // Clear saved login credentials (Remember Me feature)
      await AsyncStorage.removeItem('saved_login_email');
      await AsyncStorage.removeItem('saved_login_password');
      console.log('✓ Cleared all stored data');
      
      // Clear state
      setToken(null);
      setUser(null);
      console.log('✓ Cleared user state');
      
      // Clear API authorization header
      delete api.defaults.headers.common['Authorization'];
      // Disconnect socket
      socketService.disconnect();
      console.log('✓ Disconnected services');
      
      console.log('=== LOGOUT COMPLETE ===');
      console.log('User and token cleared - navigation should happen automatically via layout');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear state even if storage fails
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update AsyncStorage asynchronously
      AsyncStorage.setItem('delivery_user', JSON.stringify(updatedUser))
        .catch(error => console.error('Error updating user in storage:', error));
    }
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      const response = await api.put('/delivery/location', {
        latitude,
        longitude
      });
      
      if (response.data.success) {
        updateUser({
          currentLocation: { 
            latitude, 
            longitude,
            lastUpdated: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
      throw error; // Re-throw to allow calling code to handle
    }
  };

  const toggleOnlineStatus = async (): Promise<boolean> => {
    try {
      const currentStatus = user?.isOnline;
      const newStatus = user?.isOnline ? 'off_duty' : 'on_duty';
      const newIsOnline = !user?.isOnline;
      
      console.log('Toggling status:', {
        currentStatus,
        newStatus,
        newIsOnline,
        currentUserStatus: user?.status
      });
      
      const response = await api.put('/delivery/status', {
        status: newStatus,
        isOnline: newIsOnline
      });
      
      console.log('Status update response:', response.data);
      
      if (response.data.success && response.data.data) {
        // Update user with full response data from backend
        const updatedUserData = response.data.data;
        
        // Update user state with all fields from backend response
        updateUser({
          status: updatedUserData.status || newStatus,
          isOnline: updatedUserData.isOnline !== undefined ? updatedUserData.isOnline : newIsOnline,
          onlineAt: updatedUserData.onlineAt,
          lastActive: updatedUserData.lastActive,
          // Include any other fields that might have been updated
          ...(updatedUserData.zoneName && { zoneName: updatedUserData.zoneName }),
          ...(updatedUserData.currentLocation && { currentLocation: updatedUserData.currentLocation }),
        });
        
        console.log('Status updated successfully:', {
          newStatus: updatedUserData.status,
          newIsOnline: updatedUserData.isOnline,
          fullData: updatedUserData
        });
        
        return true;
      }
      console.warn('Status update response missing data:', response.data);
      return false;
    } catch (error) {
      console.error('Error toggling status:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    updateLocation,
    toggleOnlineStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
