import {
  signInWithPhoneNumber,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  ConfirmationResult,
  ApplicationVerifier,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  RecaptchaVerifier,
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  Auth,
} from 'firebase/auth';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  getFirebaseAuth,
  setFirebaseAuth,
  getFirestoreDb,
  initializeFirebase,
  UserProfile,
} from '@kirana-pro/shared';
import { useAuthStore } from '../store/authStore';

// Initialize React Native Auth with AsyncStorage persistence (eliminates console warning)
export const setupMobileAuthPersistence = (): Auth => {
  const app = initializeFirebase();
  try {
    if (Platform.OS !== 'web' && typeof getReactNativePersistence === 'function') {
      const persistence = getReactNativePersistence(ReactNativeAsyncStorage);
      const auth = initializeAuth(app, { persistence });
      setFirebaseAuth(auth);
      return auth;
    }
  } catch {
    // If initializeAuth was already called, fall back to getAuth
  }
  const auth = getAuth(app);
  setFirebaseAuth(auth);
  return auth;
};

// Ensure persistence is set up at startup
try {
  setupMobileAuthPersistence();
} catch {}

export const getUserDocRef = (uid: string) => {
  const db = getFirestoreDb();
  return doc(db, 'users', uid);
};

export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const ref = getUserDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as UserProfile;
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const ref = getUserDocRef(profile.uid);
  await setDoc(ref, profile, { merge: true });
};

export const createProfileFromFirebaseUser = async (
  fbUser: FirebaseUser,
  authProvider: 'google' | 'phone'
): Promise<UserProfile> => {
  const existing = await fetchUserProfile(fbUser.uid);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const newProfile: UserProfile = {
    uid: fbUser.uid,
    displayName: fbUser.displayName || (authProvider === 'phone' ? 'Dukaan Owner' : 'User'),
    email: fbUser.email || null,
    phoneNumber: fbUser.phoneNumber || null,
    photoURL: fbUser.photoURL || null,
    authProvider,
    storeId: null,
    role: 'owner',
    createdAt: now,
    updatedAt: now,
  };

  await saveUserProfile(newProfile);
  return newProfile;
};

export const setupRecaptchaVerifier = (
  containerId: string = 'recaptcha-container'
): ApplicationVerifier => {
  const auth = getFirebaseAuth();
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (!document.getElementById(containerId)) {
      const div = document.createElement('div');
      div.id = containerId;
      document.body.appendChild(div);
    }
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        console.warn('reCAPTCHA expired');
      },
    });
  }
  return {} as ApplicationVerifier;
};

export const sendPhoneOTP = async (
  phoneNumber: string,
  appVerifier: ApplicationVerifier
): Promise<ConfirmationResult> => {
  const auth = getFirebaseAuth();
  const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  return signInWithPhoneNumber(auth, formatted, appVerifier);
};

export const verifyOTP = async (
  confirmationResult: ConfirmationResult,
  code: string
): Promise<UserProfile> => {
  const result = await confirmationResult.confirm(code);
  const profile = await createProfileFromFirebaseUser(result.user, 'phone');
  useAuthStore.getState().setUser(profile);
  return profile;
};

export const signInWithGooglePopup = async (): Promise<UserProfile> => {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  if (typeof signInWithPopup === 'function') {
    const result = await signInWithPopup(auth, provider);
    const profile = await createProfileFromFirebaseUser(result.user, 'google');
    useAuthStore.getState().setUser(profile);
    return profile;
  }

  // On Native Mobile where browser popups are not supported
  throw new Error('Google Sign-In popup is designed for Web/Desktop browser. On mobile devices, please use Phone Number (+91) OTP.');
};

export const signInWithGoogleIdToken = async (idToken: string): Promise<UserProfile> => {
  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const profile = await createProfileFromFirebaseUser(result.user, 'google');
  useAuthStore.getState().setUser(profile);
  return profile;
};

export const signOut = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  await fbSignOut(auth);
  useAuthStore.getState().clearUser();
};

export const initAuthListener = (): (() => void) => {
  const auth = getFirebaseAuth();
  useAuthStore.getState().setLoading(true);

  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      useAuthStore.getState().clearUser();
      useAuthStore.getState().setLoading(false);
      return;
    }

    try {
      let profile = await fetchUserProfile(fbUser.uid);
      if (!profile) {
        profile = await createProfileFromFirebaseUser(
          fbUser,
          fbUser.phoneNumber ? 'phone' : 'google'
        );
      }
      useAuthStore.getState().setUser(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  });
};
