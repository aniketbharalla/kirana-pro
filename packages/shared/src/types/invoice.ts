export interface InvoiceItem {
  productId: string;
  name: string;
  nameHindi?: string;
  unit: string;
  isLoose: boolean;
  quantity: number;
  unitPrice: number;
  discount: number;       // Discount in INR for this line item
  gstRate: number;        // 0, 5, 12, 18, 28
  hsnCode?: string;       // 4 or 6-digit HSN code (e.g. "1006" for rice, "1905" for bakery)
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export type PaymentMode = 'cash' | 'upi' | 'credit' | 'split';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface InvoiceCustomer {
  id?: string;
  name: string;
  phoneNumber?: string;
  gstin?: string;         // Customer 15-character GSTIN for B2B billing
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  storeId: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  amountDue: number;
  customer?: InvoiceCustomer;
  customerGstin?: string;  // Customer GSTIN for B2B tax invoice
  isB2B?: boolean;         // True if B2B tax invoice with buyer GSTIN
  counterNumber?: number;  // POS Counter (e.g. 1, 2)
  staffId?: string;        // ID of cashier who billed
  staffName?: string;      // Name of cashier who billed
  cashTendered?: number;
  changeDue?: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}
