import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import AppConfig from '../../../config/appConfig';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading] = useState(false); // Reserved for future use
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
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
  }, [email, navigate]);

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

  const handleKeyPress = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue) => {
    const otpToVerify = otpValue || otp.join('');
    
    if (otpToVerify.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch(`${AppConfig.API.BASE_URL}/restaurant/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          otp: otpToVerify.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Navigate to reset password page with email and OTP
        navigate('/reset-password', { 
          state: { 
            email: email.toLowerCase().trim(),
            otp: otpToVerify.trim()
          } 
        });
      } else {
        setError(data.message || 'Invalid OTP. Please check and try again.');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    setOtp(['', '', '', '', '', '']);
    setTimeLeft(300);
    setCanResend(false);

    try {
      const response = await fetch(`${AppConfig.API.BASE_URL}/restaurant/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setError('');
      } else {
        setError(data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600 rounded-full opacity-15 blur-2xl transform -translate-x-20 translate-y-20" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md z-10 mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8">
          
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Verify OTP</h1>
            <p className="text-gray-600 text-xs sm:text-sm px-2">
              Enter the 6-digit OTP sent to<br />
              <span className="font-medium text-gray-800 break-all">{email}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* OTP Input Container */}
          <div className="space-y-6">
            <div className="flex justify-center gap-1.5 sm:gap-2 px-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyPress(e, index)}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    digit 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300 bg-white'
                  } ${isVerifying ? 'opacity-50' : ''}`}
                  disabled={isVerifying || loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Auto-verification indicator */}
            {isVerifying && (
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Verifying OTP...</span>
              </div>
            )}

            {/* Timer */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                OTP expires in: <span className="font-semibold text-gray-800">{formatTime(timeLeft)}</span>
              </p>
            </div>

            {/* Manual Verify Button */}
            {otp.join('').length === 6 && !isVerifying && (
              <button
                onClick={() => handleVerifyOTP()}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-white border-2 border-gray-800 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
              >
                Verify OTP
              </button>
            )}

            {/* Resend OTP */}
            <div className="text-center">
              {canResend ? (
                <button
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="text-sm text-orange-600 hover:text-orange-500 font-medium transition-colors disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Didn't receive OTP? Resend in {formatTime(timeLeft)}
                </p>
              )}
            </div>
          </div>

          {/* Back to Login Link */}
          <div className="mt-4 sm:mt-6 text-center pt-4 sm:pt-6 border-t border-gray-200">
            <Link 
              to="/forgot-password" 
              className="text-xs sm:text-sm text-orange-600 hover:text-orange-500 font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Change Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;

