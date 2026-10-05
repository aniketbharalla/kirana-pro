import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFirebaseConfig } from '@kirana-pro/shared';

export const getDashboardFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    return initializeApp(getFirebaseConfig());
  }
  return getApp();
};

export const getDb = (): Firestore => {
  return getFirestore(getDashboardFirebaseApp());
};

export const getDashboardAuth = (): Auth => {
  return getAuth(getDashboardFirebaseApp());
};
