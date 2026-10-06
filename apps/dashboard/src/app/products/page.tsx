'use client';

import React, { useState } from 'react';
import { ProductsTable } from '../../components/ProductsTable';
import { INITIAL_DASHBOARD_PRODUCTS } from '../../lib/mockData';
import { Product } from '@kirana-pro/shared';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_DASHBOARD_PRODUCTS);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Partial<Product>[]>([]);

  // Export all products as CSV
  const handleExportCsv = () => {
    const headers = [
      'Name',
      'Hindi Name',
      'Barcode',
      'Category',
      'Purchase Price',
      'Selling Price',
      'GST Rate',
      'Unit',
      'Current Stock',
      'Min Stock Alert',
    ];

    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.nameHindi || '').replace(/"/g, '""')}"`,
      p.barcode || '',
      p.category,
      p.purchasePrice,
      p.sellingPrice,
      p.gstRate,
      p.unit,
      p.currentStock,
      p.minStockAlert,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kirana_Pro_Catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'Name',
      'Hindi Name',
      'Barcode',
      'Category',
      'Purchase Price',
      'Selling Price',
      'GST Rate',
      'Unit',
      'Current Stock',
      'Min Stock Alert',
    ];
    const sampleRows = [
      [
        '"Haldiram Bhujia 400g"',
        '"हल्दीराम भुजिया"',
        '8901234567890',
        'snacks-namkeen',
        '85',
        '100',
        '12',
        'packet',
        '24',
        '6',
      ],
      [
        '"Loose Moong Dal Chhilka"',
        '"मूंग दाल छिलका"',
        '',
        'pulses-dal',
        '95',
        '120',
        '0',
        'kg',
        '50',
        '10',
      ],
    ];

    const csv = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Kirana_Products_Sample_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setImportStatus('CSV file has no data rows.');
          return;
        }

        const newItems: Partial<Product>[] = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          // Handle quoted fields
          const cols = row.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 6) {
            const [name, nameHindi, barcode, category, purchasePrice, sellingPrice, gstRate, unit, currentStock, minStockAlert] = cols;
            if (name) {
              newItems.push({
                name,
                nameHindi: nameHindi || undefined,
                barcode: barcode || null,
                category: (category as any) || 'other',
                purchasePrice: parseFloat(purchasePrice) || 0,
                sellingPrice: parseFloat(sellingPrice) || 0,
                gstRate: parseFloat(gstRate) || 0,
                unit: (unit as any) || 'packet',
                currentStock: parseFloat(currentStock) || 0,
                minStockAlert: parseFloat(minStockAlert) || 5,
              });
            }
          }
        }

        setParsedPreview(newItems);
        setImportStatus(`Found ${newItems.length} valid products ready to import.`);
      } catch (err: any) {
        setImportStatus(`Error parsing CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;

    const imported: Product[] = parsedPreview.map((item, idx) => ({
      id: `prod_import_${Date.now()}_${idx}`,
      storeId: 'demo_store_1',
      name: item.name || 'Unnamed Product',
      nameHindi: item.nameHindi,
      category: item.category || 'other',
      barcode: item.barcode || null,
      purchasePrice: item.purchasePrice || 0,
      sellingPrice: item.sellingPrice || 0,
      gstRate: item.gstRate || 0,
      unit: item.unit || 'packet',
      isLoose: item.unit === 'kg' || item.unit === 'g',
      pricePerUnit: item.sellingPrice || 0,
      currentStock: item.currentStock || 0,
      minStockAlert: item.minStockAlert || 5,
      imageURL: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setProducts((prev) => [...imported, ...prev]);
    setShowImportModal(false);
    setParsedPreview([]);
    setImportStatus(null);
  };

  return (
    <div style={styles.container}>
      {/* Header with Title and Import/Export Actions */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>📦 CATALOG & MASTER DATA</span>
            <span style={styles.countBadge}>{products.length} Total SKUs</span>
          </div>
          <h1 style={styles.title}>Products & Catalog Management</h1>
          <p style={styles.subtitle}>
            Manage barcoded and loose Taraju items, pricing, margins, and bulk CSV updates.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionsRow}>
          <button style={styles.btnSecondary} onClick={handleExportCsv}>
            📤 Export CSV
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowImportModal(true)}>
            📥 Bulk Import CSV
          </button>
        </div>
      </div>

      <ProductsTable products={products} />

      {/* CSV Import Modal */}
      {showImportModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Bulk Import Products from CSV</h2>
                <p style={styles.modalSub}>
                  Quickly upload 100s of products from distributors or excel spreadsheets.
                </p>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowImportModal(false)}>
                ✕
              </button>
            </div>

            {/* Template Download Box */}
            <div style={styles.templateBox}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                  Need the spreadsheet format?
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                  Download the ready-to-fill sample template with correct column names.
                </p>
              </div>
              <button style={styles.btnOutline} onClick={handleDownloadTemplate}>
                📄 Download Template
              </button>
            </div>

            {/* File Upload Input */}
            <div style={styles.dropzone}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={styles.fileInput}
              />
              <span style={{ fontSize: '32px' }}>📁</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>
                Select or Drop a .CSV file here
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Columns: Name, Hindi Name, Barcode, Category, Purchase Price, Selling Price, GST, Unit, Stock
              </span>
            </div>

            {importStatus && (
              <div style={styles.statusBox}>
                <span>{importStatus}</span>
              </div>
            )}

            {/* Preview Table if parsed */}
            {parsedPreview.length > 0 && (
              <div style={styles.previewContainer}>
                <span style={styles.previewTitle}>
                  Preview of Parsed Items ({parsedPreview.length})
                </span>
                <div style={styles.previewTableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>NAME</th>
                        <th style={styles.th}>CATEGORY</th>
                        <th style={styles.th}>PURCHASE (₹)</th>
                        <th style={styles.th}>SELLING (₹)</th>
                        <th style={styles.th}>UNIT</th>
                        <th style={styles.th}>STOCK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedPreview.slice(0, 5).map((item, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={styles.td}>{item.name}</td>
                          <td style={styles.td}>{item.category}</td>
                          <td style={styles.td}>₹{item.purchasePrice}</td>
                          <td style={styles.td}>₹{item.sellingPrice}</td>
                          <td style={styles.td}>{item.unit}</td>
                          <td style={styles.td}>{item.currentStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedPreview.length > 5 && (
                    <div style={styles.moreRowsNotice}>
                      + {parsedPreview.length - 5} more items will be imported.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button
                style={{
                  ...styles.btnPrimary,
                  opacity: parsedPreview.length === 0 ? 0.5 : 1,
                  cursor: parsedPreview.length === 0 ? 'not-allowed' : 'pointer',
                }}
                disabled={parsedPreview.length === 0}
                onClick={handleConfirmImport}
              >
                ✓ Confirm & Add {parsedPreview.length} Products
              </button>
            </div>
          </div>
        </div>
      )}
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
  badge: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    backgroundColor: '#F1F5F9',
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
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
    cursor: 'pointer',
  },
  btnPrimary: {
    backgroundColor: '#10B981',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 800,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    maxWidth: '650px',
    width: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  modalSub: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
  },
  templateBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnOutline: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155',
    cursor: 'pointer',
  },
  dropzone: {
    border: '2px dashed #CBD5E1',
    borderRadius: '14px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  fileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  statusBox: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  previewTitle: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  previewTableWrapper: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  th: {
    backgroundColor: '#F8FAFC',
    color: '#475569',
    fontWeight: 700,
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '1px solid #E2E8F0',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '8px 12px',
    color: '#334155',
  },
  moreRowsNotice: {
    padding: '8px',
    textAlign: 'center',
    fontSize: '11px',
    color: '#64748B',
    backgroundColor: '#F8FAFC',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
};
