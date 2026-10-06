import { Invoice } from '../types/invoice';
import { EscPosReceiptStoreInfo, PrinterSettings, PrinterWidth } from '../types/hardware';

// ─── ESC/POS Constants ────────────────────────────────────────────────────────

const ESC = 0x1b;
const GS = 0x1d;

export const ESC_POS_COMMANDS = {
  INIT: [ESC, 0x40],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_SIZE_ON: [GS, 0x21, 0x11],
  DOUBLE_SIZE_OFF: [GS, 0x21, 0x00],
  UNDERLINE_ON: [ESC, 0x2d, 0x01],
  UNDERLINE_OFF: [ESC, 0x2d, 0x00],
  CUT_PAPER: [GS, 0x56, 0x41, 0x03],
  KICK_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xfa], // Pulse to pin 2 (cash drawer)
  FEED_3_LINES: [ESC, 0x64, 0x03],
};

// ─── Text Alignment & Column Helpers ──────────────────────────────────────────

export const getColumnWidth = (width: PrinterWidth): number => {
  return width === '80mm' ? 48 : 32;
};

export const padCenter = (text: string, width: number): string => {
  if (text.length >= width) return text.substring(0, width);
  const left = Math.floor((width - text.length) / 2);
  const right = width - text.length - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
};

export const padTwoColumn = (left: string, right: string, width: number): string => {
  const availableSpace = width - left.length - right.length;
  if (availableSpace <= 0) {
    const trimmedLeft = left.substring(0, width - right.length - 1);
    return trimmedLeft + ' ' + right;
  }
  return left + ' '.repeat(availableSpace) + right;
};

export const padFourColumn = (
  col1: string,
  col2: string,
  col3: string,
  col4: string,
  width: number
): string => {
  if (width === 48) {
    // 80mm: Item(22), Qty(6), Rate(8), Amt(12)
    const c1 = col1.padEnd(22).substring(0, 22);
    const c2 = col2.padStart(6).substring(0, 6);
    const c3 = col3.padStart(8).substring(0, 8);
    const c4 = col4.padStart(12).substring(0, 12);
    return `${c1}${c2}${c3}${c4}`;
  } else {
    // 58mm: Item(14), Qty(4), Rate(6), Amt(8)
    const c1 = col1.padEnd(14).substring(0, 14);
    const c2 = col2.padStart(4).substring(0, 4);
    const c3 = col3.padStart(6).substring(0, 6);
    const c4 = col4.padStart(8).substring(0, 8);
    return `${c1}${c2}${c3}${c4}`;
  }
};

/**
 * Encodes string to UTF-8 or ASCII byte array
 */
export const stringToBytes = (str: string): number[] => {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      bytes.push(code);
    } else {
      // Fallback for non-ASCII characters to standard ASCII approximation
      bytes.push(0x20); // space
    }
  }
  return bytes;
};

// ─── Format Plain Text Receipt (Human & Web Print View) ───────────────────────

export const formatReceiptPlainText = (
  invoice: Invoice,
  store: EscPosReceiptStoreInfo,
  width: PrinterWidth = '58mm'
): string => {
  const cols = getColumnWidth(width);
  const divDouble = '='.repeat(cols);
  const divSingle = '-'.repeat(cols);

  const lines: string[] = [];

  // 1. Store Header
  lines.push(divDouble);
  lines.push(padCenter(store.name.toUpperCase(), cols));
  if (store.address) lines.push(padCenter(store.address, cols));
  if (store.phone) lines.push(padCenter(`Ph: ${store.phone}`, cols));
  if (store.gstin) lines.push(padCenter(`GSTIN: ${store.gstin}`, cols));
  lines.push(divDouble);

  // 2. Invoice Meta
  const staff = invoice.staffName ? `Cashier: ${invoice.staffName.split(' ')[0]}` : 'Cashier: Owner';
  const counter = invoice.counterNumber ? `Counter: ${invoice.counterNumber}` : 'Counter: 1';
  lines.push(`Bill: ${invoice.invoiceNumber}`);
  lines.push(padTwoColumn(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, counter, cols));
  lines.push(padTwoColumn(staff, invoice.paymentMode.toUpperCase(), cols));
  if (invoice.customer?.name && invoice.customer.name !== 'Walk-in Customer') {
    lines.push(padTwoColumn(`Cust: ${invoice.customer.name}`, invoice.customer.phoneNumber || '', cols));
  }
  if (invoice.customerGstin) {
    lines.push(`Buyer GSTIN: ${invoice.customerGstin}`);
  }
  lines.push(divSingle);

  // 3. Item Table Header
  lines.push(padFourColumn('ITEM', 'QTY', 'RATE', 'TOTAL', cols));
  lines.push(divSingle);

  // 4. Line Items
  for (const it of invoice.items) {
    const rate = String(it.unitPrice);
    const qty = it.isLoose ? `${it.quantity}kg` : String(it.quantity);
    const amt = it.totalAmount.toFixed(2);
    lines.push(padFourColumn(it.name, qty, rate, amt, cols));
  }

  lines.push(divSingle);

  // 5. Totals
  lines.push(padTwoColumn('Subtotal:', `₹${invoice.subtotal.toFixed(2)}`, cols));
  if (invoice.discountTotal > 0) {
    lines.push(padTwoColumn('Order Discount:', `-₹${invoice.discountTotal.toFixed(2)}`, cols));
  }
  if (invoice.taxTotal > 0) {
    lines.push(padTwoColumn('GST Tax Included:', `₹${invoice.taxTotal.toFixed(2)}`, cols));
  }
  lines.push(divDouble);
  lines.push(padTwoColumn('GRAND TOTAL:', `₹${invoice.grandTotal.toFixed(2)}`, cols));
  lines.push(divDouble);

  // 6. Payment info
  lines.push(padTwoColumn(`Payment Mode:`, invoice.paymentMode.toUpperCase(), cols));
  if (invoice.cashTendered) {
    lines.push(padTwoColumn('Cash Received:', `₹${invoice.cashTendered}`, cols));
  }
  if (invoice.changeDue && invoice.changeDue > 0) {
    lines.push(padTwoColumn('Change Returned:', `₹${invoice.changeDue.toFixed(2)}`, cols));
  }
  if (invoice.amountDue > 0) {
    lines.push(padTwoColumn('Udhar Balance Due:', `₹${invoice.amountDue.toFixed(2)}`, cols));
  }

  // 7. Footer
  lines.push(divDouble);
  lines.push(padCenter('Dhanyawaad! Phir Padharein!', cols));
  lines.push(padCenter('Save Paper * Go Digital', cols));
  lines.push(padCenter('Powered by Kirana Pro', cols));
  lines.push(divDouble);

  return lines.join('\n');
};

