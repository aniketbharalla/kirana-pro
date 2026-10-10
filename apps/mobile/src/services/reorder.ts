import { Product, Invoice } from '@kirana-pro/shared';

export type ReorderUrgency = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'SUFFICIENT';

export interface ReorderItemRecommendation {
  product: Product;
  dailyVelocity: number;
  daysRemaining: number | null;
  urgency: ReorderUrgency;
  suggestedQty: number;
  estimatedCost: number;
}

export interface ReorderSummary {
  recommendations: ReorderItemRecommendation[];
  criticalCount: number;
  highCount: number;
  totalSuggestedCost: number;
}

/**
 * Calculates average daily sales velocity per product over a given window of days
 */
export const calculateSalesVelocity = (
  invoices: Invoice[],
  daysWindow = 7,
  referenceDate: Date = new Date()
): Map<string, number> => {
  const velocityMap = new Map<string, number>();
  const effectiveWindow = Math.max(1, daysWindow);

  const windowStartDate = new Date(referenceDate);
  windowStartDate.setDate(referenceDate.getDate() - effectiveWindow);
  windowStartDate.setHours(0, 0, 0, 0);

  invoices.forEach((inv) => {
    const invDate = new Date(inv.createdAt);
    if (invDate >= windowStartDate) {
      inv.items?.forEach((item) => {
        const currentUnits = velocityMap.get(item.productId) || 0;
        velocityMap.set(item.productId, currentUnits + (item.quantity || 0));
      });
    }
  });

  // Convert total units in window to units/day
  const dailyRateMap = new Map<string, number>();
  velocityMap.forEach((totalUnits, prodId) => {
    const dailyRate = Math.round((totalUnits / effectiveWindow) * 10) / 10;
    dailyRateMap.set(prodId, dailyRate);
  });

  return dailyRateMap;
};

/**
 * Generates smart replenishment recommendations based on current stock, sales velocity, and target buffer days
 */
export const computeReorderRecommendations = (
  products: Product[],
  invoices: Invoice[],
  targetBufferDays = 7,
  referenceDate: Date = new Date()
): ReorderSummary => {
  const velocityMap = calculateSalesVelocity(invoices, 7, referenceDate);
  const recommendations: ReorderItemRecommendation[] = [];

  let criticalCount = 0;
  let highCount = 0;
  let totalSuggestedCost = 0;

  products.forEach((prod) => {
    if (prod.isActive === false) return;

    const currentStock = prod.currentStock || 0;
    const minAlert = prod.minStockAlert || 5;
    const dailyVelocity = velocityMap.get(prod.id) || 0;

    let daysRemaining: number | null = null;
    let urgency: ReorderUrgency = 'SUFFICIENT';

    if (dailyVelocity > 0) {
      daysRemaining = Math.round((currentStock / dailyVelocity) * 10) / 10;
      if (currentStock === 0 || daysRemaining <= 1) {
        urgency = 'CRITICAL';
      } else if (daysRemaining <= 3 || currentStock <= minAlert) {
        urgency = 'HIGH';
      } else if (daysRemaining <= targetBufferDays) {
        urgency = 'NORMAL';
      } else {
        urgency = 'SUFFICIENT';
      }
    } else {
      // No recent sales
      if (currentStock === 0) {
        urgency = 'CRITICAL';
      } else if (currentStock <= minAlert) {
        urgency = 'HIGH';
      } else {
        urgency = 'SUFFICIENT';
      }
    }

    // Recommended Order Quantity to reach bufferDays
    let suggestedQty = 0;
    if (urgency === 'CRITICAL' || urgency === 'HIGH' || urgency === 'NORMAL') {
      const targetStock = Math.max(minAlert * 2, Math.ceil(dailyVelocity * targetBufferDays));
      suggestedQty = Math.max(0, targetStock - currentStock);

      // Round to neat packaging units (e.g. at least 5 for packets)
      if (suggestedQty > 0 && prod.unit === 'packet' && suggestedQty < 5) {
        suggestedQty = 5;
      }
    }

    const estimatedCost = Math.round(suggestedQty * (prod.purchasePrice || 0) * 100) / 100;

    if (urgency === 'CRITICAL') criticalCount++;
    if (urgency === 'HIGH') highCount++;
    totalSuggestedCost += estimatedCost;

    recommendations.push({
      product: prod,
      dailyVelocity,
      daysRemaining,
      urgency,
      suggestedQty,
      estimatedCost,
    });
  });

  // Sort by urgency priority (CRITICAL -> HIGH -> NORMAL -> SUFFICIENT)
  const urgencyWeight: Record<ReorderUrgency, number> = {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    SUFFICIENT: 4,
  };

  recommendations.sort((a, b) => {
    const diff = urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
    if (diff !== 0) return diff;
    return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
  });

  return {
    recommendations,
    criticalCount,
    highCount,
    totalSuggestedCost: Math.round(totalSuggestedCost * 100) / 100,
  };
};

/**
 * Formats a clean WhatsApp wholesale purchase order in Hindi and English
 */
export const formatWhatsAppPurchaseOrder = (
  storeName: string,
  supplierName: string,
  items: { name: string; quantity: number; unit: string }[],
  deliveryNote = 'Please confirm stock and dispatch today.'
): string => {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const header = `*${storeName} - PURCHASE ORDER (ऑर्डर)*\nDate: ${dateStr}\nSupplier: ${supplierName}\n----------------------------------\n`;

  const itemsList = items
    .map((item, idx) => `${idx + 1}. *${item.name}* : ${item.quantity} ${item.unit}`)
    .join('\n');

  const footer = `\n----------------------------------\nNote: ${deliveryNote}\nधन्यवाद!`;

  return `${header}${itemsList}${footer}`;
};

/**
 * Creates a WhatsApp URL for dispatching the purchase order
 */
export const generateWhatsAppOrderUrl = (
  rawPhoneNumber: string,
  message: string
): string => {
  const cleanPhone = rawPhoneNumber.replace(/[^0-9]/g, '');
  const phoneWithCountry =
    cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
};
