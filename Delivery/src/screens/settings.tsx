import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { offlineService } from '../services/offlineService';
import { notificationService } from '../services/notificationService';
import { locationService } from '../services/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    locationTracking: true,
    autoAcceptOrders: false,
    soundEnabled: true,
    vibrationEnabled: true,
    darkMode: false,
    units: 'Metric',
    autoOffline: false,
    offlineMode: false,
  });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    pendingActions: 0,
    lastSync: 0,
  });

  useEffect(() => {
    loadSettings();
    loadCacheStats();
    
    const unsubscribe = offlineService.addNetworkListener((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('delivery_app_settings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('delivery_app_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const loadCacheStats = async () => {
    const stats = await offlineService.getCacheStats();
    setCacheStats(stats);
  };

  const handleSettingChange = async (key: string, value: boolean | string) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
    
    // Apply setting changes
    switch (key) {
      case 'notifications':
        if (value) {
          await notificationService.requestPermissions();
        }
        break;
      case 'locationTracking':
        if (value) {
          await locationService.requestPermissions();
        } else {
          locationService.stopTracking();
        }
        break;
      case 'soundEnabled':
        // Handle sound settings
        break;
      case 'vibrationEnabled':
        // Handle vibration settings
        break;
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      t('clearCache'),
      t('clearCacheConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: async () => {
            await offlineService.clearOfflineData();
            await loadCacheStats();
            Alert.alert(t('success'), t('cacheCleared'));
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    if (!isOnline) {
      Alert.alert(t('offlineStatus'), t('cannotSyncOffline'));
      return;
    }

    try {
      await offlineService.forceSync();
      await loadCacheStats();
      Alert.alert(t('success'), t('dataSynced'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToSync'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('confirmLogout'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/(app)/edit-profile');
  };

  const handlePrivacyPolicy = () => {
    router.push('/(app)/privacy');
  };

  const handleHelpSupport = () => {
    router.push('/(app)/help');
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    type: 'switch' | 'button' | 'select',
    value?: boolean | string,
    onPress?: () => void
  ) => {
    const isLogout = title === t('logout');
    return (
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Ionicons name={icon as any} size={24} color={isLogout ? '#FF6B6B' : '#666'} />
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, isLogout && styles.logoutTitle]}>{title}</Text>
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.settingAction}>
          {type === 'switch' && (
            <Switch
              value={value as boolean}
              onValueChange={(val) => handleSettingChange(title.toLowerCase().replace(/\s+/g, ''), val)}
              trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
              thumbColor={value ? '#fff' : '#f4f3f4'}
            />
          )}
          {type === 'button' && (
            <TouchableOpacity onPress={onPress}>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
          {type === 'select' && (
            <TouchableOpacity onPress={onPress} style={styles.selectButton}>
              <Text style={styles.selectText}>{value}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderLanguageModal = () => (
    <Modal visible={showLanguageModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('selectLanguageText')}</Text>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.modalOption}
              onPress={async () => {
                await setLanguage(lang.code);
                setShowLanguageModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{lang.name}</Text>
              {language === lang.code && (
                <Ionicons name="checkmark" size={20} color="#FF6B35" />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowLanguageModal(false)}
          >
            <Text style={styles.modalCloseText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderUnitsModal = () => (
    <Modal visible={showUnitsModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('selectUnits')}</Text>
          {[t('metric'), t('imperial')].map((unit) => (
            <TouchableOpacity
              key={unit}
              style={styles.modalOption}
              onPress={() => {
                handleSettingChange('units', unit);
                setShowUnitsModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{unit}</Text>
              {settings.units === unit && (
                <Ionicons name="checkmark" size={20} color="#FF6B35" />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowUnitsModal(false)}
          >
            <Text style={styles.modalCloseText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4ECDC4' : '#FF6B6B' }]} />
          <Text style={styles.statusText}>
            {isOnline ? t('connected') : t('offlineStatus')}
          </Text>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notificationSettings')}</Text>
        {renderSettingItem(
          'notifications-outline',
          t('pushNotifications'),
          t('receiveNotifications'),
          'switch',
          settings.notifications
        )}
        {renderSettingItem(
          'volume-high-outline',
          t('sound'),
          t('playSound'),
          'switch',
          settings.soundEnabled
        )}
        {renderSettingItem(
          'phone-portrait-outline',
          t('vibration'),
          t('vibrateNotifications'),
          'switch',
          settings.vibrationEnabled
        )}
      </View>

      {/* Location & Tracking Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('locationTracking')}</Text>
        {renderSettingItem(
          'location-outline',
          t('locationTracking'),
          t('allowLocationTracking'),
          'switch',
          settings.locationTracking
        )}
        {renderSettingItem(
          'navigate-outline',
          t('autoAcceptOrders'),
          t('autoAcceptOrdersDescription'),
          'switch',
          settings.autoAcceptOrders
        )}
        {renderSettingItem(
          'time-outline',
          t('autoOffline'),
          t('autoOfflineDescription'),
          'switch',
          settings.autoOffline
        )}
      </View>

      {/* App Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('appPreferences')}</Text>
        {renderSettingItem(
          'moon-outline',
          t('darkMode'),
          t('useDarkTheme'),
          'switch',
          settings.darkMode
        )}
        {renderSettingItem(
          'language-outline',
          t('language'),
          t('selectLanguage'),
          'select',
          availableLanguages.find(l => l.code === language)?.name || 'English',
          () => setShowLanguageModal(true)
        )}
        {renderSettingItem(
          'resize-outline',
          t('units'),
          t('distanceWeightUnits'),
          'select',
          settings.units,
          () => setShowUnitsModal(true)
        )}
      </View>

      {/* Data & Sync Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dataSync')}</Text>
        {renderSettingItem(
          'cloud-outline',
          t('offlineMode'),
          t('workWithoutInternet'),
          'switch',
          settings.offlineMode
        )}
        {renderSettingItem(
          'sync-outline',
          t('forceSync'),
          t('syncPendingChanges'),
          'button',
          undefined,
          handleForceSync
        )}
        {renderSettingItem(
          'trash-outline',
          t('clearCache'),
          `${t('clear')} ${cacheStats.size} ${t('cachedItems')}`,
          'button',
          undefined,
          handleClearCache
        )}
      </View>

      {/* Cache Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>{t('cacheStatistics')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cacheStats.size}</Text>
            <Text style={styles.statLabel}>{t('cachedItems')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cacheStats.pendingActions}</Text>
            <Text style={styles.statLabel}>{t('pendingActions')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {new Date(cacheStats.lastSync).toLocaleTimeString()}
            </Text>
            <Text style={styles.statLabel}>{t('lastSync')}</Text>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('account')}</Text>
        {renderSettingItem(
          'person-outline',
          t('editProfile'),
          t('updatePersonalInfo'),
          'button',
          undefined,
          handleEditProfile
        )}
        {renderSettingItem(
          'shield-outline',
          t('privacyPolicy'),
          t('viewPrivacyPolicy'),
          'button',
          undefined,
          handlePrivacyPolicy
        )}
        {renderSettingItem(
          'help-circle-outline',
          t('helpSupport'),
          t('getHelp'),
          'button',
          undefined,
          handleHelpSupport
        )}
        {renderSettingItem(
          'log-out-outline',
          t('logout'),
          t('confirmLogout'),
          'button',
          undefined,
          handleLogout
        )}
      </View>

      {renderLanguageModal()}
      {renderUnitsModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  logoutTitle: {
    color: '#FF6B6B',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingAction: {
    marginLeft: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  statsSection: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
