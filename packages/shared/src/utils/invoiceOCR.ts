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
  const uomRegex = /\b(\d+)\s*(PB|PBG|JAR|BOX|PCS|PKT|KG|LTR|GM|CTN)\b/gi;

  let invoiceNo = '';
  let supplierName = '';

  for (const line of lines) {
    if (!supplierName && (line.includes('ENTERPRISE') || line.includes('Distributor') || line.includes('LTD') || line.includes('AGENCIES'))) {
      supplierName = line.replace(/[-:]/g, ' ').replace(/^From\s*/i, '').trim();
    }
    if (!invoiceNo && (line.toLowerCase().includes('invoice') || line.toLowerCase().includes('bill no'))) {
      const match = line.match(/(?:invoice|bill)\s*(?:no|number)?[:\s]*([A-Za-z0-9\/\-]+)/i);
      if (match) invoiceNo = match[1];
    }

    // Skip summary / header lines
    if (line.toLowerCase().includes('gross amt') || line.toLowerCase().includes('subtotal') || line.toLowerCase().includes('total tax')) {
      continue;
    }

    const hsnMatch = line.match(hsnRegex);
    if (!hsnMatch) continue;
    const hsnCode = hsnMatch[1];

    // Find billing UOM
    const uomMatches = Array.from(line.matchAll(uomRegex));
    if (uomMatches.length === 0) continue;

    // Find the UOM match immediately preceding the rate/gross numbers
    let billingMatch = null;
    let numbersAfter: number[] = [];

    for (let i = uomMatches.length - 1; i >= 0; i--) {
      const m = uomMatches[i];
      if (m.index === undefined) continue;
      const afterText = line.slice(m.index + m[0].length);
      const numMatches = Array.from(afterText.matchAll(/\b(\d+(?:\.\d+)?)\b/g)).map((x) => parseFloat(x[1]));
      if (numMatches.length >= 2) {
        billingMatch = m;
        numbersAfter = numMatches;
        break;
      }
    }

    if (!billingMatch || billingMatch.index === undefined) continue;

    const rawQty = parseInt(billingMatch[1], 10);
    const rawUom = billingMatch[2].toUpperCase();
    const uomMapped = mapUOM(rawUom);

    // Everything before billingMatch (and after HSN) is product name + optional MRP
    const hsnIdx = line.indexOf(hsnCode);
    const beforeText = line.slice(hsnIdx + hsnCode.length, billingMatch.index).trim();
    // Clean product title
    let productName = beforeText
      .replace(/(?:MRP\s*[-:]?\s*)?\d+(?:\.\d+)?(?:\s+\d+(?:\.\d+)?)?\s*$/i, '')
      .replace(/MRP\s*[-:]?\s*$/i, '')
      .trim();

    if (!productName || productName.length < 3) {
      productName = `Invoice Item #${items.length + 1}`;
    }

    // Rate and Gross Amount
    const rate = numbersAfter[0];
    let grossAmt = numbersAfter[1];
    let discount = 0;
    // In distributor bills with discount columns: [rate, grossAmt, discount, cgst%, cgstAmt, sgst%, sgstAmt, total]
    if (numbersAfter.length >= 7) {
      discount = numbersAfter[2];
    }

    // Derive total unit quantity from gross amount and rate
    let totalQty = rawQty;
    if (rate > 0 && grossAmt > rate && grossAmt / rate >= 2) {
      totalQty = Math.round(grossAmt / rate);
    } else if (grossAmt <= 0 && rate > 0) {
      grossAmt = rate * totalQty;
    }

    const taxableAmt = Math.round(Math.max(0, grossAmt - discount) * 100) / 100;
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
      discount,
      taxableAmt,
      cgstRate,
      cgstAmt,
      sgstRate,
      sgstAmt,
      totalAmt,
      isNewProduct: true,
      confidence: 90,
    });
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
    confidence: items.length > 0 ? 90 : 0,
  };
}
