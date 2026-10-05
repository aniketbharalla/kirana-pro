import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  getFirestoreDb,
  Store,
  storeSchema,
  StoreSettings,
} from '@kirana-pro/shared';
import { useStoreStore } from '../store/storeStore';
import { useAuthStore } from '../store/authStore';

export const defaultStoreSettings: StoreSettings = {
  currency: 'INR',
  weightUnit: 'kg',
  defaultTaxRate: 0,
  invoicePrefix: 'INV',
  invoiceCounter: 1,
};

export const createStore = async (
  storeData: {
    name: string;
    type: Store['type'];
    customType?: string;
    address: Store['address'];
    gstNumber?: string | null;
  },
  ownerId: string
): Promise<Store> => {
  // Validate schema
  storeSchema.parse({
    name: storeData.name,
    type: storeData.type,
    customType: storeData.customType,
    address: storeData.address,
    gstNumber: storeData.gstNumber,
    ownerId,
  });

  const db = getFirestoreDb();
  const storeId = `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newStore: Store = {
    id: storeId,
    name: storeData.name.trim(),
    type: storeData.type,
    customType: storeData.customType?.trim(),
    address: storeData.address,
    gstNumber: storeData.gstNumber ? storeData.gstNumber.trim().toUpperCase() : null,
    logoURL: null,
    ownerId,
    staffIds: [],
    settings: defaultStoreSettings,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Write store doc
  await setDoc(doc(db, 'stores', storeId), newStore);

  // 2. Link storeId on user doc
  try {
    await updateDoc(doc(db, 'users', ownerId), {
      storeId,
      updatedAt: now,
    });
  } catch (e) {
    console.warn('Could not update user doc with storeId, continuing in local state:', e);
  }

  // 3. Update local auth & store states
  const currentUser = useAuthStore.getState().user;
  if (currentUser) {
    useAuthStore.getState().setUser({
      ...currentUser,
      storeId,
    });
  }
  useStoreStore.getState().setStore(newStore);

  return newStore;
};

export const fetchStore = async (storeId: string): Promise<Store | null> => {
  const db = getFirestoreDb();
  useStoreStore.getState().setLoading(true);

  try {
    const snap = await getDoc(doc(db, 'stores', storeId));
    if (!snap.exists()) {
      useStoreStore.getState().clearStore();
      return null;
    }
    const store = snap.data() as Store;
    useStoreStore.getState().setStore(store);
    return store;
  } catch (error) {
    console.error('Error fetching store:', error);
    return null;
  } finally {
    useStoreStore.getState().setLoading(false);
  }
};
