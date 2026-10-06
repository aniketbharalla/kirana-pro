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
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div style={styles.bannerContent}>
          <div style={styles.pill}>✨ STORE COMMAND CENTER</div>
          <h2 style={styles.bannerTitle}>
            Welcome, {profile?.displayName || 'Store Owner'}!
          </h2>
          <p style={styles.bannerSub}>
            Real-time live synchronization with your store. Manage catalog, monitor inventory,
            audit sales invoices, and track customer credit khata.
          </p>
        </div>

        <div style={styles.bannerActions}>
          <Link href="/products" style={styles.primaryBtn}>
            ➕ Add Product
          </Link>
          <Link href="/bills" style={styles.secondaryBtn}>
            🧾 Sales & Invoices
          </Link>
          <Link href="/khata" style={styles.secondaryBtn}>
            📒 Customer Khata
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
                <h3 style={styles.sectionTitle}>Catalog Inventory</h3>
                <p style={styles.sectionSub}>Latest items synchronized with cloud database</p>
              </div>
              <Link href="/products" style={styles.linkMore}>
                View All Catalog →
              </Link>
            </div>
            <ProductsTable products={products.slice(0, 8)} />
          </div>

          {/* Recent Stock Audit Movements */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Stock Movement Ledger</h3>
                <p style={styles.sectionSub}>Live audit trail of restocks and sales</p>
              </div>
              <Link href="/stock" style={styles.linkMore}>
                Full Ledger →
              </Link>
            </div>
            <StockLog movements={movements.slice(0, 8)} productMap={productMap} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  banner: {
    backgroundColor: '#064E3B',
    backgroundImage: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
    borderRadius: '16px',
    padding: '28px 32px',
    color: '#FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  bannerContent: {
    maxWidth: '640px',
  },
  pill: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 800,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#A7F3D0',
    padding: '4px 10px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  bannerTitle: {
    fontSize: '24px',
    fontWeight: 800,
    margin: '0 0 6px 0',
  },
  bannerSub: {
    fontSize: '14px',
    color: '#D1FAE5',
    margin: 0,
    lineHeight: 1.5,
  },
  bannerActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: '#FFFFFF',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  loadingBox: {
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#10B981',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '48px 32px',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: '6px',
  },
  emptyDesc: {
    fontSize: '14px',
    color: '#64748B',
    maxWidth: '480px',
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
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
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
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    margin: '0 0 4px 0',
  },
  sectionSub: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  },
  linkMore: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#059669',
    textDecoration: 'none',
  },
};
