'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { store, profile, activeStaff, activeShift } = useAuth();

  const navSections = [
    {
      title: 'BILLING & SALES',
      links: [
        { href: '/pos', label: 'POS Quick Billing', icon: '⚡', badge: 'F4' },
        { href: '/bills', label: 'Sales & Invoices', icon: '🧾' },
        { href: '/khata', label: 'Customer Khata', icon: '📒' },
      ],
    },
    {
      title: 'INVENTORY & CATALOG',
      links: [
        { href: '/products', label: 'Products & Catalog', icon: '📦' },
        { href: '/reorder', label: 'Smart Reorder', icon: '🔄' },
        { href: '/stock', label: 'Stock Movement Log', icon: '📋' },
        { href: '/purchases', label: 'Wholesale & OCR', icon: '🚚' },
        { href: '/suppliers', label: 'Wholesalers Directory', icon: '🏢' },
      ],
    },
    {
      title: 'STORE OPERATIONS',
      links: [
        { href: '/', label: 'Overview Dashboard', icon: '📊' },
        { href: '/galla', label: 'Daily Galla Cash', icon: '💰' },
        { href: '/staff', label: 'Staff & Shift Register', icon: '🧑‍💼' },
        { href: '/gst', label: 'GST & Tax Returns', icon: '🏛️' },
        { href: '/analytics', label: 'Profit & Analytics', icon: '📈' },
        { href: '/hardware', label: 'Hardware & Printers', icon: '🖨️' },
      ],
    },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoBadge}>🏪</div>
        <div>
          <div style={styles.brandTitleRow}>
            <h2 style={styles.brandTitle}>Kirana Pro</h2>
            <span style={styles.versionPill}>v2.4</span>
          </div>
          <span style={styles.brandSub}>Store Operating System</span>
        </div>
      </div>

      {/* Free Plan MasterX Chip */}
      <div style={styles.tierChip}>
        <div style={styles.tierDot} />
        <span style={styles.tierText}>100% Free Forever • Zero Subscription</span>
      </div>

      {/* Navigation Groups */}
      <nav style={styles.nav}>
        {navSections.map((sec) => (
          <div key={sec.title} style={styles.sectionGroup}>
            <span style={styles.sectionTitle}>{sec.title}</span>
            <div style={styles.sectionLinks}>
              {sec.links.map((item) => {
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
                    {isActive && <div style={styles.activeBar} />}
                    <span style={styles.navIcon}>{item.icon}</span>
                    <span
                      style={{
                        ...styles.navLabel,
                        ...(isActive ? styles.navLabelActive : {}),
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          ...styles.itemBadge,
                          ...(isActive ? styles.itemBadgeActive : {}),
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
            <span style={styles.statusDot}>●</span> {activeStaff ? `Counter ${activeShift?.counterNumber || 1} Active` : 'Cloud Live Sync'}
          </div>
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '268px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    padding: '20px 16px',
    gap: '14px',
    boxShadow: '1px 0 3px rgba(0, 0, 0, 0.02)',
    zIndex: 20,
    overflowY: 'auto',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 6px',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#EEF2FF',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.12)',
  },
  brandTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0F172A',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
    margin: 0,
  },
  versionPill: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    padding: '1px 6px',
    borderRadius: '6px',
  },
  brandSub: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  tierChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '8px 10px',
  },
  tierDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
  },
  tierText: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#047857',
    letterSpacing: '-0.01em',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    flex: 1,
  },
  sectionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#94A3B8',
    letterSpacing: '0.06em',
    padding: '0 10px 4px',
  },
  sectionLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: '#475569',
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    boxShadow: '0 1px 2px rgba(79, 70, 229, 0.05)',
  },
  activeBar: {
    position: 'absolute',
    left: '0px',
    top: '6px',
    bottom: '6px',
    width: '3.5px',
    borderRadius: '0 4px 4px 0',
    backgroundColor: '#4F46E5',
  },
  navIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
  },
  navLabel: {
    fontSize: '13px',
    fontWeight: 600,
    flex: 1,
  },
  navLabelActive: {
    fontWeight: 700,
    color: '#4F46E5',
  },
  itemBadge: {
    fontSize: '10px',
    fontWeight: 800,
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  itemBadgeActive: {
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
  },
  footerCard: {
    marginTop: 'auto',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  storeAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: 800,
    color: '#0F172A',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  storeDetails: {
    flex: 1,
    overflow: 'hidden',
  },
  storeName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  },
  storeStatus: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '2px',
  },
  statusDot: {
    color: '#10B981',
    fontSize: '8px',
  },
};
