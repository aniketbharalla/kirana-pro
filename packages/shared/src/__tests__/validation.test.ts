import { productSchema } from '../validation/product';
import { storeSchema } from '../validation/store';

describe('productSchema', () => {
  it('accepts valid product with all required fields', () => {
    const validProduct = {
      storeId: 'store_123',
      name: 'Toor Dal',
      category: 'dal_pulses',
      purchasePrice: 100,
      sellingPrice: 120,
      gstRate: 5,
      unit: 'kg',
      isLoose: true,
      pricePerUnit: 120,
      currentStock: 25,
      minStockAlert: 5,
      isActive: true,
    };
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('rejects product with negative sellingPrice', () => {
    const invalidProduct = {
      storeId: 'store_123',
      name: 'Toor Dal',
      category: 'dal_pulses',
      purchasePrice: 100,
      sellingPrice: -10,
      gstRate: 5,
      unit: 'kg',
      isLoose: false,
      pricePerUnit: 0,
      currentStock: 10,
      minStockAlert: 2,
    };
    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects product with invalid unit', () => {
    const invalidProduct = {
      storeId: 'store_123',
      name: 'Toor Dal',
      category: 'dal_pulses',
      purchasePrice: 100,
      sellingPrice: 50,
      gstRate: 5,
      unit: 'bushel',
      isLoose: false,
      pricePerUnit: 50,
      currentStock: 10,
      minStockAlert: 2,
    };
    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('rejects product with invalid gstRate', () => {
    const invalidProduct = {
      storeId: 'store_123',
      name: 'Toor Dal',
      category: 'dal_pulses',
      purchasePrice: 100,
      sellingPrice: 50,
      gstRate: 7, // Invalid GST slab
      unit: 'kg',
      isLoose: false,
      pricePerUnit: 50,
      currentStock: 10,
      minStockAlert: 2,
    };
    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});

describe('storeSchema', () => {
  it('accepts valid store with required fields', () => {
    const validStore = {
      name: 'Sharma Kirana Store',
      type: 'kirana',
      address: {
        street: 'Main Bazaar',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
      },
      gstNumber: '07AAAAA0000A1Z5',
      ownerId: 'owner_uid_123',
      settings: {
        currency: 'INR',
        weightUnit: 'kg',
        defaultTaxRate: 5,
        invoicePrefix: 'INV-',
        invoiceCounter: 1,
      },
    };
    const result = storeSchema.safeParse(validStore);
    expect(result.success).toBe(true);
  });

  it('rejects store without name', () => {
    const invalidStore = {
      name: '',
      type: 'kirana',
      address: {
        street: 'Main Bazaar',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
      },
      ownerId: 'owner_uid_123',
    };
    const result = storeSchema.safeParse(invalidStore);
    expect(result.success).toBe(false);
  });

  it('accepts store with optional gstNumber null', () => {
    const storeNoGst = {
      name: 'Chacha ki Dukaan',
      type: 'kirana',
      address: {
        street: 'Gali 4',
        city: 'Meerut',
        state: 'Uttar Pradesh',
        pincode: '250001',
      },
      gstNumber: null,
      ownerId: 'owner_uid_123',
    };
    const result = storeSchema.safeParse(storeNoGst);
    expect(result.success).toBe(true);
  });

  it('rejects store with invalid pincode', () => {
    const invalidPincode = {
      name: 'Chacha ki Dukaan',
      type: 'kirana',
      address: {
        street: 'Gali 4',
        city: 'Meerut',
        state: 'Uttar Pradesh',
        pincode: 'abc45', // Invalid
      },
      ownerId: 'owner_uid_123',
    };
    const result = storeSchema.safeParse(invalidPincode);
    expect(result.success).toBe(false);
  });
});
