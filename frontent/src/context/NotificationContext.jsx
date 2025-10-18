// NotificationContext
// This file structure created as per requested organization
import React, { createContext, useContext, useState } from 'react';

export const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const notificationWithId = { ...notification, id };
    setNotifications(prev => [...prev, notificationWithId]);
    return notificationWithId;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showNotification = (message, type = 'info', duration = 5000) => {
    const notification = {
      message,
      type,
      timestamp: new Date().toISOString(),
    };

    const notificationWithId = addNotification(notification);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(notificationWithId.id);
      }, duration);
    }
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
