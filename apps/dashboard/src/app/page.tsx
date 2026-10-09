'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsGrid } from '../components/StatsGrid';
import { ProductsTable } from '../components/ProductsTable';
import { StockLog } from '../components/StockLog';
import { useAuth } from '../context/AuthContext';
import { subscribeStoreProducts, subscribeStoreMovements } from '../lib/storeService';
import { Product, StockMovement } from '@kirana-pro/shared';

export default function DashboardOverviewPage() {
  const { profile, store } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const storeId = store?.id || profile?.storeId || '';

  useEffect(() => {
    if (!storeId) {
      setLoadingData(false);
      return;
    }

    const unsubProducts = subscribeStoreProducts(storeId, (prods) => {
      setProducts(prods);
      setLoadingData(false);
    });

    const unsubMovements = subscribeStoreMovements(storeId, (moves) => {
      setMovements(moves);
    });

    return () => {
      unsubProducts();
      unsubMovements();
    };
  }, [storeId]);

  const lowStockCount = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.minStockAlert
  ).length;

  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;
  const looseCount = products.filter((p) => p.isLoose).length;

  const productMap: Record<string, string> = {};
  products.forEach((p) => {
    productMap[p.id] = p.name;
  });

  return (
    <div style={styles.container}>
      {/* MasterX Command Center Hero Card */}
      <div style={styles.banner}>
        <div style={styles.bannerContent}>
          <div style={styles.pill}>✨ STORE COMMAND CENTER</div>
          <h2 style={styles.bannerTitle}>
            Welcome, {profile?.displayName || 'Store Owner'}
          </h2>
          <p style={styles.bannerSub}>
            Real-time live cloud synchronization. Manage retail catalog, monitor low inventory alerts,
            generate customer GST invoices, and track Udhar Khata ledger.
          </p>
        </div>

        <div style={styles.bannerActions}>
          <Link href="/pos" style={styles.posPrimaryBtn}>
            ⚡ POS Quick Billing (F4)
          </Link>
          <Link href="/products" style={styles.darkActionBtn}>
            ➕ Add Product
          </Link>
          <Link href="/purchases/new" style={styles.indigoActionBtn}>
            ⚡ Inward via OCR
          </Link>
          <Link href="/bills" style={styles.outlineActionBtn}>
            🧾 Sales Invoices
          </Link>
          <Link href="/khata" style={styles.outlineActionBtn}>
            📒 Khata Ledger
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <StatsGrid
        totalProducts={products.length}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        looseCount={looseCount}
      />

      {/* Live Data or Empty State */}
      {loadingData ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Fetching live store inventory from Firebase...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>Your Catalog is Ready for Products</h3>
          <p style={styles.emptyDesc}>
            No items have been added to this store yet. Start adding items to track stock, scan
            barcodes, and print customer bills.
          </p>
          <div style={styles.emptyActions}>
            <Link href="/products" style={styles.posPrimaryBtn}>
              ➕ Add First Product
            </Link>
          </div>
        </div>
      ) : (
        <div style={styles.contentGrid}>
          {/* Main Products List Preview */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <span style={styles.sectionCaption}>STORE INVENTORY</span>
                <h3 style={styles.sectionTitle}>Catalog Overview</h3>
                <p style={styles.sectionSub}>Latest items synchronized with cloud database</p>
              </div>
              <Link href="/products" style={styles.linkMore}>
                View All Catalog →
              </Link>
            </div>
            <ProductsTable
              products={products.slice(0, 10)}
              showActions={false}
              compact={true}
            />
          </div>

          {/* Stock Log Preview */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <span style={styles.sectionCaption}>AUDIT TRAIL</span>
                <h3 style={styles.sectionTitle}>Recent Stock Movements</h3>
                <p style={styles.sectionSub}>Live audit log of sales, purchases, and manual updates</p>
              </div>
              <Link href="/stock" style={styles.linkMore}>
                View Full Log →
              </Link>
            </div>
            <StockLog
              movements={movements.slice(0, 8)}
              productMap={productMap}
              compact={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1360px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontFamily: 'var(--font-body)',
  },
  banner: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '18px',
    padding: '28px 28px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  bannerContent: {
    maxWidth: '680px',
  },
  pill: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    border: '1px solid rgba(79, 70, 229, 0.2)',
    padding: '3px 10px',
    borderRadius: '999px',
    marginBottom: '10px',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    fontFamily: 'var(--font-display)',
    margin: '0 0 8px 0',
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
  },
  bannerSub: {
    fontSize: '13px',
    color: '#475569',
    margin: 0,
    lineHeight: 1.55,
  },
  bannerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  posPrimaryBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
  },
  darkActionBtn: {
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(24, 24, 27, 0.2)',
  },
  indigoActionBtn: {
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)',
  },
  outlineActionBtn: {
    backgroundColor: '#FFFFFF',
    color: '#334155',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid #CBD5E1',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  loadingBox: {
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    border: '1px solid #E2E8F0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    borderTopColor: '#4F46E5',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    padding: '48px 32px',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    fontFamily: 'var(--font-display)',
    marginBottom: '6px',
    letterSpacing: '-0.02em',
  },
  emptyDesc: {
    fontSize: '13px',
    color: '#64748B',
    maxWidth: '460px',
    lineHeight: 1.5,
    marginBottom: '20px',
  },
  emptyActions: {
    display: 'flex',
    gap: '12px',
  },
  contentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '18px',
  },
  sectionCaption: {
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0F172A',
    fontFamily: 'var(--font-display)',
    margin: '2px 0',
    letterSpacing: '-0.02em',
  },
  sectionSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: 0,
  },
  linkMore: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#4F46E5',
    textDecoration: 'none',
    backgroundColor: '#EEF2FF',
    padding: '6px 12px',
    borderRadius: '8px',
  },
};
