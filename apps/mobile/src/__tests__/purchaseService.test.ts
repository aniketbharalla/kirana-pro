import { PurchaseInvoice, Supplier } from '@kirana-pro/shared';
import { recordPurchaseInvoice } from '../services/purchase';
import { useProductStore } from '../store/productStore';
import { useSupplierStore } from '../store/supplierStore';

describe('purchaseService - recordPurchaseInvoice', () => {
  beforeEach(() => {
    useProductStore.getState().setProducts([
      {
        id: 'prod_1',
        storeId: 'store_1',
        name: 'Parle-G Gold 1kg',
        barcode: '8901234567890',
        category: 'Biscuits',
        currentStock: 10,
        unit: 'box',
        sellingPrice: 120,
        purchasePrice: 100,
        gstRate: 5,
        minStockAlert: 5,
        isActive: true,
        isLoose: false,
        pricePerUnit: 120,
        imageURL: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    useSupplierStore.getState().setSuppliers([
      {
        id: 'sup_1',
        storeId: 'store_1',
        name: 'N R ENTERPRISES',
        phone: '7415545631',
        type: 'Distributor',
        totalPurchases: 1000,
        totalPaid: 1000,
        balance: 0,
        invoiceCount: 1,
        createdAt: 1700000000,
        updatedAt: 1700000000,
      },
    ]);
  });

  it('increments stock of existing product and creates new product with 20% markup', async () => {
    const invoice: PurchaseInvoice = {
      id: 'inv_1',
      storeId: 'store_1',
      supplierId: 'sup_1',
      supplierName: 'N R ENTERPRISES',
      invoiceNo: 'NR/999',
      invoiceDate: Date.now(),
      items: [
        {
          productId: 'prod_1',
          productName: 'Parle-G Gold 1kg',
          quantity: 5,
          totalQty: 5,
          uom: 'BOX',
          uomMapped: 'box',
          rate: 100,
          grossAmt: 500,
          discount: 0,
          taxableAmt: 500,
          cgstRate: 2.5,
          cgstAmt: 12.5,
          sgstRate: 2.5,
          sgstAmt: 12.5,
          totalAmt: 525,
          isNewProduct: false,
          confidence: 90,
        },
        {
          productName: '20-20 Classic Butter 14.44g',
          quantity: 2,
          totalQty: 24, // derived from outer pack
          uom: 'PB',
          uomMapped: 'packet',
          rate: 4.25,
          grossAmt: 102.04,
          discount: 0,
          taxableAmt: 102.04,
          cgstRate: 2.5,
          cgstAmt: 2.55,
          sgstRate: 2.5,
          sgstAmt: 2.55,
          totalAmt: 107.14,
          isNewProduct: true,
          confidence: 85,
        },
      ],
      subtotal: 602.04,
      totalDiscount: 0,
      totalCGST: 15.05,
      totalSGST: 15.05,
      totalTax: 30.1,
      roundOff: 0.86,
      netPayable: 633,
      paymentStatus: 'Unpaid',
      paidAmt: 0,
      createdBy: 'user_1',
      createdAt: Date.now(),
    };

    await recordPurchaseInvoice('store_1', invoice);

    // Existing product stock incremented: 10 + 5 = 15
    const products = useProductStore.getState().products;
    const existing = products.find((p) => p.id === 'prod_1');
    expect(existing?.currentStock).toBe(15);

    // New product created with 20% markup: Math.round(4.25 * 1.2) = 5
    const newProd = products.find((p) => p.name === '20-20 Classic Butter 14.44g');
    expect(newProd).toBeDefined();
    expect(newProd?.currentStock).toBe(24);
    expect(newProd?.sellingPrice).toBe(5);

    // Supplier balance updated
    const suppliers = useSupplierStore.getState().suppliers;
    const sup = suppliers.find((s: Supplier) => s.id === 'sup_1');
    expect(sup?.balance).toBe(633);
    expect(sup?.invoiceCount).toBe(2);
  });
});
