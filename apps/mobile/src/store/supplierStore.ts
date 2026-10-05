import { create } from 'zustand';
import { Supplier, PurchaseInvoice } from '@kirana-pro/shared';

interface SupplierState {
  suppliers: Supplier[];
  purchases: PurchaseInvoice[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  setSuppliers: (suppliers: Supplier[]) => void;
  setPurchases: (purchases: PurchaseInvoice[]) => void;
  setSearchQuery: (query: string) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  addPurchase: (purchase: PurchaseInvoice) => void;

  getTotalPayable: () => number;
  getFilteredSuppliers: () => Supplier[];
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  purchases: [],
  searchQuery: '',
  isLoading: false,
  error: null,

  setSuppliers: (suppliers) => set({ suppliers }),
  setPurchases: (purchases) => set({ purchases }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addSupplier: (supplier) =>
    set((state) => ({ suppliers: [supplier, ...state.suppliers] })),

  updateSupplier: (id, updates) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  addPurchase: (purchase) =>
    set((state) => ({ purchases: [purchase, ...state.purchases] })),

  getTotalPayable: () => {
    return get().suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
  },

  getFilteredSuppliers: () => {
    const { suppliers, searchQuery } = get();
    if (!searchQuery.trim()) return suppliers;
    const q = searchQuery.toLowerCase().trim();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.gstin && s.gstin.toLowerCase().includes(q))
    );
  },
}));
