import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { DashboardShell } from '../components/DashboardShell';

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
        <AuthProvider>
          <DashboardShell>{children}</DashboardShell>
        </AuthProvider>
      </body>
    </html>
  );
}
