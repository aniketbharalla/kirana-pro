import { Invoice } from '../types/invoice';
import {
  GSTTaxSummary,
  GSTR1ExportFormat,
  GSTR1B2BInvoice,
  GSTR1B2CSItem,
  HsnSummaryItem,
} from '../types/gst';

/**
 * Validates Indian GSTIN (Goods and Services Tax Identification Number)
 * Format: 15 alphanumeric characters:
 * - 2 digits (State code, e.g. 07 for Delhi, 27 for Maharashtra)
 * - 10 chars (PAN of business)
 * - 1 char (Entity number of same PAN holder in state)
 * - 'Z' (Alphabet Z by default)
 * - 1 char (Check digit)
 */
export const isValidGSTIN = (gstin: string): boolean => {
  if (!gstin) return false;
  const cleaned = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(cleaned);
};

/**
 * Formats date from ISO or timestamp to GSTR-1 DD-MM-YYYY format
 */
export const formatGSTR1Date = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return '01-01-2026';
  }
};

/**
 * Maps unit string to Indian GST standard UQC (Unit Quantity Code)
 */
export const mapUnitToUQC = (unit?: string): string => {
  switch (unit?.toLowerCase()) {
    case 'kg':
      return 'KGS';
    case 'g':
      return 'GMS';
    case 'liter':
      return 'LTR';
    case 'ml':
      return 'MLT';
    case 'piece':
    case 'piece(s)':
      return 'PCS';
    case 'packet':
      return 'PAC';
    case 'box':
      return 'BOX';
    case 'dozen':
      return 'DOZ';
    default:
      return 'OTH';
  }
};

/**
 * Computes aggregated tax and HSN summary from a list of invoices
 */
export const generateGSTTaxSummary = (
  invoices: Invoice[],
  periodLabel: string = 'Current Month'
): GSTTaxSummary => {
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGrossSales = 0;

  let b2bCount = 0;
  let b2bTaxable = 0;
  let b2bTax = 0;

  let b2cCount = 0;
  let b2cTaxable = 0;
  let b2cTax = 0;

  const hsnMap = new Map<string, HsnSummaryItem>();

  for (const inv of invoices) {
    totalGrossSales += inv.grandTotal;

    const isB2B = Boolean(inv.isB2B || (inv.customerGstin && isValidGSTIN(inv.customerGstin)));
    if (isB2B) {
      b2bCount++;
      b2bTaxable += inv.subtotal;
      b2bTax += inv.taxTotal;
    } else {
      b2cCount++;
      b2cTaxable += inv.subtotal;
      b2cTax += inv.taxTotal;
    }

    // Process line items
    for (const item of inv.items) {
      const taxable = item.taxableAmount || 0;
      const gst = item.gstAmount || 0;
      const cgst = Math.round((gst / 2) * 100) / 100;
      const sgst = Math.round((gst / 2) * 100) / 100;

      totalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;

      // Group by HSN code (default to '9999' general groceries if absent)
      const hsn = item.hsnCode?.trim() || '9999';
      const uqc = mapUnitToUQC(item.unit);
      const existing = hsnMap.get(hsn);

      if (existing) {
        existing.totalQty += item.quantity;
        existing.totalValue += item.totalAmount;
        existing.taxableValue += taxable;
        existing.cgstAmount += cgst;
        existing.sgstAmount += sgst;
      } else {
        hsnMap.set(hsn, {
          hsnCode: hsn,
          description: item.name,
          uqc,
          totalQty: item.quantity,
          totalValue: item.totalAmount,
          taxableValue: taxable,
          igstAmount: 0,
          cgstAmount: cgst,
          sgstAmount: sgst,
          cessAmount: 0,
        });
      }
    }
  }

  // Round values
  totalTaxable = Math.round(totalTaxable * 100) / 100;
  totalCgst = Math.round(totalCgst * 100) / 100;
  totalSgst = Math.round(totalSgst * 100) / 100;
  totalIgst = Math.round(totalIgst * 100) / 100;
  const totalTax = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
  totalGrossSales = Math.round(totalGrossSales * 100) / 100;

  return {
    periodLabel,
    totalInvoices: invoices.length,
    totalTaxable,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    totalGrossSales,
    b2bCount,
    b2bTaxable: Math.round(b2bTaxable * 100) / 100,
    b2bTax: Math.round(b2bTax * 100) / 100,
    b2cCount,
    b2cTaxable: Math.round(b2cTaxable * 100) / 100,
    b2cTax: Math.round(b2cTax * 100) / 100,
    hsnSummary: Array.from(hsnMap.values()),
  };
};

/**
 * Generates official GSTR-1 JSON export structure ready for GST portal upload
 * @param store Store details with GSTIN and state code
 * @param invoices List of invoices for the period
 * @param period Financial period formatted as MMYYYY (e.g. "102026")
 */
