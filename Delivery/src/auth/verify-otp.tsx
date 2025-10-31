import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deliveryAPI } from '../services/api';

export default function VerifyOTPScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'Email is required', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPChange = (value: string, index: number) => {
    // Only allow single digit
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp.join('');
    
    if (!otpToVerify || otpToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setIsVerifying(true);
    
    try {
      const response = await deliveryAPI.verifyOTP(email, otpToVerify);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'OTP verified successfully! You can now set a new password.',
          [
            {
              text: 'OK',
              onPress: () => router.push({
                pathname: '/(auth)/reset-password',
                params: { email, otp: otpToVerify }
              })
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to verify OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      let errorMessage = 'Failed to verify OTP. Please check and try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) {
      return;
    }

    setResendLoading(true);
    try {
      const response = await deliveryAPI.forgotPassword(email);
      
      if (response.data.success) {
        Alert.alert('Success', 'OTP has been resent to your email');
        setTimeLeft(300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark-outline" size={60} color="#FF6B35" />
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  isVerifying && styles.otpInputVerifying,
                ]}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {timeLeft > 0 && (
            <Text style={styles.timerText}>
              Resend code in {formatTime(timeLeft)}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.verifyButton, (isLoading || otp.join('').length !== 6) && styles.verifyButtonDisabled]}
            onPress={() => handleVerifyOTP()}
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
            onPress={handleResendOTP}
            disabled={!canResend || resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator color="#FF6B35" />
            ) : (
              <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                Resend OTP
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emailText: {
    fontWeight: '600',
    color: '#333',
  },
  form: {
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#F8F9FA',
  },
  otpInputFilled: {
    borderColor: '#FF6B35',
    backgroundColor: '#fff',
  },
  otpInputVerifying: {
    borderColor: '#4CAF50',
  },
  timerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 24,
  },
  verifyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    backgroundColor: '#FFB399',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    padding: 12,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#999',
  },
});

