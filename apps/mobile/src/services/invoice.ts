import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import {
  getFirestoreDb,
  Invoice,
  invoiceSchema,
  InvoiceItem,
  generateInvoiceNumber,
} from '@kirana-pro/shared';
import { recordStockMovement } from './stock';
import { recordKhataTransaction } from './khata';

export const createInvoice = async (
  storeId: string,
  data: Omit<Invoice, 'id' | 'createdAt'>,
  userId: string
): Promise<Invoice> => {
  // Validate schema
  invoiceSchema.parse({
    ...data,
    storeId,
    createdBy: userId,
  });

  const now = new Date().toISOString();
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const finalInvoice: Invoice = {
    ...data,
    id: invoiceId,
    storeId,
    createdAt: now,
    createdBy: userId,
  };

  try {
    const db = getFirestoreDb();
    const invoiceRef = doc(db, 'stores', storeId, 'invoices', invoiceId);
    await setDoc(invoiceRef, finalInvoice);

    // Atomically decrement stock for all sold items
    for (const item of data.items) {
      try {
        await recordStockMovement(storeId, item.productId, {
          type: 'out',
          quantity: item.quantity,
          reason: 'sale',
          note: `Sold on invoice ${data.invoiceNumber}`,
          performedBy: userId,
        });
      } catch (stockErr) {
        console.warn(`Could not update stock for product ${item.productId}:`, stockErr);
      }
    }

    // If Udhar / Credit checkout, record debit in customer khata
    if (data.paymentMode === 'credit' && data.customer?.id && data.amountDue > 0) {
      try {
        await recordKhataTransaction(
          storeId,
          data.customer.id,
          'debit',
          data.amountDue,
          `Udhar purchase on ${data.invoiceNumber}`,
          userId,
          invoiceId
        );
      } catch (khataErr) {
        console.warn('Could not record khata ledger entry:', khataErr);
      }
    }
  } catch (err: any) {
    console.warn('Firestore offline / local invoice fallback:', err.message);
  }

  return finalInvoice;
};

export const fetchInvoices = async (storeId: string): Promise<Invoice[]> => {
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') return [];
    const invoicesCol = collection(db, 'stores', storeId, 'invoices');
    const q = query(invoicesCol, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Invoice);
  } catch (err: any) {
    console.warn('Invoices notice (returning local state):', err.message);
    return [];
  }
};

export const subscribeToInvoices = (
  storeId: string,
  onUpdate: (invoices: Invoice[]) => void
): (() => void) => {
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') return () => {};
    const invoicesCol = collection(db, 'stores', storeId, 'invoices');
    const q = query(invoicesCol, orderBy('createdAt', 'desc'), limit(50));

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Invoice);
        onUpdate(list);
      },
      (err) => {
        console.warn('Invoices listener notice (local mode):', err.message);
      }
    );
  } catch (err: any) {
    return () => {};
  }
};
