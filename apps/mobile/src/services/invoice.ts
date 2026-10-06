import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
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
import { enqueuePendingInvoice } from './localStore';
import { useProductStore } from '../store/productStore';

export const createInvoice = async (
  storeId: string,
  data: Omit<Invoice, 'id' | 'createdAt'>,
  userId: string
): Promise<Invoice> => {
  const effectiveStoreId = storeId || 'demo_store_1';
  const effectiveUserId = userId || 'user_1';

  // Validate schema
  invoiceSchema.parse({
    ...data,
    storeId: effectiveStoreId,
    createdBy: effectiveUserId,
  });

  const now = new Date().toISOString();
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const finalInvoice: Invoice = {
    ...data,
    id: invoiceId,
    storeId: effectiveStoreId,
    createdAt: now,
    createdBy: effectiveUserId,
  };

  // 1. Deduct stock from local Zustand store immediately for each item sold
  //    This ensures stock is updated in real-time even without network connection.
  for (const item of data.items) {
    try {
      await recordStockMovement(effectiveStoreId, item.productId, {
        type: 'out',
        quantity: item.quantity,
        reason: 'sale',
        note: `Sold on invoice ${data.invoiceNumber}`,
        performedBy: effectiveUserId,
      });
    } catch (stockErr: any) {
      // If insufficient stock was thrown, adjust remaining stock to 0 so billing succeeds
      try {
        const { products } = useProductStore.getState();
        const prod = products.find((p) => p.id === item.productId);
        if (prod && prod.currentStock > 0) {
          await recordStockMovement(effectiveStoreId, item.productId, {
            type: 'out',
            quantity: prod.currentStock,
            reason: 'sale',
            note: `Sold on invoice ${data.invoiceNumber} (cleared remaining stock)`,
            performedBy: effectiveUserId,
          });
        }
      } catch (fallbackErr) {
        console.warn(`Stock fallback warning for product ${item.productId}:`, fallbackErr);
      }
    }
  }

  // 2. Save invoice locally for cloud sync
  await enqueuePendingInvoice(effectiveStoreId, finalInvoice).catch(() => {});

  // 3. Record Khata ledger if credit payment
  if (data.paymentMode === 'credit' && data.customer?.id && data.amountDue > 0) {
    try {
      await recordKhataTransaction(
        effectiveStoreId,
        data.customer.id,
        'debit',
        data.amountDue,
        `Udhar purchase on ${data.invoiceNumber}`,
        effectiveUserId,
        invoiceId
      );
    } catch (khataErr) {
      console.warn('Khata ledger entry will sync later:', khataErr);
    }
  }

  return finalInvoice;
};

export const fetchInvoices = async (storeId: string): Promise<Invoice[]> => {
  const effectiveStoreId = storeId || 'demo_store_1';
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') return [];
    const invoicesCol = collection(db, 'stores', effectiveStoreId, 'invoices');
    const q = query(invoicesCol, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Invoice);
  } catch (err: any) {
    console.warn('Invoices notice (offline mode):', err.message);
    return [];
  }
};

export const subscribeToInvoices = (
  storeId: string,
  onUpdate: (invoices: Invoice[]) => void
): (() => void) => {
  const effectiveStoreId = storeId || 'demo_store_1';
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') {
      return () => {};
    }
    const invoicesCol = collection(db, 'stores', effectiveStoreId, 'invoices');
    const q = query(invoicesCol, orderBy('createdAt', 'desc'), limit(50));

    return onSnapshot(
      q,
      (snap) => {
        const invoices = snap.docs.map((d) => d.data() as Invoice);
        onUpdate(invoices);
      },
      (err) => {
        console.warn('Realtime invoices listener notice (offline mode):', err.message);
      }
    );
  } catch (err: any) {
    console.warn('Invoices listener skipped (offline mode):', err.message);
    return () => {};
  }
};