// ─── Generate ESC/POS Binary Command Buffer ───────────────────────────────────

export const generateEscPosInvoiceReceipt = (
  invoice: Invoice,
  store: EscPosReceiptStoreInfo,
  settings: PrinterSettings
): Uint8Array => {
  const bytes: number[] = [];
  const cols = getColumnWidth(settings.width);

  // Helper to push command
  const pushCmd = (cmd: number[]) => bytes.push(...cmd);
  const pushText = (str: string) => {
    bytes.push(...stringToBytes(str));
    bytes.push(0x0a); // LF newline
  };

  // 1. Initialize Printer
  pushCmd(ESC_POS_COMMANDS.INIT);

  // Optional: Kick cash drawer on cash bill
  if (settings.autoKickDrawer && invoice.paymentMode === 'cash') {
    pushCmd(ESC_POS_COMMANDS.KICK_DRAWER);
  }

  // 2. Store Header (Centered, Double size for name)
  pushCmd(ESC_POS_COMMANDS.ALIGN_CENTER);
  pushCmd(ESC_POS_COMMANDS.BOLD_ON);
  pushCmd(ESC_POS_COMMANDS.DOUBLE_SIZE_ON);
  pushText(store.name.toUpperCase());
  pushCmd(ESC_POS_COMMANDS.DOUBLE_SIZE_OFF);
  pushCmd(ESC_POS_COMMANDS.BOLD_OFF);

  if (store.address) pushText(store.address);
  if (store.phone) pushText(`Ph: ${store.phone}`);
  if (store.gstin) pushText(`GSTIN: ${store.gstin}`);

  // Divider
  pushCmd(ESC_POS_COMMANDS.ALIGN_LEFT);
  pushText('='.repeat(cols));

  // 3. Invoice Header
  const staff = invoice.staffName ? `Cashier: ${invoice.staffName.split(' ')[0]}` : 'Cashier: Owner';
  const counter = invoice.counterNumber ? `Counter: ${invoice.counterNumber}` : 'Counter: 1';
  pushText(`Bill: ${invoice.invoiceNumber}`);
  pushText(padTwoColumn(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, counter, cols));
  pushText(padTwoColumn(staff, invoice.paymentMode.toUpperCase(), cols));

  if (invoice.customer?.name && invoice.customer.name !== 'Walk-in Customer') {
    pushText(padTwoColumn(`Cust: ${invoice.customer.name}`, invoice.customer.phoneNumber || '', cols));
  }
  if (invoice.customerGstin) {
    pushText(`Buyer GSTIN: ${invoice.customerGstin}`);
  }

  pushText('-'.repeat(cols));

  // 4. Line Items Table
  pushCmd(ESC_POS_COMMANDS.BOLD_ON);
  pushText(padFourColumn('ITEM', 'QTY', 'RATE', 'AMT', cols));
  pushCmd(ESC_POS_COMMANDS.BOLD_OFF);
  pushText('-'.repeat(cols));

  for (const it of invoice.items) {
    const rate = String(it.unitPrice);
    const qty = it.isLoose ? `${it.quantity}k` : String(it.quantity);
    const amt = it.totalAmount.toFixed(2);
    pushText(padFourColumn(it.name, qty, rate, amt, cols));
  }

  pushText('-'.repeat(cols));

  // 5. Totals
  pushText(padTwoColumn('Subtotal:', `Rs.${invoice.subtotal.toFixed(2)}`, cols));
  if (invoice.discountTotal > 0) {
    pushText(padTwoColumn('Discount:', `-Rs.${invoice.discountTotal.toFixed(2)}`, cols));
  }
  if (invoice.taxTotal > 0) {
    pushText(padTwoColumn('Tax (GST):', `Rs.${invoice.taxTotal.toFixed(2)}`, cols));
  }

  pushText('='.repeat(cols));
  pushCmd(ESC_POS_COMMANDS.BOLD_ON);
  pushCmd(ESC_POS_COMMANDS.DOUBLE_SIZE_ON);
  pushText(padTwoColumn('TOTAL:', `Rs.${invoice.grandTotal.toFixed(0)}`, Math.floor(cols / 2)));
  pushCmd(ESC_POS_COMMANDS.DOUBLE_SIZE_OFF);
  pushCmd(ESC_POS_COMMANDS.BOLD_OFF);
  pushText('='.repeat(cols));

  // Payment Breakdown
  pushText(padTwoColumn('Payment Mode:', invoice.paymentMode.toUpperCase(), cols));
  if (invoice.cashTendered) {
    pushText(padTwoColumn('Cash Received:', `Rs.${invoice.cashTendered}`, cols));
  }
  if (invoice.changeDue && invoice.changeDue > 0) {
    pushText(padTwoColumn('Change Return:', `Rs.${invoice.changeDue.toFixed(2)}`, cols));
  }

  // 6. Footer
  pushCmd(ESC_POS_COMMANDS.ALIGN_CENTER);
  pushText('='.repeat(cols));
  pushCmd(ESC_POS_COMMANDS.BOLD_ON);
  pushText('Dhanyawaad! Phir Padharein!');
  pushCmd(ESC_POS_COMMANDS.BOLD_OFF);
  pushText('Powered by Kirana Pro');
  pushText('='.repeat(cols));

  // 7. Feed and Cut Paper
  pushCmd(ESC_POS_COMMANDS.FEED_3_LINES);
  if (settings.autoCut) {
    pushCmd(ESC_POS_COMMANDS.CUT_PAPER);
  }

  return new Uint8Array(bytes);
};

