import { useCartStore } from '../store/cartStore';
import { Product } from '@kirana-pro/shared';

const mockProduct: Product = {
  id: 'prod_1',
  storeId: 'store_1',
  name: 'Aashirvaad Atta 5kg',
  nameHindi: 'आशीर्वाद आटा',
  category: 'atta-flour',
  barcode: '8901030000001',
  purchasePrice: 220,
  sellingPrice: 250,
  gstRate: 0,
  unit: 'packet',
  isLoose: false,
  pricePerUnit: 250,
  currentStock: 10,
  minStockAlert: 2,
  imageURL: null,
  isActive: true,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

describe('Cart Store (POS)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('initializes with empty cart and zero totals', () => {
    const { items, totals } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(totals.grandTotal).toBe(0);
  });

  it('adds a product to cart and updates subtotal', () => {
    useCartStore.getState().addItem(mockProduct, 1);
    const { items, totals } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(totals.grandTotal).toBe(250);
  });

  it('increments quantity when existing product is added again', () => {
    useCartStore.getState().addItem(mockProduct, 1);
    useCartStore.getState().addItem(mockProduct, 2);
    const { items, totals } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
    expect(totals.grandTotal).toBe(750);
  });

  it('updates item quantity and removes item when set to 0', () => {
    useCartStore.getState().addItem(mockProduct, 2);
    useCartStore.getState().updateQuantity('prod_1', 4);
    expect(useCartStore.getState().items[0].quantity).toBe(4);

    useCartStore.getState().updateQuantity('prod_1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('applies order-level discount correctly', () => {
    useCartStore.getState().addItem(mockProduct, 2); // 500
    useCartStore.getState().setOrderDiscount(50);
    const { totals } = useCartStore.getState();
    expect(totals.subtotal).toBe(500);
    expect(totals.discountTotal).toBe(50);
    expect(totals.grandTotal).toBe(450);
  });
});
