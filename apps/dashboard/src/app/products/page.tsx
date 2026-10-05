'use client';

import React, { useState } from 'react';
import { ProductsTable } from '../../components/ProductsTable';
import { INITIAL_DASHBOARD_PRODUCTS } from '../../lib/mockData';

export default function ProductsPage() {
  const [products] = useState(INITIAL_DASHBOARD_PRODUCTS);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Products & Catalog</h2>
          <p style={styles.subtitle}>
            Browse, search, and monitor inventory levels across {products.length} products.
          </p>
        </div>
      </div>

      <ProductsTable products={products} />
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
