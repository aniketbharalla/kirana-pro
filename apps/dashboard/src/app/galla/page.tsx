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
            <span style={styles.badge}>CASH RECONCILIATION</span>
            <span style={styles.countBadge}>{sessions.length} Audited Days</span>
          </div>
          <h1 style={styles.title}>Daily Galla & Drawer Audit</h1>
          <p style={styles.subtitle}>
            Audit morning opening cash, continuous sales cash flow, and night closing drawer tallies.
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
              <div style={styles.statLabel}>LATEST EXPECTED DRAWER CASH</div>
              <div style={{ ...styles.statValue, color: '#10B981' }}>
                ₹{latestSession ? latestSession.expectedClosingCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>CUMULATIVE DISCREPANCY</div>
              <div
                style={{
                  ...styles.statValue,
                  color: totalDifference === 0 ? '#1D1D1F' : totalDifference < 0 ? '#FF3B30' : '#007AFF',
                }}
              >
                {totalDifference >= 0 ? `+₹${totalDifference.toFixed(2)}` : `-₹${Math.abs(totalDifference).toFixed(2)}`}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>DRAWER AUDIT MATCH RATE</div>
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
                    <th style={styles.th}>DATE</th>
                    <th style={styles.th}>OPENING CASH</th>
                    <th style={styles.th}>CASH SALES</th>
                    <th style={styles.th}>UPI (BANK)</th>
                    <th style={styles.th}>UDHAR REPAID</th>
                    <th style={styles.th}>EXPENSES</th>
                    <th style={styles.th}>EXPECTED DRAWER</th>
                    <th style={styles.th}>ACTUAL COUNTED</th>
                    <th style={styles.th}>DIFFERENCE</th>
                    <th style={styles.th}>NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#1D1D1F' }}>
                        {s.date}
                      </td>
                      <td style={{ ...styles.td, fontVariantNumeric: 'tabular-nums' }}>₹{s.openingCash.toFixed(2)}</td>
                      <td style={{ ...styles.td, color: '#10B981', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        +₹{s.systemSalesCash.toFixed(2)}
                      </td>
                      <td style={{ ...styles.td, fontVariantNumeric: 'tabular-nums' }}>₹{s.systemSalesUPI.toFixed(2)}</td>
                      <td style={{ ...styles.td, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                        +₹{s.systemUdharRepaid.toFixed(2)}
                      </td>
                      <td style={{ ...styles.td, color: '#FF3B30', fontVariantNumeric: 'tabular-nums' }}>
                        -₹{s.expenses.toFixed(2)}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{s.expectedClosingCash.toFixed(2)}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{(s.actualClosingCash ?? 0).toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.diffBadge,
                            backgroundColor:
                              (s.cashDifference ?? 0) === 0
                                ? 'rgba(16, 185, 129, 0.12)'
                                : (s.cashDifference ?? 0) > 0
                                ? 'rgba(0, 122, 255, 0.12)'
                                : 'rgba(255, 59, 48, 0.12)',
                            color:
                              (s.cashDifference ?? 0) === 0
                                ? '#059669'
                                : (s.cashDifference ?? 0) > 0
                                ? '#007AFF'
                                : '#FF3B30',
                          }}
                        >
                          {(s.cashDifference ?? 0) === 0
                            ? '✓ Exact Match'
                            : (s.cashDifference ?? 0) > 0
                            ? `+₹${(s.cashDifference ?? 0).toFixed(2)}`
                            : `-₹${Math.abs(s.cashDifference ?? 0).toFixed(2)}`}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#86868B', fontSize: '13px' }}>
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
    paddingBottom: '48px',
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
    marginBottom: '8px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    backgroundColor: 'rgba(118, 118, 128, 0.1)',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#86868B',
    marginTop: '6px',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  loadingState: {
    padding: '80px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderTopColor: '#10B981',
    borderRadius: '50%',
    margin: '0 auto 14px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#86868B',
    margin: 0,
    fontWeight: 500,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: '20px',
    padding: '22px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    letterSpacing: '0.04em',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#1D1D1F',
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: '20px',
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
    fontSize: '17px',
    fontWeight: 700,
    color: '#1D1D1F',
    margin: '0 0 6px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#86868B',
    maxWidth: '460px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#FBFBFC',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#1D1D1F',
  },
  diffBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
  },
};
