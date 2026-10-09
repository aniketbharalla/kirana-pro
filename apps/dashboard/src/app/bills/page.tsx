'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

        <Link
          href="/pos"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            textDecoration: 'none',
            padding: '12px 20px',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
          }}
        >
          ⚡ Open POS Quick Billing (F4)
        </Link>
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
          <div style={{ marginTop: '20px' }}>
            <Link
              href="/pos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              ⚡ Create Your First POS Bill
            </Link>
          </div>
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
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    color: '#0071E3',
    backgroundColor: 'rgba(0, 113, 227, 0.1)',
    padding: '3px 9px',
    borderRadius: '999px',
    textTransform: 'uppercase',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: '3px 9px',
    borderRadius: '999px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#1D1D1F',
    letterSpacing: '-0.03em',
    margin: 0,
    lineHeight: 1.15,
  },
  subtitle: {
    fontSize: '13px',
    color: '#86868B',
    marginTop: '4px',
    margin: 0,
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderTopColor: '#0071E3',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    color: '#86868B',
    margin: 0,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '20px',
    padding: '64px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#86868B',
    maxWidth: '460px',
    margin: '0 auto',
    lineHeight: 1.5,
  },
};
