import { useStoreStore } from '../store/storeStore';
import { Store } from '@kirana-pro/shared';

describe('storeStore', () => {
  const mockStore: Store = {
    id: 'store_123',
    name: 'Shree Ganesh Kirana',
    type: 'kirana',
    address: {
      street: '12 Bazar Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
    },
    gstNumber: null,
    logoURL: null,
    ownerId: 'user_123',
    staffIds: [],
    settings: {
      currency: 'INR',
      weightUnit: 'kg',
      defaultTaxRate: 0,
      invoicePrefix: 'INV',
      invoiceCounter: 1,
    },
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z',
  };

  beforeEach(() => {
    useStoreStore.getState().clearStore();
  });

  it('initializes with store null and isLoading false', () => {
    const state = useStoreStore.getState();
    expect(state.store).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('setStore updates store data', () => {
    useStoreStore.getState().setStore(mockStore);
    const state = useStoreStore.getState();
    expect(state.store).toEqual(mockStore);
    expect(state.isLoading).toBe(false);
  });

  it('clearStore resets to null', () => {
    useStoreStore.getState().setStore(mockStore);
    useStoreStore.getState().clearStore();
    const state = useStoreStore.getState();
    expect(state.store).toBeNull();
  });

  it('setLoading toggles isLoading', () => {
    useStoreStore.getState().setLoading(true);
    expect(useStoreStore.getState().isLoading).toBe(true);
  });
});
