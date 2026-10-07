import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import { getDb } from './firebase';
import {
  Product,
  Invoice,
  CustomerKhata,
  StockMovement,
  PurchaseInvoice,
  Supplier,
  StaffMember,
  DailyGallaSession,
/**
 * Strips all `undefined` values recursively so Firestore `setDoc` never fails with
 * "Unsupported field value: undefined"
 */
export const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const subscribeStoreProducts = (
  storeId: string,
  onData: (products: Product[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => {};
  }
  const db = getDb();
  const colRef = collection(db, 'stores', storeId, 'products');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Product);
      });
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to products:', err);
      onData([]);
    }
  );
};

export const saveStoreProduct = async (storeId: string, product: Product): Promise<void> => {
  const db = getDb();
  const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const prodRef = doc(db, 'stores', storeId, 'products', id);
  const now = new Date().toISOString();
  const data = sanitizeForFirestore({ ...product, id, storeId, updatedAt: now });
  await setDoc(prodRef, data, { merge: true });
};

export const deleteStoreProduct = async (storeId: string, productId: string): Promise<void> => {
  const db = getDb();
  const prodRef = doc(db, 'stores', storeId, 'products', productId);
  await deleteDoc(prodRef);
};

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const subscribeStoreInvoices = (
  storeId: string,
  onData: (invoices: Invoice[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => {};
  }
  const db = getDb();
  const colRef = collection(db, 'stores', storeId, 'invoices');
  const q = query(colRef, limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Invoice);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to invoices:', err);
      onData([]);
    }
  );
};

// ─── Khata Customers ──────────────────────────────────────────────────────────

export const subscribeStoreCustomers = (
  storeId: string,
  onData: (customers: CustomerKhata[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => {};
  }
  const db = getDb();
  const colRef = collection(db, 'stores', storeId, 'customers');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: CustomerKhata[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as CustomerKhata);
      });
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to customers:', err);
      onData([]);
    }
  );
};

export const saveStoreCustomer = async (
  storeId: string,
  customer: CustomerKhata
): Promise<void> => {
  const db = getDb();
  const id = customer.id || `cust_${Date.now()}`;
  const ref = doc(db, 'stores', storeId, 'customers', id);
  const data = sanitizeForFirestore({ ...customer, id, storeId });
  await setDoc(ref, data, { merge: true });
};

// ─── Stock Movements ──────────────────────────────────────────────────────────

export const subscribeStoreMovements = (
  storeId: string,
  onData: (movements: StockMovement[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => {};
  }
  const db = getDb();
  const colRef = collection(db, 'stores', storeId, 'stock_movements');
  const q = query(colRef, limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StockMovement[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as StockMovement);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to stock movements:', err);
      onData([]);
    }
  );
};

// ─── Purchases ────────────────────────────────────────────────────────────────

export const subscribeStorePurchases = (
  storeId: string,
  onData: (purchases: PurchaseInvoice[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => {};
  }
  const db = getDb();
  const colRef = collection(db, 'stores', storeId, 'purchases');
  const q = query(colRef, limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PurchaseInvoice[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as PurchaseInvoice);
      });
      list.sort((a, b) => (b.invoiceDate || 0) - (a.invoiceDate || 0));
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to purchases:', err);
      onData([]);
    }
  );
};

export const saveStorePurchase = async (
  storeId: string,
  purchase: PurchaseInvoice
): Promise<void> => {
  const db = getDb();
  const id = purchase.id || `purch_${Date.now()}`;
  const ref = doc(db, 'stores', storeId, 'purchases', id);
  const data = sanitizeForFirestore({ ...purchase, id, storeId });
  await setDoc(ref, data, { merge: true });
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const subscribeStoreSuppliers = (
  storeId: string,
  onData: (suppliers: Supplier[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => {};
  }
  const db = getDb();
  const colRef = collection(db, 'stores', storeId, 'suppliers');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Supplier[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Supplier);
      });
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to suppliers:', err);
      onData([]);
    }
  );
};

export const saveStoreSupplier = async (
  storeId: string,
  supplier: Supplier
): Promise<void> => {
  const db = getDb();
  const id = supplier.id || `sup_${Date.now()}`;
  const ref = doc(db, 'stores', storeId, 'suppliers', id);
  const data = sanitizeForFirestore({ ...supplier, id, storeId });
  await setDoc(ref, data, { merge: true });
};

// ─── Staff ────────────────────────────────────────────────────────────────────

export const subscribeStoreStaff = (
  storeId: string,
  onData: (staff: StaffMember[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => {};
  }
  const db = getDb();
  const colRef = collection(db, 'stores', storeId, 'staff');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: StaffMember[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as StaffMember);
      });
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to staff:', err);
      onData([]);
    }
  );
};

export const saveStoreStaff = async (
  storeId: string,
  staff: StaffMember
): Promise<void> => {
  const db = getDb();
  const id = staff.id || `staff_${Date.now()}`;
  const ref = doc(db, 'stores', storeId, 'staff', id);
  const data = sanitizeForFirestore({ ...staff, id, storeId });
  await setDoc(ref, data, { merge: true });
};

// ─── Galla Sessions ───────────────────────────────────────────────────────────

export const subscribeStoreGalla = (
  storeId: string,
  onData: (sessions: DailyGallaSession[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => {};
  }
  const db = getDb();
  const colRef = collection(db, 'stores', storeId, 'galla_sessions');
  const q = query(colRef, limit(30));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: DailyGallaSession[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as DailyGallaSession);
      });
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to galla sessions:', err);
      onData([]);
    }
  );
};

export const saveStoreGalla = async (
  storeId: string,
  session: DailyGallaSession
): Promise<void> => {
  const db = getDb();
  const id = session.id || `galla_${session.date || Date.now()}`;
  const ref = doc(db, 'stores', storeId, 'galla_sessions', id);
  const data = sanitizeForFirestore({ ...session, id, storeId });
  await setDoc(ref, data, { merge: true });
};
