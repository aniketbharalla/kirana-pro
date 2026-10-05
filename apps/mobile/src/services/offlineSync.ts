import { getFirestoreDb } from '@kirana-pro/shared';
import { collection, doc, setDoc } from 'firebase/firestore';

export type OfflineActionType =
  | 'CREATE_INVOICE'
  | 'UPDATE_STOCK'
  | 'RECORD_KHATA_PAYMENT'
  | 'RECORD_PURCHASE';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  storeId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
}

// In-memory queue backed by fallback
let offlineQueue: OfflineAction[] = [];
let syncListeners: ((count: number) => void)[] = [];

export const subscribeToSyncStatus = (listener: (pendingCount: number) => void) => {
  syncListeners.push(listener);
  listener(offlineQueue.length);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
};

const notifyListeners = () => {
  syncListeners.forEach((l) => l(offlineQueue.length));
};

export const enqueueOfflineAction = (
  type: OfflineActionType,
  storeId: string,
  payload: any
): OfflineAction => {
  const action: OfflineAction = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    storeId,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  offlineQueue.push(action);
  notifyListeners();
  return action;
};

export const getPendingOfflineQueue = (): OfflineAction[] => {
  return [...offlineQueue];
};

export const clearOfflineQueue = (): void => {
  offlineQueue = [];
  notifyListeners();
};

export const removeOfflineAction = (actionId: string): void => {
  offlineQueue = offlineQueue.filter((a) => a.id !== actionId);
  notifyListeners();
};

/**
 * Synchronizes pending actions to Firestore
 */
export const processOfflineQueue = async (): Promise<{
  successCount: number;
  failedCount: number;
}> => {
  if (offlineQueue.length === 0) {
    return { successCount: 0, failedCount: 0 };
  }

  const db = getFirestoreDb();
  let successCount = 0;
  let failedCount = 0;
  const remainingQueue: OfflineAction[] = [];

  for (const action of offlineQueue) {
    try {
      if (action.type === 'CREATE_INVOICE') {
        const invRef = doc(db, 'stores', action.storeId, 'invoices', action.payload.id);
        await setDoc(invRef, action.payload);
        successCount++;
      } else if (action.type === 'UPDATE_STOCK') {
        const stockRef = doc(
          db,
          'stores',
          action.storeId,
          'stock_movements',
          action.payload.id || `sm_${Date.now()}`
        );
        await setDoc(stockRef, action.payload);
        successCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.warn(`Sync failed for action ${action.id}:`, err);
      action.retryCount += 1;
      remainingQueue.push(action);
      failedCount++;
    }
  }

  offlineQueue = remainingQueue;
  notifyListeners();
  return { successCount, failedCount };
};
