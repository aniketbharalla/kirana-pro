import { create } from 'zustand';
import { DailyGallaSession } from '@kirana-pro/shared';

interface GallaState {
  currentSession: DailyGallaSession | null;
  history: DailyGallaSession[];

  openSession: (openingCash: number, storeId?: string) => void;
  recordCashSale: (amount: number) => void;
  recordUpiSale: (amount: number) => void;
  recordUdharRepayment: (amount: number) => void;
  recordPettyExpense: (amount: number) => void;
  closeSession: (actualClosingCash: number, notes?: string) => void;
  reset: () => void;
}

export const useGallaStore = create<GallaState>((set, get) => ({
  currentSession: null,
  history: [],

  openSession: (openingCash, storeId = 'dev_store_001') => {
    const today = new Date().toISOString().split('T')[0];
    const session: DailyGallaSession = {
      id: `galla_${today}_${Date.now()}`,
      storeId,
      date: today,
      openedAt: Date.now(),
      openingCash,
      systemSalesCash: 0,
      systemSalesUPI: 0,
      systemSalesUdhar: 0,
      systemUdharRepaid: 0,
      expenses: 0,
      expectedClosingCash: openingCash,
      status: 'OPEN',
    };
    set({ currentSession: session });
  },

  recordCashSale: (amount) => {
    const { currentSession } = get();
    if (!currentSession || currentSession.status !== 'OPEN') return;
    const newSalesCash = currentSession.systemSalesCash + amount;
    const expected =
      currentSession.openingCash +
      newSalesCash +
      currentSession.systemUdharRepaid -
      currentSession.expenses;

    set({
      currentSession: {
        ...currentSession,
        systemSalesCash: newSalesCash,
        expectedClosingCash: expected,
      },
    });
  },

  recordUpiSale: (amount) => {
    const { currentSession } = get();
    if (!currentSession || currentSession.status !== 'OPEN') return;
    set({
      currentSession: {
        ...currentSession,
        systemSalesUPI: currentSession.systemSalesUPI + amount,
      },
    });
  },

  recordUdharRepayment: (amount) => {
    const { currentSession } = get();
    if (!currentSession || currentSession.status !== 'OPEN') return;
    const newUdharRepaid = currentSession.systemUdharRepaid + amount;
    const expected =
      currentSession.openingCash +
      currentSession.systemSalesCash +
      newUdharRepaid -
      currentSession.expenses;

    set({
      currentSession: {
        ...currentSession,
        systemUdharRepaid: newUdharRepaid,
        expectedClosingCash: expected,
      },
    });
  },

  recordPettyExpense: (amount) => {
    const { currentSession } = get();
    if (!currentSession || currentSession.status !== 'OPEN') return;
    const newExpenses = currentSession.expenses + amount;
    const expected =
      currentSession.openingCash +
      currentSession.systemSalesCash +
      currentSession.systemUdharRepaid -
      newExpenses;

    set({
      currentSession: {
        ...currentSession,
        expenses: newExpenses,
        expectedClosingCash: expected,
      },
    });
  },

  closeSession: (actualClosingCash, notes = '') => {
    const { currentSession, history } = get();
    if (!currentSession) return;
    const cashDiff = actualClosingCash - currentSession.expectedClosingCash;
    const closed: DailyGallaSession = {
      ...currentSession,
      actualClosingCash,
      cashDifference: cashDiff,
      closedAt: Date.now(),
      status: 'CLOSED',
      notes,
    };
    set({
      currentSession: closed,
      history: [closed, ...history],
    });
  },

  reset: () => set({ currentSession: null, history: [] }),
}));
