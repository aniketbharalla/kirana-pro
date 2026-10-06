import { create } from 'zustand';
import { CustomerKhata } from '@kirana-pro/shared';

export interface KhataState {
  customers: CustomerKhata[];
  isLoading: boolean;
  searchQuery: string;

  setCustomers: (customers: CustomerKhata[]) => void;
  setLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;

  getTotalPendingCredit: () => number;
  getFilteredCustomers: () => CustomerKhata[];
}

export const useKhataStore = create<KhataState>((set, get) => ({
  customers: [],
  isLoading: false,
  searchQuery: '',

  setCustomers: (customers) => set({ customers, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  getTotalPendingCredit: () => {
    const { customers } = get();
    const sum = customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
    return Math.round(sum * 100) / 100;
  },

  getFilteredCustomers: () => {
    const { customers, searchQuery } = get();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  },
}));
