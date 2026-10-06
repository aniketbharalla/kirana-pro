import { useProductStore } from '../store/productStore';
import { addProduct } from '../services/product';
import { createInvoice } from '../services/invoice';
import {
  enqueuePendingProduct,
  getPendingProducts,
  clearPendingProducts,
  enqueuePendingInvoice,
  getPendingInvoices,
  clearPendingInvoices,
  enqueuePendingStockMove,
  getPendingStockMoves,
  clearPendingStockMoves,
  getPendingSyncSummary,
  syncAllToCloud,
} from '../services/localStore';

describe('Local-First Storage & Billing Stock Deduction', () => {
  const storeId = 'test_store_123';

  beforeEach(async () => {
    await clearPendingProducts(storeId);
    await clearPendingInvoices(storeId);
    await clearPendingStockMoves(storeId);
  });

  describe('Product addition local-first', () => {
    it('saves scanned product locally and marks it in pending cloud sync queue', async () => {
      const newProd = await addProduct(
        storeId,
        {
          name: 'Parle-G Biscuit 100g',
          category: 'biscuits',
          barcode: '8901719101010',
          purchasePrice: 8,
          sellingPrice: 10,
          gstRate: 0,
          unit: 'packet',
          isLoose: false,
          pricePerUnit: 10,
          currentStock: 25,
          minStockAlert: 5,
          imageURL: null,
          isActive: true,
        },
        'user_test'
      );

      // Verify product added to Zustand store
      const products = useProductStore.getState().products;
      const found = products.find((p) => p.barcode === '8901719101010');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Parle-G Biscuit 100g');
      expect(found?.currentStock).toBe(25);

      // Verify product is in pending sync queue for Dukaan cloud sync
      const pending = await getPendingProducts(storeId);
      expect(pending.some((p) => p.id === newProd.id)).toBe(true);
    });
  });

  describe('Billing stock deduction', () => {
    it('deducts product stock immediately when invoice is created', async () => {
      // 1. Seed product in store
      const testItem = await addProduct(
        storeId,
        {
          name: 'Colgate Strong Teeth 100g',
          category: 'oral_care',
          barcode: '8901314010101',
          purchasePrice: 45,
          sellingPrice: 55,
          gstRate: 18,
          unit: 'packet',
          isLoose: false,
          pricePerUnit: 55,
          currentStock: 20,
          minStockAlert: 5,
          imageURL: null,
          isActive: true,
        },
        'user_test'
      );

      // 2. Create invoice for 3 units
      const invoice = await createInvoice(
        storeId,
        {
          invoiceNumber: 'INV-TEST-001',
          storeId,
          items: [
            {
              productId: testItem.id,
              name: testItem.name,
              unit: 'packet',
              isLoose: false,
              quantity: 3,
              unitPrice: 55,
              discount: 0,
              gstRate: 18,
              taxableAmount: 165,
              gstAmount: 0,
              totalAmount: 165,
            },
          ],
          subtotal: 165,
          discountTotal: 0,
          taxTotal: 0,
          grandTotal: 165,
          paymentMode: 'cash',
          paymentStatus: 'paid',
          amountPaid: 165,
          amountDue: 0,
          createdBy: 'user_test',
        },
        'user_test'
      );

      expect(invoice.id).toBeDefined();

      // 3. Verify stock in Zustand was deducted from 20 to 17
      const updatedProducts = useProductStore.getState().products;
      const updatedItem = updatedProducts.find((p) => p.id === testItem.id);
      expect(updatedItem?.currentStock).toBe(17);

      // 4. Verify invoice is queued locally for Dukaan Cloud Sync
      const pendingInvoices = await getPendingInvoices(storeId);
      expect(pendingInvoices.some((inv) => inv.id === invoice.id)).toBe(true);
    });
  });

  describe('Dukaan Cloud Sync queues & summary', () => {
    it('calculates pending sync summary accurately', async () => {
      await enqueuePendingProduct(storeId, { id: 'p1', name: 'Item 1' });
      await enqueuePendingInvoice(storeId, { id: 'inv1', grandTotal: 100 });
      await enqueuePendingStockMove(storeId, {
        productId: 'p1',
        type: 'out',
        quantity: 2,
        reason: 'sale',
        performedBy: 'u1',
        timestamp: new Date().toISOString(),
      });

      const summary = await getPendingSyncSummary(storeId);
      expect(summary.total).toBe(3);
      expect(summary.products).toBe(1);
      expect(summary.invoices).toBe(1);
      expect(summary.stockMoves).toBe(1);
    });
  });
});
