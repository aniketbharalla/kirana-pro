'use client';

import React, { useState } from 'react';
import { StockMovement } from '@kirana-pro/shared';

export interface StockLogProps {
  movements: StockMovement[];
  productMap?: Record<string, string>;
  compact?: boolean;
}

export const StockLog: React.FC<StockLogProps> = ({
  movements,
  productMap = {},
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = movements.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) {
      return false;
    }
    return true;
  });

  return (
    <div style={styles.container}>
      {/* Filter Tabs */}
      <div style={styles.filterBar}>
        <div style={styles.tabGroup}>
          {[
            { id: 'all', label: 'All Movements' },
            { id: 'in', label: '🟢 Inward (Restock)' },
            { id: 'out', label: '🔴 Outward (Sales)' },
            { id: 'adjustment', label: '✏️ Adjustments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                ...styles.tabBtn,
                ...(filterType === tab.id ? styles.tabBtnActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span style={styles.countText}>{filtered.length} entries recorded</span>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>DATE & TIME</th>
              <th style={styles.th}>PRODUCT</th>
              <th style={styles.th}>TYPE</th>
              <th style={styles.th}>QTY CHANGE</th>
              <th style={styles.th}>PREV → NEW</th>
              <th style={styles.th}>REASON</th>
              <th style={styles.th}>NOTES / REF</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.emptyTd}>
                  No stock movements recorded yet.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const isPositive = m.type === 'in';
                const typeBg = isPositive ? '#ECFDF5' : m.type === 'out' ? '#FEF2F2' : '#FFFBEB';
                const typeColor = isPositive ? '#065F46' : m.type === 'out' ? '#DC2626' : '#B45309';

                const formattedDate = new Date(m.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });

                return (
                  <tr key={m.id} style={styles.tr}>
                    <td style={styles.tdDate}>{formattedDate}</td>
                    <td style={styles.tdProduct}>
                      {productMap[m.productId] || m.productId}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.typeBadge,
                          backgroundColor: typeBg,
                          color: typeColor,
                        }}
                      >
                        {m.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.tdQty}>
                      <span style={{ color: isPositive ? '#059669' : '#DC2626', fontWeight: 800 }}>
                        {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                      </span>
                    </td>
                    <td style={styles.tdStock}>
                      {m.previousStock} → <strong>{m.newStock}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.reasonBadge}>{m.reason}</span>
                    </td>
                    <td style={styles.tdNote}>
                      {m.note || <span style={styles.muted}>—</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  filterBar: {
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tabGroup: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
  },
  tabBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontWeight: 700,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  countText: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 600,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '12px 20px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#334155',
  },
  tdDate: {
    padding: '14px 20px',
    fontSize: '12px',
    color: '#64748B',
    whiteSpace: 'nowrap',
  },
  tdProduct: {
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
  },
  typeBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.3px',
  },
  tdQty: {
    padding: '14px 20px',
    fontSize: '14px',
  },
  tdStock: {
    padding: '14px 20px',
    fontSize: '12px',
    color: '#64748B',
  },
  reasonBadge: {
    backgroundColor: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#475569',
    fontWeight: 600,
  },
  tdNote: {
    padding: '14px 20px',
    fontSize: '12px',
    color: '#475569',
  },
  muted: {
    color: '#CBD5E1',
  },
  emptyTd: {
    padding: '36px 20px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '14px',
  },
};
