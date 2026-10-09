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

  // Handle Staff Verification
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
      router.replace('/pos');
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
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized in Firebase Console. Please access via http://localhost:3000 and refresh.');
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
          'Firebase returned auth/internal-error. Ensure "Phone" provider is active in Firebase Console, or use Google Sign-In!'
        );
      } else if (err.code === 'auth/invalid-phone-number') {
        setErrorMsg('Invalid phone number format.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many OTP attempts. Please wait a moment or continue with Google.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('Phone provider is not enabled in Firebase Console.');
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
    <div style={styles.pageWrapper}>
      {/* 1. Atmospheric Ambient Daylight Background */}
      <div style={styles.skyGradient} />

      {/* 2. Concentric Orbital Rings */}
      <div style={styles.orbitalRingOuter} />
      <div style={styles.orbitalRingInner} />

      {/* 3. Subtle Horizon Cumulus Layer */}
      <div style={styles.cloudLayer}>
        <svg
          viewBox="0 0 1440 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <path
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,160C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="rgba(255, 255, 255, 0.4)"
          />
          <path
            d="M0,256L60,240C120,224,240,192,360,197.3C480,203,600,245,720,250.7C840,256,960,224,1080,218.7C1200,213,1320,235,1380,245.3L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            fill="rgba(255, 255, 255, 0.65)"
          />
        </svg>
      </div>

      {/* 4. Top-Left Brand Emblem (Matching Ebolt reference) */}
      <div style={styles.brandPill}>
        <div style={styles.brandIconBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
          </svg>
        </div>
        <span style={styles.brandText}>Kirana Pro</span>
      </div>

      {/* 5. Centered Frosted Glass Authentication Card */}
      <div style={styles.cardContainer}>
        <div style={styles.frostedCard}>
          {/* Card Top Icon Chip */}
          <div style={styles.chipWrapper}>
            <div style={styles.iconChip}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 style={styles.cardTitle}>
            {persona === 'owner' ? 'Sign in with mobile' : 'Staff & Cashier Sign In'}
          </h1>
          <p style={styles.cardSubtitle}>
            Fastest billing, live stock sync, and desktop store OS. 100% Free.
          </p>

          {/* Persona Segmented Bar */}
          <div style={styles.personaBar}>
            <button
              type="button"
              style={{
                ...styles.personaPill,
                ...(persona === 'owner' ? styles.personaPillActive : {}),
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
              type="button"
              style={{
                ...styles.personaPill,
                ...(persona === 'staff' ? styles.personaPillActive : {}),
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

          {/* Status / Alert Messages */}
          {errorMsg && <div style={styles.errorBox}>⚠️ {errorMsg}</div>}
          {infoMsg && <div style={styles.infoBox}>✓ {infoMsg}</div>}

          {/* ========================================================= */}
          {/* A. STORE OWNER AUTH FLOW */}
          {/* ========================================================= */}
          {persona === 'owner' && (
            <div style={styles.formContent}>
              {authMethod === 'phone' ? (
                <>
                  {!isOtpSent ? (
                    <div style={styles.inputStack}>
                      {/* Mobile Number Pill Input */}
                      <div style={styles.pillInputRow}>
                        <div style={styles.inputPrefix}>
                          <span>🇮🇳</span>
                          <span style={styles.prefixCode}>+91</span>
                        </div>
                        <input
                          style={styles.pillInput}
                          type="tel"
                          placeholder="Enter 10-digit mobile"
                          maxLength={10}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          autoFocus
                        />
                      </div>

                      {/* Primary Dark Charcoal CTA Button */}
                      <button
                        style={styles.charcoalBtn}
                        onClick={handleSendPhoneOtp}
                        disabled={loading}
                      >
                        {loading ? 'Sending OTP SMS...' : 'Get Started'}
                      </button>
                    </div>
                  ) : (
                    <div style={styles.inputStack}>
                      {/* 6-Digit OTP Pill Input */}
                      <div style={styles.otpInputWrapper}>
                        <input
                          style={styles.otpPillInput}
                          type="text"
                          placeholder="• • • • • •"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          autoFocus
                        />
                      </div>

                      <div style={styles.resendRow}>
                        <button
                          type="button"
                          style={styles.linkBtn}
                          onClick={() => {
                            setIsOtpSent(false);
                            setOtpCode('');
                          }}
                        >
                          ← Change number or resend
                        </button>
                      </div>

                      <button
                        style={styles.charcoalBtn}
                        onClick={handleVerifyPhoneOtp}
                        disabled={loading}
                      >
                        {loading ? 'Verifying OTP...' : 'Verify & Enter Dukaan'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Google Flow Card */
                <div style={styles.inputStack}>
                  <div style={styles.googleFeatureBox}>
                    <div style={styles.featureLine}>
                      <span>⚡</span> <span>Real-time inventory sync & barcode catalog</span>
                    </div>
                    <div style={styles.featureLine}>
                      <span>⚖️</span> <span>Taraju smart scale weight calculations</span>
                    </div>
                    <div style={styles.featureLine}>
                      <span>🏛️</span> <span>Automatic GST & Customer Khata ledger</span>
                    </div>
                  </div>

                  <button
                    style={styles.charcoalBtn}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    {loading ? 'Connecting with Google...' : 'Continue with Google'}
                  </button>
                </div>
              )}

              {/* Dotted Divider */}
              <div style={styles.dividerRow}>
                <div style={styles.dottedLine} />
                <span style={styles.dividerLabel}>Or sign in with</span>
                <div style={styles.dottedLine} />
              </div>

              {/* Social Authentication Cards */}
              <div style={styles.socialRow}>
                {/* 1. Google Button */}
                <button
                  type="button"
                  style={{
                    ...styles.socialBtn,
                    ...(authMethod === 'google' ? styles.socialBtnActive : {}),
                  }}
                  onClick={() => {
                    setAuthMethod('google');
                    setErrorMsg('');
                  }}
                  title="Sign in with Google"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </button>

                {/* 2. Mobile OTP Button */}
                <button
                  type="button"
                  style={{
                    ...styles.socialBtn,
                    ...(authMethod === 'phone' ? styles.socialBtnActive : {}),
                  }}
                  onClick={() => {
                    setAuthMethod('phone');
                    setErrorMsg('');
                  }}
                  title="Sign in with Mobile Phone"
                >
                  <span style={{ fontSize: '18px' }}>📱</span>
                </button>

                {/* 3. Fast Staff Switch */}
                <button
                  type="button"
                  style={styles.socialBtn}
                  onClick={() => {
                    setPersona('staff');
                    setErrorMsg('');
                  }}
                  title="Switch to Staff Cashier PIN"
                >
                  <span style={{ fontSize: '18px' }}>🧑‍💼</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* B. STAFF / CASHIER PHONE + PIN FLOW */}
          {/* ========================================================= */}
          {persona === 'staff' && (
            <div style={styles.formContent}>
              {!verifiedStaff ? (
                <form onSubmit={handleStaffVerify} style={styles.inputStack}>
                  {/* Staff Mobile Input */}
                  <div style={styles.pillInputRow}>
                    <div style={styles.inputPrefix}>
                      <span>🇮🇳</span>
                      <span style={styles.prefixCode}>+91</span>
                    </div>
                    <input
                      style={styles.pillInput}
                      type="tel"
                      placeholder="Staff Mobile Number"
                      maxLength={10}
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Staff 4-digit PIN */}
                  <div style={styles.pillInputRow}>
                    <div style={styles.inputPrefix}>
                      <span>🔒</span>
                    </div>
                    <input
                      style={styles.pillInput}
                      type="password"
                      inputMode="numeric"
                      placeholder="4-digit Security PIN"
                      maxLength={4}
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  <button
                    style={styles.charcoalBtn}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Verifying PIN...' : 'Verify Credentials ➔'}
                  </button>
                </form>
              ) : (
                /* Step 2: Open Shift Register & Select Counter */
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

                  <div style={styles.pillInputRow}>
                    <div style={styles.inputPrefix}>
                      <span>₹</span>
                    </div>
                    <input
                      style={styles.pillInput}
                      type="number"
                      placeholder="Starting cash float in galla"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                    />
                  </div>

                  <button
                    style={styles.charcoalBtn}
                    onClick={handleOpenShiftAndLaunch}
                    disabled={loading}
                  >
                    {loading ? 'Opening Shift...' : '🚀 Start Shift & Launch Billing'}
                  </button>

                  <button
                    type="button"
                    style={styles.linkBtn}
                    onClick={() => {
                      setVerifiedStaff(null);
                      setVerifiedStore(null);
                      setStaffPin('');
                    }}
                  >
                    Switch Staff / Re-enter PIN
                  </button>
                </div>
              )}

              {/* Dotted Divider & Switch to Owner */}
              <div style={styles.dividerRow}>
                <div style={styles.dottedLine} />
                <span style={styles.dividerLabel}>Store Owner Access</span>
                <div style={styles.dottedLine} />
              </div>

              <div style={styles.socialRow}>
                <button
                  type="button"
                  style={{ ...styles.socialBtn, width: '100%' }}
                  onClick={() => setPersona('owner')}
                >
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    👑 Switch to Store Owner Login
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* reCAPTCHA Container */}
          <div id="recaptcha-container" />

          {/* Footer Security Note */}
          <p style={styles.footerText}>
            Protected by Cloud FireStore Security Rules • Kirana Pro Enterprise
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '24px',
    fontFamily: 'var(--font-body)',
  },
  skyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, #A4CCED 0%, #CDE6F8 45%, #E6F3FB 75%, #F4F9FE 100%)',
    zIndex: 0,
  },
  orbitalRingOuter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '940px',
    height: '940px',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    border: '1.5px solid rgba(255, 255, 255, 0.4)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  orbitalRingInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '680px',
    height: '680px',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    border: '1.5px solid rgba(255, 255, 255, 0.55)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  cloudLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
    zIndex: 2,
  },
  brandPill: {
    position: 'absolute',
    top: '32px',
    left: '36px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '7px 16px 7px 10px',
    backgroundColor: 'rgba(24, 24, 27, 0.88)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
    zIndex: 10,
  },
  brandIconBox: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: '#3F3F46',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '-0.01em',
    fontFamily: 'var(--font-display)',
  },
  cardContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '460px',
    display: 'flex',
    justifyContent: 'center',
  },
  frostedCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(36px) saturate(190%)',
    WebkitBackdropFilter: 'blur(36px) saturate(190%)',
    border: '1px solid rgba(255, 255, 255, 0.92)',
    borderRadius: '32px',
    padding: '38px 36px 32px',
    boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.8), 0 16px 36px rgba(99, 102, 241, 0.1)',
    textAlign: 'center',
  },
  chipWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  iconChip: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(226, 232, 240, 0.85)',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.025em',
    margin: '0 0 6px 0',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: 1.45,
    margin: '0 0 20px 0',
  },
  personaBar: {
    display: 'flex',
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
    marginBottom: '20px',
    border: '1px solid rgba(226, 232, 240, 0.6)',
  },
  personaPill: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '8px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  personaPillActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  pillInputRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
    border: '1px solid rgba(203, 213, 225, 0.6)',
    borderRadius: '14px',
    padding: '4px 14px',
    height: '48px',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
  },
  inputPrefix: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingRight: '10px',
    borderRight: '1px solid rgba(203, 213, 225, 0.6)',
    marginRight: '10px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
  },
  prefixCode: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569',
  },
  pillInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '15px',
    fontWeight: 600,
    color: '#0F172A',
  },
  charcoalBtn: {
    width: '100%',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    padding: '14px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(24, 24, 27, 0.25)',
    transition: 'all 0.15s ease',
  },
  otpInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '2px solid #10B981',
    padding: '6px 12px',
    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.12)',
  },
  otpPillInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '12px',
    textAlign: 'center',
    color: '#0F172A',
  },
  resendRow: {
    textAlign: 'center',
  },
  linkBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#4F46E5',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '4px',
  },
  googleFeatureBox: {
    backgroundColor: 'rgba(241, 245, 249, 0.75)',
    borderRadius: '14px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'left',
    border: '1px solid rgba(226, 232, 240, 0.6)',
  },
  featureLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '6px 0',
  },
  dottedLine: {
    flex: 1,
    borderBottom: '1.5px dotted #CBD5E1',
  },
  dividerLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94A3B8',
    letterSpacing: '0.02em',
  },
  socialRow: {
    display: 'flex',
    gap: '12px',
  },
  socialBtn: {
    flex: 1,
    height: '46px',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.15s ease',
  },
  socialBtnActive: {
    border: '1.5px solid #4F46E5',
    boxShadow: '0 2px 10px rgba(79, 70, 229, 0.15)',
  },
  shiftCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    textAlign: 'left',
  },
  shiftHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  shiftAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: '#ECFDF5',
    color: '#059669',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 800,
    border: '1px solid #A7F3D0',
  },
  shiftStaffName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 800,
    color: '#0F172A',
  },
  shiftRoleBadge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#059669',
    backgroundColor: '#D1FAE5',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  counterRow: {
    display: 'flex',
    gap: '8px',
  },
  counterBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '8px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748B',
    cursor: 'pointer',
    textAlign: 'center',
  },
  counterBtnActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
    color: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '12px',
    border: '1px solid #FECACA',
    textAlign: 'left',
  },
  infoBox: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '12px',
    border: '1px solid #A7F3D0',
    textAlign: 'left',
  },
  footerText: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '18px',
    margin: 0,
  },
};
