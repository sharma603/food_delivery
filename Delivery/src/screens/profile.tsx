import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';
// notificationService not needed in profile-only view

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    setAvatarUri((user as any)?.avatarUrl);
  }, []);

  const loadSettings = async () => {
    // No-op in profile-only view
  };

  const pickAndUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      const uri = result.assets[0]?.uri;
      if (!uri) return;
      setUploading(true);
      const resp = await deliveryAPI.uploadProfilePhoto(uri);
      const newUrl = resp.data?.data?.url || resp.data?.data?.avatarUrl;
      setAvatarUri(newUrl || uri);
      if (newUrl) {
        updateUser({ ...(user as any), avatarUrl: newUrl } as any);
      }
    } catch (e) {
      // swallow; optionally show toast
    } finally {
      setUploading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadSettings();
    setIsRefreshing(false);
  };

  // Profile-only view: no account actions here

  // No toggles or actions in profile-only view

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <TouchableOpacity style={styles.avatarContainer} onPress={pickAndUpload} disabled={uploading}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
        ) : (
          <Ionicons name="person-circle" size={80} color="#FF6B35" />
        )}
      </TouchableOpacity>
      <Text style={styles.name}>{user?.name || 'Delivery Partner'}</Text>
      <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
      <Text style={styles.employeeId}>ID: {user?.employeeId || 'N/A'}</Text>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { 
          backgroundColor: user?.isOnline ? '#4ECDC4' : '#FF6B6B' 
        }]} />
        <Text style={styles.statusText}>
          {user?.isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Performance Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.totalDeliveries || 0}</Text>
          <Text style={styles.statLabel}>Total Deliveries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.completedDeliveries || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>Rs. {user?.earnings || 0}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
      </View>
    </View>
  );

  const renderVehicleInfo = () => (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>Vehicle Information</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="bicycle-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Vehicle Type</Text>
            <Text style={styles.infoValue}>{user?.vehicleType || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Vehicle Number</Text>
            <Text style={styles.infoValue}>{user?.vehicleNumber || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Assigned Zone</Text>
            <Text style={styles.infoValue}>{user?.zoneName || 'No Zone Assigned'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Removed settings/actions for a clean profile-only view

  // Removed menu for profile-only presentation

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {renderProfileHeader()}
      {renderStatsSection()}
      {renderVehicleInfo()}
      {/* Profile-only: no settings or account menu */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  settingsSection: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingContent: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  menuSection: {
    padding: 20,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
  },
  logoutText: {
    color: '#FF6B6B',
  },
});
