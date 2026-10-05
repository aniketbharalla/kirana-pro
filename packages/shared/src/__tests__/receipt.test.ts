import { generateUpiUri } from '../utils/upi';
import { formatWhatsAppReceipt, generateInvoiceNumber } from '../utils/receipt';
import { Invoice } from '../types/invoice';

describe('Receipt & UPI Utilities', () => {
  it('generates standard NPCI UPI URI with exact bill amount and note', () => {
    const uri = generateUpiUri('9876543210@paytm', 'Shree Ganesh Kirana', 340.5, 'INV-2026-0001');
    expect(uri).toContain('upi://pay?');
    expect(uri).toContain('pa=9876543210%40paytm');
    expect(uri).toContain('am=340.50');
    expect(uri).toContain('cu=INR');
  });

  it('generates sequential invoice numbers with prefix and padding', () => {
    expect(generateInvoiceNumber('INV', 1)).toBe('INV-2026-0001');
    expect(generateInvoiceNumber('BILL', 42)).toBe('BILL-2026-0042');
  });

  it('formats clean WhatsApp receipt message with Hindi greetings and items', () => {
    const invoice: Invoice = {
      id: 'inv_123',
      invoiceNumber: 'INV-2026-0001',
      storeId: 'store_1',
      items: [
        {
          productId: 'prod_1',
          name: 'Aashirvaad Atta 5kg',
          nameHindi: 'आशीर्वाद चक्की आटा',
          unit: 'packet',
          isLoose: false,
          quantity: 1,
          unitPrice: 250,
          discount: 0,
          gstRate: 0,
          taxableAmount: 250,
          gstAmount: 0,
          totalAmount: 250,
        },
      ],
      subtotal: 250,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 250,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      amountPaid: 250,
      amountDue: 0,
      createdAt: '2026-10-05T10:00:00.000Z',
      createdBy: 'user_1',
    };

    const text = formatWhatsAppReceipt(invoice, 'Shree Ganesh Kirana');
    expect(text).toContain('Shree Ganesh Kirana');
    expect(text).toContain('INV-2026-0001');
    expect(text).toContain('Aashirvaad Atta');
    expect(text).toContain('250');
    expect(text).toContain('धन्यवाद');
  });
});
