'use client';

import React, { useState } from 'react';
import { PurchaseInvoice, PurchaseInvoiceDraft } from '@kirana-pro/shared';
import { BillUploadModal } from '../../components/purchases/BillUploadModal';

const STARTER_PURCHASES: PurchaseInvoice[] = [
  {
    id: 'purch_01',
    storeId: 'demo_store_1',
    supplierId: 'sup_1',
    supplierName: 'N R ENTERPRISES (Parle Distributor)',
    invoiceNo: 'NR/2026/0892',
    invoiceDate: 1728120000000,
    items: [
      {
        productId: 'prod_1',
        productName: '20-20 Classic Butter 14.44g',
        quantity: 2,
        totalQty: 24,
        uom: 'PB',
        uomMapped: 'packet',
        rate: 4.25,
        grossAmt: 102.04,
        discount: 0,
        taxableAmt: 102.04,
        cgstRate: 2.5,
        cgstAmt: 2.55,
        sgstRate: 2.5,
        sgstAmt: 2.55,
        totalAmt: 107.14,
        isNewProduct: false,
        confidence: 90,
      },
      {
        productId: 'prod_2',
        productName: 'Parle-G Gold 1kg',
        quantity: 1,
        totalQty: 1,
        uom: 'BOX',
        uomMapped: 'box',
        rate: 100,
        grossAmt: 100,
        discount: 0,
        taxableAmt: 100,
        cgstRate: 2.5,
        cgstAmt: 2.5,
        sgstRate: 2.5,
        sgstAmt: 2.5,
        totalAmt: 105,
        isNewProduct: false,
        confidence: 95,
      },
    ],
    subtotal: 202.04,
    totalDiscount: 0,
    totalCGST: 5.05,
    totalSGST: 5.05,
    totalTax: 10.1,
    roundOff: 0,
    netPayable: 212.14,
    paymentStatus: 'Unpaid',
    paidAmt: 0,
    createdBy: 'owner',
    createdAt: 1728120000000,
  },
];

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(STARTER_PURCHASES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalInwarded = purchases.reduce((sum, p) => sum + p.netPayable, 0);
  const totalPending = purchases
    .filter((p) => p.paymentStatus !== 'Paid')
    .reduce((sum, p) => sum + (p.netPayable - p.paidAmt), 0);

  const handleConfirmInwarding = (draft: PurchaseInvoiceDraft) => {
    const newInvoice: PurchaseInvoice = {
      id: `purch_${Date.now()}`,
      storeId: 'demo_store_1',
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
      createdBy: 'owner',
      createdAt: Date.now(),
    };
    setPurchases([newInvoice, ...purchases]);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Wholesale Purchases & Bill OCR</h1>
          <p style={styles.subtitle}>
            Inward stock from distributor invoices with free OCR line-item extraction.
          </p>
        </div>
        <button style={styles.scanBtn} onClick={() => setIsModalOpen(true)}>
          📷 Scan / Upload Distributor Bill
        </button>
      </div>

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

      {/* Purchases Table */}
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
    padding: '32px',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
  },
  scanBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '14px',
    padding: '12px 20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #E2E8F0',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0F172A',
    marginTop: '6px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '12px 16px',
    fontWeight: '700',
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 16px',
    color: '#334155',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
};
