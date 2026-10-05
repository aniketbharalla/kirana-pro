import { Invoice } from '../types/invoice';

/**
 * Generates sequential invoice number e.g. "INV-2026-0001"
 */
export const generateInvoiceNumber = (
  prefix: string = 'INV',
  counter: number = 1
): string => {
  const year = new Date().getFullYear();
  const padded = String(counter).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
};

/**
 * Formats a clean WhatsApp receipt string for customer sharing
 */
export const formatWhatsAppReceipt = (
  invoice: Invoice,
  storeName: string,
  storeAddress?: string,
  storePhone?: string
): string => {
  const dateStr = new Date(invoice.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const divider = '--------------------------------';
  const lines: string[] = [];

  lines.push(`🏪 *${storeName}*`);
  if (storeAddress) lines.push(`📍 ${storeAddress}`);
  if (storePhone) lines.push(`📞 ${storePhone}`);
  lines.push(divider);
  lines.push(`🧾 *Bill No:* ${invoice.invoiceNumber}`);
  lines.push(`📅 *Date:* ${dateStr}`);
  if (invoice.customer?.name) {
    lines.push(`👤 *Customer:* ${invoice.customer.name}`);
  }
  lines.push(divider);

  invoice.items.forEach((item, index) => {
    const qtyStr = `${item.quantity} ${item.unit}`;
    const nameStr = item.nameHindi ? `${item.name} (${item.nameHindi})` : item.name;
    lines.push(`${index + 1}. *${nameStr}*`);
    lines.push(`   ${qtyStr} x ₹${item.unitPrice} = ₹${item.totalAmount}`);
  });

  lines.push(divider);
  lines.push(`Subtotal: ₹${invoice.subtotal}`);
  if (invoice.discountTotal > 0) {
    lines.push(`Discount: -₹${invoice.discountTotal}`);
  }
  if (invoice.taxTotal > 0) {
    lines.push(`GST: ₹${invoice.taxTotal}`);
  }
  lines.push(`💰 *Grand Total: ₹${invoice.grandTotal}*`);
  lines.push(`💳 Payment Mode: ${invoice.paymentMode.toUpperCase()} (${invoice.paymentStatus.toUpperCase()})`);

  if (invoice.paymentMode === 'cash' && invoice.changeDue && invoice.changeDue > 0) {
    lines.push(`💵 Cash Received: ₹${invoice.cashTendered || invoice.grandTotal}`);
    lines.push(`🔄 Change Returned: ₹${invoice.changeDue}`);
  }

  lines.push(divider);
  lines.push(`धन्यवाद! फिर पधारें 🙏`);
  lines.push(`Powered by Kirana Pro`);

  return lines.join('\n');
};
