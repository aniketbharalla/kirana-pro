import { Invoice, Product } from '@kirana-pro/shared';

export type AnalyticsDateRange = 'today' | 'week' | 'month' | 'all';

export interface SalesAndProfitSummary {
  grossSales: number;
  totalDiscount: number;
  totalTax: number;
  totalCOGS: number;
  netProfit: number;
  profitMarginPercent: number;
  invoiceCount: number;
  averageBillValue: number;
}

export interface PaymentBreakdown {
  cash: number;
  upi: number;
  credit: number;
  split: number;
  total: number;
  cashPercent: number;
  upiPercent: number;
  creditPercent: number;
}

export interface ProductPerformanceItem {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  currentStock: number;
}

export interface GSTSlabSummary {
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  totalTax: number;
}

export interface GSTReport {
  slabs: GSTSlabSummary[];
  totalTaxable: number;
  totalCGST: number;
  totalSGST: number;
  totalTaxCollected: number;
}

/**
 * Filters invoices by the selected time period
 */
export const filterInvoicesByDateRange = (
  invoices: Invoice[],
  range: AnalyticsDateRange,
  referenceDate: Date = new Date()
): Invoice[] => {
  if (range === 'all') return invoices;

  const ref = new Date(referenceDate);

  if (range === 'today') {
    const startOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
    const endOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);
    return invoices.filter((inv) => {
      const invDate = new Date(inv.createdAt);
      return invDate >= startOfToday && invDate <= endOfToday;
    });
  }

  if (range === 'week') {
    const sevenDaysAgo = new Date(ref);
    sevenDaysAgo.setDate(ref.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return invoices.filter((inv) => new Date(inv.createdAt) >= sevenDaysAgo);
  }

  if (range === 'month') {
    const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0);
    return invoices.filter((inv) => new Date(inv.createdAt) >= startOfMonth);
  }

  return invoices;
};

/**
 * Calculates Gross Sales, Cost of Goods Sold (COGS), and Net Dukaan Profit
 */
export const computeSalesAndProfitSummary = (
  invoices: Invoice[],
  products: Product[]
): SalesAndProfitSummary => {
  const productCostMap = new Map<string, number>();
  products.forEach((p) => {
    productCostMap.set(p.id, p.purchasePrice || 0);
  });

  let grossSales = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalCOGS = 0;

  invoices.forEach((inv) => {
    grossSales += inv.grandTotal || 0;
    totalDiscount += inv.discountTotal || 0;
    totalTax += inv.taxTotal || 0;

    inv.items?.forEach((item) => {
      // Find purchase cost
      const costPerUnit = productCostMap.get(item.productId) ?? (item.unitPrice ? item.unitPrice * 0.8 : 0);
      totalCOGS += (item.quantity || 0) * costPerUnit;
    });
  });

  grossSales = Math.round(grossSales * 100) / 100;
  totalCOGS = Math.round(totalCOGS * 100) / 100;
  const netProfit = Math.round((grossSales - totalCOGS) * 100) / 100;
  const profitMarginPercent =
    grossSales > 0 ? Math.round((netProfit / grossSales) * 1000) / 10 : 0;
  const invoiceCount = invoices.length;
  const averageBillValue =
    invoiceCount > 0 ? Math.round((grossSales / invoiceCount) * 100) / 100 : 0;

  return {
    grossSales,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalCOGS,
    netProfit,
    profitMarginPercent,
    invoiceCount,
    averageBillValue,
  };
};

/**
 * Aggregates collection by payment mode (Cash in Galla vs UPI vs Khata Udhar)
 */
