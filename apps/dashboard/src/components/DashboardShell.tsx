'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Menu, Zap, LogOut, Store as StoreIcon, ShieldCheck, UserCheck } from 'lucide-react';

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user, profile, store, loading, signOut, activeStaff, activeShift, staffSignOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main style={styles.loginContainer}>{children}</main>;
  }

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Syncing Kirana Pro Store OS...</p>
      </div>
    );
  }

  const isStaffSession = Boolean(activeStaff);

  const initials = isStaffSession
    ? (activeStaff?.name || 'ST')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : profile?.displayName
    ? profile.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'KP';

  const storeName = store?.name || (profile?.displayName ? `${profile.displayName}'s Store` : 'My Kirana Store');

  const displayName = isStaffSession
    ? activeStaff?.name
    : (profile?.displayName || 'Store Owner');

  const displayRole = isStaffSession
    ? `Staff (${activeStaff?.role.toUpperCase()}) • Counter ${activeShift?.counterNumber || 1}`
    : (profile?.phoneNumber || profile?.email || 'Store Admin');

  const handleSignOutAction = () => {
    if (isStaffSession) {
      staffSignOut();
    } else {
      signOut();
    }
  };

  return (
    <div style={styles.layoutContainer}>
      <Suspense fallback={<aside style={{ width: 260, backgroundColor: '#FFFFFF', borderRight: '1px solid #DBDADE' }} />}>
        <Sidebar
          isMobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </Suspense>

      <div style={styles.mainContent}>
        {/* MasterX Top Header Bar */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={styles.hamburgerBtn}
              aria-label="Open navigation menu"
            >
              <Menu size={22} color="#2F2B3D" />
            </button>

            <div style={styles.storeMetaBlock}>
              <div style={styles.storeBadge}>
                <span style={styles.storeBadgeDot} />
                <span>ACTIVE STORE</span>
              </div>
              <h1 style={styles.headerTitle}>{storeName}</h1>
            </div>
          </div>

          <div style={styles.headerRight}>
            {/* MasterX Primary CTA: Quick POS Billing (F4) */}
            <Link href="/pos" style={styles.posCtaBtn}>
              <Zap size={15} strokeWidth={2.2} />
              <span style={styles.posCtaText}>POS Billing</span>
              <span style={styles.f4Tag}>F4</span>
            </Link>

            <div style={styles.freeBadge}>
              <span style={styles.freeDot}>●</span>
              <span style={styles.freeText}>Community</span>
            </div>

            <div style={styles.userInfo}>
              <div style={styles.avatar}>
                <span>{initials}</span>
              </div>
              <div style={styles.userMeta}>
                <span style={styles.userName}>{displayName}</span>
                <span style={styles.userRole}>{displayRole}</span>
              </div>
            </div>

            <button
              onClick={handleSignOutAction}
              style={styles.signOutBtn}
              title={isStaffSession ? 'Close Shift & Sign Out' : 'Sign Out of Dashboard'}
            >
              <LogOut size={14} />
              <span style={styles.signOutText}>{isStaffSession ? 'End Shift' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        {/* MasterX Page Canvas */}
        <main style={styles.pageBody}>{children}</main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  layoutContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F8F7FA',
    fontFamily: 'var(--font-body)',
  },
  loginContainer: {
    minHeight: '100vh',
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F8F7FA',
    gap: '16px',
  },
  spinner: {
    width: '36px',
    height: '36px',
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
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflowY: 'auto',
    backgroundColor: '#F8F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #DBDADE',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 2px 4px rgba(47, 43, 61, 0.04)',
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  hamburgerBtn: {
    background: 'none',
    border: '1px solid #DBDADE',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeMetaBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  storeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#7367F0',
    backgroundColor: '#EDEBFD',
    padding: '1px 7px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
    alignSelf: 'flex-start',
  },
  storeBadgeDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#7367F0',
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#2F2B3D',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  posCtaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(115, 103, 240, 0.32)',
    transition: 'all 0.15s ease',
  },
  posCtaText: {
    whiteSpace: 'nowrap',
  },
  f4Tag: {
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    padding: '1px 5px',
    borderRadius: '4px',
  },
  freeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    padding: '5px 10px',
    borderRadius: '999px',
  },
  freeText: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6F6B7D',
  },
  freeDot: {
    color: '#28C76F',
    fontSize: '7px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    backgroundColor: '#F8F7FA',
    borderRadius: '8px',
    border: '1px solid #DBDADE',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    color: '#7367F0',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2F2B3D',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: '10px',
    color: '#A8AAAE',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  signOutBtn: {
    backgroundColor: '#FCE4E4',
    color: '#EA5455',
    border: '1px solid rgba(234, 84, 85, 0.25)',
    borderRadius: '8px',
    padding: '7px 11px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.15s ease',
  },
  signOutText: {
    whiteSpace: 'nowrap',
  },
  pageBody: {
    padding: '24px',
    flex: 1,
    backgroundColor: '#F8F7FA',
    minWidth: 0,
  },
};
