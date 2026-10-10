/**
 * marketing.ts
 * WhatsApp Khata UPI Collection & Customer Marketing Service
 * Phase 6+7 – Kirana Pro ERP
 */

// ─── UPI Link Generation ───────────────────────────────────────────────────

/**
 * Generates a NPCI-compliant UPI deep link.
 * upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 */
export const generateUPILink = (
  upiId: string,
  merchantName: string,
  amount: number,
  note: string = 'Dukaan Payment'
): string => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: merchantName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
};

// ─── Khata Reminder Message ────────────────────────────────────────────────

/**
 * Formats a WhatsApp-ready Khata UPI collection reminder message.
 */
export const formatKhataUPIReminder = (
  customerName: string,
  storeName: string,
  amountDue: number,
  upiId: string,
  daysOverdue?: number
): string => {
  const upiLink = generateUPILink(upiId, storeName, amountDue, `Khata payment – ${storeName}`);
  const overdueText = daysOverdue && daysOverdue > 0 ? ` (${daysOverdue} din se pending)` : '';
  return (
    `Namaste *${customerName}* ji,\n\n` +
    `Aapke *${storeName}* pe ₹*${amountDue.toLocaleString('en-IN')}* ka udhar baaki hai${overdueText}.\n\n` +
    `Ek tap mein pay karein:\n` +
    `*UPI Pay Link:*\n${upiLink}\n\n` +
    `Ya seedha UPI ID pe bhejein:\n*${upiId}*\n\n` +
    `Dhanyawad\n– ${storeName}`
  );
};

// ─── Festival / Offer Broadcast ───────────────────────────────────────────

export interface OfferItem {
  name: string;
  originalPrice?: number;
  offerPrice: number;
  unit?: string;
}

/**
 * Generates a WhatsApp-formatted festival grocery offer broadcast.
 */
export const formatFestivalOfferMessage = (
  storeName: string,
  offerTitle: string,
  description: string,
  items: OfferItem[],
  phone: string
): string => {
  const itemLines = items
    .map((item) => {
      const unit = item.unit ? `/${item.unit}` : '';
      const saving = item.originalPrice
        ? ` (Save ₹${(item.originalPrice - item.offerPrice).toFixed(0)})`
        : '';
      return `  • ${item.name}: ₹${item.offerPrice}${unit}${saving}`;
    })
    .join('\n');

  return (
    `*${offerTitle}*\n` +
    `*${storeName}*\n\n` +
    `${description}\n\n` +
    `*Offer Items:*\n${itemLines}\n\n` +
    `Order karein: *${phone}*\n` +
    `Limited time only!\n\n` +
    `#KiranaDeal #GroceryOffer #${storeName.replace(/\s+/g, '')}`
  );
};

// ─── Digital Catalog Broadcast ────────────────────────────────────────────

export interface CatalogProduct {
  name: string;
  price: number;
  unit?: string;
  inStock: boolean;
}

/**
 * Formats a shareable digital dukaan catalog for WhatsApp.
 */
export const formatDigitalCatalogBroadcast = (
  storeName: string,
  products: CatalogProduct[],
  phone: string
): string => {
  const availableProducts = products.filter((p) => p.inStock);
  const productLines = availableProducts
    .slice(0, 20)
    .map((p) => {
      const unit = p.unit ? `/${p.unit}` : '';
      return `  • ${p.name} – ₹${p.price}${unit}`;
    })
    .join('\n');

  return (
    `*${storeName} – Digital Dukaan Menu*\n\n` +
    `Ab ghar baithe order karein! Hum home delivery bhi karte hain.\n\n` +
    `*Available Products (${availableProducts.length}):*\n${productLines}\n\n` +
    `Order bhejein: *${phone}*\n` +
    `WhatsApp ya call karein – fast delivery!`
  );
};

// ─── Monthly Ration Package ───────────────────────────────────────────────

export interface RationPackageItem {
  name: string;
  quantity: string;
  price: number;
}

/**
 * Formats a monthly ration (rashan) package offer message.
 */
export const formatRationPackageMessage = (
  storeName: string,
  packageName: string,
  items: RationPackageItem[],
  totalPrice: number,
  originalTotal: number,
  phone: string
): string => {
  const itemLines = items.map((i) => `  • ${i.name} ${i.quantity} – ₹${i.price}`).join('\n');
  const savings = originalTotal - totalPrice;

  return (
    `*${packageName}*\n` +
    `${storeName}\n\n` +
    `Mahine bhar ka saara rashan ek hi order mein!\n\n` +
    `*Package Contents:*\n${itemLines}\n\n` +
    `*Package Price: ₹${totalPrice}* (Save ₹${savings}!)\n\n` +
    `Abhi order karein: *${phone}*`
  );
};
