import { z } from 'zod';
import { productUnitSchema } from './product';

export const purchaseItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  barcode: z.string().optional(),
  hsnCode: z.string().optional(),
  quantity: z.number().positive(),
  innerQty: z.number().positive().optional(),
  totalQty: z.number().positive(),
  uom: z.string(),
  uomMapped: productUnitSchema,
  rate: z.number().nonnegative(),
  grossAmt: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  taxableAmt: z.number().nonnegative(),
  cgstRate: z.number().nonnegative().default(2.5),
  cgstAmt: z.number().nonnegative().default(0),
  sgstRate: z.number().nonnegative().default(2.5),
  sgstAmt: z.number().nonnegative().default(0),
  totalAmt: z.number().nonnegative(),
  isNewProduct: z.boolean().default(false),
  confidence: z.number().min(0).max(100).default(100),
});

export const purchaseInvoiceSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  invoiceNo: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.number(),
  imageURL: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().nonnegative(),
  totalDiscount: z.number().nonnegative().default(0),
  totalCGST: z.number().nonnegative().default(0),
  totalSGST: z.number().nonnegative().default(0),
  totalTax: z.number().nonnegative().default(0),
  roundOff: z.number().default(0),
  netPayable: z.number().nonnegative(),
  paymentStatus: z.enum(['Paid', 'Unpaid', 'Partial']),
  paidAmt: z.number().nonnegative().default(0),
});
