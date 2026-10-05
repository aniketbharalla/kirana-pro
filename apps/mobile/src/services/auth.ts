import {
  signInWithPhoneNumber,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  ConfirmationResult,
  ApplicationVerifier,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb, UserProfile } from '@kirana-pro/shared';
import { useAuthStore } from '../store/authStore';

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

export const sendPhoneOTP = async (
  phoneNumber: string,
  appVerifier: ApplicationVerifier
): Promise<ConfirmationResult> => {
  const auth = getFirebaseAuth();
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
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
