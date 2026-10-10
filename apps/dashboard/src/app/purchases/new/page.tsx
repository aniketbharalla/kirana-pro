'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, PurchaseInvoice, PurchaseInvoiceDraft, Supplier } from '@kirana-pro/shared';
import { useAuth } from '../../../context/AuthContext';
import { ScanLine, CheckCircle2, FileText, Package, Plus, ArrowLeft, Sparkles } from 'lucide-react';
import {
  subscribeStoreProducts,
  subscribeStoreSuppliers,
  inwardPurchaseInvoiceTransaction,
} from '../../../lib/storeService';
import ReviewInvoiceTable from '../../../components/purchases/ReviewInvoiceTable';

// Dynamic import with SSR disabled for Tesseract WASM OCR
const InvoiceScanner = dynamic(
  () => import('../../../components/purchases/InvoiceScanner'),
  { ssr: false }
);

export default function NewPurchasePage() {
  const router = useRouter();
  const { storeId, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [draft, setDraft] = useState<PurchaseInvoiceDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    invoiceNo: string;
    itemCount: number;
    netPayable: number;
  } | null>(null);

  useEffect(() => {
    if (!storeId) return;
    const unsubProd = subscribeStoreProducts(storeId, (data) => setProducts(data));
    const unsubSupp = subscribeStoreSuppliers(storeId, (data) => setSuppliers(data));
    return () => {
      unsubProd();
      unsubSupp();
    };
  }, [storeId]);

  const handleConfirmInwarding = async (finalDraft: PurchaseInvoiceDraft) => {
    if (!storeId) return;
    try {
      setIsSaving(true);

      // Find or assign supplier
      const matchedSupplier = suppliers.find(
        (s) =>
          s.name.toLowerCase() === (finalDraft.supplierName || '').toLowerCase() ||
          (finalDraft.supplierGstin && s.gstin === finalDraft.supplierGstin)
      );

      const invoiceId = `purch_${Date.now()}`;
      const newInvoice: PurchaseInvoice = {
        id: invoiceId,
        storeId,
        supplierId: matchedSupplier?.id || (suppliers[0]?.id || 'sup_default'),
        supplierName: finalDraft.supplierName || 'Wholesaler Agency',
        invoiceNo: finalDraft.invoiceNo || `INV/${Date.now().toString().slice(-4)}`,
        invoiceDate: Date.now(),
        items: finalDraft.items,
        subtotal: finalDraft.subtotal,
        totalDiscount: 0,
        totalCGST: finalDraft.totalCGST,
        totalSGST: finalDraft.totalSGST,
        totalTax: finalDraft.totalCGST + finalDraft.totalSGST,
        roundOff: 0,
        netPayable: finalDraft.netPayable,
        paymentStatus: 'Unpaid',
        paidAmt: 0,
        createdBy: user?.displayName || 'Store Owner',
        createdAt: Date.now(),
      };

      // Atomic Firestore transaction (updates stock, creates products, records movements & ledger)
      await inwardPurchaseInvoiceTransaction(
        storeId,
        newInvoice,
        user?.displayName || 'Store Owner'
      );

      setSuccessInfo({
        invoiceNo: newInvoice.invoiceNo,
        itemCount: newInvoice.items.length,
        netPayable: newInvoice.netPayable,
      });
      setIsSaving(false);
    } catch (err: any) {
      console.error('Failed to inward purchase invoice:', err);
      setIsSaving(false);
      alert(`Inwarding failed: ${err?.message || 'Check Firestore permissions'}`);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation & Breadcrumbs */}
      <div style={styles.topNav}>
        <Link href="/purchases" style={styles.backLink}>
          <ArrowLeft size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Back to Purchases Ledger
        </Link>
        <div style={styles.breadcrumb}>
          <span>Wholesale</span>
          <span>/</span>
          <span style={{ color: '#2F2B3D', fontWeight: 600 }}>Scan & Inward Bill (OCR)</span>
        </div>
      </div>

      {/* Header Banner */}
      <div style={styles.heroBanner}>
        <div>
          <h1 style={styles.pageTitle}>
            <ScanLine size={22} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} /> Inward Wholesaler Bill (Free WASM OCR)
          </h1>
          <p style={styles.pageDesc}>
            Scan distributor invoices like Parle (N R ENTERPRISES). Auto-calculates quantities from Gross/Rate,
            splits CGST & SGST 2.5%, and updates your store stock atomically.
          </p>
        </div>
        <div style={styles.tagBadge}>
          <Sparkles size={13} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Tesseract WASM • 100% Free Tier
        </div>
      </div>

      {/* Success Banner */}
      {successInfo ? (
        <div style={styles.successCard}>
          <div style={styles.successIcon}>
            <CheckCircle2 size={44} color="#28C76F" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={styles.successTitle}>
              Invoice #{successInfo.invoiceNo} Successfully Inwarded!
            </h2>
            <p style={styles.successDesc}>
              <strong>{successInfo.itemCount} items</strong> have been atomically credited to your inventory.
              Total purchase value: <strong>₹{successInfo.netPayable.toFixed(2)}</strong>.
            </p>
            <div style={styles.successBtnRow}>
              <Link href="/purchases" style={styles.viewLedgerBtn}>
                <FileText size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> View Purchases Ledger
              </Link>
              <Link href="/products" style={styles.viewStockBtn}>
                <Package size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Check Updated Product Stock
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccessInfo(null);
                  setDraft(null);
                }}
                style={styles.scanAnotherBtn}
              >
                <Plus size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Scan Another Bill
              </button>
            </div>
          </div>
        </div>
      ) : !draft ? (
        /* Step 1: OCR Scanner */
        <InvoiceScanner
          existingProducts={products}
          onParsed={(parsedDraft) => setDraft(parsedDraft)}
        />
      ) : (
        /* Step 2: Review & Edit Table */
        <ReviewInvoiceTable
          draft={draft}
          existingProducts={products}
          onConfirm={handleConfirmInwarding}
          onCancel={() => setDraft(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  topNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  backLink: {
    textDecoration: 'none',
    color: '#059669',
    fontSize: '13px',
    fontWeight: 700,
    backgroundColor: '#ECFDF5',
    padding: '6px 14px',
    borderRadius: '8px',
  },
  breadcrumb: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: '#64748B',
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderRadius: '16px',
    padding: '28px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 800,
    margin: '0 0 6px 0',
  },
  pageDesc: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: 0,
    maxWidth: '700px',
    lineHeight: 1.5,
  },
  tagBadge: {
    backgroundColor: '#1E293B',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    color: '#34D399',
    fontSize: '12px',
    fontWeight: 700,
    padding: '8px 14px',
    borderRadius: '10px',
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: '#A7F3D0',
    borderRadius: '16px',
    padding: '32px 24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)',
  },
  successIcon: {
    fontSize: '44px',
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#065F46',
    margin: '0 0 8px 0',
  },
  successDesc: {
    fontSize: '14px',
    color: '#047857',
    margin: '0 0 20px 0',
    lineHeight: 1.5,
  },
  successBtnRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  viewLedgerBtn: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    textDecoration: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  viewStockBtn: {
    backgroundColor: '#FFFFFF',
    color: '#2F2B3D',
    textDecoration: 'none',
    border: '1px solid #DBDADE',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
  },
  scanAnotherBtn: {
    backgroundColor: '#EDEBFD',
    color: '#7367F0',
    border: '1px solid rgba(115, 103, 240, 0.35)',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
};
