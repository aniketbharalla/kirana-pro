import {
  isValidGSTIN,
  generateGSTTaxSummary,
  generateGSTR1JSON,
  exportGSTReportCSV,
  formatGSTR1Date,
  mapUnitToUQC,
} from '../utils/gstr1';
import { Invoice } from '../types/invoice';

describe('GST & GSTR-1 Utilities', () => {
  describe('isValidGSTIN', () => {
    it('validates standard Indian 15-character GSTIN correctly', () => {
      expect(isValidGSTIN('07AABCK1234F1Z5')).toBe(true);
      expect(isValidGSTIN('27AAACB2212P1Z0')).toBe(true);
      expect(isValidGSTIN('08AABCB1234A1Z9')).toBe(true);
    });

    it('rejects invalid or malformed GSTINs', () => {
      expect(isValidGSTIN('')).toBe(false);
      expect(isValidGSTIN('12345')).toBe(false);
      expect(isValidGSTIN('07AABCK1234F1Z')).toBe(false); // 14 chars
      expect(isValidGSTIN('07AABCK1234F1Z59')).toBe(false); // 16 chars
      expect(isValidGSTIN('XXAABCK1234F1Z5')).toBe(false); // non-numeric state code
    });
  });

  describe('mapUnitToUQC', () => {
    it('maps retail packaging units to GST UQC codes', () => {
      expect(mapUnitToUQC('kg')).toBe('KGS');
      expect(mapUnitToUQC('packet')).toBe('PAC');
      expect(mapUnitToUQC('piece')).toBe('PCS');
      expect(mapUnitToUQC('liter')).toBe('LTR');
      expect(mapUnitToUQC('unknown')).toBe('OTH');
    });
  });

  const mockInvoices: Invoice[] = [
    {
      id: 'inv_1',
      invoiceNumber: 'INV-2026-001',
      storeId: 'store_1',
      items: [
        {
          productId: 'p1',
          name: 'Basmati Rice 5kg',
          unit: 'packet',
          isLoose: false,
          quantity: 2,
          unitPrice: 300,
          discount: 0,
          gstRate: 5,
          hsnCode: '1006',
          taxableAmount: 600,
          gstAmount: 30,
          totalAmount: 630,
        },
      ],
      subtotal: 600,
      discountTotal: 0,
      taxTotal: 30,
      grandTotal: 630,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      amountPaid: 630,
      amountDue: 0,
      customer: { name: 'Ramesh Sharma' },
      createdAt: '2026-10-06T10:00:00.000Z',
      createdBy: 'user_1',
      counterNumber: 1,
      staffName: 'Rahul Cashier',
    },
    {
      id: 'inv_2',
      invoiceNumber: 'INV-2026-002',
      storeId: 'store_1',
      items: [
        {
          productId: 'p2',
          name: 'Haldiram Namkeen Box',
          unit: 'box',
          isLoose: false,
          quantity: 4,
          unitPrice: 200,
          discount: 0,
          gstRate: 12,
          hsnCode: '2106',
          taxableAmount: 800,
          gstAmount: 96,
          totalAmount: 896,
        },
      ],
      subtotal: 800,
      discountTotal: 0,
      taxTotal: 96,
      grandTotal: 896,
      paymentMode: 'upi',
      paymentStatus: 'paid',
      amountPaid: 896,
      amountDue: 0,
      customer: {
        name: 'Gupta Sweets & Restro',
        phoneNumber: '9876543210',
        gstin: '07AABCK1234F1Z5',
      },
      customerGstin: '07AABCK1234F1Z5',
      isB2B: true,
      createdAt: '2026-10-06T11:00:00.000Z',
      createdBy: 'user_1',
      counterNumber: 2,
      staffName: 'Priya Cashier',
    },
  ];

  describe('generateGSTTaxSummary', () => {
    it('aggregates taxable amount, CGST, SGST and B2B/B2C split correctly', () => {
      const summary = generateGSTTaxSummary(mockInvoices, 'October 2026');
      expect(summary.totalInvoices).toBe(2);
      expect(summary.totalGrossSales).toBe(1526); // 630 + 896
      expect(summary.totalTaxable).toBe(1400); // 600 + 800
      expect(summary.totalTax).toBe(126); // 30 + 96
      expect(summary.totalCgst).toBe(63); // 126 / 2
      expect(summary.totalSgst).toBe(63); // 126 / 2

      // B2B vs B2C split
      expect(summary.b2bCount).toBe(1);
      expect(summary.b2bTaxable).toBe(800);
      expect(summary.b2bTax).toBe(96);

      expect(summary.b2cCount).toBe(1);
      expect(summary.b2cTaxable).toBe(600);
      expect(summary.b2cTax).toBe(30);

      // HSN Breakdown
      expect(summary.hsnSummary.length).toBe(2);
      const hsn1006 = summary.hsnSummary.find((h) => h.hsnCode === '1006');
      expect(hsn1006).toBeDefined();
      expect(hsn1006?.taxableValue).toBe(600);
      expect(hsn1006?.uqc).toBe('PAC');
    });
  });

  describe('generateGSTR1JSON', () => {
    it('generates compliant GSTR-1 structure with B2B, B2CS, and HSN sections', () => {
      const gstr1 = generateGSTR1JSON(
        { gstin: '07AABCK9999F1Z1', stateCode: '07' },
        mockInvoices,
        '102026'
      );

      expect(gstr1.gstin).toBe('07AABCK9999F1Z1');
      expect(gstr1.fp).toBe('102026');
      expect(gstr1.gt).toBe(1526);

      // B2B Section
      expect(gstr1.b2b.length).toBe(1);
      expect(gstr1.b2b[0].ctin).toBe('07AABCK1234F1Z5');
      expect(gstr1.b2b[0].inv[0].inum).toBe('INV-2026-002');
      expect(gstr1.b2b[0].inv[0].val).toBe(896);

      // B2CS Section (B2C Small)
      expect(gstr1.b2cs.length).toBe(1);
      expect(gstr1.b2cs[0].rt).toBe(5);
      expect(gstr1.b2cs[0].txval).toBe(600);

      // HSN Section
      expect(gstr1.hsn.data.length).toBe(2);

      // Doc issue summary
      expect(gstr1.doc_issue.doc_det[0].docs[0].totnum).toBe(2);
    });
  });

  describe('exportGSTReportCSV', () => {
    it('generates standard comma-separated tax spreadsheet', () => {
      const csv = exportGSTReportCSV(mockInvoices);
      expect(csv).toContain('Invoice Number,Date,Customer Name,Customer GSTIN');
      expect(csv).toContain('"INV-2026-001"');
      expect(csv).toContain('"INV-2026-002"');
      expect(csv).toContain('"07AABCK1234F1Z5"');
      expect(csv).toContain('B2B');
      expect(csv).toContain('B2C');
      expect(csv).toContain('Counter 1');
      expect(csv).toContain('Rahul Cashier');
    });
  });
});
