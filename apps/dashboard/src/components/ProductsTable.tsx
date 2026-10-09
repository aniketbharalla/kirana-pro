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
      {/* Table Header Filter Bar */}
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
                <td colSpan={7} style={styles.emptyTd}>
                  No products found matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isOutOfStock = item.currentStock === 0;
                const isLowStock = !isOutOfStock && item.currentStock <= item.minStockAlert;

                let stockBg = '#ECFDF5';
                let stockColor = '#065F46';
                if (isOutOfStock) {
                  stockBg = '#FEF2F2';
                  stockColor = '#DC2626';
                } else if (isLowStock) {
                  stockBg = '#FFFBEB';
                  stockColor = '#B45309';
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
                    <td style={styles.td}>₹{item.purchasePrice}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.stockBadge,
                          backgroundColor: stockBg,
                          color: stockColor,
                        }}
                      >
                        {item.currentStock} {item.unit}
                        {isLowStock ? ' (Low)' : ''}
                      </span>
                    </td>
                    <td style={styles.td}>{item.gstRate}%</td>
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
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '20px',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  filterBar: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '11px',
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
    color: '#1D1D1F',
  },
  select: {
    backgroundColor: '#FAFAFB',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '11px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555558',
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
    backgroundColor: '#FAFAFB',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  },
  th: {
    padding: '12px 20px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    transition: 'background-color 0.12s',
  },
  td: {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#1D1D1F',
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
    color: '#1D1D1F',
    letterSpacing: '-0.01em',
  },
  hindiName: {
    fontSize: '12px',
    color: '#86868B',
  },
  looseBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    color: '#4F46E5',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: '2px 7px',
    borderRadius: '5px',
    marginTop: '4px',
    width: 'fit-content',
  },
  catBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#555558',
    fontWeight: 600,
  },
  barcodeText: {
    fontSize: '12px',
    color: '#86868B',
    fontFamily: 'monospace',
  },
  mutedText: {
    fontSize: '12px',
    color: '#A1A1A6',
  },
  tdPrice: {
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#1D1D1F',
    fontVariantNumeric: 'tabular-nums',
  },
  unitText: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#86868B',
  },
  stockBadge: {
    padding: '3px 9px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'inline-block',
    fontVariantNumeric: 'tabular-nums',
  },
  emptyTd: {
    padding: '44px 20px',
    textAlign: 'center',
    color: '#86868B',
    fontSize: '13px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    padding: '6px',
    borderRadius: '6px',
  },
};
