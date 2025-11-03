// Notification Service
// This file structure created as per requested organization

class NotificationService {
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static showNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }

  static showOrderNotification(order) {
    this.showNotification(`New Order #${order.id}`, {
      body: `From ${order.restaurant} - ${order.amount}`,
      tag: 'order',
      renotify: true,
    });
  }

  static showSystemNotification(message) {
    this.showNotification('System Alert', {
      body: message,
      tag: 'system',
      requireInteraction: true,
    });
  }
}

export default NotificationService;
