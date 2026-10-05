'use client';

import React, { useState } from 'react';
import { Supplier } from '@kirana-pro/shared';

const STARTER_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    storeId: 'demo_store_1',
    name: 'N R ENTERPRISES (Parle Distributor)',
    phone: '7415545631',
    gstin: '23NMQPK6686L1Z0',
    type: 'Distributor',
    totalPurchases: 24540,
    totalPaid: 22440,
    balance: 2100,
    invoiceCount: 13,
    createdAt: 1728120000000,
    updatedAt: 1728120000000,
  },
  {
    id: 'sup_2',
    storeId: 'demo_store_1',
    name: 'Mahalaxmi Grains Wholesale Mandi',
    phone: '9826012345',
    type: 'Wholesaler',
    totalPurchases: 45000,
    totalPaid: 45000,
    balance: 0,
    invoiceCount: 6,
    createdAt: 1728120000000,
    updatedAt: 1728120000000,
  },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(STARTER_SUPPLIERS);
  const [search, setSearch] = useState('');

  const totalBalance = suppliers.reduce((sum, s) => sum + s.balance, 0);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Wholesalers & Distributors</h1>
          <p style={styles.subtitle}>
            Manage your suppliers, vendor credit balances, and contacts.
          </p>
        </div>
      </div>

      {/* Top Banner */}
      <div style={styles.banner}>
        <div>
          <div style={styles.bannerLabel}>Total Pending Payable to Wholesalers</div>
          <div style={styles.bannerAmount}>₹{totalBalance.toFixed(2)}</div>
        </div>
        <div style={styles.searchBox}>
          <input
            style={styles.searchInput}
            placeholder="Search wholesaler name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Wholesaler Name</th>
              <th style={styles.th}>Contact Phone</th>
              <th style={styles.th}>GSTIN</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Total Invoices</th>
              <th style={styles.th}>Total Purchased</th>
              <th style={styles.th}>Pending Due (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={styles.tr}>
                <td style={{ ...styles.td, fontWeight: '700', color: '#0F172A' }}>
                  {s.name}
                </td>
                <td style={styles.td}>📞 {s.phone}</td>
                <td style={{ ...styles.td, fontFamily: 'monospace' }}>
                  {s.gstin || '—'}
                </td>
                <td style={styles.td}>
                  <span style={styles.typeBadge}>{s.type}</span>
                </td>
                <td style={styles.td}>{s.invoiceCount} bills</td>
                <td style={styles.td}>₹{s.totalPurchases.toFixed(2)}</td>
                <td
                  style={{
                    ...styles.td,
                    fontWeight: '800',
                    color: s.balance > 0 ? '#EF4444' : '#059669',
                  }}
                >
                  ₹{s.balance.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
  },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '20px 24px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  bannerLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  bannerAmount: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#EF4444',
    marginTop: '4px',
  },
  searchBox: {
    width: '320px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    outline: 'none',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '12px 16px',
    fontWeight: '700',
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 16px',
    color: '#334155',
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
  },
};
