'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user, profile, store, loading, signOut, activeStaff, activeShift, staffSignOut } = useAuth();

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
    ? `🧑‍💼 Staff (${activeStaff?.role.toUpperCase()}) • Counter ${activeShift?.counterNumber || 1}`
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
      <Suspense fallback={<aside style={{ width: 268, backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0' }} />}>
        <Sidebar />
      </Suspense>

      <div style={styles.mainContent}>
        {/* MasterX Top Header Bar */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.storeBadge}>🏪 ACTIVE STORE</span>
            <h1 style={styles.headerTitle}>{storeName}</h1>
          </div>

          <div style={styles.headerRight}>
            {/* Quick POS Launch Shortcut Button */}
            <Link href="/pos" style={styles.posShortcutBtn}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span>POS Billing (F4)</span>
            </Link>

            <div style={styles.freeBadge}>
              <span style={styles.freeDot}>●</span>
              <span>Community Tier</span>
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
              {isStaffSession ? 'End Shift 🚪' : 'Sign Out 🚪'}
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F8FAFC',
    gap: '16px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    borderTopColor: '#4F46E5',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
    letterSpacing: '-0.01em',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '14px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  storeBadge: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    padding: '2px 8px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.025em',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  posShortcutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '7px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
  },
  freeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
  },
  freeDot: {
    color: '#10B981',
    fontSize: '8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 8px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EEF2FF',
    border: '1px solid rgba(79, 70, 229, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 800,
    color: '#4F46E5',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    lineHeight: 1.2,
  },
  userRole: {
    fontSize: '11px',
    color: '#64748B',
    lineHeight: 1.2,
  },
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    padding: '7px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  pageBody: {
    padding: '28px',
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
};
