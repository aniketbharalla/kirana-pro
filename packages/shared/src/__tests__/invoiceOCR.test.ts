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

  it('parses real 15-item Parle distributor invoice with discounts and HSNs', () => {
    const realParleBill = `
      From : N R ENTERPRISES
      NAGAR ROAD CHAI PE CHARCHA BHOPAL MANDI BHOPAL MP
      Contact No 7415845631
      GSTIN No 23MNQPK6685L1Z0
      Invoice No : 740003042
      Party Name : Chayan provision
      Address Ashoka Garden
      Phone No 8718945806
      Sales Route : ASHOKA GARDEN GREEN CITY
      SM Name/PH RACHIT RATHORE / 8269595491

      S. HSN Code Product Name MRP UOM1 UOM2 Rate Gross Amt Sch dis. CGST SGST Amount
      1 19059020 20-20 Classic - Butter - 144 PKT 8.60 gm Extra MRP - 5.00 5.00 2PB 4.25 102.04 0.00 2.50 2.55 2.50 2.55 107.14
      2 19059020 20-20 Classic - Cashew - 144 PKT 4.30 gm Extra MRP - 5.00 5.00 2PB 4.25 102.04 0.00 2.50 2.55 2.50 2.55 107.14
      3 19059020 HPY HPY 27+4.5G(24p)X132-12p TLO 5.00 1PB 4.25 93.54 0.00 2.50 2.34 2.50 2.34 98.22
      4 19059020 Hide & Seek Choco 33g X 160p 10.00 1PB 8.50 170.07 0.00 2.50 4.25 2.50 4.25 178.57
      5 19059020 Hide & Seek Classic - Chocolate - 72 PKT 15.50 gm Extra MRP - 30.00 30.00 6PKT 25.51 153.06 0.00 2.50 3.83 2.50 3.83 160.72
      6 19059020 Krackjack Classic - Sweet & Salty - 120 PKT 12.60 gm Extra MRP - 10.00 10.00 2PB 8.50 204.08 0.00 2.50 5.10 2.50 5.10 214.28
      7 19059020 Magix Kream Round - Chocolate - 144 PKT 3.30 gm Extra MRP - 4.50 4.50 1PB 3.90 46.75 2.34 2.50 1.11 2.50 1.11 46.64
      8 19059020 Magix Kream Round - Elaichi - 144 PKT 3.30 gm Extra MRP - 4.50 4.50 1PB 3.90 46.75 2.34 2.50 1.11 2.50 1.11 46.64
      9 19059020 Magix Kream Round - Green Apple - 144 PKT 3.30 gm Extra MRP - 4.50 4.50 1PB 3.90 46.75 2.34 2.50 1.11 2.50 1.11 46.64
      10 17049020 Melody Choco 391g X 24 PB 100.00 3PBG 85.03 255.10 0.00 2.50 6.38 2.50 6.38 267.86
      11 19059020 Monaco 23.2g+2.9g X 108+12p 5.00 1PB 4.25 114.80 0.00 2.50 2.87 2.50 2.87 120.54
      12 19059020 Monaco 46.4g+5.8g X 120p SS 10.00 1PB 8.50 102.04 0.00 2.50 2.55 2.50 2.55 107.14
      13 19059020 Parle-G Gluco 40+5g X 144p 5.00 1PB 4.33 103.90 0.00 2.50 2.60 2.50 2.60 109.10
      14 19059020 Parle-G Gluco 80+10g X 72p DS 10.00 2PB 8.66 207.79 0.00 2.50 5.20 2.50 5.20 218.19
      15 19059020 Parle-G Gold 56.25+12.5=68.75X72p 8.50 1PB 8.50 204.08 4.16 2.50 4.85 2.50 4.85 205.57

      Gross Amt 1952.80
      Sch Disc 11.17
      Total Tax Amt 96.57
      Net Amt 2018.00
    `;

    const draft = parseInvoiceText(realParleBill);
    expect(draft.supplierName).toContain('N R ENTERPRISES');
    expect(draft.invoiceNo).toBe('740003042');
    expect(draft.items.length).toBe(15);

    // Verify first item
    expect(draft.items[0].productName).toContain('20-20 Classic - Butter');
    expect(draft.items[0].totalQty).toBe(24);
    expect(draft.items[0].rate).toBe(4.25);
    expect(draft.items[0].grossAmt).toBe(102.04);

    // Verify item with scheme discount (Magix Kream Round Chocolate)
    const magix = draft.items[6];
    expect(magix.productName).toContain('Magix Kream Round - Chocolate');
    expect(magix.discount).toBe(2.34);
    expect(magix.taxableAmt).toBe(44.41);
    expect(magix.cgstAmt).toBe(1.11);
    expect(magix.sgstAmt).toBe(1.11);
    expect(magix.totalAmt).toBe(46.63);

    // Verify subtotal matches invoice gross - discount
    expect(draft.subtotal).toBeCloseTo(1941.63, 1);
    expect(draft.totalCGST + draft.totalSGST).toBeCloseTo(97.08, 1);
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
