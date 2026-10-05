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
          <Link href="/products" style={styles.primaryBtn}>
            + Manage Products
          </Link>
          <Link href="/stock" style={styles.secondaryBtn}>
            View Stock Log →
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
};
