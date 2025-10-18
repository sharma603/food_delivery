import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { useNotifications } from '../context/NotificationContext';

const NotificationsScreen = ({ navigation }) => {
  const { 
    notifications, 
    getScheduledNotifications, 
    cancelNotification, 
    clearBadgeCount,
    badgeCount 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Clear badge count when notifications screen is opened
    clearBadgeCount();
  }, []);

  const loadNotifications = async () => {
    try {
      await getScheduledNotifications();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification) => {
    const data = notification.content.data;
    
    if (data?.type === 'order') {
      Alert.alert(
        'Order Notification',
        `Order ID: ${data.orderId}\nRestaurant: ${data.restaurantName}`,
        [
          { text: 'OK', style: 'default' },
          { text: 'View Order', onPress: () => {
            // Navigate to order details
            console.log('Navigate to order:', data.orderId);
          }}
        ]
      );
    } else if (data?.type === 'promotion') {
      Alert.alert(
        'Promotion',
        `${data.title}\n${data.description}`,
        [
          { text: 'OK', style: 'default' },
          { text: 'View Offers', onPress: () => {
            navigation.navigate('OffersScreen');
          }}
        ]
      );
    } else if (data?.type === 'restaurant') {
      Alert.alert(
        'Restaurant Update',
        `${data.restaurantName}\n${data.message}`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } else {
      Alert.alert(
        'Notification',
        notification.content.body,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await cancelNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const renderNotification = ({ item }) => {
    const data = item.content.data;
    const isOrder = data?.type === 'order';
    const isPromotion = data?.type === 'promotion';
    const isRestaurant = data?.type === 'restaurant';

    return (
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIcon}>
          {isOrder && <Ionicons name="restaurant" size={24} color={COLORS.PRIMARY} />}
          {isPromotion && <Ionicons name="gift" size={24} color={COLORS.PRIMARY} />}
          {isRestaurant && <Ionicons name="storefront" size={24} color={COLORS.PRIMARY} />}
          {!isOrder && !isPromotion && !isRestaurant && (
            <Ionicons name="notifications" size={24} color={COLORS.PRIMARY} />
          )}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.content.title}</Text>
          <Text style={styles.notificationBody}>{item.content.body}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.trigger?.value || Date.now()).toLocaleString()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.identifier)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={80} color={COLORS.TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {badgeCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badgeCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationsScreen;
