'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PurchaseInvoice, PurchaseInvoiceDraft } from '@kirana-pro/shared';
import { BillUploadModal } from '../../components/purchases/BillUploadModal';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeStorePurchases,
  saveStorePurchase,
  subscribeStoreProducts,
  saveStoreProduct,
} from '../../lib/storeService';
import { Product } from '@kirana-pro/shared';

export default function PurchasesPage() {
  const { storeId, user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    const unsubPurchases = subscribeStorePurchases(storeId, (data) => {
      setPurchases(data);
      setLoading(false);
    });
    const unsubProducts = subscribeStoreProducts(storeId, (data) => {
      setProducts(data);
    });
    return () => {
      unsubPurchases();
      unsubProducts();
    };
  }, [storeId]);

  const totalInwarded = purchases.reduce((sum, p) => sum + p.netPayable, 0);
  const totalPending = purchases
    .filter((p) => p.paymentStatus !== 'Paid')
    .reduce((sum, p) => sum + (p.netPayable - p.paidAmt), 0);

  const handleConfirmInwarding = async (draft: PurchaseInvoiceDraft) => {
    if (!storeId) return;
    const newInvoice: PurchaseInvoice = {
      id: `purch_${Date.now()}`,
      storeId,
      supplierId: 'sup_1',
      supplierName: draft.supplierName || 'Wholesaler Agency',
      invoiceNo: draft.invoiceNo || `INV/${Date.now().toString().slice(-4)}`,
      invoiceDate: Date.now(),
      items: draft.items,
      subtotal: draft.subtotal,
      totalDiscount: 0,
      totalCGST: draft.totalCGST,
      totalSGST: draft.totalSGST,
      totalTax: draft.totalCGST + draft.totalSGST,
      roundOff: 0,
      netPayable: draft.netPayable,
      paymentStatus: 'Unpaid',
      paidAmt: 0,
      createdBy: user?.displayName || 'Store Owner',
      createdAt: Date.now(),
    };

    await saveStorePurchase(storeId, newInvoice);

    // Also automatically credit product inventory in stock
    for (const item of draft.items) {
      const match = products.find(
        (p) => p.name.toLowerCase() === item.productName.toLowerCase()
      );
      if (match) {
        await saveStoreProduct(storeId, {
          ...match,
          currentStock: match.currentStock + item.totalQty,
          purchasePrice: item.rate,
        });
      } else {
        await saveStoreProduct(storeId, {
          id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          storeId,
          name: item.productName,
          category: 'other',
          barcode: item.barcode || null,
          sellingPrice: Math.round(item.rate * 1.15),
          purchasePrice: item.rate,
          pricePerUnit: Math.round(item.rate * 1.15),
          gstRate: (item.cgstRate || 2.5) + (item.sgstRate || 2.5),
          unit: item.uomMapped || 'packet',
          currentStock: item.totalQty,
          minStockAlert: 5,
          isLoose: false,
          imageURL: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>📦 INWARD PROCUREMENT</span>
            <span style={styles.countBadge}>{purchases.length} Invoices</span>
          </div>
          <h1 style={styles.title}>Wholesale Purchases & Bill OCR</h1>
          <p style={styles.subtitle}>
            Inward stock from distributor invoices with free OCR line-item extraction.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/purchases/new" style={styles.newScannerLink}>
            ⚡ Inward via OCR (/purchases/new)
          </Link>
          <button style={styles.scanBtn} onClick={() => setIsModalOpen(true)}>
            📷 Quick Upload Modal
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing purchase invoices...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Inwarded Bills</div>
              <div style={styles.statValue}>{purchases.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Inwarded Value</div>
              <div style={{ ...styles.statValue, color: '#0F172A' }}>
                ₹{totalInwarded.toFixed(2)}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Payable to Wholesalers</div>
              <div style={{ ...styles.statValue, color: '#EF4444' }}>
                ₹{totalPending.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Purchases Table or Empty State */}
          {purchases.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>📄</div>
              <h3 style={styles.emptyTitle}>No Purchase Invoices Uploaded Yet</h3>
              <p style={styles.emptySubtitle}>
                Digitize paper invoices from your suppliers and distributors. Line items will be automatically extracted into your inventory.
              </p>
              <button style={styles.scanBtn} onClick={() => setIsModalOpen(true)}>
                📷 Upload First Distributor Bill
              </button>
            </div>
          ) : (
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Bill No</th>
                    <th style={styles.th}>Wholesaler / Agency</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Items Count</th>
                    <th style={styles.th}>Total Tax</th>
                    <th style={styles.th}>Net Payable</th>
                    <th style={styles.th}>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: '700', color: '#059669' }}>
                        {p.invoiceNo}
                      </td>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{p.supplierName}</td>
                      <td style={styles.td}>
                        {new Date(p.invoiceDate).toLocaleDateString('en-IN')}
                      </td>
                      <td style={styles.td}>{p.items.length} items</td>
                      <td style={styles.td}>₹{p.totalTax.toFixed(2)}</td>
                      <td style={{ ...styles.td, fontWeight: '800', color: '#0F172A' }}>
                        ₹{p.netPayable.toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              p.paymentStatus === 'Paid' ? '#ECFDF5' : '#FEF2F2',
                            color:
                              p.paymentStatus === 'Paid' ? '#065F46' : '#991B1B',
                          }}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Bill Upload Modal */}
      <BillUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmInwarding={handleConfirmInwarding}
      />
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
    paddingBottom: '40px',
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
  newScannerLink: {
    backgroundColor: '#1D1D1F',
    color: '#FFFFFF',
    textDecoration: 'none',
    borderRadius: '11px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  scanBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '11px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #E2E8F0',
    borderTopColor: '#059669',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '20px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0F172A',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: '16px',
    padding: '60px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#64748B',
    maxWidth: '460px',
    margin: '0 auto 20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    overflow: 'hidden',
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
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#334155',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
};
