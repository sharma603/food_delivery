// RestaurantRoutes Component
// This file structure created as per requested organization
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const RestaurantRoutes = ({ user, onLogout }) => {
  return (
    <Routes>
      <Route path="/dashboard" element={
        <ProtectedRoute allowedTypes={['restaurant']}>
          {/* Restaurant Dashboard */}
        </ProtectedRoute>
      } />
      
      <Route path="/menu/*" element={
        <ProtectedRoute allowedTypes={['restaurant']}>
          {/* Menu Management Routes */}
        </ProtectedRoute>
      } />
      
      <Route path="/orders/*" element={
        <ProtectedRoute allowedTypes={['restaurant']}>
          {/* Restaurant Order Routes */}
        </ProtectedRoute>
      } />
      
      <Route path="/earnings/*" element={
        <ProtectedRoute allowedTypes={['restaurant']}>
          {/* Earnings Routes */}
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default RestaurantRoutes;
