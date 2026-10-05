import { useProductStore } from '../store/productStore';
import { Product } from '@kirana-pro/shared';

describe('productStore', () => {
  const p1: Product = {
    id: 'prod_1',
    storeId: 'store_1',
    name: 'Aashirvaad Atta 5kg',
    category: 'atta-flour',
    barcode: '8901030000001',
    purchasePrice: 220,
    sellingPrice: 250,
    gstRate: 0,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 250,
    currentStock: 2,
    minStockAlert: 5, // Low stock!
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z',
  };

  const p2: Product = {
    id: 'prod_2',
    storeId: 'store_1',
    name: 'Tata Salt 1kg',
    category: 'spices-masala',
    barcode: '8901030000002',
    purchasePrice: 20,
    sellingPrice: 28,
    gstRate: 0,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 28,
    currentStock: 30,
    minStockAlert: 10, // Healthy stock
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z',
  };

  const p3: Product = {
    id: 'prod_3',
    storeId: 'store_1',
    name: 'Loose Basmati Chawal',
    category: 'rice',
    barcode: null,
    purchasePrice: 40,
    sellingPrice: 50,
    gstRate: 0,
    unit: 'kg',
    isLoose: true,
    pricePerUnit: 50,
    currentStock: 100,
    minStockAlert: 20,
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z',
  };

  beforeEach(() => {
    useProductStore.getState().setProducts([]);
    useProductStore.getState().setSearchQuery('');
    useProductStore.getState().setSelectedCategory(null);
  });

  it('initializes with empty products array', () => {
    const state = useProductStore.getState();
    expect(state.products).toEqual([]);
    expect(state.getLowStockProducts()).toEqual([]);
  });

  it('setProducts updates products and derives lowStockProducts correctly', () => {
    useProductStore.getState().setProducts([p1, p2, p3]);
    const state = useProductStore.getState();
    expect(state.products.length).toBe(3);

    const lowStock = state.getLowStockProducts();
    expect(lowStock.length).toBe(1);
    expect(lowStock[0].id).toBe('prod_1');
  });

  it('filterByCategory returns only products in that category', () => {
    useProductStore.getState().setProducts([p1, p2, p3]);
    useProductStore.getState().setSelectedCategory('rice');
    const filtered = useProductStore.getState().getFilteredProducts();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('prod_3');
  });

  it('searchProducts filters by name and barcode substring case-insensitively', () => {
    useProductStore.getState().setProducts([p1, p2, p3]);
    useProductStore.getState().setSearchQuery('atta');
    const filteredByName = useProductStore.getState().getFilteredProducts();
    expect(filteredByName.length).toBe(1);
    expect(filteredByName[0].name).toBe('Aashirvaad Atta 5kg');

    useProductStore.getState().setSearchQuery('8901030000002');
    const filteredByBarcode = useProductStore.getState().getFilteredProducts();
    expect(filteredByBarcode.length).toBe(1);
    expect(filteredByBarcode[0].name).toBe('Tata Salt 1kg');
  });

  it('getLooseProducts returns only items with isLoose: true for Taraju scale', () => {
    useProductStore.getState().setProducts([p1, p2, p3]);
    const loose = useProductStore.getState().getLooseProducts();
    expect(loose.length).toBe(1);
    expect(loose[0].id).toBe('prod_3');
  });
});
