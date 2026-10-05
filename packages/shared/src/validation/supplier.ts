import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  contactPerson: z.string().optional(),
  type: z.enum(['Wholesaler', 'Distributor', 'Direct']),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
