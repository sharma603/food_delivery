import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import LoginStyleInput from '../components/LoginStyleInput';
import { COLORS } from '../utils/constants';
import NepalAddressSelector from '../components/NepalAddressSelector';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Nepal',
      province: '',
      district: '',
      municipality: ''
    }
  });

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'Nepal',
          province: user.address?.province || '',
          district: user.address?.district || '',
          municipality: user.address?.municipality || ''
        }
      });
    }
  }, [user]);

  // Prevent keyboard from dismissing
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', (e) => {
      // Prevent automatic keyboard dismissal
      console.log('Keyboard hidden - this should not happen automatically');
    });

    return () => {
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = formatDate(selectedDate);
      handleInputChange('dateOfBirth', formattedDate);
    }
    
    // For iOS, close the picker after selection
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowDatePicker(false);
    }
  };

  const openDatePicker = () => {
    // If there's already a date, set it as the selected date
    if (formData.dateOfBirth) {
      const dateParts = formData.dateOfBirth.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2]);
        setSelectedDate(new Date(year, month, day));
      }
    }
    setShowDatePicker(true);
  };

  const handleAddressSelect = (addressData) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        province: addressData.province,
        district: addressData.district,
        municipality: addressData.municipality
      }
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Full name is required');
      return false;
    }
    if (formData.name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters long');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }
    // Basic phone validation for Nepal
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    // Date validation if provided
    if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
        return false;
      }
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        Alert.alert('Error', 'Date of birth must be in the past');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await updateUserProfile(formData);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const ProfileInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, editable = true, autoCapitalize = 'none', icon, ...props }) => {
    if (multiline) {
      // For multiline inputs, use TextInput with custom styles
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{label}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.multilineInput, !editable && styles.disabledInput]}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={COLORS.TEXT_LIGHT}
              keyboardType={keyboardType}
              multiline={multiline}
              numberOfLines={3}
              editable={editable}
              autoCapitalize={autoCapitalize}
              {...props}
            />
          </View>
        </View>
      );
    }
    
    // For single line inputs, use LoginStyleInput
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <LoginStyleInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          icon={icon}
          {...props}
        />
      </View>
    );
  };

  const GenderSelector = ({ label, value, onSelect }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.genderSelector}
        onPress={() => setShowGenderModal(true)}
      >
        <Text style={[styles.genderText, !value && styles.placeholderText]}>
          {value || 'Select gender'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.TEXT_LIGHT} />
      </TouchableOpacity>
    </View>
  );

  const DatePickerSelector = ({ label, value, onSelect }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dateSelector}
        onPress={openDatePicker}
      >
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value || 'Select date of birth'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={COLORS.TEXT_LIGHT} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={true}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          scrollEventThrottle={16}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <ProfileInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your full name"
              autoCapitalize="words"
              icon="person-outline"
            />

            <ProfileInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              autoCapitalize="none"
              icon="call-outline"
            />

            <DatePickerSelector
              label="Date of Birth"
              value={formData.dateOfBirth}
              onSelect={(value) => handleInputChange('dateOfBirth', value)}
            />

            <GenderSelector
              label="Gender"
              value={formData.gender}
              onSelect={(value) => handleInputChange('gender', value)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            {/* Nepal Address Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Province, District & Municipality *</Text>
              <NepalAddressSelector
                onAddressSelect={handleAddressSelect}
                selectedAddress={{
                  province: formData.address.province,
                  district: formData.address.district,
                  municipality: formData.address.municipality
                }}
                placeholder="Select Province, District & Municipality"
              />
            </View>

            <ProfileInput
              label="Street Address"
              value={formData.address.street}
              onChangeText={(value) => handleInputChange('address.street', value)}
              placeholder="Enter street address"
              multiline
              autoCapitalize="words"
            />

            <ProfileInput
              label="City"
              value={formData.address.city}
              onChangeText={(value) => handleInputChange('address.city', value)}
              placeholder="Enter city"
              autoCapitalize="words"
              icon="location-outline"
            />

            <ProfileInput
              label="ZIP Code"
              value={formData.address.zipCode}
              onChangeText={(value) => handleInputChange('address.zipCode', value)}
              placeholder="Enter ZIP code"
              keyboardType="numeric"
              autoCapitalize="none"
              icon="map-outline"
            />

            <ProfileInput
              label="Country"
              value={formData.address.country}
              onChangeText={(value) => handleInputChange('address.country', value)}
              placeholder="Enter country"
              autoCapitalize="words"
            />
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowGenderModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={genderOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === item && styles.selectedGenderOption
                  ]}
                  onPress={() => {
                    handleInputChange('gender', item);
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[
                    styles.genderOptionText,
                    formData.gender === item && styles.selectedGenderOptionText
                  ]}>
                    {item}
                  </Text>
                  {formData.gender === item && (
                    <Ionicons name="checkmark" size={20} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding for keyboard
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    // Wrapper to prevent touch interference
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.WHITE,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.TEXT_LIGHT,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: COLORS.BACKGROUND,
    color: COLORS.TEXT_LIGHT,
  },
  genderSelector: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateSelector: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genderText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  placeholderText: {
    color: COLORS.TEXT_LIGHT,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    elevation: 5,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    padding: 5,
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  selectedGenderOption: {
    backgroundColor: COLORS.PRIMARY + '10',
  },
  genderOptionText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  selectedGenderOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
