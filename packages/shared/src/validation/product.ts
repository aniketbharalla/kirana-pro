import { z } from 'zod';

export const productUnitSchema = z.enum([
  'kg',
  'g',
  'liter',
  'ml',
  'piece',
  'packet',
  'dozen',
  'box',
]);

export const gstRateSchema = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(12),
  z.literal(18),
  z.literal(28),
]);

export const productSchema = z.object({
  id: z.string().optional(),
  storeId: z.string().min(1, 'Store ID is required'),
  name: z.string().min(1, 'Product name is required'),
  nameHindi: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  barcode: z.string().nullable().optional(),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  gstRate: gstRateSchema,
  unit: productUnitSchema,
  isLoose: z.boolean().default(false),
  pricePerUnit: z.number().min(0, 'Price per unit cannot be negative').default(0),
  currentStock: z.number().default(0),
  minStockAlert: z.number().min(0).default(5),
  imageURL: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
