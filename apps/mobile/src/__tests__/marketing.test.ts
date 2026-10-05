/**
 * marketing.test.ts – Phase 7 WhatsApp Marketing & UPI Collection Tests
 */
import {
  generateUPILink,
  formatKhataUPIReminder,
  formatFestivalOfferMessage,
  formatDigitalCatalogBroadcast,
  formatRationPackageMessage,
  OfferItem,
  CatalogProduct,
  RationPackageItem,
} from '../services/marketing';

describe('generateUPILink', () => {
  it('generates a valid UPI deep link', () => {
    const link = generateUPILink('ramesh@upi', 'Ramesh Kirana', 250);
    expect(link).toMatch(/^upi:\/\/pay\?/);
    expect(link).toContain('pa=ramesh%40upi');
    expect(link).toContain('pn=Ramesh+Kirana');
    expect(link).toContain('am=250.00');
    expect(link).toContain('cu=INR');
  });

  it('includes the default note when none provided', () => {
    const link = generateUPILink('shop@paytm', 'My Shop', 100);
    expect(link).toContain('tn=');
    expect(link).toContain('Dukaan+Payment');
  });

  it('includes a custom note', () => {
    const link = generateUPILink('shop@paytm', 'My Shop', 100, 'Invoice #123');
    expect(link).toContain('tn=Invoice+%23123');
  });

  it('formats amount to 2 decimal places', () => {
    const link = generateUPILink('a@b', 'Store', 99.9);
    expect(link).toContain('am=99.90');
  });

  it('handles large amounts correctly', () => {
    const link = generateUPILink('a@b', 'Store', 10000);
    expect(link).toContain('am=10000.00');
  });
});

describe('formatKhataUPIReminder', () => {
  it('contains the customer name', () => {
    const msg = formatKhataUPIReminder('Suresh', 'Sharma Kirana', 500, 'sharma@upi');
    expect(msg).toContain('Suresh');
  });

  it('contains the store name', () => {
    const msg = formatKhataUPIReminder('Suresh', 'Sharma Kirana', 500, 'sharma@upi');
    expect(msg).toContain('Sharma Kirana');
  });

  it('contains the amount due', () => {
    const msg = formatKhataUPIReminder('Suresh', 'Sharma Kirana', 500, 'sharma@upi');
    expect(msg).toContain('500');
  });

  it('contains a UPI deep link', () => {
    const msg = formatKhataUPIReminder('Suresh', 'Sharma Kirana', 500, 'sharma@upi');
    expect(msg).toContain('upi://pay?');
  });

  it('contains the UPI ID', () => {
    const msg = formatKhataUPIReminder('Suresh', 'Sharma Kirana', 500, 'sharma@upi');
    expect(msg).toContain('sharma@upi');
  });

  it('includes days overdue when provided', () => {
    const msg = formatKhataUPIReminder('Suresh', 'Sharma Kirana', 500, 'sharma@upi', 7);
    expect(msg).toContain('7 din se pending');
  });

  it('omits overdue text when daysOverdue is 0', () => {
    const msg = formatKhataUPIReminder('Suresh', 'Sharma Kirana', 500, 'sharma@upi', 0);
    expect(msg).not.toContain('din se pending');
  });

  it('omits overdue text when daysOverdue is undefined', () => {
    const msg = formatKhataUPIReminder('Suresh', 'Sharma Kirana', 500, 'sharma@upi');
    expect(msg).not.toContain('din se pending');
  });
});

describe('formatFestivalOfferMessage', () => {
  const sampleItems: OfferItem[] = [
    { name: 'Basmati Rice', originalPrice: 80, offerPrice: 65, unit: 'kg' },
    { name: 'Toor Dal', offerPrice: 120, unit: 'kg' },
    { name: 'Sugar', originalPrice: 45, offerPrice: 38, unit: 'kg' },
  ];

  it('contains the offer title', () => {
    const msg = formatFestivalOfferMessage(
      'Sharma Kirana', 'Diwali Special', 'Flat discount on essentials', sampleItems, '9876543210'
    );
    expect(msg).toContain('Diwali Special');
  });

  it('contains the store name', () => {
    const msg = formatFestivalOfferMessage(
      'Sharma Kirana', 'Diwali Special', 'Flat discount on essentials', sampleItems, '9876543210'
    );
    expect(msg).toContain('Sharma Kirana');
  });

  it('contains all item names', () => {
    const msg = formatFestivalOfferMessage(
      'Sharma Kirana', 'Diwali Special', 'Flat discount on essentials', sampleItems, '9876543210'
    );
    sampleItems.forEach((item) => expect(msg).toContain(item.name));
  });

  it('shows savings for items with originalPrice', () => {
    const msg = formatFestivalOfferMessage(
      'Sharma Kirana', 'Diwali Special', 'Flat discount', sampleItems, '9876543210'
    );
    expect(msg).toContain('Save ₹15'); // 80-65=15 for rice
  });

  it('does not show savings for items without originalPrice', () => {
    const items: OfferItem[] = [{ name: 'Toor Dal', offerPrice: 120 }];
    const msg = formatFestivalOfferMessage(
      'Sharma Kirana', 'Offer', 'desc', items, '9876543210'
    );
    expect(msg).not.toContain('Save');
  });

  it('contains the contact phone number', () => {
    const msg = formatFestivalOfferMessage(
      'Sharma Kirana', 'Diwali Special', 'Flat discount', sampleItems, '9876543210'
    );
    expect(msg).toContain('9876543210');
  });

  it('contains hashtags', () => {
    const msg = formatFestivalOfferMessage(
      'Sharma Kirana', 'Diwali Special', 'Flat discount', sampleItems, '9876543210'
    );
    expect(msg).toContain('#KiranaDeal');
  });
});

