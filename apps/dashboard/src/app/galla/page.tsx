'use client';

import React, { useState, useEffect } from 'react';
import { DailyGallaSession } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreGalla } from '../../lib/storeService';

export default function GallaPage() {
  const { storeId } = useAuth();
  const [sessions, setSessions] = useState<DailyGallaSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeStoreGalla(storeId, (data) => {
      setSessions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [storeId]);

  const latestSession = sessions[0];
  const totalDifference = sessions.reduce((sum, s) => sum + (s.cashDifference ?? 0), 0);
  const matchedCount = sessions.filter((s) => (s.cashDifference ?? 0) === 0).length;
  const matchRate = sessions.length > 0 ? ((matchedCount / sessions.length) * 100).toFixed(1) : '100.0';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>💰 CASH RECONCILIATION</span>
            <span style={styles.countBadge}>{sessions.length} Audited Days</span>
          </div>
          <h1 style={styles.title}>Daily Galla & Drawer Reconciliation</h1>
          <p style={styles.subtitle}>
            Audit morning opening cash, sales cash flow, and night closing drawer differences.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing cash drawer sessions...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Latest Expected Drawer Cash</div>
              <div style={{ ...styles.statValue, color: '#059669' }}>
                ₹{latestSession ? latestSession.expectedClosingCash.toFixed(2) : '0.00'}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Cumulative Discrepancy</div>
              <div
                style={{
                  ...styles.statValue,
                  color: totalDifference === 0 ? '#0F172A' : totalDifference < 0 ? '#DC2626' : '#2563EB',
                }}
              >
                {totalDifference >= 0 ? `+₹${totalDifference.toFixed(2)}` : `-₹${Math.abs(totalDifference).toFixed(2)}`}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Drawer Audit Match Rate</div>
              <div style={styles.statValue}>{matchRate}%</div>
            </div>
          </div>

          {/* Sessions Table or Empty State */}
          {sessions.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>💰</div>
              <h3 style={styles.emptyTitle}>No Daily Galla Closings Yet</h3>
              <p style={styles.emptySubtitle}>
                When your cashier or store manager finishes a shift and logs closing cash in the POS drawer, daily tallies will appear here.
              </p>
            </div>
          ) : (
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
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.5px',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #E2E8F0',
    borderTopColor: '#059669',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '20px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0F172A',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: '16px',
    padding: '60px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#64748B',
    maxWidth: '460px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#334155',
  },
  diffBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
};
