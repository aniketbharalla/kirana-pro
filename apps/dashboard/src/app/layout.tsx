import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/Sidebar';

export const metadata: Metadata = {
  title: 'Kirana Pro — Enterprise Kirana Store OS & Desktop Dashboard',
  description: 'Manage Indian grocery stores, stock, catalog, and Taraju smart scale calculations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={styles.layoutContainer}>
          <Suspense fallback={<aside style={{ width: 260, backgroundColor: '#FFFFFF' }} />}>
            <Sidebar />
          </Suspense>
          <div style={styles.mainContent}>
            {/* Top Global Bar */}
            <header style={styles.header}>
              <div>
                <span style={styles.storeBadge}>🏪 ACTIVE STORE</span>
                <h1 style={styles.headerTitle}>Sharma Kirana Store</h1>
              </div>

              <div style={styles.headerRight}>
                <div style={styles.freeBadge}>
                  <span style={styles.freeDot}>●</span>
                  <span>100% Free Plan</span>
                </div>
                <div style={styles.avatar}>
                  <span>CJ</span>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main style={styles.pageBody}>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layoutContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
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
  pageBody: {
    padding: '32px',
    flex: 1,
  },
};
