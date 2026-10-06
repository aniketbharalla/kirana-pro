'use client';

import React, { useState, useEffect } from 'react';
import { StockLog } from '../../components/StockLog';
import { StockMovement, Product } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreMovements, subscribeStoreProducts } from '../../lib/storeService';

export default function StockLogPage() {
  const { storeId } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    let unsubProducts = subscribeStoreProducts(storeId, (prods) => {
      setProducts(prods);
    });

    let unsubMovements = subscribeStoreMovements(storeId, (movs) => {
      setMovements(movs);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubMovements();
    };
  }, [storeId]);

  const productMap: Record<string, string> = {};
  products.forEach((p) => {
    productMap[p.id] = p.name;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>📋 AUDIT TRAIL</span>
            <span style={styles.countBadge}>{movements.length} Entries</span>
          </div>
          <h2 style={styles.title}>Stock Movement Ledger</h2>
          <p style={styles.subtitle}>
            Complete chronological audit log of inward restocks, POS sales, and inventory adjustments.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing stock audit ledger...</p>
        </div>
      ) : movements.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>No Stock Movements Recorded Yet</h3>
          <p style={styles.emptySubtitle}>
            When sales are billed at the counter or inward supplier deliveries are received, all stock fluctuations will appear here.
          </p>
        </div>
      ) : (
        <StockLog movements={movements} productMap={productMap} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
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
    color: '#0D9488',
    backgroundColor: '#CCFBF1',
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
    fontSize: '24px',
    fontWeight: 800,
    color: '#0F172A',
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
    borderTopColor: '#0D9488',
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
