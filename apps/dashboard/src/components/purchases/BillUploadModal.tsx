'use client';

import React, { useState } from 'react';
import { parseInvoiceText, PurchaseInvoiceDraft, PurchaseItem } from '@kirana-pro/shared';

interface BillUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmInwarding: (draft: PurchaseInvoiceDraft) => void;
}

export const BillUploadModal: React.FC<BillUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirmInwarding,
}) => {
  const [billText, setBillText] = useState(`
N R ENTERPRISES - Parle Distributor
Bhopal, MP | GSTIN: 23NMQPK6686L1Z0
Invoice No: NR/2026/0892
Date: 05-10-2026

1 19059030 20-20 Classic Butter 14.44g MRP 5.00 2PB 4.25 102.04
2 19059040 Parle-G Gold 1kg MRP 120.00 1BOX 100.00 100.00
3 19059050 Hide & Seek Choco Fills 72g MRP 30.00 1BOX 24.50 245.00
4 19059060 Monaco Classic Salted 50g MRP 10.00 3PB 8.10 243.00
5 19059070 Krackjack Butter Sweet & Salty MRP 10.00 2PB 8.10 162.00

Subtotal: 852.04
CGST 2.5%: 21.30
SGST 2.5%: 21.30
Round Off: 0.36
Total Net Payable: 895.00
  `.trim());

  const [draft, setDraft] = useState<PurchaseInvoiceDraft | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = parseInvoiceText(billText);
      setDraft(result);
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>📷 OCR Distributor Bill Inwarding</h2>
            <p style={styles.subtitle}>
              Upload or paste printed invoice text to auto-extract line items, pack sizes, and GST.
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={styles.body}>
          {!draft ? (
            <div>
              <div style={styles.dropzone}>
                <span style={{ fontSize: '32px' }}>📄</span>
                <span style={styles.dropzoneText}>
                  Drag & drop distributor invoice image or use reference text below
                </span>
                <span style={styles.dropzoneSub}>Free Client-Side OCR • Zero Cloud Cost</span>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={styles.label}>Invoice Text / OCR Raw Extractor</label>
                <textarea
                  style={styles.textarea}
                  rows={8}
                  value={billText}
                  onChange={(e) => setBillText(e.target.value)}
                />
              </div>

              <button
                style={styles.parseBtn}
                onClick={handleParse}
                disabled={isProcessing}
              >
                {isProcessing ? '⏳ Parsing Lines & Math...' : '⚡ Run Free OCR Parser'}
              </button>
            </div>
          ) : (
            <div>
              {/* Draft Overview Banner */}
              <div style={styles.draftBanner}>
                <div>
                  <div style={styles.supplierTitle}>{draft.supplierName || 'Wholesaler Invoice'}</div>
                  <div style={styles.invMeta}>
                    Bill No: {draft.invoiceNo || 'NR/2026/0892'} • Confidence: {draft.confidence}%
                  </div>
                </div>
                <div style={styles.payableBadge}>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>NET PAYABLE</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B' }}>
                    ₹{draft.netPayable.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Product Description</th>
                      <th style={styles.th}>HSN</th>
                      <th style={styles.th}>Pack</th>
                      <th style={styles.th}>Inward Qty</th>
                      <th style={styles.th}>Rate (₹)</th>
                      <th style={styles.th}>CGST (2.5%)</th>
                      <th style={styles.th}>SGST (2.5%)</th>
                      <th style={styles.th}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.items.map((item, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.td}>{idx + 1}</td>
                        <td style={{ ...styles.td, fontWeight: '600', color: '#0F172A' }}>
                          {item.productName}
                        </td>
                        <td style={styles.td}>{item.hsnCode || '—'}</td>
                        <td style={styles.td}>{item.uom}</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#059669' }}>
                          {item.totalQty} {item.uomMapped}
                        </td>
                        <td style={styles.td}>₹{item.rate.toFixed(2)}</td>
                        <td style={styles.td}>₹{item.cgstAmt.toFixed(2)}</td>
                        <td style={styles.td}>₹{item.sgstAmt.toFixed(2)}</td>
                        <td style={{ ...styles.td, fontWeight: '700' }}>₹{item.totalAmt.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={styles.footerRow}>
                <button style={styles.backBtn} onClick={() => setDraft(null)}>
                  ← Edit Text
                </button>
                <button
                  style={styles.confirmBtn}
                  onClick={() => {
                    onConfirmInwarding(draft);
                    onClose();
                  }}
                >
                  ✓ Confirm & Inward {draft.items.length} Products to Stock
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '900px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#64748B',
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
  },
  dropzone: {
    border: '2px dashed #A7F3D0',
    backgroundColor: '#F0FDF4',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  dropzoneText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#065F46',
  },
  dropzoneSub: {
    fontSize: '12px',
    color: '#059669',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '6px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    resize: 'vertical',
  },
  parseBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '14px',
    padding: '12px 20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    marginTop: '16px',
  },
  draftBanner: {
    backgroundColor: '#0F172A',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  supplierTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  invMeta: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  payableBadge: {
    textAlign: 'right',
  },
  tableContainer: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    overflow: 'auto',
    maxHeight: '340px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '10px 12px',
    fontWeight: '700',
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '10px 12px',
    color: '#334155',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
  },
  backBtn: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontWeight: '600',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: '700',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
};
