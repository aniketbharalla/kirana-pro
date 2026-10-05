/**
 * offlineSync.test.ts – Phase 7 Offline-First Sync Unit Tests
 */
import {
  enqueueOfflineAction,
  getPendingOfflineQueue,
  clearOfflineQueue,
  removeOfflineAction,
  subscribeToSyncStatus,
  OfflineActionType,
} from '../services/offlineSync';

describe('offlineSync – Offline-First Sync Queue', () => {
  beforeEach(() => {
    // Always start each test with an empty queue
    clearOfflineQueue();
  });

  it('starts with an empty queue', () => {
    const queue = getPendingOfflineQueue();
    expect(queue).toHaveLength(0);
  });

  it('enqueues an action and returns it with correct structure', () => {
    const action = enqueueOfflineAction('CREATE_INVOICE', 'store_001', { id: 'inv_1', total: 150 });

    expect(action).toBeDefined();
    expect(action.id).toMatch(/^sync_/);
    expect(action.type).toBe('CREATE_INVOICE');
    expect(action.storeId).toBe('store_001');
    expect(action.payload).toEqual({ id: 'inv_1', total: 150 });
    expect(action.retryCount).toBe(0);
    expect(action.timestamp).toBeTruthy();
  });

  it('adds enqueued actions to the pending queue', () => {
    enqueueOfflineAction('CREATE_INVOICE', 'store_001', { id: 'inv_1' });
    enqueueOfflineAction('UPDATE_STOCK', 'store_001', { productId: 'prod_1', delta: -5 });

    const queue = getPendingOfflineQueue();
    expect(queue).toHaveLength(2);
  });

  it('returns a copy of the queue (not the reference)', () => {
    enqueueOfflineAction('CREATE_INVOICE', 'store_001', { id: 'inv_1' });
    const queue1 = getPendingOfflineQueue();
    const queue2 = getPendingOfflineQueue();
    expect(queue1).not.toBe(queue2); // different array references
    expect(queue1).toEqual(queue2);  // same contents
  });

  it('clears the queue completely', () => {
    enqueueOfflineAction('CREATE_INVOICE', 'store_001', { id: 'inv_1' });
    enqueueOfflineAction('UPDATE_STOCK', 'store_001', { productId: 'p1' });

    clearOfflineQueue();
    expect(getPendingOfflineQueue()).toHaveLength(0);
  });

  it('removes a specific action by id', () => {
    const action1 = enqueueOfflineAction('CREATE_INVOICE', 'store_001', { id: 'inv_1' });
    const action2 = enqueueOfflineAction('UPDATE_STOCK', 'store_001', { id: 'stock_1' });

    removeOfflineAction(action1.id);

    const queue = getPendingOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(action2.id);
  });

  it('does not throw when removing a non-existent action id', () => {
    enqueueOfflineAction('CREATE_INVOICE', 'store_001', { id: 'inv_1' });
    expect(() => removeOfflineAction('non_existent_id')).not.toThrow();
    expect(getPendingOfflineQueue()).toHaveLength(1);
  });

  it('supports all four action types', () => {
    const types: OfflineActionType[] = [
      'CREATE_INVOICE',
      'UPDATE_STOCK',
      'RECORD_KHATA_PAYMENT',
      'RECORD_PURCHASE',
    ];

    types.forEach((type) => {
      enqueueOfflineAction(type, 'store_001', { dummy: true });
    });

    const queue = getPendingOfflineQueue();
    expect(queue).toHaveLength(4);
    types.forEach((type, index) => {
      expect(queue[index].type).toBe(type);
    });
  });

  it('notifies sync status listeners when queue changes', () => {
    const counts: number[] = [];
    const unsubscribe = subscribeToSyncStatus((count) => counts.push(count));

    // Initial notification on subscribe
    expect(counts[0]).toBe(0);

    enqueueOfflineAction('CREATE_INVOICE', 'store_001', { id: 'inv_1' });
    expect(counts[counts.length - 1]).toBe(1);

    enqueueOfflineAction('UPDATE_STOCK', 'store_001', { id: 'stock_1' });
    expect(counts[counts.length - 1]).toBe(2);

    clearOfflineQueue();
    expect(counts[counts.length - 1]).toBe(0);

    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const counts: number[] = [];
    const unsubscribe = subscribeToSyncStatus((count) => counts.push(count));
    const initialLength = counts.length;

    unsubscribe();

    enqueueOfflineAction('CREATE_INVOICE', 'store_001', { id: 'inv_1' });
    // No new notifications should have been added after unsubscribe
    expect(counts.length).toBe(initialLength);
  });

  it('generates unique action ids for multiple enqueued items', () => {
    const actions = Array.from({ length: 5 }, (_, i) =>
      enqueueOfflineAction('UPDATE_STOCK', 'store_001', { idx: i })
    );
    const ids = actions.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });
});
