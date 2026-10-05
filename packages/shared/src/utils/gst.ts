export interface ItemGSTCalculation {
  taxableAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
}

export interface InvoiceTotalsCalculation {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

/**
 * Calculates GST amount and CGST/SGST split for an item
 * @param unitPrice Price per unit
 * @param quantity Item count or weight in kg
 * @param gstRate Tax percentage (0, 5, 12, 18, 28)
 * @param discount Item-level discount in INR
 * @param isInclusive Whether unitPrice already includes GST (typical for Indian packaged MRP)
 */
export const calculateItemGST = (
  unitPrice: number,
  quantity: number,
  gstRate: number,
  discount: number = 0,
  isInclusive: boolean = false
): ItemGSTCalculation => {
  const gross = Math.round(unitPrice * quantity * 100) / 100;
  const afterDiscount = Math.max(0, gross - discount);

  if (gstRate === 0) {
    return {
      taxableAmount: afterDiscount,
      gstAmount: 0,
      cgst: 0,
      sgst: 0,
      totalAmount: afterDiscount,
    };
  }

  let taxableAmount: number;
  let gstAmount: number;

  if (isInclusive) {
    // When price includes GST: Base = Total / (1 + rate/100)
    taxableAmount = Math.round((afterDiscount / (1 + gstRate / 100)) * 100) / 100;
    gstAmount = Math.round((afterDiscount - taxableAmount) * 100) / 100;
  } else {
    // When price is before GST
    taxableAmount = afterDiscount;
    gstAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
  }

  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount / 2) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + gstAmount) * 100) / 100;

  return {
    taxableAmount,
    gstAmount,
    cgst,
    sgst,
    totalAmount,
  };
};

/**
 * Calculates aggregated totals for an invoice
 */
export const calculateInvoiceTotals = (
  items: Array<{ taxableAmount: number; gstAmount: number; totalAmount: number }>,
  orderDiscount: number = 0
): InvoiceTotalsCalculation => {
  let subtotal = 0;
  let taxTotal = 0;

  items.forEach((item) => {
    subtotal += item.taxableAmount;
    taxTotal += item.gstAmount;
  });

  subtotal = Math.round(subtotal * 100) / 100;
  taxTotal = Math.round(taxTotal * 100) / 100;

  const rawGrandTotal = subtotal + taxTotal - orderDiscount;
  const grandTotal = Math.max(0, Math.round(rawGrandTotal * 100) / 100);

  return {
    subtotal,
    discountTotal: orderDiscount,
    taxTotal,
    grandTotal,
  };
};
