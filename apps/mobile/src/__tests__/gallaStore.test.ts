import { useGallaStore } from '../store/gallaStore';

describe('Galla Store', () => {
  beforeEach(() => {
    useGallaStore.getState().reset();
  });

  it('opens a morning galla session with opening cash', () => {
    useGallaStore.getState().openSession(2000);
    const session = useGallaStore.getState().currentSession;

    expect(session).toBeDefined();
    expect(session?.status).toBe('OPEN');
    expect(session?.openingCash).toBe(2000);
    expect(session?.expectedClosingCash).toBe(2000);
  });

  it('updates expected cash on sales, repayments, and petty expenses', () => {
    useGallaStore.getState().openSession(1500);

    // Cash sale ₹500
    useGallaStore.getState().recordCashSale(500);
    // UPI sale ₹800 (does not affect physical drawer cash)
    useGallaStore.getState().recordUpiSale(800);
    // Khata repayment received ₹200
    useGallaStore.getState().recordUdharRepayment(200);
    // Petty cash taken out for milk/chai ₹50
    useGallaStore.getState().recordPettyExpense(50);

    const session = useGallaStore.getState().currentSession;
    expect(session?.systemSalesCash).toBe(500);
    expect(session?.systemSalesUPI).toBe(800);
    expect(session?.systemUdharRepaid).toBe(200);
    expect(session?.expenses).toBe(50);

    // Expected drawer: 1500 + 500 + 200 - 50 = 2150
    expect(session?.expectedClosingCash).toBe(2150);
  });

  it('calculates shortage or surplus on night closing', () => {
    useGallaStore.getState().openSession(1000);
    useGallaStore.getState().recordCashSale(1000); // expected = 2000

    // Owner counted ₹1950 physical cash in drawer (₹50 shortage)
    useGallaStore.getState().closeSession(1950, 'Slight shortage in change coins');

    const session = useGallaStore.getState().currentSession;
    expect(session?.status).toBe('CLOSED');
    expect(session?.actualClosingCash).toBe(1950);
    expect(session?.cashDifference).toBe(-50);
    expect(session?.notes).toBe('Slight shortage in change coins');
  });
});
