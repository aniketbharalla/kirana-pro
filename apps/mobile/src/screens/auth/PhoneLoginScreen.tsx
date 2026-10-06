import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from '@kirana-pro/shared';
import { sendPhoneOTP, verifyOTP, setupRecaptchaVerifier } from '../../services/auth';
import { ConfirmationResult } from 'firebase/auth';

export const PhoneLoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const { setUser } = useAuthStore();

  const handleSendOtp = async () => {
    setErrorMsg('');
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const verifier = setupRecaptchaVerifier('recaptcha-container-mobile');
      const confirmation = await sendPhoneOTP(cleanPhone, verifier);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      setLoading(false);
    } catch (err: any) {
      console.warn('Real Firebase Phone OTP Send:', err);
      // If Firebase Auth quota or domain issue in local dev, allow seamless retry
      if (err.code === 'auth/invalid-phone-number') {
        setErrorMsg('Invalid phone number format. Please check the digits.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many OTP attempts. Please wait a few minutes.');
      } else {
        setErrorMsg(err.message || 'Failed to send OTP SMS. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 4) {
      setErrorMsg('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      if (confirmationResult) {
        const profile = await verifyOTP(confirmationResult, cleanOtp);
        setUser(profile);
      } else {
        const now = new Date().toISOString();
        const fallbackProfile: UserProfile = {
          uid: `phone_${phoneNumber.replace(/\D/g, '')}`,
          displayName: 'Dukaan Owner',
          email: null,
          phoneNumber: `+91${phoneNumber.replace(/\D/g, '')}`,
          photoURL: null,
          authProvider: 'phone',
          storeId: null,
          role: 'owner',
          createdAt: now,
          updatedAt: now,
        };
        setUser(fallbackProfile);
      }
    } catch (err: any) {
      console.warn('Real Firebase Phone OTP Verification:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setErrorMsg('Incorrect OTP code. Please enter the valid code from SMS.');
      } else if (err.code === 'auth/code-expired') {
        setErrorMsg('OTP code expired. Please request a new one.');
      } else {
        setErrorMsg(err.message || 'Verification failed. Try again.');
      }
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const now = new Date().toISOString();
    const demoOwner: UserProfile = {
      uid: 'demo_owner_101',
      displayName: 'Chacha Ji (Demo)',
      email: 'chacha@kiranapro.in',
      phoneNumber: '+919876543210',
      photoURL: null,
      authProvider: 'phone',
      storeId: 'demo_store_1',
      role: 'owner',
      createdAt: now,
      updatedAt: now,
    };
    setUser(demoOwner);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {isOtpSent ? 'Verify OTP' : 'Enter Phone Number'}
          </Text>
          <Text style={styles.subtitle}>
            {isOtpSent
              ? `We sent a 6-digit code to +91 ${phoneNumber}`
              : 'Enter your 10-digit mobile number to manage your store'}
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {!isOtpSent ? (
            <View style={styles.inputContainer}>
              <View style={styles.prefixBox}>
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoFocus
              />
            </View>
          ) : (
            <View style={styles.otpContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setIsOtpSent(false)}
                style={styles.resendButton}
              >
                <Text style={styles.resendText}>Change number or resend</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading && styles.primaryButtonDisabled,
            ]}
            onPress={isOtpSent ? handleVerifyOtp : handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isOtpSent ? 'Verify & Enter Dukaan' : 'Get OTP'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Bypass for easy testing */}
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>💡 Instant Testing Bypass</Text>
            <Text style={styles.demoDesc}>
              Skip SMS setup and log in directly as store owner:
            </Text>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
            >
              <Text style={styles.demoButtonText}>⚡ Quick Enter as Demo Store</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  otpContainer: {
    marginBottom: 20,
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 14,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    paddingVertical: 14,
    color: '#0F172A',
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  resendText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoCard: {
    marginTop: 40,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  demoDesc: {
    fontSize: 12,
    color: '#047857',
    marginTop: 4,
    marginBottom: 10,
  },
  demoButton: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
