// Real notification service with expo dependencies
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    // Check if running in Expo Go by checking for Constants.expoConfig
    this.isExpoGo = !Constants.expoConfig || Constants.expoConfig.slug === 'expo-go';
  }

  // Register for push notifications
  async registerForPushNotificationsAsync() {
    try {
      if (this.isExpoGo) {
        console.log('Running in Expo Go - notifications disabled');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = token.data;
      return token.data;
    } catch (error) {
      console.log('Notification registration failed:', error);
      return null;
    }
  }

  // Mock send push notification
  async sendPushNotification(expoPushToken, message) {
    try {
      console.log('Mock sending notification:', message);
      return { success: true };
    } catch (error) {
      console.log('Mock notification send failed:', error);
      return { success: false };
    }
  }

  // Mock schedule notification
  async schedulePushNotification(title, body, data = {}) {
    try {
      console.log('Mock scheduling notification:', title, body);
      return { success: true };
    } catch (error) {
      console.log('Mock notification schedule failed:', error);
      return { success: false };
    }
  }

  // Mock cancel notification
  async cancelNotification(notificationId) {
    try {
      console.log('Mock canceling notification:', notificationId);
      return { success: true };
    } catch (error) {
      console.log('Mock notification cancel failed:', error);
      return { success: false };
    }
  }

  // Mock get notification permissions
  async getNotificationPermissions() {
    try {
      return {
        granted: true,
        canAskAgain: true,
        status: 'granted'
      };
    } catch (error) {
      console.log('Mock permission check failed:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  // Mock request notification permissions
  async requestNotificationPermissions() {
    try {
      return {
        granted: true,
        canAskAgain: true,
        status: 'granted'
      };
    } catch (error) {
      console.log('Mock permission request failed:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  // Mock add notification listener
  addNotificationListener(callback) {
    try {
      console.log('Mock adding notification listener');
      this.notificationListener = callback;
      return { success: true };
    } catch (error) {
      console.log('Mock listener add failed:', error);
      return { success: false };
    }
  }

  // Mock remove notification listener
  removeNotificationListener() {
    try {
      console.log('Mock removing notification listener');
      this.notificationListener = null;
      return { success: true };
    } catch (error) {
      console.log('Mock listener remove failed:', error);
      return { success: false };
    }
  }

  // Mock add notification response listener
  addNotificationResponseListener(callback) {
    try {
      console.log('Mock adding notification response listener');
      this.responseListener = callback;
      return { success: true };
    } catch (error) {
      console.log('Mock response listener add failed:', error);
      return { success: false };
    }
  }

  // Mock remove notification response listener
  removeNotificationResponseListener() {
    try {
      console.log('Mock removing notification response listener');
      this.responseListener = null;
      return { success: true };
    } catch (error) {
      console.log('Mock response listener remove failed:', error);
      return { success: false };
    }
  }

  // Mock get all scheduled notifications
  async getAllScheduledNotifications() {
    try {
      return []; // Return empty array
    } catch (error) {
      console.log('Mock get scheduled notifications failed:', error);
      return [];
    }
  }

  // Mock cancel all scheduled notifications
  async cancelAllScheduledNotifications() {
    try {
      console.log('Mock canceling all scheduled notifications');
      return { success: true };
    } catch (error) {
      console.log('Mock cancel all failed:', error);
      return { success: false };
    }
  }

  // Mock get notification settings
  async getNotificationSettings() {
    try {
      return {
        sound: true,
        badge: true,
        alert: true
      };
    } catch (error) {
      console.log('Mock get settings failed:', error);
      return {
        sound: false,
        badge: false,
        alert: false
      };
    }
  }

  // Mock set notification settings
  async setNotificationSettings(settings) {
    try {
      console.log('Mock setting notification settings:', settings);
      return { success: true };
    } catch (error) {
      console.log('Mock set settings failed:', error);
      return { success: false };
    }
  }

  // Mock check if device supports notifications
  isDeviceSupported() {
    try {
      return Platform.OS === 'ios' || Platform.OS === 'android';
    } catch (error) {
      console.log('Mock device support check failed:', error);
      return false;
    }
  }

  // Mock get device info
  getDeviceInfo() {
    try {
      return {
        platform: Platform.OS,
        version: Platform.Version,
        isDevice: true
      };
    } catch (error) {
      console.log('Mock device info failed:', error);
      return {
        platform: 'unknown',
        version: 'unknown',
        isDevice: false
      };
    }
  }

  // Setup notification listeners (missing function that was causing error)
  setupNotificationListeners() {
    try {
      if (this.isExpoGo) {
        console.log('Running in Expo Go - notification listeners disabled');
        return { success: true };
      }

      console.log('Setting up notification listeners');
      
      // Add notification received listener
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      // Add notification response listener
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response received:', response);
      });

      return { success: true };
    } catch (error) {
      console.log('Setup notification listeners failed:', error);
      return { success: false };
    }
  }

  // Missing methods that NotificationContext expects
  async schedulePushNotification(title, body, data = {}, trigger = null) {
    try {
      if (this.isExpoGo) {
        console.log('Mock scheduling notification:', title, body);
        return { success: true };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger,
      });
      
      return { success: true, notificationId };
    } catch (error) {
      console.log('Schedule notification failed:', error);
      return { success: false };
    }
  }

  async getBadgeCount() {
    try {
      if (this.isExpoGo) {
        return 0;
      }
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.log('Get badge count failed:', error);
      return 0;
    }
  }

  async clearBadgeCount() {
    try {
      if (this.isExpoGo) {
        console.log('Mock clearing badge count');
        return { success: true };
      }
      await Notifications.setBadgeCountAsync(0);
      return { success: true };
    } catch (error) {
      console.log('Clear badge count failed:', error);
      return { success: false };
    }
  }

  async getScheduledNotifications() {
    try {
      if (this.isExpoGo) {
        return [];
      }
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.log('Get scheduled notifications failed:', error);
      return [];
    }
  }

  // Food delivery specific notification methods
  async notifyOrderPlaced(orderId, restaurantName) {
    return await this.schedulePushNotification(
      'Order Placed! 🎉',
      `Your order #${orderId} has been placed at ${restaurantName}`,
      { type: 'order_placed', orderId, restaurantName }
    );
  }

  async notifyOrderStatusUpdate(orderId, status, restaurantName) {
    return await this.schedulePushNotification(
      'Order Update 📦',
      `Your order #${orderId} from ${restaurantName} is now ${status}`,
      { type: 'order_update', orderId, status, restaurantName }
    );
  }

  async notifyPromotion(title, description) {
    return await this.schedulePushNotification(
      title,
      description,
      { type: 'promotion' }
    );
  }

  async notifyRestaurantUpdate(restaurantName, message) {
    return await this.schedulePushNotification(
      `${restaurantName} Update`,
      message,
      { type: 'restaurant_update', restaurantName }
    );
  }

  async notifyDeliveryEstimate(orderId, estimatedTime) {
    return await this.schedulePushNotification(
      'Delivery Estimate 🚚',
      `Your order #${orderId} will arrive in approximately ${estimatedTime} minutes`,
      { type: 'delivery_estimate', orderId, estimatedTime }
    );
  }

  // Mock cleanup
  cleanup() {
    try {
      this.removeNotificationListener();
      this.removeNotificationResponseListener();
      console.log('Mock notification service cleaned up');
      return { success: true };
    } catch (error) {
      console.log('Mock cleanup failed:', error);
      return { success: false };
    }
  }
}

export default new NotificationService();
