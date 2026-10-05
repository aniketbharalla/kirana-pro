export interface DailyGallaSession {
  id: string;
  storeId: string;
  date: string;               // YYYY-MM-DD
  openedAt: number;           // epoch ms
  closedAt?: number;
  openingCash: number;        // e.g. ₹2,000 kept in drawer at start of day
  systemSalesCash: number;    // total cash collected from invoices
  systemSalesUPI: number;     // total UPI collected
  systemSalesUdhar: number;   // total Udhar given
  systemUdharRepaid: number;  // cash collected from khata repayments
  expenses: number;           // petty cash taken out for chai/cleaning/etc.
  expectedClosingCash: number;// openingCash + systemSalesCash + systemUdharRepaid - expenses
  actualClosingCash?: number; // physical cash counted at night
  cashDifference?: number;    // actualClosingCash - expectedClosingCash (shortage / surplus)
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  closedBy?: string;
}
