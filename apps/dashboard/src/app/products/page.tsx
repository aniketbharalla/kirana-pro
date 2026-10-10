'use client';

import React, { useState, useEffect } from 'react';
import { ProductsTable } from '../../components/ProductsTable';
import { Product, PRODUCT_CATEGORIES } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  subscribeStoreProducts,
  saveStoreProduct,
  deleteStoreProduct,
  autoDiscoverAndMigrateProducts,
  seedStarterProducts,
} from '../../lib/storeService';
import { Package, RefreshCw, Download, Upload, Plus, Sparkles, X, FileText, FolderOpen, Save, Check } from 'lucide-react';

export default function ProductsPage() {
  const { storeId } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscoveredState] = useState(false);

  // Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Partial<Product>[]>([]);
  const [saving, setSaving] = useState(false);

  // New Product Form State
  const [newProd, setNewProd] = useState({
    name: '',
    nameHindi: '',
    barcode: '',
    category: 'staples-groceries',
    sellingPrice: '',
    purchasePrice: '',
    gstRate: '0',
    unit: 'packet',
    currentStock: '10',
    minStockAlert: '5',
    isLoose: false,
  });

  // Subscribe to real store products in Firestore
  useEffect(() => {
    // Safety fallback: never spin indefinitely
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3500);

    if (!storeId) {
      return () => clearTimeout(safetyTimer);
    }

    const unsubscribe = subscribeStoreProducts(storeId, (data) => {
      setProducts(data);
      setLoading(false);
      clearTimeout(safetyTimer);
    });

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [storeId]);

  // Handle manual product recovery / discovery
  const handleDiscoverExisting = async () => {
    if (!storeId) return;
    setDiscoveredState(true);
    try {
      const found = await autoDiscoverAndMigrateProducts(storeId);
      if (found.length > 0) {
        setProducts(found);
        toast.success('Catalog Discovered', `Linked ${found.length} products to your store successfully.`);
      } else {
        toast.error('No Products Found', 'No existing products found in alternate sessions. You can add items or load standard staples.');
      }
    } catch (err: any) {
      toast.error('Discovery Failed', err.message || 'Error auto-discovering catalog.');
    } finally {
      setDiscoveredState(false);
    }
  };

  // Handle loading 12 standard staples
  const handleSeedStaples = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      const seeded = await seedStarterProducts(storeId);
      setProducts(seeded);
      toast.success('Staples Catalog Loaded', `Added ${seeded.length} top Indian grocery staples to your inventory.`);
    } catch (err: any) {
      toast.error('Seeding Failed', err.message || 'Could not load starter staples.');
    } finally {
      setSaving(false);
    }
  };

  // Export all products as CSV
  const handleExportCsv = () => {
    if (products.length === 0) {
      toast.error('Catalog Empty', 'No products in inventory to export as CSV.');
      return;
    }
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

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const cols = row.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 6) {
            const [
              name,
              nameHindi,
              barcode,
              category,
              purchasePrice,
              sellingPrice,
              gstRate,
              unit,
              currentStock,
              minStockAlert,
            ] = cols;
            if (name) {
              newItems.push({
                name,
                nameHindi: nameHindi || '',
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

  // Confirm CSV Import to Firestore
  const handleConfirmImport = async () => {
    if (parsedPreview.length === 0 || !storeId) return;
    setSaving(true);

    try {
      for (const item of parsedPreview) {
        const product: Product = {
          id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          storeId,
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
        };
        await saveStoreProduct(storeId, product);
      }
      setShowImportModal(false);
      setParsedPreview([]);
      setImportStatus(null);
    } catch (err: any) {
      alert(`Error saving products: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Save Single Product
  const handleSaveSingleProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !newProd.name || !newProd.sellingPrice) return;
    setSaving(true);

    try {
      const sp = parseFloat(newProd.sellingPrice) || 0;
      const pp = parseFloat(newProd.purchasePrice) || 0;
      const stock = parseFloat(newProd.currentStock) || 0;
      const minStock = parseFloat(newProd.minStockAlert) || 5;
      const gst = parseFloat(newProd.gstRate) || 0;

      const product: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        storeId,
        name: newProd.name.trim(),
        nameHindi: newProd.nameHindi.trim() || '',
        barcode: newProd.barcode.trim() || null,
        category: newProd.category as any,
        sellingPrice: sp,
        purchasePrice: pp,
        gstRate: gst,
        unit: newProd.unit as any,
        isLoose: newProd.isLoose || newProd.unit === 'kg' || newProd.unit === 'g',
        pricePerUnit: sp,
        currentStock: stock,
        minStockAlert: minStock,
        imageURL: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveStoreProduct(storeId, product);
      setShowAddModal(false);
      setNewProd({
        name: '',
        nameHindi: '',
        barcode: '',
        category: 'staples-groceries',
        sellingPrice: '',
        purchasePrice: '',
        gstRate: '0',
        unit: 'packet',
        currentStock: '10',
        minStockAlert: '5',
        isLoose: false,
      });
      toast.success('Product Saved', `Item "${product.name}" saved successfully to catalog.`);
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not save product details.');
    } finally {
      setSaving(false);
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (id: string) => {
    if (!storeId) return;
    try {
      await deleteStoreProduct(storeId, id);
      toast.success('Product Removed', 'Item removed from catalog.');
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Could not remove product.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>
              <Package size={12} style={{ marginRight: 4 }} /> CATALOG & MASTER DATA
            </span>
            <span style={styles.countBadge}>{products.length} Products</span>
          </div>
          <h1 style={styles.title}>Products & Catalog Management</h1>
          <p style={styles.subtitle}>
            Live catalog connected to Firebase Firestore. Changes sync instantly with mobile POS.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionsRow}>
          <button
            style={styles.btnSecondary}
            onClick={handleDiscoverExisting}
            disabled={discovering}
            title="Scan for products added in previous demo/cashier sessions or alternate stores and link them to your store"
          >
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            {discovering ? 'Scanning...' : 'Discover Added Products'}
          </button>
          <button style={styles.btnSecondary} onClick={handleExportCsv}>
            <Download size={14} style={{ marginRight: 6 }} /> Export CSV
          </button>
          <button style={styles.btnSecondary} onClick={() => setShowImportModal(true)}>
            <Upload size={14} style={{ marginRight: 6 }} /> Bulk Import CSV
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
            <Plus size={15} style={{ marginRight: 6 }} /> Add Product
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing store catalog from cloud...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>
            <Package size={48} color="#A8AAAE" />
          </div>
          <h3 style={styles.emptyTitle}>No Products In Your Store Catalog</h3>
          <p style={styles.emptySubtitle}>
            Your catalog is currently empty. If you previously added products in demo/cashier mode or another store, click <strong>Discover Added Products</strong> to auto-link them now, or start by loading the starter grocery essentials.
          </p>
          <div style={styles.emptyActions}>
            <button
              style={{ ...styles.btnPrimary, backgroundColor: '#7367F0' }}
              onClick={handleDiscoverExisting}
              disabled={discovering}
            >
              <RefreshCw size={14} style={{ marginRight: 6 }} />
              {discovering ? 'Scanning Stores...' : 'Discover / Recover Added Products'}
            </button>
            <button
              style={{ ...styles.btnSecondary, backgroundColor: '#EDEBFD', borderColor: '#7367F0', color: '#7367F0', fontWeight: 700 }}
              onClick={handleSeedStaples}
              disabled={saving}
            >
              <Sparkles size={14} style={{ marginRight: 6 }} /> Load 12 Indian Kirana Staples (Atta, Dal, Oil, Salt...)
            </button>
            <button style={styles.btnSecondary} onClick={() => setShowAddModal(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Add Single Product
            </button>
            <button style={styles.btnSecondary} onClick={() => setShowImportModal(true)}>
              <Upload size={14} style={{ marginRight: 6 }} /> Upload Inventory CSV
            </button>
          </div>
        </div>
      ) : (
        <ProductsTable products={products} onDeleteProduct={handleDeleteProduct} />
      )}

      {/* Add Single Product Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <Plus size={18} style={{ marginRight: 6 }} /> Add New Product
              </h2>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSingleProduct} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Product Name (English) *</label>
                  <input
                    required
                    style={styles.input}
                    placeholder="e.g. Aashirvaad Atta 5kg"
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Hindi / Local Name (हिंदी)</label>
                  <input
                    style={styles.input}
                    placeholder="e.g. आशीर्वाद आटा 5 किग्रा"
                    value={newProd.nameHindi}
                    onChange={(e) => setNewProd({ ...newProd, nameHindi: e.target.value })}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Barcode / SKU (Optional)</label>
                  <input
                    style={styles.input}
                    placeholder="Scan or type barcode"
                    value={newProd.barcode}
                    onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Category</label>
                  <select
                    style={styles.input}
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.nameHindi ? `(${c.nameHindi})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Selling Price (₹ MRP/Rate) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    style={styles.input}
                    placeholder="e.g. 250"
                    value={newProd.sellingPrice}
                    onChange={(e) => setNewProd({ ...newProd, sellingPrice: e.target.value })}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Purchase / Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    style={styles.input}
                    placeholder="e.g. 210"
                    value={newProd.purchasePrice}
                    onChange={(e) => setNewProd({ ...newProd, purchasePrice: e.target.value })}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Unit</label>
                  <select
                    style={styles.input}
                    value={newProd.unit}
                    onChange={(e) =>
                      setNewProd({
                        ...newProd,
                        unit: e.target.value,
                        isLoose: e.target.value === 'kg' || e.target.value === 'g',
                      })
                    }
                  >
                    <option value="packet">Packet / Pkt</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="litre">Litre (L)</option>
                    <option value="ml">Millilitre (ml)</option>
                    <option value="piece">Piece (Pcs)</option>
                    <option value="box">Box</option>
                  </select>
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Initial Stock Quantity</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={newProd.currentStock}
                    onChange={(e) => setNewProd({ ...newProd, currentStock: e.target.value })}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={newProd.minStockAlert}
                    onChange={(e) => setNewProd({ ...newProd, minStockAlert: e.target.value })}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>GST Slab (%)</label>
                  <select
                    style={styles.input}
                    value={newProd.gstRate}
                    onChange={(e) => setNewProd({ ...newProd, gstRate: e.target.value })}
                  >
                    <option value="0">0% (Exempt / Essential)</option>
                    <option value="5">5% (Edible oils, sugar, tea)</option>
                    <option value="12">12% (Packaged foods, ghee)</option>
                    <option value="18">18% (Biscuits, soap, personal care)</option>
                    <option value="28">28% (Luxury / Aerated)</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.btnSecondary}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={styles.btnPrimary}>
                  <Save size={15} />
                  <span>{saving ? 'Saving...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <Upload size={18} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} /> Bulk Import Inventory via CSV
              </h2>
              <button style={styles.closeBtn} onClick={() => setShowImportModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.importInfo}>
              <p style={styles.importDesc}>
                Upload a CSV spreadsheet with your existing inventory. You can export from Marg ERP,
                Vyapar, or download our clean starter template below.
              </p>
              <button style={styles.btnDownloadTemplate} onClick={handleDownloadTemplate}>
                <FileText size={15} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Download Sample CSV Template
              </button>
            </div>

            <div style={styles.uploadArea}>
              <label style={styles.uploadLabel}>
                <span style={styles.uploadIcon}><FolderOpen size={36} color="#7367F0" /></span>
                <span style={styles.uploadTitle}>Choose CSV file to upload</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {importStatus && <div style={styles.statusBox}>{importStatus}</div>}

            {parsedPreview.length > 0 && (
              <div style={styles.previewBox}>
                <h4 style={styles.previewTitle}>
                  Preview First 3 Items ({parsedPreview.length} total detected):
                </h4>
                <ul style={styles.previewList}>
                  {parsedPreview.slice(0, 3).map((item, idx) => (
                    <li key={idx} style={styles.previewItem}>
                      <strong>{item.name}</strong> - ₹{item.sellingPrice} ({item.unit}) - Stock:{' '}
                      {item.currentStock}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                style={styles.btnSecondary}
                onClick={() => {
                  setShowImportModal(false);
                  setParsedPreview([]);
                  setImportStatus(null);
                }}
              >
                Cancel
              </button>
              <button
                style={styles.btnPrimary}
                disabled={parsedPreview.length === 0 || saving}
                onClick={handleConfirmImport}
              >
                {saving ? 'Importing...' : `Confirm & Save ${parsedPreview.length} Products`}
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
    maxWidth: '1400px',
    margin: '0 auto',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
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
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    color: '#047857',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '3px 9px',
    borderRadius: '999px',
    textTransform: 'uppercase',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: '3px 9px',
    borderRadius: '999px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  subtitle: {
    fontSize: '13px',
    color: '#86868B',
    marginTop: '4px',
    margin: 0,
  },
  actionsRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
    transition: 'all 0.15s ease',
  },
  btnSecondary: {
    backgroundColor: 'rgba(115, 103, 240, 0.08)',
    color: '#7367F0',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(115, 103, 240, 0.2)',
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #DBDADE',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.08)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'rgba(115, 103, 240, 0.15)',
    borderTopColor: '#7367F0',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    color: '#86868B',
    margin: 0,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '20px',
    padding: '64px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#86868B',
    maxWidth: '460px',
    margin: '0 auto 20px',
    lineHeight: 1.5,
  },
  emptyActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    width: '92%',
    maxWidth: '680px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 16px 36px rgba(47, 43, 61, 0.16)',
    border: '1px solid #DBDADE',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#2F2B3D',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#82868B',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '14px',
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6F6B7D',
  },
  input: {
    border: '1px solid #DBDADE',
    borderRadius: '6px',
    padding: '9px 12px',
    fontSize: '13px',
    color: '#2F2B3D',
    outline: 'none',
  },
  importInfo: {
    marginBottom: '16px',
  },
  importDesc: {
    fontSize: '13px',
    color: '#6F6B7D',
    lineHeight: 1.5,
    marginBottom: '10px',
  },
  btnDownloadTemplate: {
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#7367F0',
    cursor: 'pointer',
  },
  uploadArea: {
    border: '2px dashed rgba(115, 103, 240, 0.35)',
    borderRadius: '8px',
    padding: '30px 16px',
    textAlign: 'center',
    backgroundColor: 'rgba(115, 103, 240, 0.04)',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  uploadLabel: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  uploadIcon: {
    fontSize: '28px',
  },
  uploadTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#7367F0',
  },
  statusBox: {
    backgroundColor: '#FAFAFB',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#1D1D1F',
    marginBottom: '14px',
  },
  previewBox: {
    backgroundColor: '#FAFAFB',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },
  previewTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#636366',
    margin: '0 0 8px 0',
  },
  previewList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#1D1D1F',
  },
  previewItem: {
    marginBottom: '4px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
};
