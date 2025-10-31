import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const ChangePasswordScreen = ({ navigation }) => {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = React.useCallback((field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      Alert.alert('Error', 'Current password is required');
      return false;
    }
    if (!formData.newPassword.trim()) {
      Alert.alert('Error', 'New password is required');
      return false;
    }
    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }
    // Additional password strength validation
    const hasNumber = /\d/.test(formData.newPassword);
    const hasLetter = /[a-zA-Z]/.test(formData.newPassword);
    if (!hasNumber || !hasLetter) {
      Alert.alert('Error', 'Password must contain both letters and numbers');
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      Alert.alert('Success', 'Password changed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      // Better error handling
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
      
      // Clear password fields on error
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Password Information</Text>
            <Text style={styles.sectionDescription}>
              Enter your current password and choose a new secure password.
            </Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="lock-closed-outline"
                  size={20} 
                  color="#666" 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onChangeText={(value) => handleInputChange('currentPassword', value)}
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => togglePasswordVisibility('current')}
                >
                  <Ionicons
                    name={showPasswords.current ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="lock-closed-outline"
                  size={20} 
                  color="#666" 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChangeText={(value) => handleInputChange('newPassword', value)}
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => togglePasswordVisibility('new')}
                >
                  <Ionicons
                    name={showPasswords.new ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="lock-closed-outline"
                  size={20} 
                  color="#666" 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => togglePasswordVisibility('confirm')}
                >
                  <Ionicons
                    name={showPasswords.confirm ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={formData.newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={formData.newPassword.length >= 6 ? COLORS.SUCCESS : COLORS.TEXT_LIGHT} 
                />
                <Text style={[styles.requirement, formData.newPassword.length >= 6 && styles.requirementMet]}>
                  At least 6 characters long
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={formData.newPassword !== formData.currentPassword && formData.newPassword ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={formData.newPassword !== formData.currentPassword && formData.newPassword ? COLORS.SUCCESS : COLORS.TEXT_LIGHT} 
                />
                <Text style={[styles.requirement, formData.newPassword !== formData.currentPassword && formData.newPassword && styles.requirementMet]}>
                  Different from current password
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={/\d/.test(formData.newPassword) && /[a-zA-Z]/.test(formData.newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={/\d/.test(formData.newPassword) && /[a-zA-Z]/.test(formData.newPassword) ? COLORS.SUCCESS : COLORS.TEXT_LIGHT} 
                />
                <Text style={[styles.requirement, /\d/.test(formData.newPassword) && /[a-zA-Z]/.test(formData.newPassword) && styles.requirementMet]}>
                  Use a combination of letters and numbers
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.changeButton, loading && styles.disabledButton]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.changeButtonText}>Change Password</Text>
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
    padding: 20,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 25,
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.WHITE,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  passwordRequirements: {
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8,
    flex: 1,
  },
  requirementMet: {
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  changeButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.TEXT_LIGHT,
  },
  changeButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;