describe('formatDigitalCatalogBroadcast', () => {
  const sampleProducts: CatalogProduct[] = [
    { name: 'Atta', price: 40, unit: 'kg', inStock: true },
    { name: 'Rice', price: 60, unit: 'kg', inStock: true },
    { name: 'Refined Oil', price: 110, unit: 'L', inStock: false },
    { name: 'Sugar', price: 45, unit: 'kg', inStock: true },
  ];

  it('contains the store name', () => {
    const msg = formatDigitalCatalogBroadcast('Kirana Mart', sampleProducts, '9000011111');
    expect(msg).toContain('Kirana Mart');
  });

  it('lists only in-stock products', () => {
    const msg = formatDigitalCatalogBroadcast('Kirana Mart', sampleProducts, '9000011111');
    expect(msg).toContain('Atta');
    expect(msg).toContain('Rice');
    expect(msg).not.toContain('Refined Oil'); // out of stock
  });

  it('contains the phone number', () => {
    const msg = formatDigitalCatalogBroadcast('Kirana Mart', sampleProducts, '9000011111');
    expect(msg).toContain('9000011111');
  });

  it('shows correct available product count', () => {
    const msg = formatDigitalCatalogBroadcast('Kirana Mart', sampleProducts, '9000011111');
    expect(msg).toContain('Available Products (3)');
  });

  it('caps at 20 products', () => {
    const manyProducts: CatalogProduct[] = Array.from({ length: 25 }, (_, i) => ({
      name: `Product ${i + 1}`,
      price: 10 + i,
      inStock: true,
    }));
    const msg = formatDigitalCatalogBroadcast('Big Store', manyProducts, '9000000000');
    // Count occurrences of "Product"
    const matches = msg.match(/Product \d+/g) || [];
    expect(matches.length).toBeLessThanOrEqual(20);
  });
});

describe('formatRationPackageMessage', () => {
  const sampleItems: RationPackageItem[] = [
    { name: 'Atta', quantity: '5kg', price: 200 },
    { name: 'Rice', quantity: '5kg', price: 300 },
    { name: 'Dal', quantity: '1kg', price: 120 },
  ];

  it('contains the package name', () => {
    const msg = formatRationPackageMessage(
      'Sharma Kirana', 'Monthly Rashan Package', sampleItems, 560, 620, '9876500000'
    );
    expect(msg).toContain('Monthly Rashan Package');
  });

  it('contains the store name', () => {
    const msg = formatRationPackageMessage(
      'Sharma Kirana', 'Monthly Rashan Package', sampleItems, 560, 620, '9876500000'
    );
    expect(msg).toContain('Sharma Kirana');
  });

  it('lists all package items', () => {
    const msg = formatRationPackageMessage(
      'Sharma Kirana', 'Monthly Rashan Package', sampleItems, 560, 620, '9876500000'
    );
    sampleItems.forEach((item) => {
      expect(msg).toContain(item.name);
      expect(msg).toContain(item.quantity);
    });
  });

  it('shows the package price and savings', () => {
    const msg = formatRationPackageMessage(
      'Sharma Kirana', 'Monthly Rashan Package', sampleItems, 560, 620, '9876500000'
    );
    expect(msg).toContain('₹560');
    expect(msg).toContain('Save ₹60');
  });

  it('contains the contact number', () => {
    const msg = formatRationPackageMessage(
      'Sharma Kirana', 'Monthly Rashan Package', sampleItems, 560, 620, '9876500000'
    );
    expect(msg).toContain('9876500000');
  });
});
