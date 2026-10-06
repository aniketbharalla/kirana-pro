import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export interface FirebaseEnvironmentConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const getFirebaseConfig = (): FirebaseEnvironmentConfig => ({
  apiKey:
    process.env.FIREBASE_API_KEY ||
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyAQWMxfcCyD1k3fUFNV4rHkF15MmZVgxGU',
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN ||
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'kirana-pro-edf3a.firebaseapp.com',
  projectId:
    process.env.FIREBASE_PROJECT_ID ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'kirana-pro-edf3a',
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'kirana-pro-edf3a.firebasestorage.app',
  messagingSenderId:
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '440171839586',
  appId:
    process.env.FIREBASE_APP_ID ||
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:440171839586:web:e94944b9c14f0c2e95113b',
});

export const initializeFirebase = (customConfig?: FirebaseEnvironmentConfig): FirebaseApp => {
  const config = customConfig || getFirebaseConfig();
  if (getApps().length === 0) {
    return initializeApp(config);
  }
  return getApp();
};

export const getFirestoreDb = (app?: FirebaseApp): Firestore => {
  const currentApp = app || initializeFirebase();
  return getFirestore(currentApp);
};

let customAuthInstance: Auth | null = null;

export const setFirebaseAuth = (auth: Auth): void => {
  customAuthInstance = auth;
};

export const getFirebaseAuth = (app?: FirebaseApp): Auth => {
  if (customAuthInstance) {
    return customAuthInstance;
  }
  const currentApp = app || initializeFirebase();
  return getAuth(currentApp);
};
