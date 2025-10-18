import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleManageAddresses = () => {
    navigation.navigate('AddressManagement');
  };

  const handleReferFriends = () => {
    Alert.alert('Refer Friends', 'Referral feature coming soon!');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Support feature coming soon!');
  };

  const ProfileItem = ({ icon, title, subtitle, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <View style={styles.profileItemIcon}>
          <Ionicons name={icon} size={20} color={COLORS.PRIMARY} />
        </View>
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{String(title || '')}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{String(subtitle || '')}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_LIGHT} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={COLORS.WHITE} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'customer@example.com'}</Text>
            <Text style={styles.userLevel}>
              {user?.customerLevel || 'New'} Customer
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Profile Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.loyaltyPoints || 0}</Text>
            <Text style={styles.statLabel}>Loyalty Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.sections}>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <ProfileItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={handleEditProfile}
            />
            <ProfileItem
              icon="location-outline"
              title="Manage Addresses"
              subtitle="Add or edit delivery addresses"
              onPress={handleManageAddresses}
            />
            <ProfileItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={handleChangePassword}
            />
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.profileItem}>
              <View style={styles.profileItemLeft}>
                <View style={styles.profileItemIcon}>
                  <Ionicons name="notifications-outline" size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={styles.profileItemText}>
                  <Text style={styles.profileItemTitle}>Push Notifications</Text>
                  <Text style={styles.profileItemSubtitle}>Receive order updates</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY_LIGHT }}
                thumbColor={notificationsEnabled ? COLORS.PRIMARY : COLORS.TEXT_LIGHT}
              />
            </View>
          </View>

          {/* General Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            <ProfileItem
              icon="gift-outline"
              title="Refer Friends"
              subtitle="Earn rewards for referrals"
              onPress={handleReferFriends}
            />
            <ProfileItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help or contact us"
              onPress={handleSupport}
            />
            <ProfileItem
              icon="information-circle-outline"
              title="About FoodHub"
              subtitle="Version 1.0.0"
              onPress={() => Alert.alert('About', 'FoodHub v1.0.0\nMade with ❤️')}
            />
          </View>

          {/* Logout */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.WHITE} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    backgroundColor: COLORS.PRIMARY_LIGHT + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButton: {
    padding: 8,
    backgroundColor: COLORS.PRIMARY + '15',
    borderRadius: 20,
  },
  statsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statDivider: {
    backgroundColor: COLORS.BORDER,
    width: 1,
    height: 40,
    marginHorizontal: 20,
  },
  sections: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    marginLeft: 4,
  },
  profileItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    backgroundColor: COLORS.PRIMARY + '15',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemText: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;
