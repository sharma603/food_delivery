// SuperAdminContext
// This file structure created as per requested organization
import React, { createContext, useContext, useState } from 'react';

const SuperAdminContext = createContext();

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

export const SuperAdminProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({});

  const value = {
    restaurants,
    setRestaurants,
    users,
    setUsers,
    orders,
    setOrders,
    analytics,
    setAnalytics,
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};

export default SuperAdminContext;
