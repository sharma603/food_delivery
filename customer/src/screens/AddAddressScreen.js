import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { addressAPI } from '../services/api';

const AddAddressScreen = ({ navigation, route }) => {
  const { address, isEdit } = route.params || {};
  const [loading, setLoading] = useState(false);
  const streetInputRef = useRef(null);
  const [formData, setFormData] = useState({
    type: 'home',
    label: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nepal',
    instructions: '',
  });

  useEffect(() => {
    if (isEdit && address) {
      setFormData({
        type: address.type || 'home',
        label: address.label || '',
        street: address.street || '',
        apartment: address.apartment || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'Nepal',
        instructions: address.instructions || '',
      });
    }
  }, [isEdit, address]);

  const handleInputChange = (field, value) => {
    console.log(`📝 Input changed - ${field}:`, value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.street.trim()) {
      Alert.alert('Error', 'Please enter street address');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter city');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please enter state/province');
      return false;
    }
    if (!formData.zipCode.trim()) {
      Alert.alert('Error', 'Please enter zip/postal code');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('💾 Saving address data:', formData);
      
      if (isEdit && address) {
        await addressAPI.updateAddress(address._id, formData);
        Alert.alert('Success', 'Address updated successfully');
      } else {
        await addressAPI.addAddress(formData);
        Alert.alert('Success', 'Address added successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const AddressTypeButton = ({ type, icon, label }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        formData.type === type && styles.typeButtonActive,
      ]}
      onPress={() => handleInputChange('type', type)}
    >
      <Ionicons
        name={icon}
        size={24}
        color={formData.type === type ? COLORS.WHITE : COLORS.PRIMARY}
      />
      <Text
        style={[
          styles.typeButtonText,
          formData.type === type && styles.typeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const InputField = React.forwardRef(({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    numberOfLines = 1,
    keyboardType = 'default',
    icon,
  }, ref) => {
    const textInputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    
    // Use the forwarded ref or create a new one
    const inputRef = ref || textInputRef;
    
    return (
      <View style={styles.inputFieldContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused
        ]}>
          {icon && (
            <Ionicons name={icon} size={20} color={isFocused ? COLORS.PRIMARY : "#666"} style={styles.inputIcon} />
          )}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#999"
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            autoCorrect={false}
            autoCapitalize="words"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            blurOnSubmit={false}
            returnKeyType={multiline ? 'default' : 'next'}
            selectTextOnFocus={false}
            caretHidden={false}
          />
        </View>
      </View>
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Address' : 'Add New Address'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
        {/* Address Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Type</Text>
          <View style={styles.typeContainer}>
            <AddressTypeButton type="home" icon="home" label="Home" />
            <AddressTypeButton type="work" icon="briefcase" label="Work" />
            <AddressTypeButton type="other" icon="location" label="Other" />
          </View>
        </View>

        {/* Label (Optional) */}
        <View style={styles.section}>
          <InputField
            label="Label (Optional)"
            value={formData.label}
            onChangeText={(value) => handleInputChange('label', value)}
            placeholder="e.g., Mom's House, Office Building"
            icon="pricetag-outline"
            keyboardType="default"
          />
        </View>

        {/* Address Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          <InputField
            label="Street Address *"
            value={formData.street}
            onChangeText={(value) => handleInputChange('street', value)}
            placeholder="Enter street address"
            icon="location-outline"
            ref={streetInputRef}
          />

          <InputField
            label="Apartment, Suite, etc. (Optional)"
            value={formData.apartment}
            onChangeText={(value) => handleInputChange('apartment', value)}
            placeholder="Apt, Suite, Unit, Building, Floor"
            icon="business-outline"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="City *"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                placeholder="City"
                icon="map-outline"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="State/Province *"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
                placeholder="State"
                icon="map-outline"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Zip/Postal Code *"
                value={formData.zipCode}
                onChangeText={(value) => handleInputChange('zipCode', value)}
                placeholder="Zip Code"
                keyboardType="numeric"
                icon="mail-outline"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Country"
                value={formData.country}
                onChangeText={(value) => handleInputChange('country', value)}
                placeholder="Country"
                icon="earth-outline"
              />
            </View>
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <InputField
            label="Delivery Instructions (Optional)"
            value={formData.instructions}
            onChangeText={(value) => handleInputChange('instructions', value)}
            placeholder="e.g., Ring the doorbell, Leave at door, Call on arrival"
            multiline
            numberOfLines={3}
            icon="information-circle-outline"
          />
          <Text style={styles.helperText}>
            Help delivery person find your location easily
          </Text>
        </View>

        <View style={styles.spacer} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color={COLORS.WHITE} />
              <Text style={styles.saveButtonText}>
                {isEdit ? 'Update Address' : 'Save Address'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  typeButtonTextActive: {
    color: COLORS.WHITE,
  },
  inputFieldContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    height: 56,
  },
  inputContainerFocused: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#fff',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    fontStyle: 'italic',
  },
  spacer: {
    height: 40,
  },
  bottomContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddAddressScreen;

