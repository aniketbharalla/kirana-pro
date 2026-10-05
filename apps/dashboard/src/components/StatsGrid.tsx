'use client';

import React from 'react';

export interface StatsGridProps {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  looseCount: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  totalProducts,
  lowStockCount,
  outOfStockCount,
  looseCount,
}) => {
  const cards = [
    {
      title: 'Total Catalog Items',
      value: totalProducts,
      sub: 'Active products in store',
      icon: '📦',
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockCount,
      sub: 'Below alert threshold',
      icon: '⚠️',
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    {
      title: 'Out of Stock',
      value: outOfStockCount,
      sub: 'Depleted inventory',
      icon: '❌',
      color: '#EF4444',
      bg: '#FEF2F2',
    },
    {
      title: 'Loose / Taraju Items',
      value: looseCount,
      sub: 'Sold by weight (kg/g)',
      icon: '⚖️',
      color: '#6366F1',
      bg: '#EEF2FF',
    },
  ];

  return (
    <div style={styles.grid}>
      {cards.map((card, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.topRow}>
            <div style={{ ...styles.iconBox, backgroundColor: card.bg }}>
              <span style={styles.icon}>{card.icon}</span>
            </div>
            <span style={{ ...styles.value, color: card.color }}>
              {card.value}
            </span>
          </div>
          <div style={styles.title}>{card.title}</div>
          <div style={styles.sub}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  iconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '20px',
  },
  value: {
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '4px',
  },
  sub: {
    fontSize: '12px',
    color: '#64748B',
  },
};
