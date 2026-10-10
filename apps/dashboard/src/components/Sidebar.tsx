'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Receipt,
  BookOpen,
  Package,
  RefreshCw,
  ClipboardList,
  Truck,
  Building2,
  LayoutDashboard,
  Wallet,
  Users,
  Landmark,
  BarChart3,
  Printer,
  Store as StoreIcon,
  X,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose }) => {
  const pathname = usePathname();
  const { store, profile, activeStaff, activeShift } = useAuth();

  const navSections = [
    {
      title: 'BILLING & SALES',
      links: [
        { href: '/pos', label: 'POS Quick Billing', Icon: Zap, badge: 'F4' },
        { href: '/bills', label: 'Sales & Invoices', Icon: Receipt },
        { href: '/khata', label: 'Customer Khata', Icon: BookOpen },
      ],
    },
    {
      title: 'INVENTORY & CATALOG',
      links: [
        { href: '/products', label: 'Products & Catalog', Icon: Package },
        { href: '/reorder', label: 'Smart Reorder', Icon: RefreshCw },
        { href: '/stock', label: 'Stock Movement Log', Icon: ClipboardList },
        { href: '/purchases', label: 'Wholesale & OCR', Icon: Truck },
        { href: '/suppliers', label: 'Wholesalers Directory', Icon: Building2 },
      ],
    },
    {
      title: 'STORE OPERATIONS',
      links: [
        { href: '/', label: 'Overview Dashboard', Icon: LayoutDashboard },
        { href: '/galla', label: 'Daily Galla Cash', Icon: Wallet },
        { href: '/staff', label: 'Staff & Shift Register', Icon: Users },
        { href: '/gst', label: 'GST & Tax Returns', Icon: Landmark },
        { href: '/analytics', label: 'Profit & Analytics', Icon: BarChart3 },
        { href: '/hardware', label: 'Hardware & Printers', Icon: Printer },
      ],
    },
  ];

  const sidebarContent = (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoBadge}>
          <StoreIcon size={20} color="#7367F0" strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.brandTitleRow}>
            <h2 style={styles.brandTitle}>Kirana Pro</h2>
            <span style={styles.versionPill}>v2.4</span>
          </div>
          <span style={styles.brandSub}>Store Operating System</span>
        </div>

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button onClick={onMobileClose} style={styles.mobileCloseBtn} aria-label="Close menu">
            <X size={18} color="#6F6B7D" />
          </button>
        )}
      </div>

      {/* Free Tier MasterX Chip */}
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
                const { Icon } = item;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (onMobileClose) onMobileClose();
                    }}
                    style={{
                      ...styles.navItem,
                      ...(isActive ? styles.navItemActive : {}),
                    }}
                  >
                    {isActive && <div style={styles.activeBar} />}
                    <Icon
                      size={18}
                      color={isActive ? '#7367F0' : '#6F6B7D'}
                      strokeWidth={isActive ? 2.2 : 1.75}
                      style={{ flexShrink: 0 }}
                    />
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
          {activeStaff ? (
            <Users size={18} color="#7367F0" />
          ) : (
            <StoreIcon size={18} color="#7367F0" />
          )}
        </div>
        <div style={styles.storeDetails}>
          <div style={styles.storeName}>
            {activeStaff
              ? activeStaff.name
              : store?.name || (profile?.displayName ? `${profile.displayName}'s Store` : 'My Store')}
          </div>
          <div style={styles.storeStatus}>
            <span style={styles.statusDot}>●</span>{' '}
            {activeStaff ? `Counter ${activeShift?.counterNumber || 1} Active` : 'Cloud Live Sync'}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div style={styles.desktopContainer}>{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div style={styles.mobileBackdrop} onClick={onMobileClose}>
          <div style={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  desktopContainer: {
    display: 'flex',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #DBDADE',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    padding: '18px 14px',
    gap: '12px',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.04)',
    zIndex: 20,
    overflowY: 'auto',
    fontFamily: 'var(--font-body)',
  },
  mobileBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(47, 43, 61, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    display: 'flex',
  },
  mobileDrawer: {
    width: '280px',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 8px 24px rgba(47, 43, 61, 0.2)',
    animation: 'slideIn 0.2s ease',
  },
  mobileCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 6px',
  },
  logoBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(115, 103, 240, 0.16)',
  },
  brandTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#2F2B3D',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    margin: 0,
  },
  versionPill: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#7367F0',
    backgroundColor: '#EDEBFD',
    padding: '1px 6px',
    borderRadius: '6px',
  },
  brandSub: {
    fontSize: '11px',
    color: '#A8AAAE',
    fontWeight: 500,
    letterSpacing: '0.01em',
  },
  tierChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '8px',
    padding: '7px 10px',
  },
  tierDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#28C76F',
  },
  tierText: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#28C76F',
    letterSpacing: '-0.01em',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    flex: 1,
  },
  sectionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#A8AAAE',
    letterSpacing: '0.06em',
    padding: '0 8px 3px',
    textTransform: 'uppercase',
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
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#6F6B7D',
    transition: 'all 0.12s ease',
  },
  navItemActive: {
    backgroundColor: '#EDEBFD',
    color: '#7367F0',
    boxShadow: '0 2px 6px rgba(115, 103, 240, 0.12)',
  },
  activeBar: {
    position: 'absolute',
    left: '0px',
    top: '6px',
    bottom: '6px',
    width: '3px',
    borderRadius: '0 4px 4px 0',
    backgroundColor: '#7367F0',
  },
  navLabel: {
    fontSize: '13px',
    fontWeight: 500,
    flex: 1,
  },
  navLabelActive: {
    fontWeight: 600,
    color: '#7367F0',
  },
  itemBadge: {
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: '#F1F0F5',
    color: '#6F6B7D',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  itemBadgeActive: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
  },
  footerCard: {
    marginTop: 'auto',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '10px',
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  storeAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#7367F0',
  },
  storeDetails: {
    flex: 1,
    overflow: 'hidden',
  },
  storeName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#2F2B3D',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  },
  storeStatus: {
    fontSize: '10px',
    color: '#A8AAAE',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '2px',
  },
  statusDot: {
    color: '#28C76F',
    fontSize: '8px',
  },
};
