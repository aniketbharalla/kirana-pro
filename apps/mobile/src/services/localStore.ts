/**
 * localStore.ts
 * AsyncStorage-backed local persistence layer.
 * All data is saved locally first. Cloud sync is triggered manually (via Dukaan > Sync).
 */

import { getFirestoreDb } from '@kirana-pro/shared';
import { collection, doc, setDoc } from 'firebase/firestore';

// In-memory cache ensures 100% availability in all environments (Web, Native, Jest)
const memoryFallback = new Map<string, string>();

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
      if (memoryFallback.has(key)) {
        return memoryFallback.get(key) || null;
      }
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const val = await AsyncStorage.getItem(key);
        return val !== null ? val : memoryFallback.get(key) || null;
      } catch {
        return memoryFallback.get(key) || null;
      }
    } catch {
      return memoryFallback.get(key) || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryFallback.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, value);
      } catch {}
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    memoryFallback.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(key);
      } catch {}
    } catch {}
  },
};

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  products: (storeId: string) => `kp_products_${storeId}`,
  invoices: (storeId: string) => `kp_invoices_${storeId}`,
  pendingProducts: (storeId: string) => `kp_pending_products_${storeId}`,
  pendingInvoices: (storeId: string) => `kp_pending_invoices_${storeId}`,
  pendingStockMoves: (storeId: string) => `kp_pending_stock_${storeId}`,
};

// ─── Products Local Persistence ───────────────────────────────────────────────

export const saveProductsLocally = async (storeId: string, products: any[]): Promise<void> => {
  await storage.setItem(KEYS.products(storeId), JSON.stringify(products));
};

export const loadProductsLocally = async (storeId: string): Promise<any[]> => {
  const raw = await storage.getItem(KEYS.products(storeId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// ─── Pending Products ─────────────────────────────────────────────────────────

export const enqueuePendingProduct = async (storeId: string, product: any): Promise<void> => {
  const raw = await storage.getItem(KEYS.pendingProducts(storeId));
  const existing: any[] = raw ? JSON.parse(raw) : [];
  const idx = existing.findIndex((p) => p.id === product.id);
  if (idx > -1) {
    existing[idx] = product;
  } else {
    existing.push(product);
  }
  await storage.setItem(KEYS.pendingProducts(storeId), JSON.stringify(existing));
};

export const getPendingProducts = async (storeId: string): Promise<any[]> => {
  const raw = await storage.getItem(KEYS.pendingProducts(storeId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const clearPendingProducts = async (storeId: string): Promise<void> => {
  await storage.removeItem(KEYS.pendingProducts(storeId));
};

export const removePendingProduct = async (storeId: string, productId: string): Promise<void> => {
  const raw = await storage.getItem(KEYS.pendingProducts(storeId));
  const existing: any[] = raw ? JSON.parse(raw) : [];
  const filtered = existing.filter((p) => p.id !== productId);
  await storage.setItem(KEYS.pendingProducts(storeId), JSON.stringify(filtered));
};

// ─── Pending Invoices ─────────────────────────────────────────────────────────

export const enqueuePendingInvoice = async (storeId: string, invoice: any): Promise<void> => {
  const raw = await storage.getItem(KEYS.pendingInvoices(storeId));
  const existing: any[] = raw ? JSON.parse(raw) : [];
  const idx = existing.findIndex((i) => i.id === invoice.id);
  if (idx > -1) {
    existing[idx] = invoice;
  } else {
    existing.push(invoice);
  }
  await storage.setItem(KEYS.pendingInvoices(storeId), JSON.stringify(existing));
};

export const getPendingInvoices = async (storeId: string): Promise<any[]> => {
  const raw = await storage.getItem(KEYS.pendingInvoices(storeId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const clearPendingInvoices = async (storeId: string): Promise<void> => {
  await storage.removeItem(KEYS.pendingInvoices(storeId));
};

// ─── Pending Stock Movements ──────────────────────────────────────────────────

export interface PendingStockMove {
  id?: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  note?: string | null;
  performedBy: string;
  timestamp: string;
}

export const enqueuePendingStockMove = async (
  storeId: string,
  move: PendingStockMove
): Promise<void> => {
  const raw = await storage.getItem(KEYS.pendingStockMoves(storeId));
  const existing: PendingStockMove[] = raw ? JSON.parse(raw) : [];
  existing.push(move);
  await storage.setItem(KEYS.pendingStockMoves(storeId), JSON.stringify(existing));
};

export const getPendingStockMoves = async (storeId: string): Promise<PendingStockMove[]> => {
  const raw = await storage.getItem(KEYS.pendingStockMoves(storeId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const clearPendingStockMoves = async (storeId: string): Promise<void> => {
  await storage.removeItem(KEYS.pendingStockMoves(storeId));
};

// ─── Pending Sync Summary ─────────────────────────────────────────────────────

export interface PendingSyncSummary {
  total: number;
  products: number;
  invoices: number;
  stockMoves: number;
}

export const getPendingSyncSummary = async (storeId: string): Promise<PendingSyncSummary> => {
  const [products, invoices, stockMoves] = await Promise.all([
    getPendingProducts(storeId),
    getPendingInvoices(storeId),
    getPendingStockMoves(storeId),
  ]);
  return {
    total: products.length + invoices.length + stockMoves.length,
    products: products.length,
    invoices: invoices.length,
    stockMoves: stockMoves.length,
  };
};

// ─── Cloud Sync (Triggered ONLY via Dukaan > Sync with Cloud) ─────────────────

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  details: {
    products: number;
    invoices: number;
    stockMoves: number;
  };
  error?: string;
}

export const syncAllToCloud = async (storeId: string): Promise<SyncResult> => {
  const [products, invoices, stockMoves] = await Promise.all([
    getPendingProducts(storeId),
    getPendingInvoices(storeId),
    getPendingStockMoves(storeId),
  ]);

  const total = products.length + invoices.length + stockMoves.length;
  if (total === 0) {
    return {
      success: true,
      syncedCount: 0,
      details: { products: 0, invoices: 0, stockMoves: 0 },
    };
  }

  try {
    const db = getFirestoreDb();

    // 1. Sync pending products
    for (const prod of products) {
      const prodRef = doc(collection(db, 'stores', storeId, 'products'), prod.id);
      await setDoc(prodRef, prod, { merge: true });
    }

    // 2. Sync pending invoices
    for (const inv of invoices) {
      const invRef = doc(collection(db, 'stores', storeId, 'invoices'), inv.id);
      await setDoc(invRef, inv, { merge: true });
    }

    // 3. Sync pending stock movements
    for (const move of stockMoves) {
      const moveId = move.id || `sm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const moveRef = doc(collection(db, 'stores', storeId, 'stock_movements'), moveId);
      await setDoc(moveRef, { ...move, storeId }, { merge: true });
    }

    // Clear queues after successful push
    await Promise.all([
      clearPendingProducts(storeId),
      clearPendingInvoices(storeId),
      clearPendingStockMoves(storeId),
    ]);

    return {
      success: true,
      syncedCount: total,
      details: {
        products: products.length,
        invoices: invoices.length,
        stockMoves: stockMoves.length,
      },
    };
  } catch (err: any) {
    console.error('Cloud sync failed:', err);
    return {
      success: false,
      syncedCount: 0,
      details: { products: 0, invoices: 0, stockMoves: 0 },
      error: err.message || 'Failed to sync with cloud. Please check network connection.',
    };
  }
};
