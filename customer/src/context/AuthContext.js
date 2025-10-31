import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileAuthAPI } from '../services/mobileAPI';
import { STORAGE_KEYS } from '../utils/constants';

// Auth context states
const AuthContext = createContext();

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOADING: 'LOADING',
  LOADED: 'LOADED',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOAD_USER: 'LOAD_USER',
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOADING:
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOADED:
      return {
        ...state,
        loading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  loading: true,  // Start with loading = true to check stored auth
  isAuthenticated: false,
  user: null,
  token: null,
  error: null,
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Load stored authentication data
  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (token && userData) {
        try {
          // Validate token by trying to get the user profile
          const response = await mobileAuthAPI.getProfile();
          
          if (response.success && response.data) {
            const parsedUserData = JSON.parse(userData);
            // Extract user object, ensuring we get a plain object with user properties
            let userObj = response.data || parsedUserData.user || parsedUserData;
            
            // If userObj has nested user property, extract it
            if (userObj && typeof userObj === 'object' && userObj.user) {
              userObj = userObj.user;
            }
            
            // Ensure we have user data with proper properties
            if (userObj && typeof userObj === 'object') {
              dispatch({
                type: AUTH_ACTIONS.LOAD_USER,
                payload: { 
                  token, 
                  user: {
                    _id: userObj._id,
                    name: userObj.name || userObj.displayName || 'Customer',
                    email: userObj.email,
                    phone: userObj.phone,
                    ...userObj
                  }
                }
              });
              return; // Exit early if user is loaded
            }
          }
        } catch (error) {
          // Silently handle token validation errors - don't log them
          // Token is invalid or expired, clear it
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }
      }
      
      // If no auth data found or token is invalid, set loading to false
      dispatch({ type: AUTH_ACTIONS.LOADED });
    } catch (error) {
      // Silently handle errors - don't log them to avoid confusion
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      // Set loading to false even if there's an error
      dispatch({ type: AUTH_ACTIONS.LOADED });
    }
  };

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOADING });
    
    try {
      const response = await mobileAuthAPI.login(credentials);
      
      if (response.success) {
        // Extract user object properly
        let userObj = response.data.customer || response.data.user || response.data;
        
        // If userObj has nested user property, extract it
        if (userObj && typeof userObj === 'object' && userObj.user) {
          userObj = userObj.user;
        }
        
        // Create a clean user object with proper properties
        const cleanUserObj = {
          _id: userObj._id,
          name: userObj.name || userObj.displayName || 'Customer',
          email: userObj.email,
          phone: userObj.phone,
          ...userObj
        };
        
        // Store token and user data
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({ user: cleanUserObj, token: response.data.token }));
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: cleanUserObj,
            token: response.data.token,
          },
        });
        
        return response;
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.message || 'Login failed',
        });
        return response;
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      
      // Re-throw with the original error message preserved
      const errorToThrow = new Error(errorMessage);
      errorToThrow.originalError = error;
      throw errorToThrow;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOADING });
    
    try {
      const response = await mobileAuthAPI.register(userData);
      
      if (response.success) {
        // Extract user object properly
        let userObj = response.data.customer || response.data.user || response.data;
        
        // If userObj has nested user property, extract it
        if (userObj && typeof userObj === 'object' && userObj.user) {
          userObj = userObj.user;
        }
        
        // Create a clean user object with proper properties
        const cleanUserObj = {
          _id: userObj._id,
          name: userObj.name || userObj.displayName || 'Customer',
          email: userObj.email,
          phone: userObj.phone,
          ...userObj
        };
        
        // Store token and user data
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({ user: cleanUserObj, token: response.data.token }));
        
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            user: cleanUserObj,
            token: response.data.token,
          },
        });
        
        return response;
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: response.message || 'Registration failed',
        });
        return response;
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message || 'Network error',
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear authentication data
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      
      // Clear saved login credentials if they exist
      await AsyncStorage.removeItem('saved_login_email');
      await AsyncStorage.removeItem('saved_login_password');
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      // Error handled silently
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      const response = await mobileAuthAPI.updateProfile(profileData);
      
      if (response.success) {
        // Create updated user object
        const updatedUser = {
          ...state.user,
          ...response.data.user || response.data
        };
        
        // Update stored user data
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({ 
          user: updatedUser, 
          token: state.token 
        }));
        
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: {
            user: updatedUser,
            token: state.token,
          },
        });
        
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await mobileAuthAPI.changePassword(passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUserProfile,
    changePassword,
    loadStoredAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

