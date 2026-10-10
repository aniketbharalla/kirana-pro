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
import { Toast } from '../../components/common/Toast';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  UserCheck,
  Phone,
  Lock,
  Smartphone,
  KeyRound,
  LogIn,
  Store as StoreIcon,
  CheckCircle2,
  AlertCircle,
  Zap,
  Scale,
  Landmark,
  ArrowRight,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    profile,
    store,
    activeStaff,
    activeShift,
    signOut,
    staffSignOut,
    staffSignIn,
    startStaffShift,
  } = useAuth();

  // Persona: Store Owner vs Staff / Cashier
  const [persona, setPersona] = useState<'owner' | 'staff'>('owner');

  // Owner Auth state
  const [authMethod, setAuthMethod] = useState<'google' | 'phone'>('google');
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
  const handleStaffVerify = async (e?: React.FormEvent, customPhone?: string, customPin?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    const phoneToUse = customPhone || staffPhone;
    const pinToUse = customPin || staffPin;

    try {
      const res = await staffSignIn(phoneToUse, pinToUse);
      setVerifiedStaff(res.staff);
      setVerifiedStore(res.store);
      setInfoMsg(`Verified: ${res.staff.name} (${res.staff.role}) at ${res.store.name}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Staff verification failed. Check phone and PIN.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill and auto-verify cashier
  const handleQuickFillStaff = (phone: string, pin: string) => {
    setStaffPhone(phone);
    setStaffPin(pin);
    handleStaffVerify(undefined, phone, pin);
  };

  // Quick 1-click Demo Owner Sign-in
  const handleQuickDemoOwner = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await staffSignIn('9876543210', '1234');
      setVerifiedStaff(res.staff);
      setVerifiedStore(res.store);
      await startStaffShift(1, 1000);
      router.replace('/pos');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo owner sign-in failed.');
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
      router.replace('/');
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized in Firebase Console. Please access via http://localhost:3000 and refresh, or use 1-Click Demo Owner Sign-In.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup closed. Please try again or use 1-Click Demo Login.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups for localhost:3000 or use 1-Click Demo Owner Sign-In.');
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
          'Firebase returned auth/internal-error. Ensure "Phone" provider is active in Firebase Console, or use Google / 1-Click Demo Sign-In!'
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
      router.replace('/');
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

  // Handle manual sign out from existing session
  const handleCurrentSessionSignOut = async () => {
    setLoading(true);
    if (activeStaff) {
      staffSignOut();
    } else {
      await signOut();
    }
    setVerifiedStaff(null);
    setVerifiedStore(null);
    setLoading(false);
    setInfoMsg('Signed out of previous session. You can now log in freshly.');
  };

  const hasActiveSession = Boolean(user || activeStaff);
  const activeSessionName = activeStaff?.name || profile?.displayName || user?.email || 'Store Owner';
  const activeSessionRole = activeStaff ? activeStaff.role.toUpperCase() : 'STORE OWNER';

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

      {/* 4. Top-Left Brand Emblem */}
      <div style={styles.brandPill}>
        <div style={styles.brandIconBox}>
          <StoreIcon size={16} color="#FFFFFF" strokeWidth={2.2} />
        </div>
        <span style={styles.brandText}>Kirana Pro</span>
      </div>

      {/* 5. Centered Frosted Glass Authentication Card */}
      <div style={styles.cardContainer}>
        <div style={styles.frostedCard}>
          {/* Card Top Icon Chip */}
          <div style={styles.chipWrapper}>
            <div style={styles.iconChip}>
              <LogIn size={22} color="#7367F0" strokeWidth={2.2} />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 style={styles.cardTitle}>
            {persona === 'owner' ? 'Store Owner Access' : 'Staff & Cashier Sign In'}
          </h1>
          <p style={styles.cardSubtitle}>
            Fastest billing, live stock sync, and desktop store OS. 100% Free.
          </p>

          {/* Existing Active Session Banner (if already logged in) */}
          {hasActiveSession && (
            <div style={styles.activeSessionBanner}>
              <div style={styles.activeSessionMeta}>
                <div style={styles.activeBadge}>
                  <span style={styles.activeDot} />
                  <span>SESSION ACTIVE</span>
                </div>
                <div style={styles.activeSessionText}>
                  Signed in as <strong>{activeSessionName}</strong> ({activeSessionRole})
                </div>
              </div>
              <div style={styles.activeSessionActions}>
                <button
                  type="button"
                  style={styles.activeEnterBtn}
                  onClick={() => router.replace(activeStaff && !user ? '/bills' : '/pos')}
                >
                  <span>Enter Store OS</span>
                  <ArrowRight size={14} color="#FFFFFF" />
                </button>
                <button
                  type="button"
                  style={styles.activeSwitchBtn}
                  onClick={handleCurrentSessionSignOut}
                  disabled={loading}
                >
                  <LogOut size={13} color="#EA5455" />
                  <span>Switch Account</span>
                </button>
              </div>
            </div>
          )}

          {/* Persona Segmented Bar */}
          <div style={styles.personaBar}>
            <button
              id="tab-store-owner"
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
              <ShieldCheck size={15} color={persona === 'owner' ? '#7367F0' : '#6F6B7D'} />
              <span>Store Owner (मालिक)</span>
            </button>
            <button
              id="tab-staff-cashier"
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
              <UserCheck size={15} color={persona === 'staff' ? '#7367F0' : '#6F6B7D'} />
              <span>Staff & Cashier (कैशियर)</span>
            </button>
          </div>

          {/* Status / Alert Toasters */}
          {errorMsg && (
            <div id="login-error-toast-wrapper" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Toast
                type="error"
                title="Action Required"
                message={errorMsg}
                onClose={() => setErrorMsg('')}
              />
            </div>
          )}
          {infoMsg && (
            <div id="login-success-toast-wrapper" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Toast
                type="success"
                title="Success"
                message={infoMsg}
                onClose={() => setInfoMsg('')}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* A. STORE OWNER AUTH FLOW */}
          {/* ========================================================= */}
          {persona === 'owner' && (
            <div style={styles.formContent}>
              {/* 1. Direct Google Sign-In Button (Prominent & Primary) */}
              <button
                id="btn-google-login"
                type="button"
                style={styles.googlePrimaryBtn}
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
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
                <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
              </button>

              {/* 2. One-Click Demo Owner Sign-In */}
              <button
                id="btn-demo-owner"
                type="button"
                style={styles.demoOwnerBtn}
                onClick={handleQuickDemoOwner}
                disabled={loading}
              >
                <Sparkles size={16} color="#7367F0" />
                <span>1-Click Demo Owner Sign In (Dukaan Malik)</span>
              </button>

              {/* Dotted Divider */}
              <div style={styles.dividerRow}>
                <div style={styles.dottedLine} />
                <span style={styles.dividerLabel}>Or sign in with Phone SMS OTP</span>
                <div style={styles.dottedLine} />
              </div>

              {/* 3. Phone SMS OTP Input Flow */}
              {!isOtpSent ? (
                <div style={styles.inputStack}>
                  <div style={styles.pillInputRow}>
                    <div style={styles.inputPrefix}>
                      <Phone size={15} color="#7367F0" />
                      <span style={styles.prefixCode}>+91</span>
                    </div>
                    <input
                      style={styles.pillInput}
                      type="tel"
                      placeholder="Enter 10-digit mobile"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    style={styles.purpleCtaBtn}
                    onClick={handleSendPhoneOtp}
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP SMS...' : 'Send OTP via SMS'}
                  </button>
                </div>
              ) : (
                <div style={styles.inputStack}>
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
                      Change number or resend
                    </button>
                  </div>

                  <button
                    type="button"
                    style={styles.purpleCtaBtn}
                    onClick={handleVerifyPhoneOtp}
                    disabled={loading}
                  >
                    {loading ? 'Verifying OTP...' : 'Verify & Enter Dukaan'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* B. STAFF / CASHIER PHONE + PIN FLOW */}
          {/* ========================================================= */}
          {persona === 'staff' && (
            <div style={styles.formContent}>
              {!verifiedStaff ? (
                <>
                  {/* Quick Fill / Demo Cashier Pills */}
                  <div style={styles.quickFillSection}>
                    <div style={styles.quickFillLabel}>
                      <Zap size={12} color="#7367F0" />
                      <span>One-Tap Demo Cashiers:</span>
                    </div>
                    <div style={styles.quickFillChips}>
                      <button
                        id="chip-cashier-1"
                        type="button"
                        style={styles.quickFillChip}
                        onClick={() => handleQuickFillStaff('9811122233', '0000')}
                      >
                        <strong>Cashier 1:</strong> Rohan (PIN: 0000)
                      </button>
                      <button
                        id="chip-cashier-2"
                        type="button"
                        style={styles.quickFillChip}
                        onClick={() => handleQuickFillStaff('9822233344', '1111')}
                      >
                        <strong>Cashier 2:</strong> Amit (PIN: 1111)
                      </button>
                      <button
                        id="chip-owner-pin"
                        type="button"
                        style={styles.quickFillChip}
                        onClick={() => handleQuickFillStaff('9876543210', '1234')}
                      >
                        <strong>Owner PIN:</strong> Malik (PIN: 1234)
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleStaffVerify} style={styles.inputStack}>
                    {/* Staff Mobile Input */}
                    <div style={styles.pillInputRow}>
                      <div style={styles.inputPrefix}>
                        <Phone size={15} color="#7367F0" />
                        <span style={styles.prefixCode}>+91</span>
                      </div>
                      <input
                        id="input-staff-phone"
                        style={styles.pillInput}
                        type="tel"
                        placeholder="Staff Mobile Number"
                        maxLength={10}
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        required
                      />
                    </div>

                    {/* Staff 4-digit PIN */}
                    <div style={styles.pillInputRow}>
                      <div style={styles.inputPrefix}>
                        <Lock size={15} color="#7367F0" />
                      </div>
                      <input
                        id="input-staff-pin"
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
                      id="btn-staff-verify"
                      style={styles.purpleCtaBtn}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Verifying PIN...' : 'Verify Credentials'}
                    </button>
                  </form>
                </>
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
                    type="button"
                    style={styles.purpleCtaBtn}
                    onClick={handleOpenShiftAndLaunch}
                    disabled={loading}
                  >
                    {loading ? 'Opening Shift...' : 'Start Shift & Launch Billing'}
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
            </div>
          )}

          {/* Bottom Switcher Row */}
          <div style={styles.dividerRow}>
            <div style={styles.dottedLine} />
            <span style={styles.dividerLabel}>Quick Switch</span>
            <div style={styles.dottedLine} />
          </div>

          <div style={styles.socialRow}>
            {/* 1. Direct Google Sign-In */}
            <button
              type="button"
              style={styles.socialBtn}
              onClick={handleGoogleSignIn}
              title="Sign in with Google"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
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

            {/* 2. Switch to Owner */}
            <button
              type="button"
              style={{
                ...styles.socialBtn,
                ...(persona === 'owner' ? styles.socialBtnActive : {}),
              }}
              onClick={() => {
                setPersona('owner');
                setErrorMsg('');
              }}
              title="Switch to Store Owner View"
            >
              <Smartphone size={18} color="#7367F0" />
            </button>

            {/* 3. Switch to Staff */}
            <button
              type="button"
              style={{
                ...styles.socialBtn,
                ...(persona === 'staff' ? styles.socialBtnActive : {}),
              }}
              onClick={() => {
                setPersona('staff');
                setErrorMsg('');
              }}
              title="Switch to Staff & Cashier PIN"
            >
              <KeyRound size={18} color="#7367F0" />
            </button>
          </div>

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
    top: '28px',
    left: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px 6px 8px',
    backgroundColor: '#2F2B3D',
    borderRadius: '10px',
    boxShadow: '0 4px 14px rgba(47, 43, 61, 0.15)',
    zIndex: 10,
  },
  brandIconBox: {
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    backgroundColor: '#7367F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '13px',
    letterSpacing: '-0.01em',
    fontFamily: 'var(--font-display)',
  },
  cardContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '470px',
    display: 'flex',
    justifyContent: 'center',
  },
  frostedCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(36px) saturate(190%)',
    WebkitBackdropFilter: 'blur(36px) saturate(190%)',
    border: '1px solid rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '32px 28px 24px',
    boxShadow: '0 20px 50px rgba(47, 43, 61, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  chipWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  iconChip: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.25)',
    boxShadow: '0 4px 12px rgba(115, 103, 240, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    fontWeight: 700,
    color: '#2F2B3D',
    letterSpacing: '-0.02em',
    margin: '0 0 4px 0',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#6F6B7D',
    lineHeight: 1.45,
    margin: '0 0 16px 0',
  },
  activeSessionBanner: {
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.3)',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '16px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  activeSessionMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    flexWrap: 'wrap',
  },
  activeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#FFFFFF',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#7367F0',
    letterSpacing: '0.04em',
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#28C76F',
  },
  activeSessionText: {
    fontSize: '12px',
    color: '#2F2B3D',
  },
  activeSessionActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  activeEnterBtn: {
    flex: 1,
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(115, 103, 240, 0.3)',
  },
  activeSwitchBtn: {
    backgroundColor: '#FFFFFF',
    color: '#EA5455',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  personaBar: {
    display: 'flex',
    backgroundColor: '#F8F7FA',
    borderRadius: '10px',
    padding: '4px',
    gap: '4px',
    marginBottom: '16px',
    border: '1px solid #DBDADE',
  },
  personaPill: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '8px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6F6B7D',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  personaPillActive: {
    backgroundColor: '#FFFFFF',
    color: '#7367F0',
    boxShadow: '0 2px 4px rgba(47, 43, 61, 0.08)',
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  googlePrimaryBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #DBDADE',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2B3D',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.06)',
    transition: 'all 0.15s ease',
  },
  demoOwnerBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.25)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#7367F0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  quickFillSection: {
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '10px',
    padding: '10px 12px',
    textAlign: 'left',
  },
  quickFillLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#7367F0',
    marginBottom: '8px',
    letterSpacing: '0.02em',
  },
  quickFillChips: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  quickFillChip: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DBDADE',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '11px',
    color: '#4B465C',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  inputStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  pillInputRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '10px',
    padding: '4px 12px',
    height: '46px',
    transition: 'border-color 0.15s ease',
  },
  inputPrefix: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingRight: '10px',
    borderRight: '1px solid #DBDADE',
    marginRight: '10px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#4B465C',
  },
  prefixCode: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6F6B7D',
  },
  pillInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2F2B3D',
  },
  purpleCtaBtn: {
    width: '100%',
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
    transition: 'all 0.15s ease',
  },
  otpInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '2px solid #7367F0',
    padding: '6px 12px',
    boxShadow: '0 2px 8px rgba(115, 103, 240, 0.15)',
  },
  otpPillInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    textAlign: 'center',
    fontSize: '20px',
    letterSpacing: '10px',
    fontWeight: 700,
    color: '#2F2B3D',
    backgroundColor: 'transparent',
  },
  resendRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#7367F0',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px',
    textDecoration: 'underline',
  },
  shiftCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left',
  },
  shiftHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#F8F7FA',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #DBDADE',
  },
  shiftAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '16px',
  },
  shiftStaffName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#2F2B3D',
    margin: 0,
  },
  shiftRoleBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    color: '#28C76F',
    backgroundColor: '#E8FADF',
    padding: '2px 8px',
    borderRadius: '999px',
    marginTop: '4px',
  },
  counterRow: {
    display: 'flex',
    gap: '8px',
  },
  counterBtn: {
    flex: 1,
    backgroundColor: '#F8F7FA',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#DBDADE',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6F6B7D',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  counterBtnActive: {
    backgroundColor: '#EDEBFD',
    borderColor: '#7367F0',
    color: '#7367F0',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '14px 0 10px 0',
  },
  dottedLine: {
    flex: 1,
    borderBottomWidth: '1px',
    borderBottomStyle: 'dashed',
    borderBottomColor: '#DBDADE',
  },
  dividerLabel: {
    fontSize: '11px',
    color: '#A8AAAE',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  socialRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  socialBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#F8F7FA',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#DBDADE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  socialBtnActive: {
    backgroundColor: '#EDEBFD',
    borderColor: '#7367F0',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FCE4E4',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '12px',
    color: '#EA5455',
    fontWeight: 500,
    textAlign: 'left',
    marginBottom: '10px',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#E8FADF',
    border: '1px solid #B7F2CB',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '12px',
    color: '#28C76F',
    fontWeight: 500,
    textAlign: 'left',
    marginBottom: '10px',
  },
  footerText: {
    fontSize: '11px',
    color: '#A8AAAE',
    marginTop: '16px',
    marginBottom: 0,
    lineHeight: 1.4,
  },
};
