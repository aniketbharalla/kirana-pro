export type ProductUnit = 'kg' | 'g' | 'liter' | 'ml' | 'piece' | 'packet' | 'dozen' | 'box';

export interface Product {
  id: string;
  storeId: string;
  name: string;
  nameHindi?: string;
  category: string;
  barcode: string | null;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number; // 0, 5, 12, 18, 28
  unit: ProductUnit;
  isLoose: boolean;
  pricePerUnit: number;
  currentStock: number;
  minStockAlert: number;
  imageURL: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
