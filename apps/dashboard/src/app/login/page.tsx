'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithGoogle,
  getOrCreateRecaptcha,
  resetRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '../../lib/auth';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'phone' | 'google'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Cleanup RecaptchaVerifier on unmount
  useEffect(() => {
    return () => {
      resetRecaptcha('recaptcha-container');
      recaptchaVerifierRef.current = null;
    };
  }, []);

  // Handle Real Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized in Firebase Console. Add localhost to Authorized Domains.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please try again.');
      } else {
        setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Real Phone OTP Send
  const handleSendPhoneOtp = async () => {
    setErrorMsg('');
    setInfoMsg('');
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const verifier = getOrCreateRecaptcha('recaptcha-container');
      recaptchaVerifierRef.current = verifier;

      const confirmation = await sendPhoneOtp(cleanPhone, verifier);
      confirmationResultRef.current = confirmation;
      setIsOtpSent(true);
      setInfoMsg(`OTP sent to +91 ${cleanPhone}. Please check your SMS.`);
    } catch (err: any) {
      console.error('Phone OTP Send Error:', err);
      resetRecaptcha('recaptcha-container');
      recaptchaVerifierRef.current = null;

      if (err.code === 'auth/internal-error') {
        setErrorMsg(
          'Firebase returned auth/internal-error. Ensure "Phone" sign-in provider is enabled in Firebase Console (Authentication > Sign-in method > Phone). Alternatively, sign in using Google Sign-In!'
        );
      } else if (err.code === 'auth/invalid-phone-number') {
        setErrorMsg('Invalid phone number format.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many OTP attempts. Please wait a moment or use Google Sign-In.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('Phone provider is not enabled in Firebase Console. Please enable Phone under Authentication > Sign-in method.');
      } else {
        setErrorMsg(err.message || 'Failed to send OTP. Please check connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Real Phone OTP Verification
  const handleVerifyPhoneOtp = async () => {
    setErrorMsg('');
    setInfoMsg('');
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit OTP code');
      return;
    }

    if (!confirmationResultRef.current) {
      setErrorMsg('Session expired. Please request a new OTP.');
      setIsOtpSent(false);
      return;
    }

    setLoading(true);
    try {
      await verifyPhoneOtp(confirmationResultRef.current, cleanOtp);
      router.push('/');
    } catch (err: any) {
      console.error('Phone OTP Verification Error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setErrorMsg('Incorrect OTP. Please enter the valid 6-digit code received on your phone.');
      } else if (err.code === 'auth/code-expired') {
        setErrorMsg('OTP has expired. Please request a new code.');
      } else {
        setErrorMsg(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoBadge}>🏪</div>
        <h1 style={styles.title}>Kirana Pro</h1>
        <p style={styles.subtitle}>Desktop Store Management System</p>
        <div style={styles.freePill}>100% Free Forever • Zero Subscription</div>

        {/* Auth Method Tabs */}
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tabBtn,
              ...(authMethod === 'phone' ? styles.tabBtnActive : {}),
            }}
            onClick={() => {
              setAuthMethod('phone');
              setErrorMsg('');
            }}
          >
            📱 Mobile OTP
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(authMethod === 'google' ? styles.tabBtnActive : {}),
            }}
            onClick={() => {
              setAuthMethod('google');
              setErrorMsg('');
            }}
          >
            🌐 Google Sign-In
          </button>
        </div>

        {/* Status / Error Alerts */}
        {errorMsg && <div style={styles.errorBox}>⚠️ {errorMsg}</div>}
        {infoMsg && <div style={styles.infoBox}>✓ {infoMsg}</div>}

        {/* 1. MOBILE NUMBER OTP FORM */}
        {authMethod === 'phone' && (
          <div style={styles.formSection}>
            {!isOtpSent ? (
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>ENTER YOUR 10-DIGIT MOBILE NUMBER</label>
                <div style={styles.phoneInputRow}>
                  <div style={styles.flagPrefix}>
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    style={styles.phoneInput}
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoFocus
                  />
                </div>

                <button
                  style={styles.submitBtn}
                  onClick={handleSendPhoneOtp}
                  disabled={loading}
                >
                  {loading ? 'Sending OTP SMS...' : '📲 Get OTP (ओटीपी भेजें)'}
                </button>
              </div>
            ) : (
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>ENTER 6-DIGIT VERIFICATION CODE</label>
                <input
                  style={styles.otpInput}
                  type="text"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  autoFocus
                />

                <div style={styles.resendRow}>
                  <button
                    style={styles.resendLink}
                    onClick={() => {
                      setIsOtpSent(false);
                      setOtpCode('');
                    }}
                  >
                    ← Change number or resend
                  </button>
                </div>

                <button
                  style={styles.submitBtn}
                  onClick={handleVerifyPhoneOtp}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : '✓ Verify & Enter Dukaan'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. GOOGLE SIGN-IN FORM */}
        {authMethod === 'google' && (
          <div style={styles.formSection}>
            <div style={styles.featuresList}>
              <div style={styles.featureItem}>
                <span>📊</span>
                <span>Live Stock & Low-Alert Monitoring</span>
              </div>
              <div style={styles.featureItem}>
                <span>⚖️</span>
                <span>Taraju Smart Scale Synchronization</span>
              </div>
              <div style={styles.featureItem}>
                <span>🏛️</span>
                <span>Automated GSTR-1 & HSN Tax Return Filing</span>
              </div>
            </div>

            <button
              style={styles.googleBtn}
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <span style={styles.googleIcon}>🌐</span>
              <span>{loading ? 'Signing in with Google...' : 'Continue with Google'}</span>
            </button>
          </div>
        )}



        {/* Permanent reCAPTCHA widget container */}
        <div id="recaptcha-container"></div>

        <p style={styles.footerText}>
          Secure Authentication powered by Firebase Project <code style={styles.codeText}>kirana-pro-edf3a</code>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '24px',
    padding: '36px',
    width: '100%',
    maxWidth: '460px',
    textAlign: 'center',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
  },
  logoBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    backgroundColor: '#ECFDF5',
    border: '1.5px solid #A7F3D0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    marginBottom: '14px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    marginBottom: '10px',
  },
  freePill: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '3px 12px',
    borderRadius: '20px',
    border: '1px solid #A7F3D0',
    marginBottom: '20px',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
    marginBottom: '20px',
  },
  tabBtn: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
  },
  inputLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  phoneInputRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #CBD5E1',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  flagPrefix: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    borderRight: '1px solid #E2E8F0',
    padding: '12px 14px',
    fontSize: '15px',
    fontWeight: 700,
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '12px 14px',
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
  },
  otpInput: {
    width: '100%',
    boxSizing: 'border-box',
    border: '2px solid #10B981',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '26px',
    fontWeight: 800,
    letterSpacing: '12px',
    textAlign: 'center',
    color: '#0F172A',
    outline: 'none',
  },
  resendRow: {
    textAlign: 'center',
  },
  resendLink: {
    background: 'none',
    border: 'none',
    color: '#10B981',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
  },
  featuresList: {
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
    border: '1px solid #E2E8F0',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600,
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #CBD5E1',
    color: '#1E293B',
    fontWeight: 700,
    fontSize: '15px',
    padding: '13px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  googleIcon: {
    fontSize: '18px',
  },

  footerText: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '16px',
    margin: 0,
  },
  codeText: {
    backgroundColor: '#F1F5F9',
    padding: '2px 4px',
    borderRadius: '4px',
    color: '#475569',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '14px',
    border: '1px solid #FECACA',
    textAlign: 'left',
  },
  infoBox: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '14px',
    border: '1px solid #A7F3D0',
    textAlign: 'left',
  },
};
