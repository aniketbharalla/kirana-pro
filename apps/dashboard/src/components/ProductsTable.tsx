'use client';

import React, { useState } from 'react';
import { Product, PRODUCT_CATEGORIES } from '@kirana-pro/shared';

export interface ProductsTableProps {
  products: Product[];
  onDeleteProduct?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({ products, onDeleteProduct }) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const filtered = products.filter((p) => {
    if (!p || p.isActive === false) return false;
    if (selectedCat !== 'all' && p.category !== selectedCat) {
      return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
      const matchHindi = p.nameHindi ? p.nameHindi.toLowerCase().includes(q) : false;
      return matchName || matchBarcode || matchHindi;
    }
    return true;
  });

  return (
    <div style={styles.container}>
      {/* MasterX Filter & Search Toolbar */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search products by name, barcode, or Hindi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          style={styles.select}
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
        >
          <option value="all">All Categories ({products.length})</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.nameHindi ? `(${c.nameHindi})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>PRODUCT NAME</th>
              <th style={styles.th}>CATEGORY</th>
              <th style={styles.th}>BARCODE</th>
              <th style={styles.th}>SELLING PRICE</th>
              <th style={styles.th}>PURCHASE PRICE</th>
              <th style={styles.th}>CURRENT STOCK</th>
              <th style={styles.th}>GST</th>
              {onDeleteProduct && <th style={styles.th}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={styles.emptyTd}>
                  No products found matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isOutOfStock = item.currentStock === 0;
                const isLowStock = !isOutOfStock && item.currentStock <= item.minStockAlert;

                let stockBg = '#ECFDF5';
                let stockColor = '#047857';
                let stockBorder = '1px solid rgba(16, 185, 129, 0.2)';
                let stockLabel = `${item.currentStock} ${item.unit}`;

                if (isOutOfStock) {
                  stockBg = '#FEF2F2';
                  stockColor = '#B91C1C';
                  stockBorder = '1px solid rgba(239, 68, 68, 0.2)';
                  stockLabel = `0 ${item.unit} (Out of Stock)`;
                } else if (isLowStock) {
                  stockBg = '#FFFBEB';
                  stockColor = '#B45309';
                  stockBorder = '1px solid rgba(245, 158, 11, 0.25)';
                  stockLabel = `${item.currentStock} ${item.unit} (Low Stock)`;
                }

                return (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.tdName}>
                      <div style={styles.nameBlock}>
                        <div style={styles.mainName}>{item.name}</div>
                        {item.nameHindi && (
                          <div style={styles.hindiName}>{item.nameHindi}</div>
                        )}
                        {item.isLoose && (
                          <span style={styles.looseBadge}>⚖️ Loose (Taraju)</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.catBadge}>{item.category}</span>
                    </td>
                    <td style={styles.td}>
                      {item.barcode ? (
                        <span style={styles.barcodeText}>📷 {item.barcode}</span>
                      ) : (
                        <span style={styles.mutedText}>Manual</span>
                      )}
                    </td>
                    <td style={styles.tdPrice}>
                      ₹{item.sellingPrice}
                      <span style={styles.unitText}>/{item.unit}</span>
                    </td>
                    <td style={styles.tdPurchasePrice}>₹{item.purchasePrice}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.stockBadge,
                          backgroundColor: stockBg,
                          color: stockColor,
                          border: stockBorder,
                        }}
                      >
                        {stockLabel}
                      </span>
                    </td>
                    <td style={styles.tdGst}>{item.gstRate}%</td>
                    {onDeleteProduct && (
                      <td style={styles.td}>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${item.name}" from catalog?`)) {
                              onDeleteProduct(item.id);
                            }
                          }}
                          style={styles.deleteBtn}
                          title="Delete Product"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
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
    fontFamily: 'var(--font-body)',
  },
  filterBar: {
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '8px 14px',
    flex: 1,
    minWidth: '240px',
  },
  searchIcon: {
    marginRight: '8px',
    fontSize: '14px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    fontWeight: 500,
    color: '#0F172A',
  },
  select: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
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
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#334155',
  },
  tdName: {
    padding: '14px 20px',
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  mainName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.01em',
  },
  hindiName: {
    fontSize: '12px',
    color: '#64748B',
  },
  looseBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    border: '1px solid rgba(79, 70, 229, 0.2)',
    padding: '2px 8px',
    borderRadius: '6px',
    marginTop: '4px',
    width: 'fit-content',
  },
  catBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '4px 9px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
  },
  barcodeText: {
    fontSize: '12px',
    color: '#475569',
    fontFamily: 'monospace',
    backgroundColor: '#F8FAFC',
    padding: '2px 6px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
  },
  mutedText: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  tdPrice: {
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: 800,
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
  },
  tdPurchasePrice: {
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
    fontVariantNumeric: 'tabular-nums',
  },
  tdGst: {
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#4F46E5',
  },
  unitText: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
  },
  stockBadge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'inline-block',
    fontVariantNumeric: 'tabular-nums',
  },
  emptyTd: {
    padding: '44px 20px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px',
  },
  deleteBtn: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '6px 10px',
    borderRadius: '8px',
    transition: 'all 0.12s ease',
  },
};
