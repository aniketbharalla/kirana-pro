import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  limit,
  runTransaction,
} from 'firebase/firestore';
import { getDb } from './firebase';
import {
  Product,
  Invoice,
  InvoiceItem,
  PaymentMode,
  InvoiceCustomer,
  CustomerKhata,
  StockMovement,
  PurchaseInvoice,
  Supplier,
  StaffMember,
  DailyGallaSession,
} from '@kirana-pro/shared';

/**
 * Strips all `undefined` values recursively so Firestore `setDoc` never fails with
 * "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
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
}

// ─── Starter Staples for Instant Store Setup ──────────────────────────────────

export const DEFAULT_KIRANA_STAPLES: Omit<Product, 'storeId'>[] = [
  {
    id: 'prod_staple_1',
    name: 'Aashirvaad Shudh Chakki Atta 5kg',
    nameHindi: 'आशीर्वाद चक्की आटा',
    category: 'staples-groceries',
    barcode: '8901030000001',
    purchasePrice: 220,
    sellingPrice: 250,
    gstRate: 0,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 250,
    currentStock: 25,
    minStockAlert: 5,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_2',
    name: 'Tata Salt Vacuum Evaporated 1kg',
    nameHindi: 'टाटा नमक',
    category: 'spices-masala',
    barcode: '8901030000002',
    purchasePrice: 22,
    sellingPrice: 28,
    gstRate: 0,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 28,
    currentStock: 50,
    minStockAlert: 10,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_3',
    name: 'Loose Basmati Chawal (Premium Rice)',
    nameHindi: 'खुला बासमती चावल',
    category: 'staples-groceries',
    barcode: null,
    purchasePrice: 42,
    sellingPrice: 52,
    gstRate: 0,
    unit: 'kg',
    isLoose: true,
    pricePerUnit: 52,
    currentStock: 150,
    minStockAlert: 30,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_4',
    name: 'Loose Shakar Cheeni (Pure Sugar)',
    nameHindi: 'खुली शक्कर चीनी',
    category: 'staples-groceries',
    barcode: null,
    purchasePrice: 38,
    sellingPrice: 44,
    gstRate: 0,
    unit: 'kg',
    isLoose: true,
    pricePerUnit: 44,
    currentStock: 100,
    minStockAlert: 20,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_5',
    name: 'Maggi 2-Minute Masala Noodles 70g',
    nameHindi: 'मैगी नूडल्स',
    category: 'snacks-namkeen',
    barcode: '8901058852331',
    purchasePrice: 11.5,
    sellingPrice: 14,
    gstRate: 12,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 14,
    currentStock: 48,
    minStockAlert: 12,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_6',
    name: 'Amul Pasteurised Butter 100g',
    nameHindi: 'अमूल मक्खन',
    category: 'dairy',
    barcode: '8901262010017',
    purchasePrice: 50,
    sellingPrice: 56,
    gstRate: 12,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 56,
    currentStock: 30,
    minStockAlert: 6,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_7',
    name: 'Fortune Sunlite Refined Sunflower Oil 1L',
    nameHindi: 'फॉर्च्यून रिफाइंड तेल',
    category: 'oil-ghee',
    barcode: '8906007280014',
    purchasePrice: 130,
    sellingPrice: 148,
    gstRate: 5,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 148,
    currentStock: 24,
    minStockAlert: 6,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_8',
    name: 'Loose Toor Dal Desi (Arhar)',
    nameHindi: 'अरहर / तूर दाल',
    category: 'pulses-dal',
    barcode: null,
    purchasePrice: 135,
    sellingPrice: 155,
    gstRate: 0,
    unit: 'kg',
    isLoose: true,
    pricePerUnit: 155,
    currentStock: 80,
    minStockAlert: 15,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_9',
    name: 'Parle-G Original Gluco Biscuits 250g',
    nameHindi: 'पारले-जी बिस्कुट',
    category: 'snacks-namkeen',
    barcode: '8901719101037',
    purchasePrice: 24,
    sellingPrice: 30,
    gstRate: 18,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 30,
    currentStock: 60,
    minStockAlert: 12,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_10',
    name: 'Tata Tea Premium Desh Ki Chai 500g',
    nameHindi: 'टाटा चाय प्रीमियम',
    category: 'beverages',
    barcode: '8901052002145',
    purchasePrice: 245,
    sellingPrice: 285,
    gstRate: 5,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 285,
    currentStock: 20,
    minStockAlert: 5,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_11',
    name: 'Loose Red Onions (Desi Pyaz)',
    nameHindi: 'देशी लाल प्याज',
    category: 'fruits-vegetables',
    barcode: null,
    purchasePrice: 26,
    sellingPrice: 35,
    gstRate: 0,
    unit: 'kg',
    isLoose: true,
    pricePerUnit: 35,
    currentStock: 120,
    minStockAlert: 25,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_staple_12',
    name: 'Loose Potatoes (Aloo Pahadi)',
    nameHindi: 'पहाड़ी नया आलू',
    category: 'fruits-vegetables',
    barcode: null,
    purchasePrice: 20,
    sellingPrice: 28,
    gstRate: 0,
    unit: 'kg',
    isLoose: true,
    pricePerUnit: 28,
    currentStock: 150,
    minStockAlert: 30,
    imageURL: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── Auto-Discover and Migrate Products from Demo/Alternate Stores ────────────

export const autoDiscoverAndMigrateProducts = async (
  targetStoreId: string
): Promise<Product[]> => {
  if (!targetStoreId) return [];
  const db = getDb();

  // 1. Candidate stores to inspect
  const candidateStoreIds = new Set<string>();
  candidateStoreIds.add('demo_store_1');

  if (targetStoreId.startsWith('store_')) {
    const uidPart = targetStoreId.replace('store_', '');
    if (uidPart.length > 10) {
      candidateStoreIds.add(`store_${uidPart.substring(0, 10)}`);
    }
  }

  // Also check stored IDs in localStorage
  if (typeof window !== 'undefined') {
    const remembered = localStorage.getItem('kirana_store_id');
    if (remembered && remembered !== targetStoreId) candidateStoreIds.add(remembered);
  }

  let foundProducts: Product[] = [];

  for (const cId of candidateStoreIds) {
    if (cId === targetStoreId) continue;
    try {
      const cSnap = await getDocs(collection(db, 'stores', cId, 'products'));
      if (!cSnap.empty) {
        cSnap.forEach((d) => {
          foundProducts.push({ ...d.data(), id: d.id, storeId: targetStoreId } as Product);
        });
        break;
      }
    } catch {}
  }

  // 2. Check local storage products cache
  if (foundProducts.length === 0 && typeof window !== 'undefined') {
    try {
      const keys = ['kirana_products_cache', 'kp_products_demo_store_1', `kp_products_${targetStoreId}`];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            foundProducts = parsed.map((p) => ({ ...p, storeId: targetStoreId }));
            break;
          }
        }
      }
    } catch {}
  }

  // 3. If products were found in other store or local cache, copy them into target store in Firestore
  if (foundProducts.length > 0) {
    for (const prod of foundProducts) {
      try {
        const prodRef = doc(db, 'stores', targetStoreId, 'products', prod.id);
        await setDoc(prodRef, sanitizeForFirestore({ ...prod, storeId: targetStoreId }), { merge: true });
      } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('kirana_products_cache', JSON.stringify(foundProducts));
    }
  }

  return foundProducts;
};

// ─── Seed Starter Staples ─────────────────────────────────────────────────────

export const seedStarterProducts = async (storeId: string): Promise<Product[]> => {
  if (!storeId) return [];
  const db = getDb();
  const seeded: Product[] = [];

  for (const item of DEFAULT_KIRANA_STAPLES) {
    const prod: Product = {
      ...item,
      storeId,
    };
    try {
      const prodRef = doc(db, 'stores', storeId, 'products', prod.id);
      await setDoc(prodRef, sanitizeForFirestore(prod), { merge: true });
      seeded.push(prod);
    } catch (err) {
      console.warn('Seed product note:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('kirana_products_cache', JSON.stringify(seeded));
  }
  return seeded;
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const subscribeStoreProducts = (
  storeId: string,
  onData: (products: Product[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => { };
  }

  // Instant local cache restore to prevent any blank screen
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('kirana_products_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onData(parsed);
        }
      }
    } catch {}
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

      if (list.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('kirana_products_cache', JSON.stringify(list));
        }
        onData(list);
      } else {
        // If this store has 0 products, try auto-discovering from demo / candidate stores
        autoDiscoverAndMigrateProducts(storeId).then((discovered) => {
          if (discovered.length > 0) {
            onData(discovered);
          } else {
            onData([]);
          }
        }).catch(() => {
          onData([]);
        });
      }
    },
    (err) => {
      console.warn('Error subscribing to products:', err);
      // Fallback to local cache if Firestore read fails
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('kirana_products_cache');
          if (cached) onData(JSON.parse(cached));
          else onData([]);
        } catch {
          onData([]);
        }
      } else {
        onData([]);
      }
    }
  );
};

export const saveStoreProduct = async (storeId: string, product: Product): Promise<void> => {
  const db = getDb();
  const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const prodRef = doc(db, 'stores', storeId, 'products', id);
  const now = new Date().toISOString();
  const data = sanitizeForFirestore({ ...product, id, storeId, updatedAt: now }) as Product;
  await setDoc(prodRef, data, { merge: true });

  // Update local cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('kirana_products_cache');
      const existing: Product[] = raw ? JSON.parse(raw) : [];
      const idx = existing.findIndex((p) => p.id === id);
      if (idx > -1) existing[idx] = data;
      else existing.push(data);
      localStorage.setItem('kirana_products_cache', JSON.stringify(existing));
    } catch {}
  }
};

export const deleteStoreProduct = async (storeId: string, productId: string): Promise<void> => {
  const db = getDb();
  const prodRef = doc(db, 'stores', storeId, 'products', productId);
  await deleteDoc(prodRef);

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('kirana_products_cache');
      if (raw) {
        const existing: Product[] = JSON.parse(raw);
        const filtered = existing.filter((p) => p.id !== productId);
        localStorage.setItem('kirana_products_cache', JSON.stringify(filtered));
      }
    } catch {}
  }
};

// ─── POS Quick Billing Sale Recorder ──────────────────────────────────────────

export const recordStoreSale = async (
  storeId: string,
  sale: {
    items: InvoiceItem[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    paymentMode: PaymentMode;
    amountPaid: number;
    amountDue: number;
    customer?: InvoiceCustomer;
    counterNumber?: number;
    staffId?: string;
    staffName?: string;
    cashTendered?: number;
    changeDue?: number;
    notes?: string;
    createdBy: string;
  }
): Promise<Invoice> => {
  if (!storeId) throw new Error('Store ID required to record sale');
  const db = getDb();
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const invoiceId = `inv_${nowMs}_${Math.random().toString(36).substring(2, 6)}`;
  const invoiceNumber = `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${nowMs.toString().slice(-4)}`;

  const invoice: Invoice = {
    id: invoiceId,
    invoiceNumber,
    storeId,
    items: sale.items,
    subtotal: sale.subtotal,
    discountTotal: sale.discountTotal,
    taxTotal: sale.taxTotal,
    grandTotal: sale.grandTotal,
    paymentMode: sale.paymentMode,
    paymentStatus: sale.amountDue > 0 ? (sale.amountPaid > 0 ? 'partial' : 'unpaid') : 'paid',
    amountPaid: sale.amountPaid,
    amountDue: sale.amountDue,
    customer: sale.customer,
    counterNumber: sale.counterNumber || 1,
    staffId: sale.staffId,
    staffName: sale.staffName,
    cashTendered: sale.cashTendered,
    changeDue: sale.changeDue,
    notes: sale.notes,
    createdAt: now,
    createdBy: sale.createdBy,
  };

  // Transaction for atomic stock deductions and ledger updates
  await runTransaction(db, async (tx) => {
    // 1. Product reads for stock decrement
    const productReads: { item: InvoiceItem; docSnap: any; ref: any }[] = [];
    for (const item of sale.items) {
      const pRef = doc(db, 'stores', storeId, 'products', item.productId);
      const snap = await tx.get(pRef);
      productReads.push({ item, docSnap: snap, ref: pRef });
    }

    // 2. Read customer doc if credit payment
    let customerSnap: any = null;
    let customerRef: any = null;
    if (sale.paymentMode === 'credit' && sale.customer?.id) {
      customerRef = doc(db, 'stores', storeId, 'customers', sale.customer.id);
      customerSnap = await tx.get(customerRef);
    }

    // 3. Update products and write stock movements
    for (const pr of productReads) {
      if (pr.docSnap.exists()) {
        const curStock = pr.docSnap.data().currentStock || 0;
        const newStock = Math.max(0, curStock - pr.item.quantity);
        tx.update(pr.ref, { currentStock: newStock, updatedAt: now });

        const smRef = doc(collection(db, 'stores', storeId, 'stock_movements'));
        tx.set(
          smRef,
          sanitizeForFirestore({
            storeId,
            productId: pr.item.productId,
            type: 'out',
            quantity: pr.item.quantity,
            reason: 'sale',
            note: `POS Sale #${invoiceNumber}`,
            performedBy: sale.createdBy,
            previousStock: curStock,
            newStock,
            createdAt: now,
          })
        );
      }
    }

    // 4. Update customer balance if credit sale
    if (customerRef && customerSnap && customerSnap.exists()) {
      const prevBal = customerSnap.data().currentBalance || 0;
      const newBal = prevBal + sale.amountDue;
      tx.update(customerRef, {
        currentBalance: newBal,
        updatedAt: now,
      });

      const custTxRef = doc(collection(db, 'stores', storeId, 'customers', sale.customer!.id!, 'transactions'));
      tx.set(
        custTxRef,
        sanitizeForFirestore({
          customerId: sale.customer!.id,
          storeId,
          type: 'debit',
          amount: sale.amountDue,
          description: `POS Udhar Sale #${invoiceNumber}`,
          balanceAfter: newBal,
          createdAt: now,
          createdBy: sale.createdBy,
        })
      );
    }

    // 5. Save Invoice doc
    const invRef = doc(db, 'stores', storeId, 'invoices', invoiceId);
    tx.set(invRef, sanitizeForFirestore(invoice));
  });

  // Local backup cache
  if (typeof window !== 'undefined') {
    try {
      const rawInvs = localStorage.getItem('kirana_invoices_cache');
      const invList: Invoice[] = rawInvs ? JSON.parse(rawInvs) : [];
      invList.unshift(invoice);
      localStorage.setItem('kirana_invoices_cache', JSON.stringify(invList.slice(0, 50)));
    } catch {}
  }

  return invoice;
};

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const subscribeStoreInvoices = (
  storeId: string,
  onData: (invoices: Invoice[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => { };
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
    return () => { };
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
    return () => { };
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
    return () => { };
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

/**
 * Atomically updates product stock, records stock movements, saves purchase invoice,
 * and increments supplier purchase totals using a Firestore transaction.
 */
