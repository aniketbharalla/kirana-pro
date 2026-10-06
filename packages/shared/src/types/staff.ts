export type StaffRole = 'owner' | 'manager' | 'cashier';

export interface StaffMember {
  id: string;
  storeId: string;
  name: string;
  phone?: string;
  role: StaffRole;
  pin: string;             // 4-digit numeric PIN, e.g. "1234"
  counterAssigned?: number; // e.g. 1 for Counter 1
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CounterSession {
  id: string;
  storeId: string;
  counterNumber: number;
  staffId: string;
  staffName: string;
  role: StaffRole;
  openedAt: string;
  closedAt?: string;
  openingCash: number;     // Cash drawer opening float
  closingCash?: number;    // Counted cash at shift end
  totalSales: number;
  cashSales: number;
  upiSales: number;
  creditSales: number;
  invoiceCount: number;
  expectedCash?: number;   // openingCash + cashSales
  variance?: number;       // closingCash - expectedCash (surplus/shortage)
  notes?: string;
  isClosed: boolean;
}
