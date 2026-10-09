import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import {
  getFirestoreDb,
  StockMovement,
  StockMovementType,
  StockMovementReason,
} from '@kirana-pro/shared';
import { useProductStore } from '../store/productStore';
import { saveProductsLocally, enqueuePendingStockMove } from './localStore';

export const computeNewStock = (
  currentStock: number,
  quantity: number,
  type: StockMovementType
): number => {
  if (type === 'in') {
    return currentStock + quantity;
  }
  if (type === 'out') {
    if (currentStock < quantity) {
      throw new Error(`Insufficient stock: cannot reduce ${currentStock} by ${quantity}`);
    }
    return currentStock - quantity;
  }
  if (type === 'adjustment') {
    return quantity;
  }
  return currentStock;
};

// ─── Update stock in local Zustand store ────────────────────────────────────

export const updateLocalStock = (
  storeId: string,
  productId: string,
  newStock: number
): void => {
  const { products } = useProductStore.getState();
  const updatedProducts = products.map((p) =>
    p.id === productId
      ? { ...p, currentStock: newStock, updatedAt: new Date().toISOString() }
      : p
  );
  useProductStore.getState().setProducts(updatedProducts);

  // Persist locally in background
  saveProductsLocally(storeId, updatedProducts).catch(() => {});
};

// ─── Record stock movement (local-first, queued for cloud sync) ─────────────

export const recordStockMovement = async (
  storeId: string,
  productId: string,
  params: {
    type: StockMovementType;
    quantity: number;
    reason: StockMovementReason;
    note?: string | null;
    performedBy: string;
  }
): Promise<StockMovement> => {
  const effectiveStoreId = storeId || 'demo_store_1';
  const now = new Date().toISOString();
  const movementId = `sm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // 1. Compute new stock from local state (instant, no network)
  const { products } = useProductStore.getState();
  const product = products.find((p) => p.id === productId);
  const currentStock = product?.currentStock ?? 0;
  const newStock = computeNewStock(currentStock, params.quantity, params.type);

  // 2. Update Zustand store and local storage immediately
  updateLocalStock(effectiveStoreId, productId, newStock);

  const movementRecord: StockMovement = {
    id: movementId,
    storeId: effectiveStoreId,
    productId,
    type: params.type,
    quantity: params.quantity,
    previousStock: currentStock,
    newStock,
    reason: params.reason,
    note: params.note || null,
    performedBy: params.performedBy || 'owner',
    createdAt: now,
  };

  // 3. Enqueue locally for cloud sync (when user presses Sync with Cloud)
  await enqueuePendingStockMove(effectiveStoreId, {
    id: movementId,
    productId,
    type: params.type,
    quantity: params.quantity,
    reason: params.reason,
    note: params.note,
    performedBy: params.performedBy || 'owner',
    timestamp: now,
  }).catch(() => {});

  return movementRecord;
};

// ─── Fetch Stock Movements History ──────────────────────────────────────────

export const fetchStockMovements = async (
  storeId: string,
  productId?: string
): Promise<StockMovement[]> => {
  const effectiveStoreId = storeId || 'demo_store_1';
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') return [];
    const col = collection(db, 'stores', effectiveStoreId, 'stock_movements');

    let q;
    if (productId) {
      q = query(col, where('productId', '==', productId), orderBy('createdAt', 'desc'));
    } else {
      q = query(col, orderBy('createdAt', 'desc'));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as StockMovement);
  } catch (err: any) {
    console.warn('Stock movements fetch (offline mode):', err.message);
    return [];
  }
};

export const fetchStockHistory = fetchStockMovements;
