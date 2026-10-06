import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDashboardAuth, getDb } from './firebase';
import { UserProfile } from '@kirana-pro/shared';

// Create or update Firestore user profile
export const syncUserProfileToFirestore = async (
  fbUser: FirebaseUser,
  provider: 'google' | 'phone'
): Promise<UserProfile> => {
  const db = getDb();
  const userRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const now = new Date().toISOString();
  const newProfile: UserProfile = {
    uid: fbUser.uid,
    displayName: fbUser.displayName || (provider === 'phone' ? 'Dukaan Owner' : 'Kirana User'),
    email: fbUser.email || null,
    phoneNumber: fbUser.phoneNumber || null,
    photoURL: fbUser.photoURL || null,
    authProvider: provider,
    storeId: 'demo_store_1',
    role: 'owner',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(userRef, newProfile, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc profile warning:', err);
  }

  return newProfile;
};

// Real Google Sign-in with popup
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; profile: UserProfile }> => {
  const auth = getDashboardAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const profile = await syncUserProfileToFirestore(result.user, 'google');
  return { user: result.user, profile };
};

// Initialize RecaptchaVerifier for Phone OTP
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  const auth = getDashboardAuth();
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired');
    },
  });
};

// Real Phone OTP Send
export const sendPhoneOtp = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  const auth = getDashboardAuth();
  // Ensure Indian +91 format if not present
  const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  return signInWithPhoneNumber(auth, formatted, verifier);
};

// Real Phone OTP Verification
export const verifyPhoneOtp = async (
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> => {
  const result = await confirmationResult.confirm(otpCode);
  const profile = await syncUserProfileToFirestore(result.user, 'phone');
  return { user: result.user, profile };
};

export const signOutUser = async (): Promise<void> => {
  const auth = getDashboardAuth();
  await fbSignOut(auth);
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  const auth = getDashboardAuth();
  return onAuthStateChanged(auth, callback);
};

export const MOCK_DASHBOARD_USER: UserProfile = {
  uid: 'owner_demo_1',
  displayName: 'Chacha Ji (Sharma Kirana)',
  email: 'chacha@kiranapro.in',
  phoneNumber: '+919876543210',
  photoURL: null,
  authProvider: 'google',
  storeId: 'demo_store_1',
  role: 'owner',
  createdAt: '2026-10-05T00:00:00.000Z',
  updatedAt: '2026-10-05T00:00:00.000Z',
};
