import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
      return token;
    } catch (error) {
      console.error('Error getting expo push token:', error);
      return null;
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    seconds: number = 0
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: seconds > 0 ? { seconds } : null,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Delivery-specific notification methods
  async notifyNewOrder(orderId: string, restaurantName: string, distance: number): Promise<void> {
    await this.scheduleLocalNotification(
      'New Delivery Order',
      `New order from ${restaurantName} - ${distance.toFixed(1)}km away`,
      { type: 'new_order', orderId, restaurantName, distance },
      0
    );
  }

  async notifyOrderUpdate(orderId: string, status: string): Promise<void> {
    const statusMessages = {
      accepted: 'Order accepted successfully',
      picked_up: 'Order picked up from restaurant',
      delivered: 'Order delivered successfully',
      cancelled: 'Order has been cancelled',
    };

    await this.scheduleLocalNotification(
      'Order Update',
      statusMessages[status as keyof typeof statusMessages] || 'Order status updated',
      { type: 'order_update', orderId, status },
      0
    );
  }

  async notifyEarningsUpdate(amount: number): Promise<void> {
    await this.scheduleLocalNotification(
      'Earnings Update',
      `You earned Rs. ${amount} from your recent delivery`,
      { type: 'earnings_update', amount },
      0
    );
  }

  async notifyLocationReminder(): Promise<void> {
    await this.scheduleLocalNotification(
      'Location Tracking',
      'Please ensure location services are enabled for accurate tracking',
      { type: 'location_reminder' },
      0
    );
  }

  async notifyStatusChange(isOnline: boolean): Promise<void> {
    await this.scheduleLocalNotification(
      'Status Update',
      isOnline ? 'You are now online and ready to receive orders' : 'You are now offline',
      { type: 'status_change', isOnline },
      0
    );
  }

  async notifyDailySummary(earnings: number, deliveries: number): Promise<void> {
    await this.scheduleLocalNotification(
      'Daily Summary',
      `Great work! You completed ${deliveries} deliveries and earned Rs. ${earnings} today`,
      { type: 'daily_summary', earnings, deliveries },
      0
    );
  }

  async notifyWeeklyGoal(progress: number, goal: number): Promise<void> {
    const percentage = Math.round((progress / goal) * 100);
    await this.scheduleLocalNotification(
      'Weekly Goal Progress',
      `You're ${percentage}% towards your weekly goal of Rs. ${goal}`,
      { type: 'weekly_goal', progress, goal, percentage },
      0
    );
  }

  async notifyWeatherAlert(condition: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Weather Alert',
      `Current weather: ${condition}. Please drive safely!`,
      { type: 'weather_alert', condition },
      0
    );
  }

  async notifyMaintenanceReminder(vehicleType: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Maintenance Reminder',
      `Time for ${vehicleType} maintenance. Schedule your service appointment.`,
      { type: 'maintenance_reminder', vehicleType },
      0
    );
  }

  async notifyPromotion(offer: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Special Promotion',
      offer,
      { type: 'promotion', offer },
      0
    );
  }

  async notifySystemUpdate(): Promise<void> {
    await this.scheduleLocalNotification(
      'App Update Available',
      'A new version of the delivery app is available. Update now for better performance!',
      { type: 'system_update' },
      0
    );
  }

  // Batch notifications for multiple orders
  async notifyMultipleOrders(orders: Array<{id: string, restaurant: string, distance: number}>): Promise<void> {
    if (orders.length === 1) {
      await this.notifyNewOrder(orders[0].id, orders[0].restaurant, orders[0].distance);
    } else {
      await this.scheduleLocalNotification(
        'Multiple New Orders',
        `You have ${orders.length} new delivery orders available`,
        { type: 'multiple_orders', orders },
        0
      );
    }
  }

  // Smart notification scheduling based on user activity
  async scheduleSmartNotification(type: string, data: any, delay: number = 0): Promise<void> {
    // Check if user is likely to be active based on time
    const hour = new Date().getHours();
    const isActiveTime = hour >= 7 && hour <= 22; // 7 AM to 10 PM
    
    if (isActiveTime || type === 'urgent') {
      await this.scheduleLocalNotification(
        this.getNotificationTitle(type),
        this.getNotificationMessage(type, data),
        { type, ...data },
        delay
      );
    }
  }

  private getNotificationTitle(type: string): string {
    const titles = {
      new_order: 'New Order',
      order_update: 'Order Update',
      earnings_update: 'Earnings',
      status_change: 'Status Update',
      daily_summary: 'Daily Summary',
      weekly_goal: 'Goal Progress',
      weather_alert: 'Weather Alert',
      maintenance_reminder: 'Maintenance',
      promotion: 'Promotion',
      system_update: 'Update Available',
    };
    return titles[type as keyof typeof titles] || 'Notification';
  }

  private getNotificationMessage(type: string, data: any): string {
    // This would contain logic to generate appropriate messages
    return 'You have a new notification';
  }
}

export const notificationService = new NotificationService();
