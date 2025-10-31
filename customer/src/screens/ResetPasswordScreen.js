import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import LoginStyleInput from '../components/LoginStyleInput';
import { mobileAuthAPI } from '../services/mobileAPI';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email, otp } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await mobileAuthAPI.resetPassword(email, otp, newPassword);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully! You can now login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      // Better error handling
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = newPassword.length >= 6 && confirmPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={60} color={COLORS.PRIMARY} />
          </View>

          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below
          </Text>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <LoginStyleInput
              ref={passwordRef}
              icon="lock-closed"
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={true}
              showToggle={true}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <LoginStyleInput
              ref={confirmPasswordRef}
              icon="lock-closed"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
              showToggle={true}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={[
              styles.requirementText,
              newPassword.length >= 6 && styles.requirementTextValid
            ]}>
              • At least 6 characters long
            </Text>
            <Text style={[
              styles.requirementText,
              newPassword === confirmPassword && confirmPassword.length > 0 && styles.requirementTextValid
            ]}>
              • Passwords must match
            </Text>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[
              styles.resetButton,
              (!isFormValid || loading) && styles.resetButtonDisabled
            ]}
            onPress={handleResetPassword}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.resetButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backToLoginText}>
              Remember your password? <Text style={styles.backToLoginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  requirementsContainer: {
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  requirementTextValid: {
    color: COLORS.SUCCESS,
  },
  resetButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonDisabled: {
    backgroundColor: COLORS.BORDER,
  },
  resetButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backToLoginText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  backToLoginLink: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
