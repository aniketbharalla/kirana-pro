import { create } from 'zustand';
import { Store } from '@kirana-pro/shared';

export interface StoreState {
  store: Store | null;
  isLoading: boolean;
  setStore: (store: Store) => void;
  clearStore: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useStoreStore = create<StoreState>((set) => ({
  store: null,
  isLoading: false,
  setStore: (store) => set({ store, isLoading: false }),
  clearStore: () => set({ store: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
