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
  const storeId = `store_${fbUser.uid}`;
  const newProfile: UserProfile = {
    uid: fbUser.uid,
    displayName: fbUser.displayName || (provider === 'phone' ? 'Dukaan Owner' : 'Kirana User'),
    email: fbUser.email || null,
    phoneNumber: fbUser.phoneNumber || null,
    photoURL: fbUser.photoURL || null,
    authProvider: provider,
    storeId,
    role: 'owner',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(userRef, newProfile, { merge: true });
    // Also ensure store record exists
    const storeRef = doc(db, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);
    if (!storeSnap.exists()) {
      await setDoc(storeRef, {
        id: storeId,
        name: fbUser.displayName ? `${fbUser.displayName}'s Kirana` : 'My Kirana Store',
        ownerName: fbUser.displayName || 'Owner',
        phone: fbUser.phoneNumber || '',
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.warn('Firestore setDoc profile warning:', err);
  }

  return newProfile;
};

// Real Google Sign-in with popup
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser }> => {
  const auth = getDashboardAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return { user: result.user };
};

// Get or initialize reusable RecaptchaVerifier for Phone OTP
export const getOrCreateRecaptcha = (containerId: string): RecaptchaVerifier => {
  const auth = getDashboardAuth();
  if (typeof window !== 'undefined' && (window as any).recaptchaVerifier) {
    return (window as any).recaptchaVerifier;
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired');
    },
  });

  if (typeof window !== 'undefined') {
    (window as any).recaptchaVerifier = verifier;
  }
  return verifier;
};

// Reset reCAPTCHA widget safely on error or change
export const resetRecaptcha = (containerId: string = 'recaptcha-container'): void => {
  if (typeof window !== 'undefined') {
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch {}
      delete (window as any).recaptchaVerifier;
    }
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
  }
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
): Promise<{ user: FirebaseUser }> => {
  const result = await confirmationResult.confirm(otpCode);
  return { user: result.user };
};

export const signOutUser = async (): Promise<void> => {
  const auth = getDashboardAuth();
  await fbSignOut(auth);
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  const auth = getDashboardAuth();
  return onAuthStateChanged(auth, callback);
};
