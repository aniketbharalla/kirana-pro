import { create } from 'zustand';
import { Supplier, PurchaseInvoice, SupplierTransaction } from '@kirana-pro/shared';

interface SupplierState {
  suppliers: Supplier[];
  purchases: PurchaseInvoice[];
  transactions: SupplierTransaction[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  setSuppliers: (suppliers: Supplier[]) => void;
  setPurchases: (purchases: PurchaseInvoice[]) => void;
  setTransactions: (transactions: SupplierTransaction[]) => void;
  setSearchQuery: (query: string) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  addPurchase: (purchase: PurchaseInvoice) => void;
  addTransaction: (tx: SupplierTransaction) => void;
  recordPayment: (
    supplierId: string,
    amount: number,
    paymentMode: 'Cash' | 'UPI' | 'Bank' | 'Cheque',
    note?: string
  ) => void;

  getTotalPayable: () => number;
  getFilteredSuppliers: () => Supplier[];
  getSupplierTransactions: (supplierId: string) => SupplierTransaction[];
  getSupplierPurchases: (supplierId: string) => PurchaseInvoice[];
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  purchases: [],
  transactions: [],
  searchQuery: '',
  isLoading: false,
  error: null,

  setSuppliers: (suppliers) => set({ suppliers }),
  setPurchases: (purchases) => set({ purchases }),
  setTransactions: (transactions) => set({ transactions }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addSupplier: (supplier) =>
    set((state) => ({ suppliers: [supplier, ...state.suppliers] })),

  updateSupplier: (id, updates) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  addPurchase: (purchase) =>
    set((state) => ({ purchases: [purchase, ...state.purchases] })),

  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),

  recordPayment: (supplierId, amount, paymentMode, note) => {
    const { suppliers, transactions } = get();
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const newBalance = Math.max(0, Math.round((sup.balance - amount) * 100) / 100);
    const newTotalPaid = Math.round(((sup.totalPaid || 0) + amount) * 100) / 100;

    const newTx: SupplierTransaction = {
      id: `tx_pay_${Date.now()}`,
      storeId: sup.storeId,
      supplierId,
      type: 'PAYMENT',
      amount,
      balanceAfter: newBalance,
      paymentMode,
      note: note || `Paid ₹${amount.toFixed(2)} via ${paymentMode}`,
      createdAt: Date.now(),
    };

    set({
      suppliers: suppliers.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              balance: newBalance,
              totalPaid: newTotalPaid,
              updatedAt: Date.now(),
            }
          : s
      ),
      transactions: [newTx, ...transactions],
    });
  },

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

  getSupplierTransactions: (supplierId: string) => {
    return get().transactions.filter((t) => t.supplierId === supplierId);
  },

  getSupplierPurchases: (supplierId: string) => {
    return get().purchases.filter((p) => p.supplierId === supplierId);
  },
}));
