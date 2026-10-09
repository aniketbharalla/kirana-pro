'use client';

import React, { Suspense } from 'react';
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
      <Suspense fallback={<aside style={{ width: 264, backgroundColor: 'rgba(255, 255, 255, 0.72)' }} />}>
        <Sidebar />
      </Suspense>

      <div style={styles.mainContent}>
        {/* Top Apple Frosted Header */}
        <header style={styles.header}>
          <div>
            <span style={styles.storeBadge}>🏪 ACTIVE STORE</span>
            <h1 style={styles.headerTitle}>{storeName}</h1>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.freeBadge}>
              <span style={styles.freeDot}>●</span>
              <span>Free Community Plan</span>
            </div>

            <div style={styles.userInfo}>
              <div style={styles.avatar}>
                <span>{initials}</span>
              </div>
              <div style={styles.userMeta}>
                <span style={styles.userName}>{displayName}</span>
                <span style={styles.userRole}>
                  {displayRole}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOutAction}
              style={styles.signOutBtn}
              title={isStaffSession ? "Close Shift & Sign Out" : "Sign Out of Dashboard"}
            >
              {isStaffSession ? 'End Shift 🚪' : 'Sign Out 🚪'}
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
    backgroundColor: '#F5F5F7',
  },
  loginContainer: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F7',
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F5F5F7',
    gap: '16px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderTopColor: '#10B981',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#86868B',
    letterSpacing: '-0.01em',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(25px) saturate(190%)',
    WebkitBackdropFilter: 'blur(25px) saturate(190%)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    padding: '14px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.02)',
  },
  storeBadge: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '2px 8px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: '19px',
    fontWeight: 800,
    color: '#1D1D1F',
    marginTop: '2px',
    letterSpacing: '-0.025em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  freeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    padding: '5px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#555558',
  },
  freeDot: {
    color: '#10B981',
    fontSize: '8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 800,
    color: '#047857',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1D1D1F',
    lineHeight: 1.2,
  },
  userRole: {
    fontSize: '11px',
    color: '#86868B',
    lineHeight: 1.2,
  },
  signOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    color: '#DC2626',
    border: 'none',
    borderRadius: '9px',
    padding: '7px 13px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  pageBody: {
    padding: '28px',
    flex: 1,
  },
};
