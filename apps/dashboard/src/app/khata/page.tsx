'use client';

import React, { useState } from 'react';
import { KhataTable } from '../../components/KhataTable';
import { CustomerKhata } from '@kirana-pro/shared';

const STARTER_CUSTOMERS: CustomerKhata[] = [
  {
    id: 'cust_1',
    storeId: 'demo_store_1',
    name: 'Ramesh Sharma (Pandit Ji)',
    phoneNumber: '9876543210',
    address: 'Near Shiv Mandir, Ward 4',
    currentBalance: 420,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T09:00:00.000Z',
  },
  {
    id: 'cust_2',
    storeId: 'demo_store_1',
    name: 'Gupta Ji Chai Wala',
    phoneNumber: '9123456780',
    address: 'Main Chowk Corner',
    currentBalance: 780,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-05T10:30:00.000Z',
  },
  {
    id: 'cust_3',
    storeId: 'demo_store_1',
    name: 'Sunil Tailor',
    phoneNumber: '9988776655',
    address: 'Shop #12, Market',
    currentBalance: 150,
    createdAt: '2026-10-03T11:00:00.000Z',
    updatedAt: '2026-10-04T12:00:00.000Z',
  },
  {
    id: 'cust_4',
    storeId: 'demo_store_1',
    name: 'Mishra Ji Teacher',
    phoneNumber: '9871122334',
    address: 'Adarsh Colony',
    currentBalance: 0,
    createdAt: '2026-10-04T14:00:00.000Z',
    updatedAt: '2026-10-05T08:00:00.000Z',
  },
];

export default function KhataPage() {
  const [customers] = useState<CustomerKhata[]>(STARTER_CUSTOMERS);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Customer Khata (उधार बहीखाता)</h1>
          <p style={styles.subtitle}>
            Manage regular customer credit balances, payment logs, and recovery reminders
          </p>
        </div>
      </div>

      <KhataTable customers={customers} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
};
