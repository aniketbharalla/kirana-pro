import { calculateItemGST, calculateInvoiceTotals } from '../utils/gst';

describe('GST Calculation Engine', () => {
  it('calculates 0% GST item correctly (e.g. Atta, Dal, Loose Rice)', () => {
    const itemMath = calculateItemGST(50, 2, 0, 0);
    expect(itemMath.taxableAmount).toBe(100);
    expect(itemMath.gstAmount).toBe(0);
    expect(itemMath.cgst).toBe(0);
    expect(itemMath.sgst).toBe(0);
    expect(itemMath.totalAmount).toBe(100);
  });

  it('calculates 5% GST on Edible Oil with correct CGST/SGST 2.5% split', () => {
    // 1 item @ 105 total with 5% GST inclusive
    // Base = 100, GST = 5 (CGST = 2.5, SGST = 2.5)
    const itemMath = calculateItemGST(105, 1, 5, 0, true);
    expect(itemMath.taxableAmount).toBe(100);
    expect(itemMath.gstAmount).toBe(5);
    expect(itemMath.cgst).toBe(2.5);
    expect(itemMath.sgst).toBe(2.5);
    expect(itemMath.totalAmount).toBe(105);
  });

  it('calculates 12% GST exclusive item with item-level discount', () => {
    // 1 item @ 100, discount 10 -> taxable 90, GST 12% of 90 = 10.8 -> total = 100.8
    const itemMath = calculateItemGST(100, 1, 12, 10, false);
    expect(itemMath.taxableAmount).toBe(90);
    expect(itemMath.gstAmount).toBe(10.8);
    expect(itemMath.cgst).toBe(5.4);
    expect(itemMath.sgst).toBe(5.4);
    expect(itemMath.totalAmount).toBe(100.8);
  });

  it('calculates overall invoice subtotal, tax breakdown, and grand total', () => {
    const items = [
      calculateItemGST(250, 1, 0, 0),    // Atta: 250, tax: 0
      calculateItemGST(20, 2, 5, 0),     // Oil soap: 40, tax 5% = 2
      calculateItemGST(50, 1, 18, 0),    // Cleaning: 50, tax 18% = 9
    ];

    const totals = calculateInvoiceTotals(items, 0);
    expect(totals.subtotal).toBe(340);
    expect(totals.taxTotal).toBe(11);
    expect(totals.grandTotal).toBe(351);
  });
});
