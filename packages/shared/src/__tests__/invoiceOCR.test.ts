import { parseInvoiceText, mapUOM } from '../utils/invoiceOCR';

describe('invoiceOCR - parseInvoiceText', () => {
  it('parses Parle distributor bill line items with HSN, derived quantity, and GST', () => {
    const rawBill = `
      N R ENTERPRISES - Parle Distributor
      Invoice No: NR/2026/0892
      1 19059030 20-20 Classic Butter 14.44g MRP 5.00 2PB 4.25 102.04
      2 19059040 Parle-G Gold 1kg MRP 120.00 1BOX 100.00 100.00
      Subtotal: 202.04
      CGST 2.5%: 5.05
      SGST 2.5%: 5.05
      Total: 212.14
    `;

    const draft = parseInvoiceText(rawBill);

    expect(draft.items.length).toBeGreaterThanOrEqual(2);

    const item1 = draft.items[0];
    expect(item1.productName).toContain('20-20 Classic Butter');
    expect(item1.hsnCode).toBe('19059030');
    expect(item1.rate).toBe(4.25);
    // Derived pack multiplier: 102.04 / 4.25 = 24
    expect(item1.totalQty).toBe(24);
    expect(item1.uomMapped).toBe('packet');
    expect(item1.cgstRate).toBe(2.5);
    expect(item1.sgstRate).toBe(2.5);

    const item2 = draft.items[1];
    expect(item2.productName).toContain('Parle-G Gold');
    expect(item2.rate).toBe(100.00);
    expect(item2.totalQty).toBe(1);
    expect(item2.uomMapped).toBe('box');

    expect(draft.subtotal).toBeCloseTo(202.04, 1);
    expect(draft.netPayable).toBeCloseTo(212.14, 1);
    expect(draft.confidence).toBeGreaterThan(50);
  });

  it('maps various distributor UOM abbreviations correctly', () => {
    expect(mapUOM('PB')).toBe('packet');
    expect(mapUOM('PBG')).toBe('packet');
    expect(mapUOM('PKT')).toBe('packet');
    expect(mapUOM('JAR')).toBe('box');
    expect(mapUOM('BOX')).toBe('box');
    expect(mapUOM('PCS')).toBe('piece');
    expect(mapUOM('KG')).toBe('kg');
  });
});
