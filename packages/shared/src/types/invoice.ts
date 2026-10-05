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
  cashTendered?: number;
  changeDue?: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}
