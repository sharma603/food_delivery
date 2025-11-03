import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login page based on the current route
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin')) {
      return <Navigate to="/admin/login" replace />;
    } else {
      return <Navigate to="/restaurant/login" replace />;
    }
  }

  // Check role if specified
  if (allowedRoles.length > 0) {
    const userRole = user.role || (user.restaurant ? 'restaurant' : 'superadmin');
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
