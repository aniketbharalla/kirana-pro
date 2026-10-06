'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StatsGrid } from '../components/StatsGrid';
import { ProductsTable } from '../components/ProductsTable';
import { StockLog } from '../components/StockLog';
import { INITIAL_DASHBOARD_PRODUCTS, INITIAL_DASHBOARD_MOVEMENTS } from '../lib/mockData';

export default function DashboardOverviewPage() {
  const [products] = useState(INITIAL_DASHBOARD_PRODUCTS);
  const [movements] = useState(INITIAL_DASHBOARD_MOVEMENTS);

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
          <h2 style={styles.bannerTitle}>Welcome to Kirana Pro Desktop</h2>
          <p style={styles.bannerSub}>
            Real-time synchronization with your mobile store app. Manage your grocery catalog,
            track inward restock movements, and monitor low stock items.
          </p>
        </div>

        <div style={styles.bannerActions}>
          <Link href="/bills" style={styles.primaryBtn}>
            🧾 View Sales & Bills
          </Link>
          <Link href="/khata" style={styles.secondaryBtn}>
            📒 Customer Khata →
          </Link>
          <Link href="/products" style={styles.secondaryBtn}>
            📦 Manage Catalog
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

      {/* Back-Office Quick Launch Grid */}
      <div style={styles.quickLaunchGrid}>
        <Link href="/gst" style={styles.quickCard}>
          <div style={{ ...styles.quickIconBg, backgroundColor: '#FEF3C7' }}>🏛️</div>
          <div>
            <div style={styles.quickTitle}>GST & GSTR-1 Portal</div>
            <div style={styles.quickSub}>Portal JSON, HSN summary & CA CSV</div>
          </div>
        </Link>

        <Link href="/analytics" style={styles.quickCard}>
          <div style={{ ...styles.quickIconBg, backgroundColor: '#EFF6FF' }}>📈</div>
          <div>
            <div style={styles.quickTitle}>Profit & Margins</div>
            <div style={styles.quickSub}>Gross profit, revenue trend & KPIs</div>
          </div>
        </Link>

        <Link href="/reorder" style={styles.quickCard}>
          <div style={{ ...styles.quickIconBg, backgroundColor: '#FEE2E2' }}>🔄</div>
          <div>
            <div style={styles.quickTitle}>Smart Reorder</div>
            <div style={styles.quickSub}>Stockout forecast & WhatsApp PO</div>
          </div>
        </Link>

        <Link href="/staff" style={styles.quickCard}>
          <div style={{ ...styles.quickIconBg, backgroundColor: '#DCFCE7' }}>🧑‍💼</div>
          <div>
            <div style={styles.quickTitle}>Shift & Cashier Register</div>
            <div style={styles.quickSub}>Counter cash reconciliation & floats</div>
          </div>
        </Link>

        <Link href="/hardware" style={styles.quickCard}>
          <div style={{ ...styles.quickIconBg, backgroundColor: '#F3E8FF' }}>🖨️</div>
          <div>
            <div style={styles.quickTitle}>Hardware & Printers</div>
            <div style={styles.quickSub}>58mm/80mm roll, cut & drawer kick</div>
          </div>
        </Link>
      </div>

      {/* Catalog & Stock Dual Section */}
      <div style={styles.sectionHeaderRow}>
        <div>
          <h3 style={styles.sectionTitle}>Product Inventory</h3>
          <p style={styles.sectionSub}>Quick view of current stock and price per unit</p>
        </div>
        <Link href="/products" style={styles.linkText}>
          View all {products.length} products →
        </Link>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <ProductsTable products={products.slice(0, 5)} />
      </div>

      <div style={styles.sectionHeaderRow}>
        <div>
          <h3 style={styles.sectionTitle}>Recent Stock Audit Log</h3>
          <p style={styles.sectionSub}>Immutable chronological inward and outward movements</p>
        </div>
        <Link href="/stock" style={styles.linkText}>
          View full stock ledger →
        </Link>
      </div>

      <StockLog movements={movements} productMap={productMap} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
  },
  banner: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '28px 32px',
    marginBottom: '28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  bannerContent: {
    flex: 1,
    minWidth: '280px',
  },
  pill: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '3px 10px',
    borderRadius: '6px',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  bannerTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: '6px',
  },
  bannerSub: {
    fontSize: '14px',
    color: '#64748B',
    lineHeight: 1.5,
    maxWidth: '600px',
  },
  bannerActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '14px',
    padding: '12px 20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  secondaryBtn: {
    backgroundColor: '#F8FAFC',
    color: '#334155',
    fontWeight: 600,
    fontSize: '14px',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '14px',
    marginTop: '10px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  linkText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#10B981',
  },
  quickLaunchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    margin: '24px 0 32px 0',
  },
  quickCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  },
  quickIconBg: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  quickTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0F172A',
  },
  quickSub: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },
};
