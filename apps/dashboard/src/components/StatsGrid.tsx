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
      caption: 'CATALOG HEALTH',
      title: 'Active Products',
      value: totalProducts,
      sub: 'Total SKUs in store catalog',
      statusPill: '● Live Inventory',
      pillColor: '#047857',
      pillBg: '#ECFDF5',
      icon: '📦',
      tintBg: '#EEF2FF',
      iconColor: '#4F46E5',
    },
    {
      caption: 'REORDER THRESHOLD',
      title: 'Low Stock Alerts',
      value: lowStockCount,
      sub: 'Items below minimum buffer',
      statusPill: lowStockCount > 0 ? '⚠️ Action Required' : '✓ Stock Healthy',
      pillColor: lowStockCount > 0 ? '#B45309' : '#047857',
      pillBg: lowStockCount > 0 ? '#FFFBEB' : '#ECFDF5',
      icon: '🔔',
      tintBg: '#FFFBEB',
      iconColor: '#D97706',
    },
    {
      caption: 'CRITICAL INVENTORY',
      title: 'Out of Stock',
      value: outOfStockCount,
      sub: 'Zero count on retail shelf',
      statusPill: outOfStockCount > 0 ? '❌ Urgent Restock' : '✓ Zero Depletion',
      pillColor: outOfStockCount > 0 ? '#B91C1C' : '#047857',
      pillBg: outOfStockCount > 0 ? '#FEF2F2' : '#ECFDF5',
      icon: '🚨',
      tintBg: '#FEF2F2',
      iconColor: '#EF4444',
    },
    {
      caption: 'SMART HARDWARE',
      title: 'Taraju Scale Items',
      value: looseCount,
      sub: 'Sold by weight (kg/g/litres)',
      statusPill: '⚖️ Weight Scale',
      pillColor: '#4338CA',
      pillBg: '#EEF2FF',
      icon: '⚖️',
      tintBg: '#ECFDF5',
      iconColor: '#10B981',
    },
  ];

  return (
    <div style={styles.grid}>
      {cards.map((card, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.topRow}>
            <div style={{ ...styles.iconBox, backgroundColor: card.tintBg }}>
              <span style={styles.icon}>{card.icon}</span>
            </div>
            <span
              style={{
                ...styles.statusBadge,
                color: card.pillColor,
                backgroundColor: card.pillBg,
              }}
            >
              {card.statusPill}
            </span>
          </div>

          <div style={styles.valueRow}>
            <span style={styles.value}>{card.value}</span>
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '18px',
    marginBottom: '28px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.15s ease',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '20px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: '999px',
    letterSpacing: '-0.01em',
  },
  valueRow: {
    marginBottom: '6px',
  },
  value: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#0F172A',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
  caption: {
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: '6px',
    marginBottom: '2px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.015em',
    marginBottom: '4px',
  },
  sub: {
    fontSize: '12px',
    color: '#64748B',
    lineHeight: 1.35,
  },
};
