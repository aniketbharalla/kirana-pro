'use client';

import React, { useState } from 'react';
import { StockLog } from '../../components/StockLog';
import { INITIAL_DASHBOARD_MOVEMENTS, INITIAL_DASHBOARD_PRODUCTS } from '../../lib/mockData';

export default function StockLogPage() {
  const [movements] = useState(INITIAL_DASHBOARD_MOVEMENTS);

  const productMap: Record<string, string> = {};
  INITIAL_DASHBOARD_PRODUCTS.forEach((p) => {
    productMap[p.id] = p.name;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Stock Movement Ledger</h2>
          <p style={styles.subtitle}>
            Complete chronological audit log of inward restocks, POS sales, and adjustments.
          </p>
        </div>
      </div>

      <StockLog movements={movements} productMap={productMap} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
  },
};
