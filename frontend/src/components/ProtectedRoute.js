// UNUSED COMPONENT - DUPLICATE OF routes/ProtectedRoute.js
// This file is redundant and should be removed
/*
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSecurityMiddleware } from '../middleware/authMiddleware';

const ProtectedRoute = ({ children, allowedTypes = [] }) => {
  const { user, loading } = useAuth();
  
  // Apply security middleware for all protected routes
  useSecurityMiddleware({
    enableSessionTimeout: true,
    sessionTimeoutMinutes: 30,
    enableMultiTabPrevention: true,
    enableAuthMonitoring: true,
    enableSecureUnload: true
  });

  // Debug logging
  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - Loading:', loading);
  console.log('ProtectedRoute - AllowedTypes:', allowedTypes);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  // If specific user types are required, check them
  if (allowedTypes.length > 0) {
    const userType = user?.type || user?.role;
    if (!userType || !allowedTypes.includes(userType)) {
      // Redirect to appropriate dashboard based on user type
      const redirectPath = userType === 'admin' ? '/admin/dashboard' : 
                          userType === 'restaurant' ? '/restaurant/dashboard' : 
                          '/admin/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute;
*/
