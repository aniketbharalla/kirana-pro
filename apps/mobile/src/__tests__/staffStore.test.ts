import { useStaffStore, DEFAULT_STARTER_STAFF } from '../store/staffStore';

describe('Staff Store & Multi-Counter Management', () => {
  beforeEach(() => {
    useStaffStore.setState({
      activeStaff: DEFAULT_STARTER_STAFF[0],
      staffList: [...DEFAULT_STARTER_STAFF],
      isLocked: false,
      counterNumber: 1,
    });
  });

  describe('PIN Authentication', () => {
    it('authenticates and unlocks with valid owner PIN (1234)', () => {
      useStaffStore.getState().lockCounter();
      expect(useStaffStore.getState().isLocked).toBe(true);

      const result = useStaffStore.getState().unlockWithPIN('1234');
      expect(result.success).toBe(true);
      expect(result.staff?.role).toBe('owner');
      expect(useStaffStore.getState().isLocked).toBe(false);
    });

    it('authenticates and switches active staff with cashier PIN (0000)', () => {
      const result = useStaffStore.getState().unlockWithPIN('0000');
      expect(result.success).toBe(true);
      expect(result.staff?.name).toContain('Rohan Sharma');
      expect(useStaffStore.getState().activeStaff?.role).toBe('cashier');
    });

    it('rejects invalid PIN with clear error message', () => {
      const result = useStaffStore.getState().unlockWithPIN('9999');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Incorrect 4-digit PIN');
    });
  });

  describe('Role-based Permissions', () => {
    it('grants owner all permissions', () => {
      useStaffStore.setState({ activeStaff: DEFAULT_STARTER_STAFF[0] });
      const store = useStaffStore.getState();

      expect(store.hasPermission('bill')).toBe(true);
      expect(store.hasPermission('edit_catalog')).toBe(true);
      expect(store.hasPermission('view_reports')).toBe(true);
      expect(store.hasPermission('manage_staff')).toBe(true);
      expect(store.hasPermission('change_prices')).toBe(true);
    });

    it('restricts cashier to billing only', () => {
      useStaffStore.setState({ activeStaff: DEFAULT_STARTER_STAFF[1] }); // Cashier
      const store = useStaffStore.getState();

      expect(store.hasPermission('bill')).toBe(true);
      expect(store.hasPermission('edit_catalog')).toBe(false);
      expect(store.hasPermission('view_reports')).toBe(false);
      expect(store.hasPermission('manage_staff')).toBe(false);
      expect(store.hasPermission('change_prices')).toBe(false);
    });
  });

  describe('Counter Shift Register', () => {
    it('opens shift, records sales across cash/upi, and calculates handover variance on shift close', () => {
      // 1. Open Counter 2 shift with ₹500 float
      const shift = useStaffStore.getState().openShift(2, 500);
      expect(shift.counterNumber).toBe(2);
      expect(shift.openingCash).toBe(500);
      expect(shift.totalSales).toBe(0);

      // 2. Record Cash Sale ₹300
      useStaffStore.getState().recordShiftSale(300, 'cash');
      // 3. Record UPI Sale ₹200
      useStaffStore.getState().recordShiftSale(200, 'upi');

      const current = useStaffStore.getState().activeCounterSession;
      expect(current?.totalSales).toBe(500);
      expect(current?.cashSales).toBe(300);
      expect(current?.upiSales).toBe(200);
      expect(current?.invoiceCount).toBe(2);

      // 4. Close Shift with ₹800 counted cash (Expected = 500 opening + 300 cash = 800) -> 0 variance
      const closed = useStaffStore.getState().closeShift(800, 'Evening handover');
      expect(closed?.isClosed).toBe(true);
      expect(closed?.expectedCash).toBe(800);
      expect(closed?.variance).toBe(0);
    });
  });

  describe('Staff CRUD', () => {
    it('adds new staff member and updates staff list', () => {
      const newCashier = useStaffStore.getState().addStaff({
        storeId: 'demo_store_1',
        name: 'Vikas Kumar',
        phone: '9988776655',
        role: 'cashier',
        pin: '2222',
        counterAssigned: 1,
        isActive: true,
      });

      expect(newCashier.id).toBeDefined();
      const found = useStaffStore.getState().staffList.find((s) => s.pin === '2222');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Vikas Kumar');
    });
  });
});
