import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { notificationService } from '../src/services/notificationService';
import * as Notifications from 'expo-notifications';

// Component to handle notification taps
function NotificationHandler() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Listen for notification taps
    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        
        console.log('📱 Notification tapped:', data);
        
        // Only handle if user is authenticated
        if (!isAuthenticated) {
          console.log('User not authenticated, ignoring notification tap');
          return;
        }

        // Handle different notification types
        if (data?.type === 'new_order' || data?.type === 'order_ready' || data?.type === 'order_notification') {
          const orderId = data?.orderId || data?.notificationData?.order?._id || data?.order?._id;
          
          if (orderId) {
            // Navigate to order detail screen
            console.log('Navigating to order detail:', orderId);
            router.push(`/(app)/order-detail?orderId=${orderId}`);
          } else {
            // If no orderId, navigate to available orders tab
            console.log('Navigating to available orders');
            router.push('/(app)/(tabs)/orders?tab=available');
          }
        } else if (data?.type === 'order_assigned') {
          const orderId = data?.orderId || data?.notificationData?.order?._id || data?.order?._id;
          if (orderId) {
            // Navigate to order detail for assigned order
            router.push(`/(app)/order-detail?orderId=${orderId}`);
          } else {
            // Navigate to my orders
            router.push('/(app)/(tabs)/orders?tab=my-orders');
          }
        }
      }
    );

    // Listen for notifications received while app is in foreground
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification received:', notification);
        // You can handle foreground notifications here if needed
      }
    );

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, [isAuthenticated, router]);

  return null; // This component doesn't render anything
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationHandler />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </LanguageProvider>
  );
}


