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
});