export const inwardPurchaseInvoiceTransaction = async (
  storeId: string,
  invoice: PurchaseInvoice,
  userName = 'Store Owner'
): Promise<void> => {
  const db = getDb();

  await runTransaction(db, async (tx) => {
    // 1. ALL READS FIRST (Required by Firestore transactions)
    const existingProductReads: { item: (typeof invoice.items)[0]; docSnap: any; ref: any }[] = [];
    for (const item of invoice.items) {
      if (item.productId) {
        const pRef = doc(db, 'stores', storeId, 'products', item.productId);
        const pSnap = await tx.get(pRef);
        existingProductReads.push({ item, docSnap: pSnap, ref: pRef });
      }
    }

    let supplierSnap: any = null;
    let supplierRef: any = null;
    if (invoice.supplierId) {
      supplierRef = doc(db, 'stores', storeId, 'suppliers', invoice.supplierId);
      supplierSnap = await tx.get(supplierRef);
    }

    // 2. ALL WRITES AFTER READS
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // Update existing products & record movements
    for (const { item, docSnap, ref } of existingProductReads) {
      const prev = docSnap.exists() ? (docSnap.data().currentStock || 0) : 0;
      const nextStock = prev + item.totalQty;
      tx.update(ref, {
        currentStock: nextStock,
        purchasePrice: item.rate,
        updatedAt: nowIso,
      });

      const movRef = doc(collection(db, 'stores', storeId, 'stock_movements'));
      const movementData = sanitizeForFirestore({
        id: movRef.id,
        storeId,
        productId: item.productId,
        type: 'in',
        reason: 'purchase',
        quantity: item.totalQty,
        previousStock: prev,
        newStock: nextStock,
        note: `Purchase Inward Inv #${invoice.invoiceNo}`,
        performedBy: userName,
        createdAt: nowIso,
      });
      tx.set(movRef, movementData);
    }

    // Create new products & record movements
    for (const item of invoice.items) {
      if (!item.productId) {
        const newProdRef = doc(collection(db, 'stores', storeId, 'products'));
        const newProdData = sanitizeForFirestore({
          id: newProdRef.id,
          storeId,
          name: item.productName,
          category: 'other',
          sellingPrice: Math.round(item.rate * 1.15),
          purchasePrice: item.rate,
          unit: item.uomMapped || 'packet',
          currentStock: item.totalQty,
          minStockAlert: 5,
          isLoose: false,
          gstRate: (item.cgstRate || 2.5) + (item.sgstRate || 2.5),
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        tx.set(newProdRef, newProdData);

        const movRef = doc(collection(db, 'stores', storeId, 'stock_movements'));
        const movementData = sanitizeForFirestore({
          id: movRef.id,
          storeId,
          productId: newProdRef.id,
          type: 'in',
          reason: 'purchase',
          quantity: item.totalQty,
          previousStock: 0,
          newStock: item.totalQty,
          note: `Purchase Inward (New Product) Inv #${invoice.invoiceNo}`,
          performedBy: userName,
          createdAt: nowIso,
        });
        tx.set(movRef, movementData);
      }
    }

    // Save purchase invoice
    const invId = invoice.id || `purch_${nowMs}`;
    const invoiceRef = doc(db, 'stores', storeId, 'purchases', invId);
    tx.set(invoiceRef, sanitizeForFirestore({ ...invoice, id: invId, storeId }));

    // Update supplier ledger if supplier exists
    if (supplierRef && supplierSnap && supplierSnap.exists()) {
      const prevPurchases = supplierSnap.data().totalPurchases || 0;
      const prevCount = supplierSnap.data().invoiceCount || 0;
      const prevBalance = supplierSnap.data().balance || 0;
      tx.update(supplierRef, {
        totalPurchases: prevPurchases + invoice.netPayable,
        invoiceCount: prevCount + 1,
        balance: prevBalance + invoice.netPayable,
        updatedAt: nowMs,
      });
    }
  });
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const subscribeStoreSuppliers = (
  storeId: string,
  onData: (suppliers: Supplier[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => { };
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
    return () => { };
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
      if (typeof window !== 'undefined' && list.length > 0) {
        try {
          localStorage.setItem('kirana_store_staff_cache', JSON.stringify(list));
          localStorage.setItem('kirana_store_id', storeId);
        } catch {}
      }
      onData(list);
    },
    (err) => {
      console.warn('Error subscribing to staff:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('kirana_store_staff_cache');
        if (cached) {
          try {
            onData(JSON.parse(cached));
            return;
          } catch {}
        }
      }
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

  // Cache locally for instant cashier login access
  if (typeof window !== 'undefined') {
    try {
      const cachedStr = localStorage.getItem('kirana_store_staff_cache');
      let currentList: StaffMember[] = cachedStr ? JSON.parse(cachedStr) : [];
      const cleanPhone = (staff.phone || '').replace(/\D/g, '').slice(-10);
      const existingIdx = currentList.findIndex(
        (s) => s.id === id || (s.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone
      );
      const updatedMember = { ...staff, id, storeId } as StaffMember;
      if (existingIdx >= 0) {
        currentList[existingIdx] = updatedMember;
      } else {
        currentList.push(updatedMember);
      }
      localStorage.setItem('kirana_store_staff_cache', JSON.stringify(currentList));
      localStorage.setItem('kirana_store_id', storeId);
    } catch (e) {
      console.warn('Cache staff error:', e);
    }
  }

  await setDoc(ref, data, { merge: true });
};

// ─── Galla Sessions ───────────────────────────────────────────────────────────

export const subscribeStoreGalla = (
  storeId: string,
  onData: (sessions: DailyGallaSession[]) => void
): (() => void) => {
  if (!storeId) {
    onData([]);
    return () => { };
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
