import {
  formatReceiptPlainText,
  generateEscPosInvoiceReceipt,
  generateEscPosTestReceipt,
  generateCashDrawerKickBytes,
  getColumnWidth,
  padCenter,
  padTwoColumn,
  padFourColumn,
} from '../utils/escpos';
import { Invoice } from '../types/invoice';
import { PrinterSettings, EscPosReceiptStoreInfo } from '../types/hardware';

describe('ESC/POS Thermal Receipt Generator', () => {
  const store: EscPosReceiptStoreInfo = {
    name: 'Sharma Kirana Store',
    address: 'Chawri Bazar, Delhi-110006',
    phone: '9876543210',
    gstin: '07AABCK1234F1Z5',
  };

  const invoice: Invoice = {
    id: 'inv_101',
    invoiceNumber: 'INV-2026-0042',
    storeId: 'demo_store_1',
    items: [
      {
        productId: 'prod_1',
        name: 'Aashirvaad Atta 5kg',
        unit: 'packet',
        isLoose: false,
        quantity: 2,
        unitPrice: 250,
        discount: 0,
        gstRate: 0,
        taxableAmount: 500,
        gstAmount: 0,
        totalAmount: 500,
      },
      {
        productId: 'prod_2',
        name: 'Tata Salt 1kg',
        unit: 'packet',
        isLoose: false,
        quantity: 1,
        unitPrice: 28,
        discount: 0,
        gstRate: 0,
        taxableAmount: 28,
        gstAmount: 0,
        totalAmount: 28,
      },
    ],
    subtotal: 528,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 528,
    paymentMode: 'cash',
    paymentStatus: 'paid',
    amountPaid: 528,
    amountDue: 0,
    cashTendered: 600,
    changeDue: 72,
    createdAt: '2026-10-06T10:00:00.000Z',
    createdBy: 'cashier_1',
    counterNumber: 1,
    staffName: 'Rohan Sharma',
  };

  const settings58: PrinterSettings = {
    width: '58mm',
    connection: 'bluetooth',
    autoCut: true,
    autoKickDrawer: true,
  };

  const settings80: PrinterSettings = {
    width: '80mm',
    connection: 'usb',
    autoCut: true,
    autoKickDrawer: false,
  };

  describe('Column Width and Padding', () => {
    it('returns 32 cols for 58mm and 48 cols for 80mm', () => {
      expect(getColumnWidth('58mm')).toBe(32);
      expect(getColumnWidth('80mm')).toBe(48);
    });

    it('pads text to center', () => {
      const centered = padCenter('KIRANA', 12);
      expect(centered.length).toBe(12);
      expect(centered.trim()).toBe('KIRANA');
    });

    it('pads two columns left and right aligned', () => {
      const row = padTwoColumn('Total:', 'Rs.500', 20);
      expect(row.length).toBe(20);
      expect(row.startsWith('Total:')).toBe(true);
      expect(row.endsWith('Rs.500')).toBe(true);
    });

    it('pads 4-column receipt table line item', () => {
      const row58 = padFourColumn('Atta 5kg', '2', '250', '500.00', 32);
      expect(row58.length).toBe(32);

      const row80 = padFourColumn('Aashirvaad Atta 5kg', '2', '250', '500.00', 48);
      expect(row80.length).toBe(48);
    });
  });

  describe('Plain Text Receipt Formatting', () => {
    it('creates formatted 58mm receipt string with store header and items', () => {
      const receipt = formatReceiptPlainText(invoice, store, '58mm');

      expect(receipt).toContain('SHARMA KIRANA STORE');
      expect(receipt).toContain('INV-2026-0042');
      expect(receipt).toContain('Aashirvaad Att');
      expect(receipt).toContain('Tata Salt 1kg');
      expect(receipt).toContain('528.00');
      expect(receipt).toContain('Cash Received:');
      expect(receipt).toContain('Change Returned:');
      expect(receipt).toContain('Dhanyawaad! Phir Padharein!');
    });
  });

  describe('ESC/POS Binary Generation', () => {
    it('generates non-empty Uint8Array with init and cut commands for 58mm', () => {
      const bytes = generateEscPosInvoiceReceipt(invoice, store, settings58);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(100);

      // Verify ESC @ init command is at beginning
      expect(bytes[0]).toBe(0x1b);
      expect(bytes[1]).toBe(0x40);

      // Verify paper cut command is present
      const cutFound = bytes.some((b, i) => b === 0x1d && bytes[i + 1] === 0x56);
      expect(cutFound).toBe(true);
    });

    it('generates test receipt with printer info', () => {
      const testBytes = generateEscPosTestReceipt(store, settings80);
      expect(testBytes).toBeInstanceOf(Uint8Array);
      expect(testBytes.length).toBeGreaterThan(50);
    });

    it('generates cash drawer kick command bytes', () => {
      const kick = generateCashDrawerKickBytes();
      expect(kick[0]).toBe(0x1b);
      expect(kick[1]).toBe(0x70);
    });
  });
});
