import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const Header = ({ title, showBackButton = false, navigation, onBackPress }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#3498db" />
      <View style={styles.headerContent}>
        <View style={styles.left}>
          {showBackButton && (
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title || 'HypeBridge'}</Text>
        </View>
        
        <View style={styles.right}>
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>
                Welcome, {typeof user === 'object' 
                  ? (user.name || user.displayName || 'Customer')
                  : 'Customer'
                }
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#3498db',
    paddingBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  right: {
    alignItems: 'flex-end',
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});

export default Header;

