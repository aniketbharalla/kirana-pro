import {
  collection,
  doc,
  getDoc,
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
  const db = getFirestoreDb();
  const productRef = doc(db, 'stores', storeId, 'products', productId);
  const movementsCol = collection(db, 'stores', storeId, 'stock_movements');
  const movementRef = doc(movementsCol);
  const now = new Date().toISOString();

  let movementRecord: StockMovement | null = null;

  await runTransaction(db, async (transaction) => {
    const prodSnap = await transaction.get(productRef);
    if (!prodSnap.exists()) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = Number(prodSnap.data().currentStock || 0);
    const newStock = computeNewStock(currentStock, params.quantity, params.type);

    movementRecord = {
      id: movementRef.id,
      storeId,
      productId,
      type: params.type,
      quantity: params.quantity,
      previousStock: currentStock,
      newStock,
      reason: params.reason,
      note: params.note || null,
      performedBy: params.performedBy,
      createdAt: now,
    };

    // 1. Write immutable stock movement
    transaction.set(movementRef, movementRecord);

    // 2. Atomically update product stock
    transaction.update(productRef, {
      currentStock: newStock,
      updatedAt: now,
    });
  });

  return movementRecord!;
};

export const fetchStockHistory = async (
  storeId: string,
  productId?: string
): Promise<StockMovement[]> => {
  const db = getFirestoreDb();
  const movementsCol = collection(db, 'stores', storeId, 'stock_movements');

  let q = query(movementsCol, orderBy('createdAt', 'desc'));
  if (productId) {
    q = query(movementsCol, where('productId', '==', productId), orderBy('createdAt', 'desc'));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as StockMovement);
};
