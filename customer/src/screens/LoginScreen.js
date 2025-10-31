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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login, loading, error, clearError } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Load saved credentials on mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('saved_login_email');
      const savedPassword = await AsyncStorage.getItem('saved_login_password');
      
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const handleLogin = async () => {
    // Clear any previous errors
    clearError();
    setLoginError('');

    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await login({
        email: email.toLowerCase().trim(),
        password: password.trim(),
      });

      if (response.success) {
        // Save or clear credentials based on rememberMe
        if (rememberMe) {
          await AsyncStorage.setItem('saved_login_email', email);
          await AsyncStorage.setItem('saved_login_password', password);
        } else {
          await AsyncStorage.removeItem('saved_login_email');
          await AsyncStorage.removeItem('saved_login_password');
        }

        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigation will be handled automatically by AuthProvider
            },
          },
        ]);
      } else {
        // Show detailed error message
        const errorMessage = response.message || 'Login failed. Please check your credentials and try again.';
        setLoginError(errorMessage);
        Alert.alert(
          'Login Failed',
          errorMessage,
          [{ text: 'OK', style: 'default' }],
          { cancelable: true }
        );
      }
    } catch (error) {
      // Get the actual error message from the error object
      // The axios interceptor should have set error.message to the backend's message
      let errorMessage = error.message || 'Login failed. Please check your credentials and try again.';
      
      // If we have originalError, prefer its message if available
      if (error.originalError && error.originalError.message) {
        errorMessage = error.originalError.message;
      }
      
      // Set error message to display on screen
      setLoginError(errorMessage);
      
      Alert.alert(
        'Login Failed',
        errorMessage,
        [
          { 
            text: 'OK', 
            style: 'default',
            onPress: () => {
              // Clear password field on error
              setPassword('');
            }
          }
        ],
        { cancelable: true }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to FoodHub</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <View style={[
              styles.inputContainer, 
              (error || loginError) && styles.inputContainerError
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={(error || loginError) ? COLORS.ERROR : "#666"} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (loginError) setLoginError(''); // Clear error when user types
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
            </View>

            {/* Password Input */}
            <View style={[
              styles.inputContainer, 
              (error || loginError) && styles.inputContainerError
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={(error || loginError) ? COLORS.ERROR : "#666"} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (loginError) setLoginError(''); // Clear error when user types
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
             <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Remember Me and Forgot Password */}
            <View style={styles.optionsContainer}>
              <View style={styles.rememberMeContainer}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: '#e0e0e0', true: COLORS.PRIMARY }}
                  thumbColor={rememberMe ? '#ffffff' : '#f4f3f4'}
                  ios_backgroundColor="#e0e0e0"
                />
                <Text style={styles.rememberMeText}>Remember Me</Text>
              </View>
              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {(error || loginError) && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.ERROR} style={styles.errorIcon} />
                <Text style={styles.errorText}>{loginError || String(error || 'An error occurred')}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, (loading || isSubmitting) && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading || isSubmitting}
            >
              {(loading || isSubmitting) ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.WHITE,
    height: 56,
  },
  inputContainerError: {
    borderColor: COLORS.ERROR,
    borderWidth: 2,
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: COLORS.TEXT_LIGHT,
  },
  loginButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  registerLink: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
});

export default LoginScreen;

