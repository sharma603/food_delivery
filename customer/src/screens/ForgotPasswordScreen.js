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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { SERVER_CONFIG } from '../config/serverConfig';
import { mobileAuthAPI } from '../services/mobileAPI';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleForgotPassword = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await mobileAuthAPI.forgotPassword({
        email: email.toLowerCase().trim(),
      });

      if (response.success) {
        Alert.alert(
          'OTP Sent',
          'OTP has been sent to your email address. Please check your inbox.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('OTPVerification', { email });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      // More specific error messages
      let errorMessage = 'Network error. Please try again.';
      
      if (error.message.includes('Network Error') || error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your internet connection and ensure the server is running.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to server. Please check if the backend server is running.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address and we'll send you an OTP to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
                autoFocus={true}
              />
            </View>

            {/* Send Reset Link Button */}
            <TouchableOpacity
              style={[styles.resetButton, isSubmitting && styles.disabledButton]}
              onPress={handleForgotPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <View style={styles.backToLoginContainer}>
              <Text style={styles.backToLoginText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backToLoginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    marginBottom: 24,
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
  resetButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: COLORS.TEXT_LIGHT,
  },
  resetButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  backToLoginLink: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
