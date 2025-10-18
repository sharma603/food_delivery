import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute check:', { user, loading, allowedRoles });

  if (loading) {
    console.log('Loading auth state...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/restaurant/login" replace />;
  }

  // Check role if specified
  if (allowedRoles.length > 0) {
    const userRole = user.role || (user.restaurant ? 'restaurant' : 'superadmin');
    console.log('Role check:', { userRole, allowedRoles, userHasRole: allowedRoles.includes(userRole) });
    
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate login page based on role
      const redirectTo = allowedRoles.includes('superadmin') ? '/admin/login' : '/restaurant/login';
      console.log('Role mismatch, redirecting to:', redirectTo);
      return <Navigate to={redirectTo} replace />;
    }
  }

  console.log('Access granted');
  return children;
};

export default ProtectedRoute;
