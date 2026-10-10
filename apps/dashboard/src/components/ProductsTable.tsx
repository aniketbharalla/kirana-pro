'use client';

import React, { useState } from 'react';
import { Product, PRODUCT_CATEGORIES } from '@kirana-pro/shared';
import { Search, Scale, Barcode, Trash2 } from 'lucide-react';

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
          <Search size={16} color="#A8AAAE" style={{ marginRight: '8px' }} />
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

                let stockBg = '#DDF6E8';
                let stockColor = '#28C76F';
                let stockLabel = `${item.currentStock} ${item.unit}`;

                if (isOutOfStock) {
                  stockBg = '#FCE4E4';
                  stockColor = '#EA5455';
                  stockLabel = `0 ${item.unit} (Out)`;
                } else if (isLowStock) {
                  stockBg = '#FFF1E3';
                  stockColor = '#FF9F43';
                  stockLabel = `${item.currentStock} ${item.unit} (Low)`;
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
                          <span style={styles.looseBadge}>
                            <Scale size={11} color="#7367F0" />
                            <span>Loose (Taraju)</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.catBadge}>{item.category}</span>
                    </td>
                    <td style={styles.td}>
                      {item.barcode ? (
                        <span style={styles.barcodeText}>
                          <Barcode size={13} color="#6F6B7D" />
                          <span>{item.barcode}</span>
                        </span>
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
                        }}
                      >
                        ● {stockLabel}
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
                          <Trash2 size={14} color="#EA5455" />
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
    border: '1px solid #DBDADE',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.05)',
    overflow: 'hidden',
    fontFamily: 'var(--font-body)',
  },
  filterBar: {
    padding: '14px 18px',
    borderBottom: '1px solid #DBDADE',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '8px',
    padding: '7px 12px',
    flex: 1,
    minWidth: '240px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    fontWeight: 500,
    color: '#2F2B3D',
  },
  select: {
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#4B465C',
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
    backgroundColor: '#F8F7FA',
    borderBottom: '1px solid #DBDADE',
  },
  th: {
    padding: '12px 18px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#6F6B7D',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #F1F0F5',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '12px 18px',
    fontSize: '13px',
    color: '#4B465C',
  },
  tdName: {
    padding: '12px 18px',
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  mainName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2B3D',
    letterSpacing: '-0.01em',
  },
  hindiName: {
    fontSize: '12px',
    color: '#A8AAAE',
  },
  looseBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#7367F0',
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.2)',
    padding: '2px 7px',
    borderRadius: '4px',
    marginTop: '3px',
    width: 'fit-content',
  },
  catBadge: {
    backgroundColor: '#F1F0F5',
    color: '#6F6B7D',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
  },
  barcodeText: {
    fontSize: '12px',
    color: '#6F6B7D',
    fontFamily: 'monospace',
    backgroundColor: '#F8F7FA',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid #DBDADE',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  mutedText: {
    fontSize: '12px',
    color: '#A8AAAE',
  },
  tdPrice: {
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#2F2B3D',
    fontVariantNumeric: 'tabular-nums',
  },
  tdPurchasePrice: {
    padding: '12px 18px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#6F6B7D',
    fontVariantNumeric: 'tabular-nums',
  },
  tdGst: {
    padding: '12px 18px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#7367F0',
  },
  unitText: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#A8AAAE',
  },
  stockBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'inline-block',
    fontVariantNumeric: 'tabular-nums',
  },
  emptyTd: {
    padding: '40px 18px',
    textAlign: 'center',
    color: '#A8AAAE',
    fontSize: '13px',
  },
  deleteBtn: {
    background: '#FCE4E4',
    border: '1px solid rgba(234, 84, 85, 0.25)',
    cursor: 'pointer',
    padding: '5px 8px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.12s ease',
  },
};
