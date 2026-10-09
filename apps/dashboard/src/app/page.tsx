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
      {/* Apple-Style Hero Command Banner */}
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
          <Link
            href="/pos"
            style={{
              ...styles.primaryBtn,
              backgroundColor: '#10B981',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            ⚡ POS Quick Billing (F4)
          </Link>
          <Link href="/products" style={styles.primaryBtn}>
            ➕ Add Product
          </Link>
          <Link href="/purchases/new" style={styles.accentBtn}>
            ⚡ Inward via OCR
          </Link>
          <Link href="/bills" style={styles.secondaryBtn}>
            🧾 Sales Invoices
          </Link>
          <Link href="/khata" style={styles.secondaryBtn}>
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
            <Link href="/products" style={styles.addBtn}>
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
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  banner: {
    backgroundColor: '#1D1D1F',
    color: '#FFFFFF',
    borderRadius: '20px',
    padding: '32px 28px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.15)',
  },
  bannerContent: {
    maxWidth: '640px',
  },
  pill: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    border: '1px solid rgba(52, 211, 153, 0.25)',
    padding: '3px 9px',
    borderRadius: '999px',
    marginBottom: '10px',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: '26px',
    fontWeight: 800,
    margin: '0 0 8px 0',
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  bannerSub: {
    fontSize: '13px',
    color: '#A1A1A6',
    margin: 0,
    lineHeight: 1.5,
  },
  bannerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '11px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  accentBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: '#1D1D1F',
    padding: '10px 18px',
    borderRadius: '11px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    padding: '10px 16px',
    borderRadius: '11px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  loadingBox: {
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderTopColor: '#10B981',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#86868B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '48px 32px',
    textAlign: 'center',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    marginBottom: '6px',
    letterSpacing: '-0.02em',
  },
  emptyDesc: {
    fontSize: '13px',
    color: '#86868B',
    maxWidth: '460px',
    lineHeight: 1.5,
    marginBottom: '20px',
  },
  emptyActions: {
    display: 'flex',
    gap: '12px',
  },
  addBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '10px 22px',
    borderRadius: '11px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
  },
  contentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    padding: '24px',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '18px',
  },
  sectionCaption: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#86868B',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: '2px 0',
    letterSpacing: '-0.02em',
  },
  sectionSub: {
    fontSize: '12px',
    color: '#86868B',
    margin: 0,
  },
  linkMore: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#059669',
    textDecoration: 'none',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: '6px 12px',
    borderRadius: '8px',
  },
};