// ─── Test Receipt Generator ───────────────────────────────────────────────────

export const generateEscPosTestReceipt = (
  store: EscPosReceiptStoreInfo,
  settings: PrinterSettings
): Uint8Array => {
  const bytes: number[] = [];
  const cols = getColumnWidth(settings.width);

  const pushCmd = (cmd: number[]) => bytes.push(...cmd);
  const pushText = (str: string) => {
    bytes.push(...stringToBytes(str));
    bytes.push(0x0a);
  };

  pushCmd(ESC_POS_COMMANDS.INIT);
  pushCmd(ESC_POS_COMMANDS.ALIGN_CENTER);
  pushCmd(ESC_POS_COMMANDS.BOLD_ON);
  pushCmd(ESC_POS_COMMANDS.DOUBLE_SIZE_ON);
  pushText(store.name.toUpperCase());
  pushCmd(ESC_POS_COMMANDS.DOUBLE_SIZE_OFF);
  pushCmd(ESC_POS_COMMANDS.BOLD_OFF);

  pushText('PRINTER TEST RECEIPT');
  pushText(`Width: ${settings.width} (${cols} columns)`);
  pushText(`Connection: ${settings.connection.toUpperCase()}`);
  pushText(`Date: ${new Date().toLocaleString()}`);

  pushCmd(ESC_POS_COMMANDS.ALIGN_LEFT);
  pushText('-'.repeat(cols));
  pushText(padTwoColumn('Character Set:', 'Standard ASCII', cols));
  pushText(padTwoColumn('Auto-Cut Enabled:', settings.autoCut ? 'YES' : 'NO', cols));
  pushText(padTwoColumn('Drawer Kick:', settings.autoKickDrawer ? 'YES' : 'NO', cols));
  pushText('-'.repeat(cols));

  pushCmd(ESC_POS_COMMANDS.ALIGN_CENTER);
  pushCmd(ESC_POS_COMMANDS.BOLD_ON);
  pushText('✓ Printer Configured Correctly!');
  pushCmd(ESC_POS_COMMANDS.BOLD_OFF);
  pushText('Kirana Pro Hardware Ready');

  pushCmd(ESC_POS_COMMANDS.FEED_3_LINES);
  if (settings.autoCut) {
    pushCmd(ESC_POS_COMMANDS.CUT_PAPER);
  }

  return new Uint8Array(bytes);
};

export const generateCashDrawerKickBytes = (): Uint8Array => {
  return new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xfa]);
};
