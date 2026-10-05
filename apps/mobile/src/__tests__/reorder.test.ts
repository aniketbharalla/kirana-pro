import {
  calculateSalesVelocity,
  computeReorderRecommendations,
  formatWhatsAppPurchaseOrder,
  generateWhatsAppOrderUrl,
} from '../services/reorder';
import { Product, Invoice } from '@kirana-pro/shared';

describe('ReorderService', () => {
  const mockProducts: Product[] = [
    {
      id: 'p1',
      storeId: 'store_1',
      name: 'Maggi 70g',
      category: 'snacks_namkeen',
      barcode: '8901058852331',
      purchasePrice: 11.5,
      sellingPrice: 14,
      gstRate: 12,
      unit: 'packet',
      isLoose: false,
      pricePerUnit: 14,
      currentStock: 2, // Low stock!
      minStockAlert: 10,
      imageURL: null,
      isActive: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'p2',
      storeId: 'store_1',
      name: 'Basmati Rice',
      category: 'rice_grains',
      barcode: null,
      purchasePrice: 40,
      sellingPrice: 50,
      gstRate: 0,
      unit: 'kg',
      isLoose: true,
      pricePerUnit: 50,
      currentStock: 100, // Plenty in stock
      minStockAlert: 15,
      imageURL: null,
      isActive: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv_1',
      invoiceNumber: 'INV-1',
      storeId: 'store_1',
      items: [
        {
          productId: 'p1',
          name: 'Maggi 70g',
          unit: 'packet',
          isLoose: false,
          quantity: 14, // 14 units sold in 7 days = 2 units/day
          unitPrice: 14,
          discount: 0,
          gstRate: 0,
          taxableAmount: 196,
          gstAmount: 0,
          totalAmount: 196,
        },
      ],
      subtotal: 196,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 196,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      amountPaid: 196,
      amountDue: 0,
      createdAt: '2026-10-05T12:00:00.000Z',
      createdBy: 'cashier',
    },
  ];

  test('calculates sales velocity correctly', () => {
    const refDate = new Date('2026-10-06T00:00:00.000Z');
    const velocityMap = calculateSalesVelocity(mockInvoices, 7, refDate);
    // 14 packets / 7 days = 2.0 packets/day
    expect(velocityMap.get('p1')).toBe(2);
  });

  test('computes reorder urgency and recommended batch size', () => {
    const refDate = new Date('2026-10-06T00:00:00.000Z');
    const summary = computeReorderRecommendations(mockProducts, mockInvoices, 7, refDate);

    const maggiRec = summary.recommendations.find((r) => r.product.id === 'p1');
    expect(maggiRec).toBeDefined();
    // currentStock = 2, velocity = 2/day -> days remaining = 1 day (CRITICAL)
    expect(maggiRec?.daysRemaining).toBe(1);
    expect(maggiRec?.urgency).toBe('CRITICAL');
    expect(maggiRec?.suggestedQty).toBeGreaterThan(0);

    const riceRec = summary.recommendations.find((r) => r.product.id === 'p2');
    expect(riceRec?.urgency).toBe('SUFFICIENT');
  });

  test('formats structured WhatsApp purchase order message', () => {
    const msg = formatWhatsAppPurchaseOrder(
      'Sharma Kirana Store',
      'Ramesh Wholesale',
      [
        { name: 'Maggi 70g', quantity: 24, unit: 'packet' },
        { name: 'Tata Salt 1kg', quantity: 15, unit: 'packet' },
      ],
      'Please dispatch by 4 PM.'
    );

    expect(msg).toContain('Sharma Kirana Store - PURCHASE ORDER');
    expect(msg).toContain('Ramesh Wholesale');
    expect(msg).toContain('Maggi 70g');
    expect(msg).toContain('24 packet');
    expect(msg).toContain('Please dispatch by 4 PM.');
  });

  test('generates valid WhatsApp order URL', () => {
    const url = generateWhatsAppOrderUrl('9876543210', 'Test PO Message');
    expect(url).toContain('https://wa.me/919876543210');
    expect(url).toContain(encodeURIComponent('Test PO Message'));
  });
});
