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
      caption: 'INVENTORY CATALOG',
      title: 'Active Products',
      value: totalProducts,
      sub: 'Items registered in store',
      icon: '📦',
      color: '#059669',
      tintBg: 'rgba(16, 185, 129, 0.1)',
      borderTint: 'rgba(16, 185, 129, 0.2)',
    },
    {
      caption: 'INVENTORY ALERT',
      title: 'Low Stock Items',
      value: lowStockCount,
      sub: 'Below reorder threshold',
      icon: '⚠️',
      color: '#D97706',
      tintBg: 'rgba(245, 158, 11, 0.1)',
      borderTint: 'rgba(245, 158, 11, 0.25)',
    },
    {
      caption: 'URGENT RESTOCK',
      title: 'Out of Stock',
      value: outOfStockCount,
      sub: 'Zero count in store',
      icon: '❌',
      color: '#DC2626',
      tintBg: 'rgba(239, 68, 68, 0.1)',
      borderTint: 'rgba(239, 68, 68, 0.25)',
    },
    {
      caption: 'SMART SCALE',
      title: 'Loose / Taraju',
      value: looseCount,
      sub: 'Sold by weight (kg/g)',
      icon: '⚖️',
      color: '#4F46E5',
      tintBg: 'rgba(99, 102, 241, 0.1)',
      borderTint: 'rgba(99, 102, 241, 0.2)',
    },
  ];

  return (
    <div style={styles.grid}>
      {cards.map((card, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.topRow}>
            <div
              style={{
                ...styles.iconBox,
                backgroundColor: card.tintBg,
                border: `1px solid ${card.borderTint}`,
              }}
            >
              <span style={styles.icon}>{card.icon}</span>
            </div>
            <span
              style={{
                ...styles.value,
                color: card.color,
              }}
            >
              {card.value}
            </span>
          </div>
          <div style={styles.caption}>{card.caption}</div>
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
    marginBottom: '28px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '18px',
  },
  value: {
    fontSize: '30px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
  },
  caption: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#86868B',
    marginBottom: '2px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1D1D1F',
    letterSpacing: '-0.015em',
    marginBottom: '4px',
  },
  sub: {
    fontSize: '12px',
    color: '#86868B',
    lineHeight: 1.35,
  },
};
