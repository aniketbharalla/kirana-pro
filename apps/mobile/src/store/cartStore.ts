import { create } from 'zustand';
import {
  Product,
  InvoiceItem,
  calculateItemGST,
  calculateInvoiceTotals,
  InvoiceCustomer,
  PaymentMode,
} from '@kirana-pro/shared';

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export interface CartState {
  items: InvoiceItem[];
  orderDiscount: number;
  customer: InvoiceCustomer | null;
  paymentMode: PaymentMode;
  cashTendered: number;
  totals: CartTotals;

  addItem: (product: Product, quantity?: number, customPrice?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItemDiscount: (productId: string, discount: number) => void;
  removeItem: (productId: string) => void;
  setOrderDiscount: (discount: number) => void;
  setCustomer: (customer: InvoiceCustomer | null) => void;
  setPaymentMode: (mode: PaymentMode) => void;
  setCashTendered: (tendered: number) => void;
  clearCart: () => void;
  getChangeDue: () => number;
}

const computeTotals = (items: InvoiceItem[], orderDiscount: number): CartTotals => {
  return calculateInvoiceTotals(items, orderDiscount);
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orderDiscount: 0,
  customer: null,
  paymentMode: 'cash',
  cashTendered: 0,
  totals: {
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 0,
  },

  addItem: (product, quantity = 1, customPrice) => {
    const { items, orderDiscount } = get();
    const existingIndex = items.findIndex((i) => i.productId === product.id);
    const unitPrice = customPrice !== undefined ? customPrice : product.sellingPrice;
    const gstRate = product.gstRate || 0;

    let updatedItems: InvoiceItem[];

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      const newQty = Math.round((existing.quantity + quantity) * 1000) / 1000;
      const math = calculateItemGST(unitPrice, newQty, gstRate, existing.discount);

      updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        unitPrice,
        taxableAmount: math.taxableAmount,
        gstAmount: math.gstAmount,
        totalAmount: math.totalAmount,
      };
    } else {
      const math = calculateItemGST(unitPrice, quantity, gstRate, 0);
      const newItem: InvoiceItem = {
        productId: product.id,
        name: product.name,
        nameHindi: product.nameHindi,
        unit: product.unit,
        isLoose: product.isLoose,
        quantity,
        unitPrice,
        discount: 0,
        gstRate,
        taxableAmount: math.taxableAmount,
        gstAmount: math.gstAmount,
        totalAmount: math.totalAmount,
      };
      updatedItems = [newItem, ...items];
    }

    set({
      items: updatedItems,
      totals: computeTotals(updatedItems, orderDiscount),
    });
  },

  updateQuantity: (productId, quantity) => {
    const { items, orderDiscount } = get();
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const updatedItems = items.map((item) => {
      if (item.productId === productId) {
        const math = calculateItemGST(item.unitPrice, quantity, item.gstRate, item.discount);
        return {
          ...item,
          quantity,
          taxableAmount: math.taxableAmount,
          gstAmount: math.gstAmount,
          totalAmount: math.totalAmount,
        };
      }
      return item;
    });

    set({
      items: updatedItems,
      totals: computeTotals(updatedItems, orderDiscount),
    });
  },

  setItemDiscount: (productId, discount) => {
    const { items, orderDiscount } = get();
    const updatedItems = items.map((item) => {
      if (item.productId === productId) {
        const math = calculateItemGST(item.unitPrice, item.quantity, item.gstRate, discount);
        return {
          ...item,
          discount,
          taxableAmount: math.taxableAmount,
          gstAmount: math.gstAmount,
          totalAmount: math.totalAmount,
        };
      }
      return item;
    });

    set({
      items: updatedItems,
      totals: computeTotals(updatedItems, orderDiscount),
    });
  },

  removeItem: (productId) => {
    const { items, orderDiscount } = get();
    const updatedItems = items.filter((i) => i.productId !== productId);
    set({
      items: updatedItems,
      totals: computeTotals(updatedItems, orderDiscount),
    });
  },

  setOrderDiscount: (discount) => {
    const { items } = get();
    set({
      orderDiscount: discount,
      totals: computeTotals(items, discount),
    });
  },

  setCustomer: (customer) => set({ customer }),
  setPaymentMode: (paymentMode) => set({ paymentMode }),
  setCashTendered: (cashTendered) => set({ cashTendered }),

  clearCart: () =>
    set({
      items: [],
      orderDiscount: 0,
      customer: null,
      paymentMode: 'cash',
      cashTendered: 0,
      totals: {
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
      },
    }),

  getChangeDue: () => {
    const { cashTendered, totals } = get();
    if (cashTendered <= totals.grandTotal) return 0;
    return Math.round((cashTendered - totals.grandTotal) * 100) / 100;
  },
}));
