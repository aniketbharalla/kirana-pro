'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Overview', icon: '📊' },
    { href: '/products', label: 'Products & Catalog', icon: '📦' },
    { href: '/stock', label: 'Stock Movement Log', icon: '📋' },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoBadge}>🏪</div>
        <div>
          <h2 style={styles.brandTitle}>Kirana Pro</h2>
          <span style={styles.brandSub}>Desktop Store Manager</span>
        </div>
      </div>

      {/* Free Plan Badge */}
      <div style={styles.planCard}>
        <div style={styles.planBadge}>100% FREE TIER</div>
        <p style={styles.planText}>Zero monthly fee • Unlimited products & stock tracking</p>
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
              {isActive && <div style={styles.activeDot} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Store Info */}
      <div style={styles.footerCard}>
        <div style={styles.storeAvatar}>K</div>
        <div style={styles.storeDetails}>
          <div style={styles.storeName}>Sharma Kirana</div>
          <div style={styles.storeStatus}>🟢 Cloud Synced</div>
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    padding: '24px 16px',
    gap: '20px',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 8px',
  },
  logoBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.3px',
  },
  brandSub: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 500,
  },
  planCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px',
  },
  planBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#A7F3D0',
    padding: '2px 8px',
    borderRadius: '6px',
    marginBottom: '6px',
  },
  planText: {
    fontSize: '11px',
    color: '#475569',
    lineHeight: 1.4,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '10px',
    color: '#475569',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    fontWeight: 700,
  },
  navIcon: {
    fontSize: '18px',
  },
  navLabel: {
    flex: 1,
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
  },
  footerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  storeAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  storeDetails: {
    overflow: 'hidden',
  },
  storeName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  storeStatus: {
    fontSize: '11px',
    color: '#059669',
    fontWeight: 600,
  },
};
