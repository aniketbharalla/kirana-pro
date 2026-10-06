'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user, profile, store, loading, signOut } = useAuth();

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main style={styles.loginContainer}>{children}</main>;
  }

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading Kirana Pro Store...</p>
      </div>
    );
  }

  const initials = profile?.displayName
    ? profile.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'KP';

  const storeName = store?.name || (profile?.displayName ? `${profile.displayName}'s Store` : 'My Store');

  return (
    <div style={styles.layoutContainer}>
      <Suspense fallback={<aside style={{ width: 260, backgroundColor: '#FFFFFF' }} />}>
        <Sidebar />
      </Suspense>

      <div style={styles.mainContent}>
        {/* Top Global Bar */}
        <header style={styles.header}>
          <div>
            <span style={styles.storeBadge}>🏪 ACTIVE STORE</span>
            <h1 style={styles.headerTitle}>{storeName}</h1>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.freeBadge}>
              <span style={styles.freeDot}>●</span>
              <span>100% Free Plan</span>
            </div>

            <div style={styles.userInfo}>
              <div style={styles.avatar}>
                <span>{initials}</span>
              </div>
              <div style={styles.userMeta}>
                <span style={styles.userName}>{profile?.displayName || 'Store Owner'}</span>
                <span style={styles.userRole}>
                  {profile?.phoneNumber || profile?.email || 'Authenticated'}
                </span>
              </div>
            </div>

            <button
              onClick={signOut}
              style={styles.signOutBtn}
              title="Sign Out of Dashboard"
            >
              Sign Out 🚪
            </button>
          </div>
        </header>

        {/* Page Content */}
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
  },
  loginContainer: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
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
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#10B981',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748B',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  storeBadge: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '2px 8px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A',
    marginTop: '2px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  freeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F1F5F9',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
  },
  freeDot: {
    color: '#10B981',
    fontSize: '10px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#ECFDF5',
    border: '1.5px solid #10B981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 800,
    color: '#065F46',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B',
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
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  pageBody: {
    padding: '32px',
    flex: 1,
  },
};
