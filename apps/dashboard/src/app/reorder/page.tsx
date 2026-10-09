'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreProducts } from '../../lib/storeService';

export default function SmartReorderPage() {
  const { store, storeId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all_alerts' | 'out_of_stock' | 'low_stock'>('all_alerts');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeStoreProducts(storeId, (data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [storeId]);

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
    if (reorderItems.length === 0) {
      alert('No items currently need reordering.');
      return;
    }
    const storeName = store?.name || 'My Kirana Store';
    const lines = [
      `*🛒 PURCHASE ORDER (खरीद ऑर्डर)*`,
      `*Store:* ${storeName}`,
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
            <span style={styles.reorderBadge}>INVENTORY FORECASTING</span>
            <span style={outOfStockCount > 0 ? styles.criticalBadge : styles.healthyBadge}>
              {outOfStockCount > 0 ? `⚠️ ${outOfStockCount} Out of Stock` : '✓ Stock Healthy'}
            </span>
          </div>
          <h1 style={styles.title}>Smart Reorder & Procurement</h1>
          <p style={styles.subtitle}>
            Continuous inventory velocity forecasting with 1-click WhatsApp purchase orders for wholesale distributors.
          </p>
        </div>

        {/* Action Button */}
        <div style={styles.headerActions}>
          <button style={styles.btnPrimary} onClick={handleCopyWhatsAppPo}>
            {copied ? '✓ PO Copied to Clipboard!' : '📲 Copy WhatsApp PO for Mandi'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing inventory forecast models...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>ITEMS NEEDING REORDER</span>
              <span style={{ ...styles.kpiVal, color: '#FF3B30' }}>{reorderItems.length}</span>
              <span style={styles.kpiSub}>At or below minimum buffer threshold</span>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>OUT OF STOCK (CRITICAL)</span>
              <span style={{ ...styles.kpiVal, color: outOfStockCount > 0 ? '#FF3B30' : '#1D1D1F' }}>
                {outOfStockCount}
              </span>
              <span style={styles.kpiSub}>Immediate replenishment required</span>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>ESTIMATED REORDER BUDGET</span>
              <span style={{ ...styles.kpiVal, color: '#10B981' }}>
                ₹{totalBudgetNeeded.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span style={styles.kpiSub}>Wholesale distributor replenishment cost</span>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>TOTAL STORE SKUS</span>
              <span style={styles.kpiVal}>{products.length}</span>
              <span style={styles.kpiSub}>Tracked inventory items in catalog</span>
            </div>
          </div>

          {/* iOS Segmented Filter Tabs */}
          <div style={styles.segmentedControl}>
            <button
              style={{
                ...styles.segmentedBtn,
                ...(filter === 'all_alerts' ? styles.segmentedBtnActive : {}),
              }}
              onClick={() => setFilter('all_alerts')}
            >
              All Alerts ({reorderItems.length})
            </button>
            <button
              style={{
                ...styles.segmentedBtn,
                ...(filter === 'out_of_stock' ? styles.segmentedBtnActive : {}),
              }}
              onClick={() => setFilter('out_of_stock')}
            >
              Out of Stock ({outOfStockCount})
            </button>
            <button
              style={{
                ...styles.segmentedBtn,
                ...(filter === 'low_stock' ? styles.segmentedBtnActive : {}),
              }}
              onClick={() => setFilter('low_stock')}
            >
              Low Stock ({Math.max(0, reorderItems.length - outOfStockCount)})
            </button>
          </div>

          {/* Reorder Table */}
          <div style={styles.tableCard}>
            <div style={styles.tableHeaderRow}>
              <div>
                <h2 style={styles.tableTitle}>Recommended Wholesale Replenishment</h2>
                <span style={styles.tableSubtitle}>
                  Order batches calculated dynamically based on safety stock threshold margins.
                </span>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '42px', marginBottom: '12px' }}>✨</div>
                <h4 style={{ margin: '0 0 6px 0', color: '#1D1D1F', fontSize: '17px', fontWeight: 700 }}>
                  All Inventory Levels Are Healthy
                </h4>
                <p style={{ margin: 0, color: '#86868B', fontSize: '13px' }}>
                  No items require replenishment for this filter criteria.
                </p>
              </div>
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
                      <th style={styles.th}>WHOLESALE RATE</th>
                      <th style={styles.th}>EST. BUDGET</th>
                      <th style={styles.th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 700, color: '#1D1D1F' }}>{item.name}</td>
                        <td style={{ ...styles.td, color: '#86868B' }}>{item.nameHindi || '—'}</td>
                        <td style={{ ...styles.td, textTransform: 'capitalize' }}>
                          {item.category.replace('-', ' ')}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                              color: item.isOut ? '#FF3B30' : '#FF9500',
                            }}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontVariantNumeric: 'tabular-nums' }}>
                          {item.minStockAlert} {item.unit}
                        </td>
                        <td style={{ ...styles.td, fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                          +{item.suggestedQty} {item.unit}
                        </td>
                        <td style={{ ...styles.td, fontVariantNumeric: 'tabular-nums' }}>₹{item.purchasePrice}</td>
                        <td style={{ ...styles.td, fontWeight: 700, color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>
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
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '48px',
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
    marginBottom: '8px',
  },
  reorderBadge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  criticalBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  healthyBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#86868B',
    marginTop: '6px',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  btnPrimary: {
    backgroundColor: '#1D1D1F',
    color: '#FFFFFF',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: '9999px',
    padding: '12px 22px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
    transition: 'all 0.15s ease',
  },
  loadingState: {
    padding: '80px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderTopColor: '#10B981',
    borderRadius: '50%',
    margin: '0 auto 14px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#86868B',
    margin: 0,
    fontWeight: 500,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: '20px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    letterSpacing: '0.04em',
    marginBottom: '8px',
  },
  kpiVal: {
    fontSize: '30px',
    fontWeight: 800,
    color: '#1D1D1F',
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
    marginBottom: '4px',
  },
  kpiSub: {
    fontSize: '12px',
    color: '#86868B',
    letterSpacing: '-0.01em',
  },
  segmentedControl: {
    display: 'inline-flex',
    backgroundColor: 'rgba(118, 118, 128, 0.1)',
    padding: '4px',
    borderRadius: '12px',
    gap: '4px',
    alignSelf: 'flex-start',
  },
  segmentedBtn: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: '8px',
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#636366',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  segmentedBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#1D1D1F',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)',
  },
  tableHeaderRow: {
    marginBottom: '20px',
  },
  tableTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  tableSubtitle: {
    fontSize: '13px',
    color: '#86868B',
    marginTop: '4px',
    display: 'block',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    letterSpacing: '0.04em',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: '#FBFBFC',
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#1D1D1F',
  },
  outBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    color: '#FF3B30',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
  },
  lowBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    color: '#FF9500',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
  },
  emptyState: {
    padding: '56px 20px',
    textAlign: 'center',
  },
};
