'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { store, profile, activeStaff, activeShift } = useAuth();

  const navLinks = [
    { href: '/', label: 'Overview', icon: '📊' },
    { href: '/pos', label: 'POS Quick Billing', icon: '⚡' },
    { href: '/bills', label: 'Sales & Invoices', icon: '🧾' },
    { href: '/khata', label: 'Customer Khata', icon: '📒' },
    { href: '/products', label: 'Products & Catalog', icon: '📦' },
    { href: '/reorder', label: 'Smart Reorder', icon: '🔄' },
    { href: '/stock', label: 'Stock Movement Log', icon: '📋' },
    { href: '/purchases', label: 'Wholesale & OCR', icon: '🚚' },
    { href: '/suppliers', label: 'Wholesalers Directory', icon: '🏢' },
    { href: '/galla', label: 'Daily Galla Cash', icon: '💰' },
    { href: '/staff', label: 'Staff & Shift Register', icon: '🧑‍💼' },
    { href: '/gst', label: 'GST & Tax Returns', icon: '🏛️' },
    { href: '/analytics', label: 'Profit & Analytics', icon: '📈' },
    { href: '/hardware', label: 'Hardware & Printers', icon: '🖨️' },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoBadge}>🏪</div>
        <div>
          <h2 style={styles.brandTitle}>Kirana Pro</h2>
          <span style={styles.brandSub}>Store OS</span>
        </div>
      </div>

      {/* Free Plan Glass Card */}
      <div style={styles.planCard}>
        <div style={styles.planHeader}>
          <span style={styles.planDot}>●</span>
          <span style={styles.planBadge}>100% FREE TIER</span>
        </div>
        <p style={styles.planText}>Zero fee • Unlimited cloud stock tracking</p>
      </div>

      {/* Nav Links */}
      <nav style={styles.nav}>
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              {isActive && <div style={styles.activePill} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Store Info */}
      <div style={styles.footerCard}>
        <div style={styles.storeAvatar}>
          {activeStaff ? '🧑‍💼' : (store?.name ? store.name.slice(0, 1).toUpperCase() : '🏪')}
        </div>
        <div style={styles.storeDetails}>
          <div style={styles.storeName}>
            {activeStaff ? activeStaff.name : (store?.name || (profile?.displayName ? `${profile.displayName}'s Store` : 'My Store'))}
          </div>
          <div style={styles.storeStatus}>
            <span style={styles.statusDot}>●</span> {activeStaff ? `Counter ${activeShift?.counterNumber || 1} Active` : 'Firebase Live'}
          </div>
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '264px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(25px) saturate(190%)',
    WebkitBackdropFilter: 'blur(25px) saturate(190%)',
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    padding: '24px 16px',
    gap: '18px',
    boxShadow: '1px 0 10px rgba(0, 0, 0, 0.02)',
    zIndex: 20,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 6px',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '11px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#1D1D1F',
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: '11px',
    color: '#86868B',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  planCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    borderRadius: '12px',
    padding: '10px 12px',
  },
  planHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
  },
  planDot: {
    color: '#10B981',
    fontSize: '9px',
  },
  planBadge: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#065F46',
    letterSpacing: '0.04em',
  },
  planText: {
    fontSize: '11px',
    color: '#64748B',
    lineHeight: 1.35,
    margin: 0,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    overflowY: 'auto',
    paddingRight: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '9px 12px',
    borderRadius: '10px',
    color: '#475569',
    fontWeight: 600,
    fontSize: '13px',
    transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    color: '#047857',
    fontWeight: 700,
  },
  navIcon: {
    fontSize: '16px',
  },
  navLabel: {
    flex: 1,
  },
  activePill: {
    width: '4px',
    height: '14px',
    borderRadius: '999px',
    backgroundColor: '#10B981',
  },
  footerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
  },
  storeAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '9px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  storeDetails: {
    overflow: 'hidden',
  },
  storeName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#1D1D1F',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  storeStatus: {
    fontSize: '10px',
    color: '#059669',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  statusDot: {
    fontSize: '8px',
  },
};
