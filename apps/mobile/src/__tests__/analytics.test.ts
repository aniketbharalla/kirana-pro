import {
  filterInvoicesByDateRange,
  computeSalesAndProfitSummary,
  computePaymentBreakdown,
  computeTopAndSlowProducts,
  computeGSTTaxReport,
} from '../services/analytics';
import { Invoice, Product } from '@kirana-pro/shared';

describe('AnalyticsService', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod_1',
      storeId: 'store_1',
      name: 'Aashirvaad Atta 5kg',
      category: 'atta_flour',
      barcode: '8901030000001',
      purchasePrice: 200,
      sellingPrice: 250,
      gstRate: 0,
      unit: 'packet',
      isLoose: false,
      pricePerUnit: 250,
      currentStock: 10,
      minStockAlert: 5,
      imageURL: null,
      isActive: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'prod_2',
      storeId: 'store_1',
      name: 'Tata Salt 1kg',
      category: 'spices_masala',
      barcode: '8901030000002',
      purchasePrice: 20,
      sellingPrice: 28,
      gstRate: 5,
      unit: 'packet',
      isLoose: false,
      pricePerUnit: 28,
      currentStock: 2,
      minStockAlert: 5,
      imageURL: null,
      isActive: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv_1',
      invoiceNumber: 'INV-001',
      storeId: 'store_1',
      items: [
        {
          productId: 'prod_1',
          name: 'Aashirvaad Atta 5kg',
          unit: 'packet',
          isLoose: false,
          quantity: 2,
          unitPrice: 250,
          discount: 0,
          gstRate: 0,
          taxableAmount: 500,
          gstAmount: 0,
          totalAmount: 500,
        },
      ],
      subtotal: 500,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 500,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      amountPaid: 500,
      amountDue: 0,
      createdAt: '2026-10-06T10:00:00.000Z',
      createdBy: 'cashier',
    },
    {
      id: 'inv_2',
      invoiceNumber: 'INV-002',
      storeId: 'store_1',
      items: [
        {
          productId: 'prod_2',
          name: 'Tata Salt 1kg',
          unit: 'packet',
          isLoose: false,
          quantity: 5,
          unitPrice: 28,
          discount: 0,
          gstRate: 5,
          taxableAmount: 133.33,
          gstAmount: 6.67,
          totalAmount: 140,
        },
      ],
      subtotal: 140,
      discountTotal: 0,
      taxTotal: 6.67,
      grandTotal: 140,
      paymentMode: 'upi',
      paymentStatus: 'paid',
      amountPaid: 140,
      amountDue: 0,
      createdAt: '2026-10-06T11:00:00.000Z',
      createdBy: 'cashier',
    },
  ];

  test('filters invoices by today, week, and month', () => {
    const ref = new Date('2026-10-06T12:00:00.000Z');
    const todayInvs = filterInvoicesByDateRange(mockInvoices, 'today', ref);
    expect(todayInvs.length).toBe(2);

    const weekInvs = filterInvoicesByDateRange(mockInvoices, 'week', ref);
    expect(weekInvs.length).toBe(2);
  });

  test('computes gross sales, COGS, and net profit correctly', () => {
    const summary = computeSalesAndProfitSummary(mockInvoices, mockProducts);
    // Gross sales: 500 + 140 = 640
    expect(summary.grossSales).toBe(640);
    // COGS: (2 * 200) + (5 * 20) = 400 + 100 = 500
    expect(summary.totalCOGS).toBe(500);
    // Net profit: 640 - 500 = 140
    expect(summary.netProfit).toBe(140);
    // Profit margin: (140 / 640) * 100 = 21.9%
    expect(summary.profitMarginPercent).toBe(21.9);
    expect(summary.invoiceCount).toBe(2);
    expect(summary.averageBillValue).toBe(320);
  });

  test('computes payment breakdown across cash, upi, and credit', () => {
    const breakdown = computePaymentBreakdown(mockInvoices);
    expect(breakdown.cash).toBe(500);
    expect(breakdown.upi).toBe(140);
    expect(breakdown.credit).toBe(0);
    expect(breakdown.total).toBe(640);
    expect(breakdown.cashPercent).toBe(78);
    expect(breakdown.upiPercent).toBe(22);
  });

  test('identifies bestsellers and slow-moving items', () => {
    const { topSelling, slowMoving } = computeTopAndSlowProducts(mockInvoices, mockProducts);
    expect(topSelling[0].name).toBe('Tata Salt 1kg');
    expect(topSelling[0].unitsSold).toBe(5);
    expect(topSelling[1].name).toBe('Aashirvaad Atta 5kg');
    expect(topSelling[1].unitsSold).toBe(2);
    expect(slowMoving.length).toBeGreaterThan(0);
  });

  test('computes GST tax slabs correctly', () => {
    const report = computeGSTTaxReport(mockInvoices);
    expect(report.totalTaxCollected).toBe(6.67);
    const slab5 = report.slabs.find((s) => s.gstRate === 5);
    expect(slab5).toBeDefined();
    expect(slab5?.totalTax).toBe(6.67);
  });
});
