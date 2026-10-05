import { z } from 'zod';

export const storeTypeSchema = z.enum([
  'kirana',
  'general',
  'medical',
  'dairy',
  'other',
]);

export const storeAddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});

export const storeSettingsSchema = z.object({
  currency: z.literal('INR').default('INR'),
  weightUnit: z.enum(['kg', 'g']).default('kg'),
  defaultTaxRate: z.number().default(0),
  invoicePrefix: z.string().default('INV-'),
  invoiceCounter: z.number().default(1),
});

export const storeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Store name is required'),
  type: storeTypeSchema,
  customType: z.string().optional(),
  address: storeAddressSchema,
  gstNumber: z.string().nullable().optional(),
  logoURL: z.string().url().nullable().optional(),
  ownerId: z.string().min(1, 'Owner ID is required'),
  staffIds: z.array(z.string()).default([]),
  settings: storeSettingsSchema.default({
    currency: 'INR',
    weightUnit: 'kg',
    defaultTaxRate: 0,
    invoicePrefix: 'INV-',
    invoiceCounter: 1,
  }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type StoreInput = z.infer<typeof storeSchema>;
