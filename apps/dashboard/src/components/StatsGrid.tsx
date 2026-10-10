'use client';

import React from 'react';
import { Package, AlertTriangle, AlertCircle, Scale } from 'lucide-react';

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
      statusPill: 'Live Inventory',
      pillColor: '#28C76F',
      pillBg: '#DDF6E8',
      tintBg: '#EDEBFD',
      iconBorder: 'rgba(115, 103, 240, 0.25)',
      Icon: Package,
      iconColor: '#7367F0',
    },
    {
      caption: 'REORDER THRESHOLD',
      title: 'Low Stock Alerts',
      value: lowStockCount,
      sub: 'Items below minimum buffer',
      statusPill: lowStockCount > 0 ? 'Action Needed' : 'Stock Healthy',
      pillColor: lowStockCount > 0 ? '#FF9F43' : '#28C76F',
      pillBg: lowStockCount > 0 ? '#FFF1E3' : '#DDF6E8',
      tintBg: '#FFF1E3',
      iconBorder: 'rgba(255, 159, 67, 0.25)',
      Icon: AlertTriangle,
      iconColor: '#FF9F43',
    },
    {
      caption: 'CRITICAL INVENTORY',
      title: 'Out of Stock',
      value: outOfStockCount,
      sub: 'Zero count on retail shelf',
      statusPill: outOfStockCount > 0 ? 'Urgent Restock' : 'Zero Depletion',
      pillColor: outOfStockCount > 0 ? '#EA5455' : '#28C76F',
      pillBg: outOfStockCount > 0 ? '#FCE4E4' : '#DDF6E8',
      tintBg: '#FCE4E4',
      iconBorder: 'rgba(234, 84, 85, 0.25)',
      Icon: AlertCircle,
      iconColor: '#EA5455',
    },
    {
      caption: 'SMART HARDWARE',
      title: 'Taraju Scale Items',
      value: looseCount,
      sub: 'Sold by weight (kg/g/litres)',
      statusPill: 'Weight Scale',
      pillColor: '#7367F0',
      pillBg: '#EDEBFD',
      tintBg: '#DDF6E8',
      iconBorder: 'rgba(40, 199, 111, 0.25)',
      Icon: Scale,
      iconColor: '#28C76F',
    },
  ];

  return (
    <div style={styles.grid}>
      {cards.map((card, i) => {
        const { Icon } = card;
        return (
          <div key={i} style={styles.card}>
            <div style={styles.topRow}>
              <div
                style={{
                  ...styles.iconBox,
                  backgroundColor: card.tintBg,
                  border: `1px solid ${card.iconBorder}`,
                }}
              >
                <Icon size={20} color={card.iconColor} strokeWidth={2} />
              </div>
              <span
                style={{
                  ...styles.statusBadge,
                  color: card.pillColor,
                  backgroundColor: card.pillBg,
                }}
              >
                ● {card.statusPill}
              </span>
            </div>

            <div style={styles.valueRow}>
              <span style={styles.value}>{card.value}</span>
            </div>

            <div style={styles.caption}>{card.caption}</div>
            <div style={styles.title}>{card.title}</div>
            <div style={styles.sub}>{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DBDADE',
    borderRadius: '12px',
    padding: '18px 20px',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.15s ease',
    fontFamily: 'var(--font-body)',
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
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: '6px',
    letterSpacing: '-0.01em',
  },
  valueRow: {
    marginBottom: '4px',
  },
  value: {
    fontSize: '30px',
    fontWeight: 700,
    color: '#2F2B3D',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  caption: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#A8AAAE',
    textTransform: 'uppercase',
    marginTop: '6px',
    marginBottom: '2px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2B3D',
    letterSpacing: '-0.01em',
    marginBottom: '4px',
  },
  sub: {
    fontSize: '12px',
    color: '#6F6B7D',
    lineHeight: 1.35,
  },
};
