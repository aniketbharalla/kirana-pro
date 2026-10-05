import { ProductUnit } from './product';

export interface PurchaseItem {
  productId?: string;
  productName: string;
  barcode?: string;
  hsnCode?: string;
  quantity: number;
  innerQty?: number;
  totalQty: number;
  uom: string;
  uomMapped: ProductUnit;
  rate: number;
  grossAmt: number;
  discount: number;
  taxableAmt: number;
  cgstRate: number;
  cgstAmt: number;
  sgstRate: number;
  sgstAmt: number;
  totalAmt: number;
  isNewProduct: boolean;
  confidence: number;
}

export interface PurchaseInvoice {
  id: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: number;
  imageURL?: string;
  items: PurchaseItem[];
  subtotal: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  totalTax: number;
  roundOff: number;
  netPayable: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  paidAmt: number;
  createdBy: string;
  createdAt: number;
}

export interface PurchaseInvoiceDraft {
  supplierName?: string;
  supplierPhone?: string;
  supplierGstin?: string;
  supplierAddress?: string;
  invoiceNo?: string;
  items: PurchaseItem[];
  subtotal: number;
  totalCGST: number;
  totalSGST: number;
  netPayable: number;
  confidence: number;
}
