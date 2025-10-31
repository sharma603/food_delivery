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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { mobileAuthAPI } from '../services/mobileAPI';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const inputRefs = useRef([]);

  useEffect(() => {
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
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPChange = (value, index) => {
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

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue = null) => {
    const otpToVerify = otpValue || otp.join('');
    
    if (!otpToVerify || otpToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setIsVerifying(true);
    
    try {
      const response = await mobileAuthAPI.verifyOTP(email, otpToVerify);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'OTP verified successfully! You can now set a new password.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ResetPassword', { email, otp: otpToVerify })
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to verify OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      // Better error handling
      let errorMessage = 'Failed to verify OTP. Please check and try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const response = await mobileAuthAPI.forgotPassword({ email });
      
      if (response.success) {
        Alert.alert('Success', 'New OTP has been sent to your email');
        setTimeLeft(300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      // Better error handling
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const isOTPComplete = otp.every(digit => digit !== '') && otp.join('').length === 6;

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
          <Text style={styles.headerTitle}>Verify OTP</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={60} color={COLORS.PRIMARY} />
          </View>

          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit OTP to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  digit && styles.otpBoxFilled,
                  isVerifying && styles.otpBoxVerifying
                ]}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
                editable={!loading}
                textContentType="oneTimeCode"
                inputMode="numeric"
                placeholder=""
                placeholderTextColor="transparent"
                caretHidden={false}
              />
            ))}
          </View>

          {/* Auto-verification indicator */}
          {isVerifying && (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              <Text style={styles.verifyingText}>Verifying OTP...</Text>
            </View>
          )}

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              OTP expires in: <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
            </Text>
          </View>

          {/* Manual Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!isOTPComplete || loading) && styles.verifyButtonDisabled
            ]}
            onPress={() => handleVerifyOTP()}
            disabled={!isOTPComplete || loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.verifyButtonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the OTP?</Text>
            <TouchableOpacity
              style={[
                styles.resendButton,
                (!canResend || resendLoading) && styles.resendButtonDisabled
              ]}
              onPress={handleResendOTP}
              disabled={!canResend || resendLoading}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <Text style={[
                  styles.resendButtonText,
                  !canResend && styles.resendButtonTextDisabled
                ]}>
                  Resend OTP
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              • Enter the 6-digit OTP from your email{'\n'}
              • OTP will be verified automatically when complete{'\n'}
              • Check spam folder if not in inbox{'\n'}
              • OTP expires in 5 minutes{'\n'}
              • You have 3 attempts to enter the correct OTP
            </Text>
          </View>
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
  emailText: {
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A', // Dark text color for visibility
    backgroundColor: '#FFFFFF', // White background
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#FFFFFF', // White background
    borderWidth: 3,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    color: '#1A1A1A', // Dark text for visibility on white background
  },
  otpBoxVerifying: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: '#FFFFFF', // White background
    borderWidth: 3,
    shadowColor: COLORS.SUCCESS,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    color: '#1A1A1A', // Dark text for visibility on white background
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  timerValue: {
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  verifyButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.BORDER,
  },
  verifyButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  resendButtonTextDisabled: {
    color: COLORS.TEXT_SECONDARY,
  },
  helpContainer: {
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
});

export default OTPVerificationScreen;