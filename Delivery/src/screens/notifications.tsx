import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/common/EmptyState';
import { deliveryAPI } from '../services/api';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  createdAt?: string;
  read?: boolean;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      setIsRefreshing(true);
      const resp = await deliveryAPI.getNotifications();
      if (resp.data?.success) {
        setNotifications(resp.data.data || []);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      setNotifications([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await deliveryAPI.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadNotifications} />}
      >
        {notifications.length === 0 ? (
          <EmptyState icon="notifications-outline" title="No notifications" subtitle="You're all caught up" />
        ) : (
          notifications.map((n) => (
            <View key={n._id} style={[styles.card, n.read ? styles.cardRead : undefined]}>
              <View style={styles.cardHeader}>
                <Ionicons name="notifications-outline" size={20} color="#FF6B35" />
                <Text style={styles.cardTitle}>{n.title || 'Notification'}</Text>
              </View>
              <Text style={styles.cardMessage}>{n.message}</Text>
              <View style={styles.cardFooter}>
                {!n.read && (
                  <TouchableOpacity onPress={() => markAsRead(n._id)}>
                    <Text style={styles.readAction}>Mark as read</Text>
                  </TouchableOpacity>
                )}
                {n.createdAt && <Text style={styles.timeText}>{new Date(n.createdAt).toLocaleString()}</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRead: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#333' },
  cardMessage: { fontSize: 14, color: '#666' },
  cardFooter: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readAction: { color: '#FF6B35', fontSize: 12 },
  timeText: { color: '#999', fontSize: 12 },
});



