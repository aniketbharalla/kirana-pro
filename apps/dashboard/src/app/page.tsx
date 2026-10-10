'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsGrid } from '../components/StatsGrid';
import { ProductsTable } from '../components/ProductsTable';
import { StockLog } from '../components/StockLog';
import { useAuth } from '../context/AuthContext';
import { subscribeStoreProducts, subscribeStoreMovements } from '../lib/storeService';
import { Product, StockMovement } from '@kirana-pro/shared';
import { Zap, Plus, Camera, Receipt, BookOpen, Package, ArrowRight } from 'lucide-react';

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
          <div style={styles.pill}>STORE COMMAND CENTER</div>
          <h2 style={styles.bannerTitle}>
            Welcome, {profile?.displayName || 'Store Owner'}
          </h2>
          <p style={styles.bannerSub}>
            Real-time live cloud synchronization. Manage retail catalog, monitor low inventory alerts,
            generate customer GST invoices, and track Udhar Khata ledger.
          </p>
        </div>

        <div style={styles.bannerActions}>
          {/* MasterX Primary CTA Button */}
          <Link href="/pos" style={styles.primaryCtaBtn}>
            <Zap size={16} strokeWidth={2.2} />
            <span>POS Quick Billing (F4)</span>
          </Link>
          <Link href="/products" style={styles.darkActionBtn}>
            <Plus size={16} strokeWidth={2.2} />
            <span>Add Product</span>
          </Link>
          <Link href="/purchases/new" style={styles.indigoActionBtn}>
            <Camera size={16} strokeWidth={2.2} />
            <span>Inward via OCR</span>
          </Link>
          <Link href="/bills" style={styles.outlineActionBtn}>
            <Receipt size={16} strokeWidth={1.8} />
            <span>Sales Invoices</span>
          </Link>
          <Link href="/khata" style={styles.outlineActionBtn}>
            <BookOpen size={16} strokeWidth={1.8} />
            <span>Khata Ledger</span>
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
          <div style={styles.emptyIconBox}>
            <Package size={36} color="#7367F0" />
          </div>
          <h3 style={styles.emptyTitle}>Your Catalog is Ready for Products</h3>
          <p style={styles.emptyDesc}>
            No items have been added to this store yet. Start adding items to track stock, scan
            barcodes, and print customer bills.
          </p>
          <div style={styles.emptyActions}>
            <Link href="/products" style={styles.primaryCtaBtn}>
              <Plus size={16} strokeWidth={2.2} />
              <span>Add First Product</span>
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
                <span>View All Catalog</span>
                <ArrowRight size={14} />
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
                <span>View Full Log</span>
                <ArrowRight size={14} />
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
    border: '1px solid #DBDADE',
    borderRadius: '14px',
    padding: '24px 26px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '18px',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.05)',
  },
  bannerContent: {
    maxWidth: '680px',
  },
  pill: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#7367F0',
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.25)',
    padding: '2px 8px',
    borderRadius: '4px',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2F2B3D',
    fontFamily: 'var(--font-display)',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  bannerSub: {
    fontSize: '13px',
    color: '#6F6B7D',
    margin: 0,
    lineHeight: 1.5,
  },
  bannerActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  primaryCtaBtn: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(115, 103, 240, 0.35)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  darkActionBtn: {
    backgroundColor: '#2F2B3D',
    color: '#FFFFFF',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.15)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  indigoActionBtn: {
    backgroundColor: '#EDEBFD',
    color: '#7367F0',
    border: '1px solid rgba(115, 103, 240, 0.25)',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  outlineActionBtn: {
    backgroundColor: '#FFFFFF',
    color: '#4B465C',
    padding: '9px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    border: '1px solid #DBDADE',
    boxShadow: '0 1px 2px rgba(47, 43, 61, 0.04)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  loadingBox: {
    padding: '50px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #DBDADE',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: '#DBDADE',
    borderTopColor: '#7367F0',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#6F6B7D',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '40px 24px',
    textAlign: 'center',
    border: '1px solid #DBDADE',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.05)',
  },
  emptyIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: '#EDEBFD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  emptyTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#2F2B3D',
    fontFamily: 'var(--font-display)',
    marginBottom: '6px',
    letterSpacing: '-0.01em',
  },
  emptyDesc: {
    fontSize: '13px',
    color: '#6F6B7D',
    maxWidth: '440px',
    lineHeight: 1.5,
    marginBottom: '18px',
  },
  emptyActions: {
    display: 'flex',
    gap: '10px',
  },
  contentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #DBDADE',
    padding: '20px',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  sectionCaption: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#A8AAAE',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#2F2B3D',
    fontFamily: 'var(--font-display)',
    margin: '2px 0',
    letterSpacing: '-0.01em',
  },
  sectionSub: {
    fontSize: '12px',
    color: '#6F6B7D',
    margin: 0,
  },
  linkMore: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#7367F0',
    textDecoration: 'none',
    backgroundColor: '#EDEBFD',
    padding: '6px 12px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
};