export const generateGSTR1JSON = (
  store: { gstin?: string; stateCode?: string },
  invoices: Invoice[],
  period: string
): GSTR1ExportFormat => {
  const storeGstin = store.gstin?.trim().toUpperCase() || '07AABCK1234F1Z5';
  const posState = store.stateCode || storeGstin.substring(0, 2) || '07';

  const b2bInvoices: GSTR1B2BInvoice[] = [];
  const b2csMap = new Map<number, { txval: number; camt: number; samt: number }>();
  const hsnMap = new Map<string, HsnSummaryItem>();

  let grossTurnover = 0;

  for (const inv of invoices) {
    grossTurnover += inv.grandTotal;
    const isB2B = Boolean(inv.isB2B || (inv.customerGstin && isValidGSTIN(inv.customerGstin)));

    if (isB2B && inv.customerGstin) {
      const ctin = inv.customerGstin.trim().toUpperCase();
      const existingCustomer = b2bInvoices.find((b) => b.ctin === ctin);

      const itemsDetail = inv.items.map((it, idx) => {
        const gst = it.gstAmount || 0;
        return {
          num: idx + 1,
          itm_det: {
            rt: it.gstRate,
            txval: it.taxableAmount,
            iamt: 0,
            camt: Math.round((gst / 2) * 100) / 100,
            samt: Math.round((gst / 2) * 100) / 100,
            csamt: 0,
          },
        };
      });

      const invDetail = {
        inum: inv.invoiceNumber,
        idt: formatGSTR1Date(inv.createdAt),
        val: inv.grandTotal,
        pos: posState,
        itms: itemsDetail,
      };

      if (existingCustomer) {
        existingCustomer.inv.push(invDetail);
      } else {
        b2bInvoices.push({
          ctin,
          inv: [invDetail],
        });
      }
    } else {
      // Aggregate B2CS by rate
      for (const it of inv.items) {
        const rate = it.gstRate || 0;
        const taxable = it.taxableAmount || 0;
        const gst = it.gstAmount || 0;
        const camt = Math.round((gst / 2) * 100) / 100;
        const samt = Math.round((gst / 2) * 100) / 100;

        const current = b2csMap.get(rate) || { txval: 0, camt: 0, samt: 0 };
        current.txval += taxable;
        current.camt += camt;
        current.samt += samt;
        b2csMap.set(rate, current);
      }
    }

    // Build HSN summary
    for (const it of inv.items) {
      const hsn = it.hsnCode?.trim() || '9999';
      const uqc = mapUnitToUQC(it.unit);
      const taxable = it.taxableAmount || 0;
      const gst = it.gstAmount || 0;
      const cgst = Math.round((gst / 2) * 100) / 100;
      const sgst = Math.round((gst / 2) * 100) / 100;

      const existing = hsnMap.get(hsn);
      if (existing) {
        existing.totalQty += it.quantity;
        existing.totalValue += it.totalAmount;
        existing.taxableValue += taxable;
        existing.cgstAmount += cgst;
        existing.sgstAmount += sgst;
      } else {
        hsnMap.set(hsn, {
          hsnCode: hsn,
          description: it.name,
          uqc,
          totalQty: it.quantity,
          totalValue: it.totalAmount,
          taxableValue: taxable,
          igstAmount: 0,
          cgstAmount: cgst,
          sgstAmount: sgst,
          cessAmount: 0,
        });
      }
    }
  }

  // Convert B2CS map to array
  const b2csList: GSTR1B2CSItem[] = Array.from(b2csMap.entries()).map(([rt, vals]) => ({
    sply_ty: 'INTRA',
    rt,
    txval: Math.round(vals.txval * 100) / 100,
    camt: Math.round(vals.camt * 100) / 100,
    samt: Math.round(vals.samt * 100) / 100,
    iamt: 0,
    csamt: 0,
  }));

  // Document issue summary
  const firstInv = invoices[0]?.invoiceNumber || 'INV-001';
  const lastInv = invoices[invoices.length - 1]?.invoiceNumber || 'INV-001';

  return {
    gstin: storeGstin,
    fp: period,
    gt: Math.round(grossTurnover * 100) / 100,
    cur_gt: Math.round(grossTurnover * 100) / 100,
    b2b: b2bInvoices,
    b2cs: b2csList,
    hsn: { data: Array.from(hsnMap.values()) },
    doc_issue: {
      doc_det: [
        {
          doc_num: 1,
          doc_typ: 'Invoices for outward supply',
          docs: [
            {
              from: firstInv,
              to: lastInv,
              totnum: invoices.length,
              canc: 0,
              net_issue: invoices.length,
            },
          ],
        },
      ],
    },
  };
};

/**
 * Generates standard CSV tax report string for accountants / Chartered Accountants
 */
export const exportGSTReportCSV = (invoices: Invoice[]): string => {
  const headers = [
    'Invoice Number',
    'Date',
    'Customer Name',
    'Customer GSTIN',
    'Invoice Type',
    'Payment Mode',
    'Taxable Value (₹)',
    'CGST (₹)',
    'SGST (₹)',
    'IGST (₹)',
    'Total Tax (₹)',
    'Grand Total (₹)',
    'Counter',
    'Cashier',
  ];

  const rows: string[] = [headers.join(',')];

  for (const inv of invoices) {
    const isB2B = Boolean(inv.isB2B || (inv.customerGstin && isValidGSTIN(inv.customerGstin)));
    const cgst = Math.round((inv.taxTotal / 2) * 100) / 100;
    const sgst = Math.round((inv.taxTotal / 2) * 100) / 100;

    const row = [
      `"${inv.invoiceNumber}"`,
      `"${formatGSTR1Date(inv.createdAt)}"`,
      `"${(inv.customer?.name || 'Walk-in Customer').replace(/"/g, '""')}"`,
      `"${inv.customerGstin || inv.customer?.gstin || '-'}"`,
      isB2B ? 'B2B' : 'B2C',
      inv.paymentMode.toUpperCase(),
      inv.subtotal.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      '0.00',
      inv.taxTotal.toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.counterNumber ? `Counter ${inv.counterNumber}` : 'Main Counter',
      `"${(inv.staffName || 'Owner').replace(/"/g, '""')}"`,
    ];

    rows.push(row.join(','));
  }

  return rows.join('\n');
};
