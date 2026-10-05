import { useKhataStore } from '../store/khataStore';
import { CustomerKhata } from '@kirana-pro/shared';

const mockCustomer: CustomerKhata = {
  id: 'cust_1',
  storeId: 'store_1',
  name: 'Ramesh Sharma',
  phoneNumber: '9876543210',
  currentBalance: 350,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

describe('Khata Store', () => {
  beforeEach(() => {
    useKhataStore.getState().setCustomers([]);
  });

  it('sets customer list and computes total pending market credit', () => {
    const list: CustomerKhata[] = [
      mockCustomer,
      {
        ...mockCustomer,
        id: 'cust_2',
        name: 'Suresh Verma',
        currentBalance: 650,
      },
      {
        ...mockCustomer,
        id: 'cust_3',
        name: 'Deepak Patel',
        currentBalance: 0,
      },
    ];

    useKhataStore.getState().setCustomers(list);
    expect(useKhataStore.getState().customers).toHaveLength(3);
    expect(useKhataStore.getState().getTotalPendingCredit()).toBe(1000);
  });

  it('filters customers by search query (name or phone)', () => {
    const list: CustomerKhata[] = [
      mockCustomer,
      {
        ...mockCustomer,
        id: 'cust_2',
        name: 'Suresh Verma',
        phoneNumber: '9123456780',
      },
    ];

    useKhataStore.getState().setCustomers(list);
    useKhataStore.getState().setSearchQuery('suresh');
    const filtered = useKhataStore.getState().getFilteredCustomers();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('cust_2');
  });
});
