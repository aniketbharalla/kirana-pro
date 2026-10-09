import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import {
  getFirestoreDb,
  Supplier,
  supplierSchema,
} from '@kirana-pro/shared';
import { useSupplierStore } from '../store/supplierStore';

export const createSupplier = async (
  storeId: string,
  data: Omit<Supplier, 'id' | 'storeId' | 'totalPurchases' | 'totalPaid' | 'balance' | 'invoiceCount' | 'createdAt' | 'updatedAt'>
): Promise<Supplier> => {
  supplierSchema.parse({ ...data, storeId });

  const now = Date.now();
  const supplierId = `sup_${now}_${Math.random().toString(36).substring(2, 6)}`;
  const newSupplier: Supplier = {
    ...data,
    id: supplierId,
    storeId,
    totalPurchases: 0,
    totalPaid: 0,
    balance: 0,
    invoiceCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const db = getFirestoreDb();
    if (db && typeof db === 'object') {
      const ref = doc(db, 'stores', storeId, 'suppliers', supplierId);
      await setDoc(ref, newSupplier);
    }
  } catch (err: any) {
    console.warn('Supplier create fallback:', err.message);
  }

  useSupplierStore.getState().addSupplier(newSupplier);
  return newSupplier;
};

export const getSuppliers = async (storeId: string): Promise<Supplier[]> => {
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') {
      return useSupplierStore.getState().suppliers;
    }
    const suppliersRef = collection(db, 'stores', storeId, 'suppliers');
    const snapshot = await getDocs(suppliersRef);
    const list: Supplier[] = [];
    snapshot.forEach((d) => list.push(d.data() as Supplier));
    if (list.length > 0) {
      useSupplierStore.getState().setSuppliers(list);
      return list;
    }
  } catch (err: any) {
    console.warn('Error fetching suppliers:', err.message);
  }
  return useSupplierStore.getState().suppliers;
};

export const subscribeToSuppliers = (
  storeId: string,
  onUpdate: (suppliers: Supplier[]) => void
) => {
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') return () => {};
    const suppliersRef = collection(db, 'stores', storeId, 'suppliers');
    return onSnapshot(suppliersRef, (snapshot) => {
      const list: Supplier[] = [];
      snapshot.forEach((d) => list.push(d.data() as Supplier));
      onUpdate(list);
    });
  } catch (err: any) {
    console.warn('Suppliers subscribe fallback:', err.message);
    return () => {};
  }
};
