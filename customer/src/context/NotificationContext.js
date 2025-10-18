import React, { createContext, useContext, useEffect, useState } from 'react';
import notificationService from '../services/notificationService';
// import Constants from 'expo-constants';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize notification service
  useEffect(() => {
    initializeNotifications();
    
    return () => {
      // Cleanup listeners when component unmounts
      notificationService.cleanup();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Check if running in Expo Go
      const isExpoGo = false; // Mock value
      
      if (isExpoGo) {
        console.log('Running in Expo Go - notifications completely disabled to prevent errors');
        setIsInitialized(true);
        return;
      }

      // Register for push notifications
      const token = await notificationService.registerForPushNotificationsAsync();
      setExpoPushToken(token);

      // Set up notification listeners (works for both push and local notifications)
      try {
        notificationService.setupNotificationListeners();
      } catch (error) {
        console.log('Notification listeners setup failed:', error.message);
      }

      // Get initial badge count
      try {
        const initialBadgeCount = await notificationService.getBadgeCount();
        setBadgeCount(initialBadgeCount);
      } catch (error) {
        console.log('Badge count not available, using local notifications only');
        setBadgeCount(0);
      }

      setIsInitialized(true);
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notification service:', error);
      // Still mark as initialized to allow local notifications
      setIsInitialized(true);
    }
  };

  // Schedule a local notification
  const scheduleNotification = async (title, body, data = {}, trigger = null) => {
    try {
      const notificationId = await notificationService.scheduleLocalNotification(
        title,
        body,
        data,
        trigger
      );
      
      if (notificationId) {
        // Update badge count
        await updateBadgeCount();
      }
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  // Schedule notification for later
  const scheduleNotificationForLater = async (title, body, seconds, data = {}) => {
    try {
      const notificationId = await notificationService.scheduleNotificationForLater(
        title,
        body,
        seconds,
        data
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification for later:', error);
      return null;
    }
  };

  // Cancel a notification
  const cancelNotification = async (notificationId) => {
    try {
      await notificationService.cancelNotification(notificationId);
      await updateBadgeCount();
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  // Cancel all notifications
  const cancelAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
      await updateBadgeCount();
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  };

  // Update badge count
  const updateBadgeCount = async () => {
    try {
      const count = await notificationService.getBadgeCount();
      setBadgeCount(count);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  // Clear badge count
  const clearBadgeCount = async () => {
    try {
      await notificationService.clearBadgeCount();
      setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing badge count:', error);
    }
  };

  // Food delivery specific notification methods
  const notifyOrderPlaced = async (orderId, restaurantName) => {
    try {
      const notificationId = await notificationService.notifyOrderPlaced(orderId, restaurantName);
      await updateBadgeCount();
      return notificationId;
    } catch (error) {
      console.error('Error notifying order placed:', error);
      return null;
    }
  };

  const notifyOrderStatusUpdate = async (orderId, status, restaurantName) => {
    try {
      const notificationId = await notificationService.notifyOrderStatusUpdate(
        orderId,
        status,
        restaurantName
      );
      await updateBadgeCount();
      return notificationId;
    } catch (error) {
      console.error('Error notifying order status update:', error);
      return null;
    }
  };

  const notifyPromotion = async (title, description) => {
    try {
      const notificationId = await notificationService.notifyPromotion(title, description);
      await updateBadgeCount();
      return notificationId;
    } catch (error) {
      console.error('Error notifying promotion:', error);
      return null;
    }
  };

  const notifyRestaurantUpdate = async (restaurantName, message) => {
    try {
      const notificationId = await notificationService.notifyRestaurantUpdate(
        restaurantName,
        message
      );
      await updateBadgeCount();
      return notificationId;
    } catch (error) {
      console.error('Error notifying restaurant update:', error);
      return null;
    }
  };

  const notifyDeliveryEstimate = async (orderId, estimatedTime) => {
    try {
      const notificationId = await notificationService.notifyDeliveryEstimate(
        orderId,
        estimatedTime
      );
      await updateBadgeCount();
      return notificationId;
    } catch (error) {
      console.error('Error notifying delivery estimate:', error);
      return null;
    }
  };

  // Get scheduled notifications
  const getScheduledNotifications = async () => {
    try {
      const scheduledNotifications = await notificationService.getScheduledNotifications();
      setNotifications(scheduledNotifications);
      return scheduledNotifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  const value = {
    // State
    expoPushToken,
    badgeCount,
    notifications,
    isInitialized,
    
    // Methods
    scheduleNotification,
    scheduleNotificationForLater,
    cancelNotification,
    cancelAllNotifications,
    updateBadgeCount,
    clearBadgeCount,
    
    // Food delivery specific methods
    notifyOrderPlaced,
    notifyOrderStatusUpdate,
    notifyPromotion,
    notifyRestaurantUpdate,
    notifyDeliveryEstimate,
    
    // Utility methods
    getScheduledNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
