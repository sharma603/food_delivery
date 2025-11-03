// PublicRoute Component
// This file structure created as per requested organization
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children, redirectTo = '/admin/dashboard' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (user) {
    const userType = user.type || user.role;
    const defaultRedirect = userType === 'restaurant' 
      ? '/restaurant/dashboard' 
      : '/admin/dashboard';
    
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  // If not authenticated, render the public component
  return children;
};

export default PublicRoute;
