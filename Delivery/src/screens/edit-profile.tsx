import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { deliveryAPI } from '../services/api';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    vehicleType: '',
    vehicleNumber: '',
    vehicleModel: '',
    vehicleYear: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        vehicleType: user.vehicleType || '',
        vehicleNumber: user.vehicleNumber || '',
        vehicleModel: user.vehicleModel || '',
        vehicleYear: user.vehicleYear?.toString() || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!profileData.name || !profileData.phone) {
      Alert.alert(t('error'), 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await deliveryAPI.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        vehicleType: profileData.vehicleType,
        vehicleNumber: profileData.vehicleNumber,
        vehicleModel: profileData.vehicleModel,
        vehicleYear: profileData.vehicleYear ? parseInt(profileData.vehicleYear) : undefined,
      });

      if (response.data.success) {
        updateUser(response.data.data);
        Alert.alert(t('success'), 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(t('error'), error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('name')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Your name" 
          value={profileData.name}
          onChangeText={(text) => setProfileData({ ...profileData, name: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('phone')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Your phone" 
          keyboardType="phone-pad" 
          value={profileData.phone}
          onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('vehicleType')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Vehicle type" 
          value={profileData.vehicleType}
          onChangeText={(text) => setProfileData({ ...profileData, vehicleType: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('vehicleNumber')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Vehicle number" 
          value={profileData.vehicleNumber}
          onChangeText={(text) => setProfileData({ ...profileData, vehicleNumber: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('vehicleModel')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Vehicle model" 
          value={profileData.vehicleModel}
          onChangeText={(text) => setProfileData({ ...profileData, vehicleModel: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('vehicleYear')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Year" 
          keyboardType="numeric"
          value={profileData.vehicleYear}
          onChangeText={(text) => setProfileData({ ...profileData, vehicleYear: text })}
        />
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>{t('save')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60, 
    padding: 16, 
    backgroundColor: '#fff', 
    borderBottomColor: '#eee', 
    borderBottomWidth: 1 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333',
    flex: 1,
    textAlign: 'center'
  },
  backButton: {
    padding: 4,
  },
  formGroup: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 12, padding: 14 },
  label: { fontSize: 12, color: '#777', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fafafa' },
  primaryButton: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#FF6B35', padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryButtonDisabled: { backgroundColor: '#FFB399' },
  primaryButtonText: { color: '#fff', fontWeight: '700' }
});


