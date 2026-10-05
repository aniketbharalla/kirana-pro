export type SupplierType = 'Wholesaler' | 'Distributor' | 'Direct';

export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  city?: string;
  contactPerson?: string;
  type: SupplierType;
  totalPurchases: number;
  totalPaid: number;
  balance: number;
  invoiceCount: number;
  createdAt: number;
  updatedAt: number;
}

export type SupplierTxnType = 'PURCHASE_INVOICE' | 'PAYMENT';

export interface SupplierTransaction {
  id: string;
  storeId: string;
  supplierId: string;
  type: SupplierTxnType;
  amount: number;
  balanceAfter: number;
  invoiceNo?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Bank' | 'Cheque';
  referenceNo?: string;
  note?: string;
  createdAt: number;
}
