import { useSupplierStore } from '../store/supplierStore';
import { Supplier, PurchaseInvoice } from '@kirana-pro/shared';

const mockSupplier: Supplier = {
  id: 'sup_1',
  storeId: 'store_1',
  name: 'N R ENTERPRISES',
  phone: '7415545631',
  gstin: '23NMQPK6686L1Z0',
  type: 'Distributor',
  totalPurchases: 15000,
  totalPaid: 12000,
  balance: 3000,
  invoiceCount: 4,
  createdAt: 1700000000,
  updatedAt: 1700000000,
};

describe('Supplier Store', () => {
  beforeEach(() => {
    useSupplierStore.getState().setSuppliers([]);
    useSupplierStore.getState().setPurchases([]);
  });

  it('sets suppliers and computes total pending credit payable to suppliers', () => {
    const list: Supplier[] = [
      mockSupplier,
      {
        ...mockSupplier,
        id: 'sup_2',
        name: 'Gupta Wholesale',
        balance: 5000,
      },
    ];

    useSupplierStore.getState().setSuppliers(list);
    expect(useSupplierStore.getState().suppliers).toHaveLength(2);
    expect(useSupplierStore.getState().getTotalPayable()).toBe(8000);
  });

  it('filters suppliers by search query (name or phone)', () => {
    const list: Supplier[] = [
      mockSupplier,
      {
        ...mockSupplier,
        id: 'sup_2',
        name: 'Gupta Wholesale',
        phone: '9826011122',
      },
    ];

    useSupplierStore.getState().setSuppliers(list);
    useSupplierStore.getState().setSearchQuery('gupta');
    const filtered = useSupplierStore.getState().getFilteredSuppliers();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('sup_2');
  });

  it('records payment to a supplier and decrements pending balance', () => {
    useSupplierStore.getState().setSuppliers([mockSupplier]);
    useSupplierStore.getState().setTransactions([]);

    // Record a payment of 1000 via UPI
    useSupplierStore.getState().recordPayment('sup_1', 1000, 'UPI', 'UPI Ref 123456');

    const updatedSup = useSupplierStore.getState().suppliers.find((s) => s.id === 'sup_1');
    expect(updatedSup).toBeDefined();
    // 3000 - 1000 = 2000
    expect(updatedSup?.balance).toBe(2000);
    // 12000 + 1000 = 13000
    expect(updatedSup?.totalPaid).toBe(13000);

    const txs = useSupplierStore.getState().getSupplierTransactions('sup_1');
    expect(txs).toHaveLength(1);
    expect(txs[0].type).toBe('PAYMENT');
    expect(txs[0].amount).toBe(1000);
    expect(txs[0].balanceAfter).toBe(2000);
    expect(txs[0].paymentMode).toBe('UPI');
  });
});
