'use client';

import React from 'react';
import { DailyGallaSession } from '@kirana-pro/shared';

const STARTER_GALLA_SESSIONS: DailyGallaSession[] = [
  {
    id: 'galla_2026-10-05',
    storeId: 'demo_store_1',
    date: '2026-10-05',
    openedAt: 1728100800000,
    closedAt: 1728154800000,
    openingCash: 2000,
    systemSalesCash: 8450,
    systemSalesUPI: 14200,
    systemSalesUdhar: 1200,
    systemUdharRepaid: 800,
    expenses: 150,
    expectedClosingCash: 11100, // 2000 + 8450 + 800 - 150
    actualClosingCash: 11100,
    cashDifference: 0,
    status: 'CLOSED',
    notes: 'Clean day closing, zero mismatch.',
  },
  {
    id: 'galla_2026-10-04',
    storeId: 'demo_store_1',
    date: '2026-10-04',
    openedAt: 1728014400000,
    closedAt: 1728068400000,
    openingCash: 2000,
    systemSalesCash: 7200,
    systemSalesUPI: 11000,
    systemSalesUdhar: 1500,
    systemUdharRepaid: 500,
    expenses: 200,
    expectedClosingCash: 9500,
    actualClosingCash: 9480,
    cashDifference: -20,
    status: 'CLOSED',
    notes: '₹20 shortage due to coin change difference.',
  },
];

export default function GallaPage() {
  const sessions = STARTER_GALLA_SESSIONS;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Daily Galla & Drawer Reconciliation</h1>
          <p style={styles.subtitle}>
            Audit morning opening cash, sales cash flow, and night closing drawer differences.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Today's Expected Drawer Cash</div>
          <div style={{ ...styles.statValue, color: '#059669' }}>₹11,100.00</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Drawer Discrepancy (30 Days)</div>
          <div style={{ ...styles.statValue, color: '#D97706' }}>-₹20.00</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Audit Match Rate</div>
          <div style={styles.statValue}>99.8%</div>
        </div>
      </div>

      {/* Sessions Table */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Opening Cash</th>
              <th style={styles.th}>Cash Sales</th>
              <th style={styles.th}>UPI (Bank)</th>
              <th style={styles.th}>Udhar Repaid</th>
              <th style={styles.th}>Expenses</th>
              <th style={styles.th}>Expected Drawer</th>
              <th style={styles.th}>Actual Counted</th>
              <th style={styles.th}>Difference</th>
              <th style={styles.th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} style={styles.tr}>
                <td style={{ ...styles.td, fontWeight: '700', color: '#0F172A' }}>
                  {s.date}
                </td>
                <td style={styles.td}>₹{s.openingCash.toFixed(2)}</td>
                <td style={{ ...styles.td, color: '#059669', fontWeight: '600' }}>
                  +₹{s.systemSalesCash.toFixed(2)}
                </td>
                <td style={styles.td}>₹{s.systemSalesUPI.toFixed(2)}</td>
                <td style={{ ...styles.td, color: '#059669' }}>
                  +₹{s.systemUdharRepaid.toFixed(2)}
                </td>
                <td style={{ ...styles.td, color: '#EF4444' }}>
                  -₹{s.expenses.toFixed(2)}
                </td>
                <td style={{ ...styles.td, fontWeight: '700' }}>
                  ₹{s.expectedClosingCash.toFixed(2)}
                </td>
                <td style={{ ...styles.td, fontWeight: '700' }}>
                  ₹{(s.actualClosingCash ?? 0).toFixed(2)}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.diffBadge,
                      backgroundColor:
                        (s.cashDifference ?? 0) === 0
                          ? '#ECFDF5'
                          : (s.cashDifference ?? 0) > 0
                          ? '#F0FDF4'
                          : '#FEF2F2',
                      color:
                        (s.cashDifference ?? 0) === 0
                          ? '#065F46'
                          : (s.cashDifference ?? 0) > 0
                          ? '#15803D'
                          : '#B91C1C',
                    }}
                  >
                    {(s.cashDifference ?? 0) === 0
                      ? '✓ Exact Match'
                      : (s.cashDifference ?? 0) > 0
                      ? `+₹${(s.cashDifference ?? 0).toFixed(2)}`
                      : `-₹${Math.abs(s.cashDifference ?? 0).toFixed(2)}`}
                  </span>
                </td>
                <td style={{ ...styles.td, color: '#64748B', fontSize: '12px' }}>
                  {s.notes || '—'}
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #E2E8F0',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0F172A',
    marginTop: '6px',
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
  diffBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
};
