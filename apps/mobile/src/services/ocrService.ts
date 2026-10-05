import { parseInvoiceText, PurchaseInvoiceDraft } from '@kirana-pro/shared';

// Standard reference FMCG invoice for instant 1-tap testing
export const SAMPLE_PARLE_BILL_TEXT = `
N R ENTERPRISES - Parle Distributor
Bhopal, MP | GSTIN: 23NMQPK6686L1Z0
Invoice No: NR/2026/0892
Date: 05-10-2026

1 19059030 20-20 Classic Butter 14.44g MRP 5.00 2PB 4.25 102.04
2 19059040 Parle-G Gold 1kg MRP 120.00 1BOX 100.00 100.00
3 19059050 Hide & Seek Choco Fills 72g MRP 30.00 1BOX 24.50 245.00
4 19059060 Monaco Classic Salted 50g MRP 10.00 3PB 8.10 243.00
5 19059070 Krackjack Butter Sweet & Salty MRP 10.00 2PB 8.10 162.00

Subtotal: 852.04
CGST 2.5%: 21.30
SGST 2.5%: 21.30
Round Off: 0.36
Total Net Payable: 895.00
`;

export async function processInvoiceImage(
  imageUri?: string,
  rawTextOverride?: string
): Promise<PurchaseInvoiceDraft> {
  // If text is provided (e.g. from pasted OCR or test bill), parse directly
  if (rawTextOverride && rawTextOverride.trim()) {
    return parseInvoiceText(rawTextOverride);
  }

  // Graceful fallback for web/local simulation:
  // Extracts simulated text from sample distributor bill
  return parseInvoiceText(SAMPLE_PARLE_BILL_TEXT);
}