export const computePaymentBreakdown = (invoices: Invoice[]): PaymentBreakdown => {
  let cash = 0;
  let upi = 0;
  let credit = 0;
  let split = 0;

  invoices.forEach((inv) => {
    const amount = inv.grandTotal || 0;
    if (inv.paymentMode === 'cash') cash += amount;
    else if (inv.paymentMode === 'upi') upi += amount;
    else if (inv.paymentMode === 'credit') credit += amount;
    else if (inv.paymentMode === 'split') split += amount;
  });

  const total = cash + upi + credit + split;
  const cashPercent = total > 0 ? Math.round((cash / total) * 100) : 0;
  const upiPercent = total > 0 ? Math.round((upi / total) * 100) : 0;
  const creditPercent = total > 0 ? Math.round((credit / total) * 100) : 0;

  return {
    cash: Math.round(cash * 100) / 100,
    upi: Math.round(upi * 100) / 100,
    credit: Math.round(credit * 100) / 100,
    split: Math.round(split * 100) / 100,
    total: Math.round(total * 100) / 100,
    cashPercent,
    upiPercent,
    creditPercent,
  };
};

/**
 * Calculates top selling bestsellers and slow-moving / dead stock
 */
export const computeTopAndSlowProducts = (
  invoices: Invoice[],
  products: Product[],
  limit = 5
): {
  topSelling: ProductPerformanceItem[];
  slowMoving: ProductPerformanceItem[];
} => {
  const perfMap = new Map<string, { unitsSold: number; revenue: number }>();

  invoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      const existing = perfMap.get(item.productId) || { unitsSold: 0, revenue: 0 };
      perfMap.set(item.productId, {
        unitsSold: existing.unitsSold + (item.quantity || 0),
        revenue: existing.revenue + (item.totalAmount || 0),
      });
    });
  });

  const performanceList: ProductPerformanceItem[] = products.map((prod) => {
    const stats = perfMap.get(prod.id) || { unitsSold: 0, revenue: 0 };
    const cost = (prod.purchasePrice || 0) * stats.unitsSold;
    const profit = stats.revenue - cost;
    return {
      productId: prod.id,
      name: prod.name,
      category: prod.category || 'General',
      unitsSold: stats.unitsSold,
      revenue: Math.round(stats.revenue * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      currentStock: prod.currentStock || 0,
    };
  });

  const topSelling = [...performanceList]
    .filter((p) => p.unitsSold > 0)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit);

  const slowMoving = [...performanceList]
    .sort((a, b) => a.unitsSold - b.unitsSold)
    .slice(0, limit);

  return { topSelling, slowMoving };
};

/**
 * Computes GST Tax Slabs (0%, 5%, 12%, 18%, 28%) with CGST and SGST breakdown
 */
export const computeGSTTaxReport = (invoices: Invoice[]): GSTReport => {
  const slabMap = new Map<number, { taxableValue: number; totalTax: number }>();

  [0, 5, 12, 18, 28].forEach((rate) => {
    slabMap.set(rate, { taxableValue: 0, totalTax: 0 });
  });

  invoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      const rate = item.gstRate || 0;
      const current = slabMap.get(rate) || { taxableValue: 0, totalTax: 0 };
      slabMap.set(rate, {
        taxableValue: current.taxableValue + (item.taxableAmount || 0),
        totalTax: current.totalTax + (item.gstAmount || 0),
      });
    });
  });

  let totalTaxable = 0;
  let totalTaxCollected = 0;

  const slabs: GSTSlabSummary[] = [];

  slabMap.forEach((val, rate) => {
    const taxableValue = Math.round(val.taxableValue * 100) / 100;
    const totalTax = Math.round(val.totalTax * 100) / 100;
    const cgst = Math.round((totalTax / 2) * 100) / 100;
    const sgst = Math.round((totalTax - cgst) * 100) / 100;

    totalTaxable += taxableValue;
    totalTaxCollected += totalTax;

    slabs.push({
      gstRate: rate,
      taxableValue,
      cgst,
      sgst,
      totalTax,
    });
  });

  slabs.sort((a, b) => a.gstRate - b.gstRate);

  const totalCGST = Math.round((totalTaxCollected / 2) * 100) / 100;
  const totalSGST = Math.round((totalTaxCollected - totalCGST) * 100) / 100;

  return {
    slabs,
    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalCGST,
    totalSGST,
    totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
  };
};
