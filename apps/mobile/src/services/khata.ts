import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  getFirestoreDb,
  CustomerKhata,
  KhataTransaction,
  KhataTransactionType,
  customerKhataSchema,
} from '@kirana-pro/shared';

export const createCustomer = async (
  storeId: string,
  data: Omit<CustomerKhata, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt' | 'storeId'>
): Promise<CustomerKhata> => {
  customerKhataSchema.parse({
    ...data,
    storeId,
  });

  const now = new Date().toISOString();
  const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newCustomer: CustomerKhata = {
    ...data,
    id: customerId,
    storeId,
    currentBalance: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const db = getFirestoreDb();
    const ref = doc(db, 'stores', storeId, 'customers', customerId);
    await setDoc(ref, newCustomer);
  } catch (err: any) {
    console.warn('Customer create fallback:', err.message);
  }

  return newCustomer;
};

export const recordKhataTransaction = async (
  storeId: string,
  customerId: string,
  type: KhataTransactionType,
  amount: number,
  note: string = '',
  userId: string = 'system',
  invoiceId?: string
): Promise<KhataTransaction> => {
  const now = new Date().toISOString();
  const txId = `ktx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const tx: KhataTransaction = {
    id: txId,
    storeId,
    customerId,
    type,
    amount,
    invoiceId,
    note,
    performedBy: userId,
    createdAt: now,
  };

  try {
    const db = getFirestoreDb();
    const customerRef = doc(db, 'stores', storeId, 'customers', customerId);
    const txRef = doc(db, 'stores', storeId, 'customers', customerId, 'transactions', txId);

    await runTransaction(db, async (t) => {
      const snap = await t.get(customerRef);
      if (!snap.exists()) {
        throw new Error('Customer does not exist');
      }

      const cust = snap.data() as CustomerKhata;
      const balanceDelta = type === 'debit' ? amount : -amount;
      const updatedBalance = Math.round((cust.currentBalance + balanceDelta) * 100) / 100;

      t.update(customerRef, {
        currentBalance: updatedBalance,
        updatedAt: now,
      });

      t.set(txRef, tx);
    });
  } catch (err: any) {
    console.warn('Khata transaction fallback:', err.message);
  }

  return tx;
};

export const fetchCustomers = async (storeId: string): Promise<CustomerKhata[]> => {
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') return [];
    const col = collection(db, 'stores', storeId, 'customers');
    const snap = await getDocs(col);
    return snap.docs.map((d) => d.data() as CustomerKhata);
  } catch (err: any) {
    console.warn('Customers notice (running in local store mode):', err.message);
    return [];
  }
};

export const subscribeToCustomers = (
  storeId: string,
  onUpdate: (customers: CustomerKhata[]) => void
): (() => void) => {
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') return () => {};
    const col = collection(db, 'stores', storeId, 'customers');
    return onSnapshot(
      col,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as CustomerKhata);
        onUpdate(list);
      },
      (err) => {
        console.warn('Customers listener notice (local mode):', err.message);
      }
    );
  } catch (err: any) {
    return () => {};
  }
};
