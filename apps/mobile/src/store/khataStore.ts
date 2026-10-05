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
  customers: [
    {
      id: 'cust_demo_1',
      storeId: 'demo_store_1',
      name: 'Ramesh Sharma (Pandit Ji)',
      phoneNumber: '9876543210',
      address: 'Near Shiv Mandir, Ward 4',
      currentBalance: 420,
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-05T09:00:00.000Z',
    },
    {
      id: 'cust_demo_2',
      storeId: 'demo_store_1',
      name: 'Gupta Ji Chai Wala',
      phoneNumber: '9123456780',
      address: 'Main Chowk',
      currentBalance: 780,
      createdAt: '2026-10-02T10:00:00.000Z',
      updatedAt: '2026-10-05T10:30:00.000Z',
    },
    {
      id: 'cust_demo_3',
      storeId: 'demo_store_1',
      name: 'Sunil Tailor',
      phoneNumber: '9988776655',
      address: 'Shop #12, Market',
      currentBalance: 150,
      createdAt: '2026-10-03T11:00:00.000Z',
      updatedAt: '2026-10-04T12:00:00.000Z',
    },
  ],
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
