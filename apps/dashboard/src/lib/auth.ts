import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getDashboardAuth } from './firebase';
import { UserProfile } from '@kirana-pro/shared';

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  const auth = getDashboardAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
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
