'use client';

import React, { useState, useMemo } from 'react';
import { INITIAL_DASHBOARD_PRODUCTS } from '../../lib/mockData';
import { Product } from '@kirana-pro/shared';

export default function SmartReorderPage() {
  const [products] = useState<Product[]>(INITIAL_DASHBOARD_PRODUCTS);
  const [filter, setFilter] = useState<'all_alerts' | 'out_of_stock' | 'low_stock'>('all_alerts');
  const [copied, setCopied] = useState(false);

  // Compute reorder items
  const reorderItems = useMemo(() => {
    return products
      .filter((p) => p.currentStock <= p.minStockAlert)
      .map((p) => {
        const isOut = p.currentStock === 0;
        const suggestedQty = Math.max(1, p.minStockAlert * 2 - p.currentStock);
        const estCost = suggestedQty * p.purchasePrice;
        return {
          ...p,
          isOut,
          suggestedQty,
          estCost,
        };
      });
  }, [products]);

  const filteredItems = useMemo(() => {
    if (filter === 'out_of_stock') return reorderItems.filter((i) => i.isOut);
    if (filter === 'low_stock') return reorderItems.filter((i) => !i.isOut);
    return reorderItems;
  }, [reorderItems, filter]);

  const totalBudgetNeeded = reorderItems.reduce((sum, i) => sum + i.estCost, 0);
  const outOfStockCount = reorderItems.filter((i) => i.isOut).length;

  // Generate WhatsApp PO Text
  const handleCopyWhatsAppPo = () => {
    const lines = [
      `*🛒 PURCHASE ORDER (खरीद ऑर्डर)*`,
      `*Store:* Sharma Kirana Store`,
      `*Date:* ${new Date().toLocaleDateString('en-IN')}`,
      `--------------------------------`,
      ...reorderItems.map(
        (i, idx) =>
          `${idx + 1}. *${i.name}* (${i.nameHindi || ''})\n   Qty: *${i.suggestedQty} ${i.unit}* | Current: ${i.currentStock}`
      ),
      `--------------------------------`,
      `*Est. Total Value:* ₹${totalBudgetNeeded.toLocaleString('en-IN')}`,
      `Please confirm stock dispatch date. धन्यवाद! 🙏`,
    ];

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.reorderBadge}>🔄 INVENTORY FORECASTING</span>
            <span style={styles.alertBadge}>
              {outOfStockCount > 0 ? `⚠️ ${outOfStockCount} Out of Stock` : '🟢 Stock Healthy'}
            </span>
          </div>
          <h1 style={styles.title}>Smart Reorder & Procurement Alerts</h1>
          <p style={styles.subtitle}>
            Algorithmic stock depletion forecasting and 1-click WhatsApp purchase orders for mandi distributors.
          </p>
        </div>

        {/* Action Button */}
        <div style={styles.headerActions}>
          <button style={styles.btnPrimary} onClick={handleCopyWhatsAppPo}>
            {copied ? '✓ PO Copied to Clipboard!' : '📲 Copy WhatsApp PO for Mandi'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #EF4444' }}>
          <span style={styles.kpiLabel}>ITEMS NEEDING REORDER</span>
          <span style={{ ...styles.kpiVal, color: '#DC2626' }}>{reorderItems.length} Products</span>
          <span style={styles.kpiSub}>Stock at or below minimum threshold</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>OUT OF STOCK (CRITICAL)</span>
          <span style={{ ...styles.kpiVal, color: outOfStockCount > 0 ? '#B91C1C' : '#0F172A' }}>
            {outOfStockCount} Items
          </span>
          <span style={styles.kpiSub}>Immediate stockout crisis</span>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #10B981' }}>
          <span style={styles.kpiLabel}>ESTIMATED REORDER BUDGET</span>
          <span style={{ ...styles.kpiVal, color: '#047857' }}>
            ₹{totalBudgetNeeded.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span style={styles.kpiSub}>Wholesale replenishment cost</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>ORDER RUN-RATE</span>
          <span style={styles.kpiVal}>14 Days</span>
          <span style={styles.kpiSub}>Estimated inventory cover after reorder</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterRow}>
        <button
          style={{ ...styles.filterBtn, ...(filter === 'all_alerts' ? styles.filterBtnActive : {}) }}
          onClick={() => setFilter('all_alerts')}
        >
          🚨 All Alerts ({reorderItems.length})
        </button>
        <button
          style={{ ...styles.filterBtn, ...(filter === 'out_of_stock' ? styles.filterBtnActive : {}) }}
          onClick={() => setFilter('out_of_stock')}
        >
          🔴 Out of Stock ({outOfStockCount})
        </button>
        <button
          style={{ ...styles.filterBtn, ...(filter === 'low_stock' ? styles.filterBtnActive : {}) }}
          onClick={() => setFilter('low_stock')}
        >
          🟡 Low Stock ({reorderItems.length - outOfStockCount})
        </button>
      </div>

      {/* Reorder Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeaderRow}>
          <div>
            <h2 style={styles.tableTitle}>Recommended Replenishment Orders</h2>
            <span style={styles.tableSubtitle}>
              Quantities calculated automatically based on min alert buffer safety margins.
            </span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div style={styles.emptyState}>No products match the selected filter.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>PRODUCT NAME</th>
                  <th style={styles.th}>HINDI NAME</th>
                  <th style={styles.th}>CATEGORY</th>
                  <th style={styles.th}>CURRENT STOCK</th>
                  <th style={styles.th}>MIN ALERT</th>
                  <th style={styles.th}>SUGGESTED REORDER</th>
                  <th style={styles.th}>WHOLESALE RATE (₹)</th>
                  <th style={styles.th}>EST. BUDGET (₹)</th>
                  <th style={styles.th}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{item.name}</td>
                    <td style={{ ...styles.td, color: '#64748B' }}>{item.nameHindi || '—'}</td>
                    <td style={{ ...styles.td, textTransform: 'capitalize' }}>
                      {item.category.replace('-', ' ')}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          fontWeight: 800,
                          color: item.isOut ? '#DC2626' : '#D97706',
                        }}
                      >
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td style={styles.td}>{item.minStockAlert} {item.unit}</td>
                    <td style={{ ...styles.td, fontWeight: 800, color: '#10B981' }}>
                      +{item.suggestedQty} {item.unit}
                    </td>
                    <td style={styles.td}>₹{item.purchasePrice}</td>
                    <td style={{ ...styles.td, fontWeight: 800, color: '#0F172A' }}>
                      ₹{item.estCost.toLocaleString('en-IN')}
                    </td>
                    <td style={styles.td}>
                      {item.isOut ? (
                        <span style={styles.outBadge}>Out of Stock</span>
                      ) : (
                        <span style={styles.lowBadge}>Low Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  reorderBadge: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  alertBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#991B1B',
    backgroundColor: '#FEE2E2',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  btnPrimary: {
    backgroundColor: '#10B981',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: 800,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  kpiVal: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
  },
  filterBtn: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    color: '#FFFFFF',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    padding: '20px',
    borderBottom: '1px solid #F1F5F9',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  tableSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    backgroundColor: '#F8FAFC',
    color: '#475569',
    fontWeight: 700,
    fontSize: '11px',
    letterSpacing: '0.5px',
    padding: '12px 18px',
    textAlign: 'left',
    borderBottom: '1px solid #E2E8F0',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 18px',
    color: '#334155',
  },
  outBadge: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '11px',
  },
  lowBadge: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '11px',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '14px',
  },
};
