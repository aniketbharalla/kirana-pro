'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BillsTable } from '../../components/BillsTable';
import { Invoice } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreInvoices } from '../../lib/storeService';
import { Receipt, Zap } from 'lucide-react';

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
            <span style={styles.badge}>
              <Receipt size={12} style={{ marginRight: 4 }} /> POS COUNTER BILLS
            </span>
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
            backgroundColor: '#7367F0',
            color: '#FFFFFF',
            textDecoration: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
          }}
        >
          <Zap size={16} /> Open POS Quick Billing (F4)
        </Link>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing store bills from cloud...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>
            <Receipt size={48} color="#A8AAAE" />
          </div>
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
                backgroundColor: '#7367F0',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
              }}
            >
              <Zap size={16} /> Create Your First POS Bill
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
    fontFamily: 'var(--font-body)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: '#7367F0',
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.28)',
    padding: '4px 10px',
    borderRadius: '999px',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6F6B7D',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    padding: '4px 10px',
    borderRadius: '999px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#2F2B3D',
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1.15,
  },
  subtitle: {
    fontSize: '13px',
    color: '#6F6B7D',
    marginTop: '4px',
    margin: 0,
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #DBDADE',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.06)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: '#DBDADE',
    borderTopColor: '#7367F0',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    color: '#6F6B7D',
    margin: 0,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DBDADE',
    borderRadius: '16px',
    padding: '64px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.06)',
  },
  emptyIcon: {
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#2F2B3D',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#6F6B7D',
    maxWidth: '460px',
    margin: '0 auto',
    lineHeight: 1.5,
  },
};

