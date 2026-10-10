'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDashboardAuth, getDb } from '../lib/firebase';
import { signOutUser } from '../lib/auth';
import { autoDiscoverAndMigrateProducts } from '../lib/storeService';
import { UserProfile, Store, StaffMember, CounterSession } from '@kirana-pro/shared';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  store: Store | null;
  storeId: string;
  activeStaff: StaffMember | null;
  activeShift: CounterSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
  staffSignIn: (staffPhone: string, pin: string, storeIdentifier?: string) => Promise<{ staff: StaffMember; store: Store }>;
  startStaffShift: (counterNumber: number, openingCash: number) => Promise<void>;
  staffSignOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  store: null,
  storeId: '',
  activeStaff: null,
  activeShift: null,
  loading: true,
  signOut: async () => {},
  staffSignIn: async () => { throw new Error('Not implemented'); },
  startStaffShift: async () => {},
  staffSignOut: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [activeShift, setActiveShift] = useState<CounterSession | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const loadingUidRef = React.useRef<string | null>(null);

  // Restore staff session on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedStaff = localStorage.getItem('kirana_active_staff');
      const savedShift = localStorage.getItem('kirana_active_shift');
      const savedStoreId = localStorage.getItem('kirana_store_id');
      if (savedStaff && savedStoreId) {
        const parsedStaff = JSON.parse(savedStaff) as StaffMember;
        setActiveStaff(parsedStaff);
        if (savedShift) {
          setActiveShift(JSON.parse(savedShift) as CounterSession);
        }
        const db = getDb();
        getDoc(doc(db, 'stores', savedStoreId)).then((snap) => {
          if (snap.exists()) {
            setStore(snap.data() as Store);
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed restoring staff session:', e);
    }
  }, []);

  const loadProfileAndStore = async (fbUser: FirebaseUser) => {
    if (loadingUidRef.current === fbUser.uid) return;
    loadingUidRef.current = fbUser.uid;

    try {
      const db = getDb();
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      let userProfile: UserProfile;
      const now = new Date().toISOString();
      const defaultStoreId = `store_${fbUser.uid}`;
      const shortStoreId = `store_${fbUser.uid.substring(0, 10)}`;

      // 1. Resolve store document & ID: check existing store possibilities
      let resolvedStoreId = defaultStoreId;
      let resolvedStoreSnap = await getDoc(doc(db, 'stores', defaultStoreId));

      // If full UID store doesn't exist, check short UID store
      if (!resolvedStoreSnap.exists()) {
        const shortSnap = await getDoc(doc(db, 'stores', shortStoreId));
        if (shortSnap.exists()) {
          resolvedStoreId = shortStoreId;
          resolvedStoreSnap = shortSnap;
        }
      }

      // If existing user doc had a specific storeId, check that too
      if (userSnap.exists()) {
        userProfile = userSnap.data() as UserProfile;
        if (userProfile.storeId) {
          const profileStoreSnap = await getDoc(doc(db, 'stores', userProfile.storeId));
          if (profileStoreSnap.exists()) {
            resolvedStoreId = userProfile.storeId;
            resolvedStoreSnap = profileStoreSnap;
          }
        } else {
          userProfile.storeId = resolvedStoreId;
          await setDoc(userRef, { storeId: resolvedStoreId }, { merge: true });
        }
      } else {
        userProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Store Owner',
          email: fbUser.email || null,
          phoneNumber: fbUser.phoneNumber || null,
          photoURL: fbUser.photoURL || null,
          authProvider: fbUser.phoneNumber ? 'phone' : 'google',
          storeId: resolvedStoreId,
          role: 'owner',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userRef, userProfile, { merge: true });
      }

      setProfile(userProfile);

      // 2. Load or create store document
      let resolvedStore: Store;
      if (resolvedStoreSnap.exists()) {
        resolvedStore = resolvedStoreSnap.data() as Store;
      } else {
        const newStore: Store = {
          id: resolvedStoreId,
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
        await setDoc(doc(db, 'stores', resolvedStoreId), newStore, { merge: true });
        resolvedStore = newStore;
      }

      setStore(resolvedStore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('kirana_store_id', resolvedStoreId);
        localStorage.setItem('kirana_store_cache', JSON.stringify(resolvedStore));
      }

      // 3. Immediately auto-discover and migrate any products from demo/alternate store or local cache
      autoDiscoverAndMigrateProducts(resolvedStoreId).catch((e) => {
        console.warn('Product auto-migration note:', e);
      });

      // 4. Pre-cache staff list for offline / instant cashier login
      try {
        const staffSnap = await getDocs(collection(db, 'stores', resolvedStoreId, 'staff'));
        const staffList: StaffMember[] = [];
        staffSnap.forEach((d) => staffList.push({ ...d.data(), id: d.id, storeId: resolvedStoreId } as StaffMember));
        if (staffList.length > 0 && typeof window !== 'undefined') {
          localStorage.setItem('kirana_store_staff_cache', JSON.stringify(staffList));
        }
      } catch (e) {
        console.warn('Initial staff fetch note:', e);
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
        // Only clear store if no staff is logged in
        if (!localStorage.getItem('kirana_active_staff')) {
          setStore(null);
        }
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

    const isAuthenticated = !!user || !!activeStaff;
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, activeStaff, loading, pathname, router]);

  const handleSignOut = async () => {
    setLoading(true);
    await signOutUser();
    setUser(null);
    setProfile(null);
    setStore(null);
    setActiveStaff(null);
    setActiveShift(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kirana_active_staff');
      localStorage.removeItem('kirana_active_shift');
      localStorage.removeItem('kirana_store_id');
    }
    setLoading(false);
    router.replace('/login');
  };

  // 3. Staff Sign-in with Phone + PIN (Store Identifier not required)
  const staffSignIn = async (staffPhone: string, pin: string, storeIdentifier?: string) => {
    const cleanPhone = staffPhone.trim().replace(/\D/g, '').slice(-10);
    const cleanPin = pin.trim();
    const cleanStore = (storeIdentifier || (typeof window !== 'undefined' ? localStorage.getItem('kirana_store_id') || '' : '')).trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    if (!cleanPin || cleanPin.length !== 4) {
      throw new Error('Please enter your 4-digit staff PIN.');
    }

    const db = getDb();
    let targetStoreId = cleanStore;
    let storeData: Store | null = null;
    let matchedStaff: StaffMember | null = null;

    // Helper to check if a staff member record matches the phone and PIN
    const isStaffMatch = (s: any) => {
      const sPhone = String(s.phone || '').replace(/\D/g, '').slice(-10);
      const sPin = String(s.pin || '').trim();
      return sPhone === cleanPhone && sPin === cleanPin && s.isActive !== false;
    };

    // 1. First priority: Check local staff cache (instant, zero network delay, resilient)
    if (typeof window !== 'undefined') {
      try {
        const cachedStaffStr = localStorage.getItem('kirana_store_staff_cache');
        if (cachedStaffStr) {
          const cachedStaffList: StaffMember[] = JSON.parse(cachedStaffStr);
          const found = cachedStaffList.find(isStaffMatch);
          if (found) {
            matchedStaff = found;
            targetStoreId = found.storeId || cleanStore || 'demo_store_1';
          }
        }
      } catch (e) {
        console.warn('Local staff cache lookup note:', e);
      }
    }

    // 2. Second priority: If remembered store exists, inspect its staff documents
    if (!matchedStaff && cleanStore) {
      try {
        const staffSnap = await getDocs(collection(db, 'stores', cleanStore, 'staff'));
        for (const docSnap of staffSnap.docs) {
          const data = docSnap.data();
          if (isStaffMatch(data)) {
            matchedStaff = { ...data, id: docSnap.id, storeId: cleanStore } as StaffMember;
            targetStoreId = cleanStore;
            break;
          }
        }
      } catch (e) {
        console.warn('Remembered store staff scan error:', e);
      }
    }

    // 3. Third priority: Search across all staff subcollections in Firestore
    if (!matchedStaff) {
      try {
        const cgSnap = await getDocs(collection(db, 'stores'));
        for (const storeDoc of cgSnap.docs) {
          const sId = storeDoc.id;
          try {
            const staffSnap = await getDocs(collection(db, 'stores', sId, 'staff'));
            for (const docSnap of staffSnap.docs) {
              const data = docSnap.data();
              if (isStaffMatch(data)) {
                matchedStaff = { ...data, id: docSnap.id, storeId: sId } as StaffMember;
                targetStoreId = sId;
                storeData = storeDoc.data() as Store;
                break;
              }
            }
          } catch {}
          if (matchedStaff) break;
        }
      } catch (e) {
        console.warn('Stores staff scan note:', e);
      }
    }

    // 4. Fourth priority: Starter staff or demo accounts fallback
    if (!matchedStaff) {
      const starterStaff = [
        { name: 'Rohan Sharma (Cashier 1)', role: 'cashier' as const, phone: '9811122233', pin: '0000', counter: 1 },
        { name: 'Amit Patel (Cashier 2)', role: 'cashier' as const, phone: '9822233344', pin: '1111', counter: 2 },
        { name: 'Dukaan Malik (Owner)', role: 'owner' as const, phone: '9876543210', pin: '1234', counter: 1 },
      ];
      const starter = starterStaff.find(
        (s) => s.phone.slice(-10) === cleanPhone && s.pin === cleanPin
      );
      if (starter) {
        matchedStaff = {
          id: `demo_${starter.phone}`,
          storeId: cleanStore || 'demo_store_1',
          name: starter.name,
          phone: starter.phone,
          role: starter.role,
          pin: starter.pin,
          counterAssigned: starter.counter,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        targetStoreId = cleanStore || 'demo_store_1';
      }
    }

    // 5. Fifth priority: If owner is logging in as cashier with owner default PIN 0000 or 1234
    if (!matchedStaff && profile && profile.phoneNumber) {
      const ownerDigits = profile.phoneNumber.replace(/\D/g, '').slice(-10);
      if (ownerDigits === cleanPhone && (cleanPin === '0000' || cleanPin === '1234')) {
        matchedStaff = {
          id: `staff_owner_${profile.uid}`,
          storeId: cleanStore || profile.storeId || 'demo_store_1',
          name: profile.displayName || 'Store Owner',
          phone: profile.phoneNumber,
          role: 'owner',
          pin: cleanPin,
          counterAssigned: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        targetStoreId = cleanStore || profile.storeId || 'demo_store_1';
      }
    }

    if (!matchedStaff) {
      throw new Error('Incorrect Phone Number or 4-digit PIN. Please check your credentials.');
    }

    // 6. Ensure storeData is resolved
    if (!storeData && targetStoreId) {
      try {
        const sSnap = await getDoc(doc(db, 'stores', targetStoreId));
        if (sSnap.exists()) {
          storeData = sSnap.data() as Store;
        }
      } catch (e) {
        console.warn('Store fetch error:', e);
      }
    }

    if (!storeData) {
      if (typeof window !== 'undefined') {
        const cachedStoreStr = localStorage.getItem('kirana_store_cache');
        if (cachedStoreStr) {
          try {
            storeData = JSON.parse(cachedStoreStr);
          } catch {}
        }
      }
    }

    if (!storeData) {
      storeData = {
        id: targetStoreId || 'demo_store_1',
        name: 'Kirana Pro Store',
        type: 'kirana',
        address: { street: 'Main Market Road', city: 'Mumbai', state: 'MH', pincode: '400001' },
        gstNumber: null,
        logoURL: null,
        ownerId: 'owner_default',
        staffIds: [matchedStaff.id],
        settings: {
          currency: 'INR',
          weightUnit: 'kg',
          defaultTaxRate: 0,
          invoicePrefix: 'INV',
          invoiceCounter: 1,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Set state & persist
    setActiveStaff(matchedStaff);
    setStore(storeData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kirana_active_staff', JSON.stringify(matchedStaff));
      localStorage.setItem('kirana_store_id', targetStoreId || storeData.id);
    }

    return { staff: matchedStaff, store: storeData };
  };

  // 4. Start Counter Shift
  const startStaffShift = async (counterNumber: number, openingCash: number) => {
    const effectiveStoreId = store?.id || (activeStaff ? activeStaff.storeId : '');
    if (!activeStaff || !effectiveStoreId) return;

    const now = new Date().toISOString();
    const session: CounterSession = {
      id: `shift_${Date.now()}`,
      storeId: effectiveStoreId,
      counterNumber,
      staffId: activeStaff.id,
      staffName: activeStaff.name,
      role: activeStaff.role,
      openedAt: now,
      openingCash,
      cashSales: 0,
      upiSales: 0,
      creditSales: 0,
      totalSales: 0,
      invoiceCount: 0,
      isClosed: false,
    };

    try {
      const db = getDb();
      await setDoc(doc(db, 'stores', effectiveStoreId, 'counter_sessions', session.id), session);
    } catch (err) {
      console.warn('Could not save shift record to cloud:', err);
    }

    setActiveShift(session);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kirana_active_shift', JSON.stringify(session));
    }
  };

  // 5. Staff Sign Out
  const staffSignOut = () => {
    setActiveStaff(null);
    setActiveShift(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kirana_active_staff');
      localStorage.removeItem('kirana_active_shift');
    }
    router.replace('/login');
  };

  const storeId = store?.id || profile?.storeId || (user ? `store_${user.uid}` : (activeStaff ? activeStaff.storeId : ''));

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        store,
        storeId,
        activeStaff,
        activeShift,
        loading,
        signOut: handleSignOut,
        staffSignIn,
        startStaffShift,
        staffSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
