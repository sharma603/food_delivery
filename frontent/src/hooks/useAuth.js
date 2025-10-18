import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API authentication - replace with actual API call
      // For demo purposes, using hardcoded admin credentials
      if (formData.email === 'admin@fooddelivery.com' && formData.password === 'admin123') {
        const userData = {
          id: 1,
          name: 'Admin User',
          email: formData.email,
          role: 'admin'
        };
        const token = 'demo-admin-token-' + Date.now();

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setLoading(false);
        return { success: true, user: userData };
      } else {
        setError('Invalid email or password');
        setLoading(false);
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
      setLoading(false);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const updateUser = (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (err) {
      setError('Failed to update user data');
      console.error('Update user error:', err);
    }
  };

  const isAuthenticated = !!user;
  const hasRole = (role) => user && user.role === role;

  return {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
  };
};
