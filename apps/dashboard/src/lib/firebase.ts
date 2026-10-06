import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFirebaseConfig } from '@kirana-pro/shared';

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const getDashboardFirebaseApp = (): FirebaseApp => {
  if (!appInstance) {
    if (getApps().length === 0) {
      appInstance = initializeApp(getFirebaseConfig());
    } else {
      appInstance = getApp();
    }
  }
  return appInstance;
};

export const getDb = (): Firestore => {
  if (!dbInstance) {
    dbInstance = getFirestore(getDashboardFirebaseApp());
  }
  return dbInstance;
};

export const getDashboardAuth = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getDashboardFirebaseApp());
  }
  return authInstance;
};

