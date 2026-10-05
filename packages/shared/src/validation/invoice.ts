import { z } from 'zod';

export const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Product name is required'),
  nameHindi: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unit is required'),
  isLoose: z.boolean().default(false),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  discount: z.number().nonnegative('Discount cannot be negative').default(0),
  gstRate: z.number().nonnegative('GST rate cannot be negative'),
  taxableAmount: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  storeId: z.string().min(1, 'Store ID is required'),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item'),
  subtotal: z.number().nonnegative(),
  discountTotal: z.number().nonnegative().default(0),
  taxTotal: z.number().nonnegative().default(0),
  grandTotal: z.number().nonnegative(),
  paymentMode: z.enum(['cash', 'upi', 'credit', 'split']),
  paymentStatus: z.enum(['paid', 'partial', 'unpaid']),
  amountPaid: z.number().nonnegative(),
  amountDue: z.number().nonnegative(),
  customer: z
    .object({
      id: z.string().optional(),
      name: z.string().min(1),
      phoneNumber: z.string().optional(),
    })
    .optional(),
  cashTendered: z.number().optional(),
  changeDue: z.number().optional(),
  notes: z.string().optional(),
  createdBy: z.string().min(1, 'Created by is required'),
});

export const customerKhataSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number'),
  address: z.string().optional(),
  creditLimit: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
