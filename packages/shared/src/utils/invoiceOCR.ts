import { ProductUnit } from '../types/product';
import { PurchaseInvoiceDraft, PurchaseItem } from '../types/purchase';

export function mapUOM(uom: string): ProductUnit {
  const normalized = (uom || '').trim().toUpperCase();
  if (['PB', 'PBG', 'PKT', 'PACKET'].includes(normalized)) return 'packet';
  if (['JAR', 'BOX', 'CTN', 'CARTON'].includes(normalized)) return 'box';
  if (['PCS', 'PC', 'PIECE'].includes(normalized)) return 'piece';
  if (['KG', 'KGS', 'KILO'].includes(normalized)) return 'kg';
  if (['G', 'GM', 'GRAM', 'GR'].includes(normalized)) return 'g';
  if (['LTR', 'L', 'LITER', 'LITRE'].includes(normalized)) return 'liter';
  if (['ML'].includes(normalized)) return 'ml';
  if (['DOZEN', 'DZ'].includes(normalized)) return 'dozen';
  return 'piece';
}

export function parseInvoiceText(rawText: string): PurchaseInvoiceDraft {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const items: PurchaseItem[] = [];
  const hsnRegex = /\b(\d{6,8})\b/;
  const uomRegex = /(\d+)\s*(PB|PBG|JAR|BOX|PCS|PKT|KG|LTR|GM)/i;
  const decimalRegex = /\b(\d+\.\d{2})\b/g;

  let invoiceNo = '';
  let supplierName = '';

  for (const line of lines) {
    if (!supplierName && (line.includes('ENTERPRISE') || line.includes('Distributor') || line.includes('LTD') || line.includes('AGENCIES'))) {
      supplierName = line.replace(/[-:]/g, ' ').trim();
    }
    if (!invoiceNo && (line.toLowerCase().includes('invoice') || line.toLowerCase().includes('bill no'))) {
      const match = line.match(/(?:invoice|bill)\s*(?:no|number)?[:\s]*([A-Za-z0-9\/\-]+)/i);
      if (match) invoiceNo = match[1];
    }

    // Check if line looks like an invoice line item (has HSN code or product name keywords)
    const hasHsn = hsnRegex.test(line);
    const uomGlobalRegex = /(\d+)\s*(PB|PBG|JAR|BOX|PCS|PKT|KG|LTR|GM)\b/gi;
    const allUomMatches = Array.from(line.matchAll(uomGlobalRegex));
    const hasUom = allUomMatches.length > 0;
    const decimalMatches = Array.from(line.matchAll(decimalRegex)).map((m) => parseFloat(m[1]));

    if ((hasHsn || hasUom) && decimalMatches.length >= 1) {
      const hsnMatch = line.match(hsnRegex);
      const hsnCode = hsnMatch ? hsnMatch[1] : undefined;

      // Billing UOM is the last match (e.g. 1BOX) rather than product title pack size (e.g. 1kg)
      const billingUomMatch = allUomMatches.length > 0 ? allUomMatches[allUomMatches.length - 1] : null;
      const rawQty = billingUomMatch ? parseInt(billingUomMatch[1], 10) : 1;
      const rawUom = billingUomMatch ? billingUomMatch[2].toUpperCase() : 'PCS';
      const uomMapped = mapUOM(rawUom);

      // Clean product name by stripping leading S.No, HSN, billing UOM, and trailing price numbers
      let productName = line
        .replace(hsnRegex, '')
        .replace(/MRP\s*\d+\.?\d*/gi, '')
        .replace(/^\d+[\s\.\-]+/, '') // remove leading index e.g. "1 "
        .replace(/\b\d+\.\d{2}\b/g, '');

      if (billingUomMatch) {
        productName = productName.replace(billingUomMatch[0], '');
      }
      productName = productName.trim();

      if (!productName || productName.length < 3) {
        productName = `Invoice Item #${items.length + 1}`;
      }

      // Identify rate and gross amount
      // Usually distributor line: ... Rate ... GrossAmt
      let rate = decimalMatches[0];
      let grossAmt = decimalMatches[decimalMatches.length - 1];

      if (decimalMatches.length >= 2) {
        rate = decimalMatches[decimalMatches.length - 2];
        grossAmt = decimalMatches[decimalMatches.length - 1];
      }

      // If outer pack bill (e.g. 2PB with gross 102.04 and unit rate 4.25):
      // totalQty = grossAmt / rate = 24
      let totalQty = rawQty;
      if (rate > 0 && grossAmt > rate && grossAmt / rate >= 2) {
        totalQty = Math.round(grossAmt / rate);
      } else if (grossAmt <= 0 && rate > 0) {
        grossAmt = rate * totalQty;
      }

      const taxableAmt = grossAmt;
      const cgstRate = 2.5;
      const sgstRate = 2.5;
      const cgstAmt = Math.round(((taxableAmt * cgstRate) / 100) * 100) / 100;
      const sgstAmt = Math.round(((taxableAmt * sgstRate) / 100) * 100) / 100;
      const totalAmt = Math.round((taxableAmt + cgstAmt + sgstAmt) * 100) / 100;

      items.push({
        productName,
        hsnCode,
        quantity: rawQty,
        totalQty,
        uom: rawUom,
        uomMapped,
        rate,
        grossAmt,
        discount: 0,
        taxableAmt,
        cgstRate,
        cgstAmt,
        sgstRate,
        sgstAmt,
        totalAmt,
        isNewProduct: true,
        confidence: 85,
      });
    }
  }

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.taxableAmt, 0) * 100) / 100;
  const totalCGST = Math.round(items.reduce((sum, item) => sum + item.cgstAmt, 0) * 100) / 100;
  const totalSGST = Math.round(items.reduce((sum, item) => sum + item.sgstAmt, 0) * 100) / 100;
  const netPayable = Math.round((subtotal + totalCGST + totalSGST) * 100) / 100;

  return {
    supplierName: supplierName || undefined,
    invoiceNo: invoiceNo || undefined,
    items,
    subtotal,
    totalCGST,
    totalSGST,
    netPayable,
    confidence: items.length > 0 ? 85 : 0,
  };
}
