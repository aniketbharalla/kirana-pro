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
