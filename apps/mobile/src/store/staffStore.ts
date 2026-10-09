import { create } from 'zustand';
import { StaffMember, StaffRole, CounterSession } from '@kirana-pro/shared';

export const DEFAULT_STARTER_STAFF: StaffMember[] = [
  {
    id: 'staff_owner',
    storeId: 'demo_store_1',
    name: 'Dukaan Malik (Owner)',
    phone: '9876543210',
    role: 'owner',
    pin: '1234',
    counterAssigned: 1,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'staff_cashier_1',
    storeId: 'demo_store_1',
    name: 'Rohan Sharma (Cashier 1)',
    phone: '9811122233',
    role: 'cashier',
    pin: '0000',
    counterAssigned: 1,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'staff_cashier_2',
    storeId: 'demo_store_1',
    name: 'Amit Patel (Cashier 2)',
    phone: '9822233344',
    role: 'cashier',
    pin: '1111',
    counterAssigned: 2,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
];

export interface StaffState {
  activeStaff: StaffMember | null;
  activeCounterSession: CounterSession | null;
  staffList: StaffMember[];
  isLocked: boolean;
  counterNumber: number;

  // Actions
  setActiveStaff: (staff: StaffMember | null) => void;
  setCounterNumber: (counter: number) => void;
  lockCounter: () => void;
  unlockWithPIN: (pin: string) => { success: boolean; staff?: StaffMember; error?: string };
  addStaff: (data: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => StaffMember;
  updateStaff: (staffId: string, updates: Partial<StaffMember>) => void;
  removeStaff: (staffId: string) => void;

  // Counter Shift Management
  openShift: (counterNumber: number, openingCash: number) => CounterSession;
  recordShiftSale: (amount: number, mode: 'cash' | 'upi' | 'credit' | 'split') => void;
  closeShift: (closingCash: number, notes?: string) => CounterSession | null;

  // Role permissions checker
  hasPermission: (
    action: 'bill' | 'edit_catalog' | 'view_reports' | 'manage_staff' | 'change_prices'
  ) => boolean;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  activeStaff: DEFAULT_STARTER_STAFF[0], // default to Owner
  activeCounterSession: {
    id: `shift_${Date.now()}`,
    storeId: 'demo_store_1',
    counterNumber: 1,
    staffId: DEFAULT_STARTER_STAFF[0].id,
    staffName: DEFAULT_STARTER_STAFF[0].name,
    role: 'owner',
    openedAt: new Date().toISOString(),
    openingCash: 1000,
    totalSales: 0,
    cashSales: 0,
    upiSales: 0,
    creditSales: 0,
    invoiceCount: 0,
    isClosed: false,
  },
  staffList: DEFAULT_STARTER_STAFF,
  isLocked: false,
  counterNumber: 1,

  setActiveStaff: (staff) => set({ activeStaff: staff }),
  setCounterNumber: (counterNumber) => set({ counterNumber }),
  lockCounter: () => set({ isLocked: true }),

  unlockWithPIN: (pin: string) => {
    const { staffList, counterNumber } = get();
    const matched = staffList.find((s) => s.pin === pin && s.isActive);

    if (!matched) {
      return { success: false, error: 'Incorrect 4-digit PIN. Try again.' };
    }

    set({ activeStaff: matched, isLocked: false });

    // Update active shift session staff if open
    const currentShift = get().activeCounterSession;
    if (currentShift && !currentShift.isClosed) {
      set({
        activeCounterSession: {
          ...currentShift,
          staffId: matched.id,
          staffName: matched.name,
          role: matched.role,
        },
      });
    }

    return { success: true, staff: matched };
  },

  addStaff: (data) => {
    const now = new Date().toISOString();
    const newStaff: StaffMember = {
      ...data,
      id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ staffList: [...state.staffList, newStaff] }));
    return newStaff;
  },

  updateStaff: (staffId, updates) => {
    const now = new Date().toISOString();
    set((state) => {
      const updatedList = state.staffList.map((s) =>
        s.id === staffId ? { ...s, ...updates, updatedAt: now } : s
      );
      const updatedActive =
        state.activeStaff?.id === staffId ? { ...state.activeStaff, ...updates, updatedAt: now } : state.activeStaff;
      return { staffList: updatedList, activeStaff: updatedActive };
    });
  },

  removeStaff: (staffId) => {
    set((state) => ({
      staffList: state.staffList.map((s) => (s.id === staffId ? { ...s, isActive: false } : s)),
    }));
  },

  openShift: (counterNumber: number, openingCash: number) => {
    const { activeStaff } = get();
    const now = new Date().toISOString();
    const newShift: CounterSession = {
      id: `shift_${Date.now()}`,
      storeId: activeStaff?.storeId || 'demo_store_1',
      counterNumber,
      staffId: activeStaff?.id || 'staff_owner',
      staffName: activeStaff?.name || 'Owner',
      role: activeStaff?.role || 'owner',
      openedAt: now,
      openingCash,
      totalSales: 0,
      cashSales: 0,
      upiSales: 0,
      creditSales: 0,
      invoiceCount: 0,
      isClosed: false,
    };

    set({ activeCounterSession: newShift, counterNumber });
    return newShift;
  },

  recordShiftSale: (amount: number, mode: 'cash' | 'upi' | 'credit' | 'split') => {
    const { activeCounterSession } = get();
    if (!activeCounterSession || activeCounterSession.isClosed) return;

    const currentCash = activeCounterSession.cashSales || 0;
    const currentUpi = activeCounterSession.upiSales || 0;
    const currentCredit = activeCounterSession.creditSales || 0;

    const newCash = mode === 'cash' || mode === 'split' ? currentCash + amount : currentCash;
    const newUpi = mode === 'upi' ? currentUpi + amount : currentUpi;
    const newCredit = mode === 'credit' ? currentCredit + amount : currentCredit;

    set({
      activeCounterSession: {
        ...activeCounterSession,
        totalSales: activeCounterSession.totalSales + amount,
        cashSales: newCash,
        upiSales: newUpi,
        creditSales: newCredit,
        invoiceCount: activeCounterSession.invoiceCount + 1,
      },
    });
  },

  closeShift: (closingCash: number, notes?: string) => {
    const { activeCounterSession } = get();
    if (!activeCounterSession) return null;

    const now = new Date().toISOString();
    const expectedCash = activeCounterSession.openingCash + activeCounterSession.cashSales;
    const variance = closingCash - expectedCash;

    const closedSession: CounterSession = {
      ...activeCounterSession,
      closedAt: now,
      closingCash,
      expectedCash,
      variance,
      notes,
      isClosed: true,
    };

    set({ activeCounterSession: closedSession });
    return closedSession;
  },

  hasPermission: (action) => {
    const { activeStaff } = get();
    if (!activeStaff) return false;
    const role = activeStaff.role;

    if (role === 'owner') return true;

    if (role === 'manager') {
      // Manager can bill, edit catalog, view reports, change prices
      return ['bill', 'edit_catalog', 'view_reports', 'change_prices'].includes(action);
    }

    if (role === 'cashier') {
      // Cashier can only bill and scan
      return action === 'bill';
    }

    return false;
  },
}));
