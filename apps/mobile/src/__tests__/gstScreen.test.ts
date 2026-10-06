import {
  generateGSTTaxSummary,
  generateGSTR1JSON,
  exportGSTReportCSV,
  Invoice,
} from '@kirana-pro/shared';

describe('GST Invoicing & Tax Calculations', () => {
  const sampleInvoices: Invoice[] = [
    {
      id: 'inv_1',
      invoiceNumber: 'INV-2026-001',
      storeId: 'demo_store_1',
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
          hsnCode: '1101',
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
      createdBy: 'cashier_1',
      counterNumber: 1,
      staffName: 'Rohan Sharma',
    },
    {
      id: 'inv_2',
      invoiceNumber: 'INV-2026-002',
      storeId: 'demo_store_1',
      items: [
        {
          productId: 'prod_2',
          name: 'Tata Tea Gold 500g',
          unit: 'packet',
          isLoose: false,
          quantity: 2,
          unitPrice: 280,
          discount: 0,
          gstRate: 5,
          hsnCode: '0902',
          taxableAmount: 533.33,
          gstAmount: 26.67,
          totalAmount: 560,
        },
      ],
      subtotal: 533.33,
      discountTotal: 0,
      taxTotal: 26.67,
      grandTotal: 560,
      paymentMode: 'upi',
      paymentStatus: 'paid',
      amountPaid: 560,
      amountDue: 0,
      customer: {
        name: 'Sharma Sweets',
        gstin: '07AABCK1234F1Z5',
      },
      customerGstin: '07AABCK1234F1Z5',
      isB2B: true,
      createdAt: '2026-10-06T11:00:00.000Z',
      createdBy: 'cashier_2',
      counterNumber: 2,
      staffName: 'Amit Patel',
    },
  ];

  it('computes accurate tax totals, CGST, SGST, and B2B/B2C ratio', () => {
    const summary = generateGSTTaxSummary(sampleInvoices, 'October 2026');

    expect(summary.totalInvoices).toBe(2);
    expect(summary.totalGrossSales).toBe(1060); // 500 + 560
    expect(summary.totalTax).toBe(26.68);
    expect(summary.totalCgst).toBe(13.34);
    expect(summary.totalSgst).toBe(13.34);

    expect(summary.b2bCount).toBe(1);
    expect(summary.b2bTaxable).toBe(533.33);

    expect(summary.b2cCount).toBe(1);
    expect(summary.b2cTaxable).toBe(500);

    // HSN aggregation
    expect(summary.hsnSummary.length).toBe(2);
    const attaHsn = summary.hsnSummary.find((h) => h.hsnCode === '1101');
    expect(attaHsn?.totalQty).toBe(2);
  });

  it('generates GSTR-1 government return JSON with valid structure', () => {
    const gstr1 = generateGSTR1JSON(
      { gstin: '07AABCK9999F1Z1', stateCode: '07' },
      sampleInvoices,
      '102026'
    );

    expect(gstr1.gstin).toBe('07AABCK9999F1Z1');
    expect(gstr1.fp).toBe('102026');
    expect(gstr1.b2b.length).toBe(1);
    expect(gstr1.b2b[0].ctin).toBe('07AABCK1234F1Z5');
    expect(gstr1.b2cs.length).toBe(1);
    expect(gstr1.hsn.data.length).toBe(2);
  });

  it('exports CSV with invoice-level cashier attribution and B2B tagging', () => {
    const csv = exportGSTReportCSV(sampleInvoices);
    expect(csv).toContain('INV-2026-001');
    expect(csv).toContain('INV-2026-002');
    expect(csv).toContain('Counter 1');
    expect(csv).toContain('Counter 2');
    expect(csv).toContain('Rohan Sharma');
    expect(csv).toContain('Amit Patel');
    expect(csv).toContain('B2B');
    expect(csv).toContain('B2C');
  });
});
