'use client';

import React, { useState, useEffect } from 'react';
import { BillsTable } from '../../components/BillsTable';
import { Invoice } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreInvoices } from '../../lib/storeService';

export default function BillsPage() {
  const { storeId } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeStoreInvoices(storeId, (data) => {
      setInvoices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [storeId]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>🧾 POS COUNTER BILLS</span>
            <span style={styles.countBadge}>{invoices.length} Bills</span>
          </div>
          <h1 style={styles.title}>Sales & Invoices</h1>
          <p style={styles.subtitle}>
            Live counter sales, payment modes breakdown, and 58mm thermal receipts
          </p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing store bills from cloud...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>🧾</div>
          <h3 style={styles.emptyTitle}>No Invoices Recorded Yet</h3>
          <p style={styles.emptySubtitle}>
            Bills generated at your checkout counter or from the mobile app will automatically appear here in real time.
          </p>
        </div>
      ) : (
        <BillsTable invoices={invoices} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
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
    letterSpacing: '-0.5px',
    margin: 0,
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
    borderTopColor: '#2563EB',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: '16px',
    padding: '60px 24px',
    textAlign: 'center',
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
};
