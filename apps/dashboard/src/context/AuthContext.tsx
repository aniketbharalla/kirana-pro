'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDashboardAuth, getDb } from '../lib/firebase';
import { signOutUser } from '../lib/auth';
import { UserProfile, Store } from '@kirana-pro/shared';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  store: Store | null;
  storeId: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  store: null,
  storeId: '',
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const loadingUidRef = React.useRef<string | null>(null);

  const loadProfileAndStore = async (fbUser: FirebaseUser) => {
    if (loadingUidRef.current === fbUser.uid) return;
    loadingUidRef.current = fbUser.uid;

    try {
      const db = getDb();
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      let userProfile: UserProfile;
      const now = new Date().toISOString();
      const defaultStoreId = `store_${fbUser.uid.substring(0, 10)}`;

      if (userSnap.exists()) {
        userProfile = userSnap.data() as UserProfile;
        if (!userProfile.storeId) {
          userProfile.storeId = defaultStoreId;
          await setDoc(userRef, { storeId: defaultStoreId }, { merge: true });
        }
      } else {
        userProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Store Owner',
          email: fbUser.email || null,
          phoneNumber: fbUser.phoneNumber || null,
          photoURL: fbUser.photoURL || null,
          authProvider: fbUser.phoneNumber ? 'phone' : 'google',
          storeId: defaultStoreId,
          role: 'owner',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userRef, userProfile, { merge: true });
      }

      setProfile(userProfile);

      // Load or create store document
      const storeId = userProfile.storeId || defaultStoreId;
      const storeRef = doc(db, 'stores', storeId);
      const storeSnap = await getDoc(storeRef);

      if (storeSnap.exists()) {
        setStore(storeSnap.data() as Store);
      } else {
        const newStore: Store = {
          id: storeId,
          name: userProfile.displayName ? `${userProfile.displayName}'s Kirana` : 'My Kirana Store',
          type: 'kirana',
          address: {
            street: 'Main Market',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
          },
          gstNumber: null,
          logoURL: null,
          ownerId: fbUser.uid,
          staffIds: [fbUser.uid],
          settings: {
            currency: 'INR',
            weightUnit: 'kg',
            defaultTaxRate: 0,
            invoicePrefix: 'INV',
            invoiceCounter: 1,
          },
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(storeRef, newStore, { merge: true });
        setStore(newStore);
      }
    } catch (err) {
      console.error('Error loading profile or store:', err);
    } finally {
      loadingUidRef.current = null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfileAndStore(user);
    }
  };

  // 1. Subscribe to Firebase Auth ONCE on mount
  useEffect(() => {
    const auth = getDashboardAuth();
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      setUser(fbUser);
      if (fbUser) {
        await loadProfileAndStore(fbUser);
      } else {
        setProfile(null);
        setStore(null);
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 2. Route protection decoupled from auth listener lifecycle
  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/login') {
      router.replace('/login');
    } else if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  const handleSignOut = async () => {
    setLoading(true);
    await signOutUser();
    setUser(null);
    setProfile(null);
    setStore(null);
    setLoading(false);
    router.replace('/login');
  };

  const storeId = store?.id || profile?.storeId || (user ? `store_${user.uid}` : '');

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        store,
        storeId,
        loading,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
