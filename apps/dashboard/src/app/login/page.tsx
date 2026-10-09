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
import { useAuth } from '../../context/AuthContext';
import { StaffMember, Store } from '@kirana-pro/shared';

export default function LoginPage() {
  const router = useRouter();
  const { staffSignIn, startStaffShift } = useAuth();

  // Persona: Store Owner vs Staff / Cashier
  const [persona, setPersona] = useState<'owner' | 'staff'>('owner');

  // Owner Auth state
  const [authMethod, setAuthMethod] = useState<'phone' | 'google'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Staff Auth state
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [verifiedStaff, setVerifiedStaff] = useState<StaffMember | null>(null);
  const [verifiedStore, setVerifiedStore] = useState<Store | null>(null);
  const [counterNumber, setCounterNumber] = useState(1);
  const [openingCash, setOpeningCash] = useState('500');

  // Status & loading
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

  // Handle Staff Verification (Only Phone + PIN required)
  const handleStaffVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await staffSignIn(staffPhone, staffPin);
      setVerifiedStaff(res.staff);
      setVerifiedStore(res.store);
      setInfoMsg(`✓ Verified: ${res.staff.name} (${res.staff.role}) at ${res.store.name}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Staff verification failed. Check phone and PIN.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Shift Register Activation
  const handleOpenShiftAndLaunch = async () => {
    if (!verifiedStaff) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const parsedFloat = parseFloat(openingCash) || 0;
      await startStaffShift(counterNumber, parsedFloat);
      router.replace('/bills');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to open counter shift.');
      setLoading(false);
    }
  };

  // Handle Real Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await signInWithGoogle();
      // AuthContext will automatically redirect to '/' upon auth state update
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized in Firebase Console. Please access via http://localhost:3000 or http://127.0.0.1:3000 and refresh.');
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
      // AuthContext will automatically redirect to '/' upon auth state update
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

        {/* Persona Switcher: Store Owner vs Staff / Cashier */}
        <div style={styles.personaContainer}>
          <button
            style={{
              ...styles.personaBtn,
              ...(persona === 'owner' ? styles.personaBtnActive : {}),
            }}
            onClick={() => {
              setPersona('owner');
              setErrorMsg('');
              setInfoMsg('');
            }}
          >
            👑 Store Owner (मालिक)
          </button>
          <button
            style={{
              ...styles.personaBtn,
              ...(persona === 'staff' ? styles.personaBtnActive : {}),
            }}
            onClick={() => {
              setPersona('staff');
              setErrorMsg('');
              setInfoMsg('');
            }}
          >
            🧑‍💼 Staff & Cashier (कैशियर)
          </button>
        </div>

        {/* Status / Error Alerts */}
        {errorMsg && <div style={styles.errorBox}>⚠️ {errorMsg}</div>}
        {infoMsg && <div style={styles.infoBox}>✓ {infoMsg}</div>}

        {/* ============================================================== */}
        {/* A. STAFF / CASHIER PHONE + PIN FLOW */}
        {/* ============================================================== */}
        {persona === 'staff' && (
          <div style={styles.formSection}>
            {!verifiedStaff ? (
              <form onSubmit={handleStaffVerify} style={styles.staffForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>STAFF MOBILE NUMBER (कैशियर मोबाइल नंबर)</label>
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
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>4-DIGIT SECURITY PIN (४ अंकों का पिन)</label>
                  <input
                    style={styles.pinInput}
                    type="password"
                    inputMode="numeric"
                    placeholder="• • • •"
                    maxLength={4}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <span style={styles.helperText}>Counter PIN assigned by store owner in Staff Register</span>
                </div>

                <button
                  style={styles.submitBtn}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Verifying Credentials...' : '🔑 Verify Credentials (पिन सत्यापित करें) ➔'}
                </button>
              </form>
            ) : (
              /* Step 2: Open Shift Register & Count Opening Cash */
              <div style={styles.shiftCard}>
                <div style={styles.shiftHeader}>
                  <div style={styles.shiftAvatar}>
                    {verifiedStaff.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={styles.shiftStaffName}>{verifiedStaff.name}</h3>
                    <span style={styles.shiftRoleBadge}>{verifiedStaff.role.toUpperCase()}</span>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>SELECT COUNTER (काउंटर चुनें)</label>
                  <div style={styles.counterRow}>
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        style={{
                          ...styles.counterBtn,
                          ...(counterNumber === num ? styles.counterBtnActive : {}),
                        }}
                        onClick={() => setCounterNumber(num)}
                      >
                        Counter {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>MORNING OPENING CASH IN GALLA (गल्ले में शुरुआती नकद)</label>
                  <div style={styles.currencyInputRow}>
                    <span style={styles.currencySymbol}>₹</span>
                    <input
                      style={styles.currencyInput}
                      type="number"
                      placeholder="500"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                    />
                  </div>
                  <span style={styles.helperText}>Starting cash float for giving change to customers</span>
                </div>

                <div style={styles.shiftActionsRow}>
                  <button
                    style={styles.submitBtn}
                    onClick={handleOpenShiftAndLaunch}
                    disabled={loading}
                  >
                    {loading ? 'Opening Shift...' : '🚀 Start Shift & Launch Billing (बिलिंग शुरू करें)'}
                  </button>
                  <button
                    style={styles.cancelLink}
                    type="button"
                    onClick={() => {
                      setVerifiedStaff(null);
                      setVerifiedStore(null);
                      setStaffPin('');
                    }}
                  >
                    Switch Staff / Re-enter PIN
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* B. STORE OWNER GOOGLE & PHONE OTP FLOW */}
        {/* ============================================================== */}
        {persona === 'owner' && (
          <>
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

            {/* 1. MOBILE NUMBER OTP FORM */}
            {authMethod === 'phone' && (
              <div style={styles.formSection}>
                {!isOtpSent ? (
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>ENTER STORE OWNER MOBILE NUMBER</label>
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
          </>
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
  personaContainer: {
    display: 'flex',
    backgroundColor: 'rgba(118, 118, 128, 0.1)',
    borderRadius: '14px',
    padding: '4px',
    gap: '4px',
    marginBottom: '20px',
  },
  personaBtn: {
    flex: 1,
    borderWidth: 0,
    borderStyle: 'none',
    backgroundColor: 'transparent',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#636366',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  personaBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#1D1D1F',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  staffForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left',
  },
  quickFillBox: {
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '12px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  quickFillLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#166534',
  },
  quickFillRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  quickPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#15803D',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  quickPinTag: {
    backgroundColor: '#DCFCE7',
    padding: '1px 5px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  textInput: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: '12px',
    padding: '12px 14px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#1D1D1F',
    outline: 'none',
  },
  helperText: {
    fontSize: '11px',
    color: '#86868B',
    marginTop: '2px',
  },
  pinInput: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#FBFBFC',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#10B981',
    borderRadius: '14px',
    padding: '14px',
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '14px',
    textAlign: 'center',
    color: '#1D1D1F',
    outline: 'none',
  },
  shiftCard: {
    backgroundColor: '#FBFBFC',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left',
  },
  shiftHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '12px',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  shiftAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 800,
    color: '#059669',
  },
  shiftStaffName: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 800,
    color: '#1D1D1F',
  },
  shiftRoleBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '2px 8px',
    borderRadius: '9999px',
    marginTop: '2px',
  },
  counterRow: {
    display: 'flex',
    gap: '8px',
  },
  counterBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#636366',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  },
  counterBtnActive: {
    backgroundColor: '#1D1D1F',
    borderColor: '#1D1D1F',
    color: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
  },
  currencyInputRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: '#10B981',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  currencySymbol: {
    padding: '12px 16px',
    fontSize: '18px',
    fontWeight: 800,
    color: '#059669',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  currencyInput: {
    flex: 1,
    borderWidth: 0,
    borderStyle: 'none',
    outline: 'none',
    padding: '12px 14px',
    fontSize: '18px',
    fontWeight: 800,
    color: '#1D1D1F',
  },
  shiftActionsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center',
    marginTop: '6px',
  },
  cancelLink: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderStyle: 'none',
    color: '#86868B',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
