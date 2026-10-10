'use client';

import React, { useState } from 'react';
import { Product, PurchaseInvoiceDraft, PurchaseItem } from '@kirana-pro/shared';
import { Package, Plus, Trash2, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react';

interface ReviewInvoiceTableProps {
  draft: PurchaseInvoiceDraft;
  existingProducts?: Product[];
  onConfirm: (finalInvoice: PurchaseInvoiceDraft) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function ReviewInvoiceTable({
  draft,
  existingProducts = [],
  onConfirm,
  onCancel,
  isSaving = false,
}: ReviewInvoiceTableProps) {
  const [supplierName, setSupplierName] = useState(draft.supplierName || 'Wholesaler Agency');
  const [supplierGstin, setSupplierGstin] = useState(draft.supplierGstin || '');
  const [supplierPhone, setSupplierPhone] = useState(draft.supplierPhone || '');
  const [invoiceNo, setInvoiceNo] = useState(draft.invoiceNo || `INV/${Date.now().toString().slice(-4)}`);
  const [items, setItems] = useState<PurchaseItem[]>(draft.items || []);

  // Update item field
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Recalculate logic if rate, grossAmt or totalQty changes
      if (field === 'rate' || field === 'grossAmt') {
        const rate = field === 'rate' ? Number(value) : item.rate;
        const gross = field === 'grossAmt' ? Number(value) : item.grossAmt;
        if (rate > 0 && field === 'grossAmt') {
          // totalQty = Gross / Rate
          item.totalQty = Math.max(1, Math.round(gross / rate));
        } else if (item.totalQty > 0 && field === 'rate') {
          item.grossAmt = Math.round(rate * item.totalQty * 100) / 100;
        }
      } else if (field === 'totalQty') {
        const qty = Number(value);
        if (item.rate > 0) {
          item.grossAmt = Math.round(item.rate * qty * 100) / 100;
        }
      }

      // Recalculate taxes: CGST 2.5%, SGST 2.5%
      const taxable = item.grossAmt - (item.discount || 0);
      item.taxableAmt = Math.max(0, taxable);
      item.cgstRate = item.cgstRate || 2.5;
      item.sgstRate = item.sgstRate || 2.5;
      item.cgstAmt = Math.round(item.taxableAmt * (item.cgstRate / 100) * 100) / 100;
      item.sgstAmt = Math.round(item.taxableAmt * (item.sgstRate / 100) * 100) / 100;
      item.totalAmt = Math.round((item.taxableAmt + item.cgstAmt + item.sgstAmt) * 100) / 100;

      updated[index] = item;
      return updated;
    });
  };

  const handleProductMatch = (index: number, productId: string) => {
    setItems((prev) => {
      const updated = [...prev];
      if (productId === '__new__') {
        updated[index] = {
          ...updated[index],
          productId: undefined,
          isNewProduct: true,
        };
      } else {
        const matched = existingProducts.find((p) => p.id === productId);
        updated[index] = {
          ...updated[index],
          productId,
          productName: matched?.name || updated[index].productName,
          isNewProduct: false,
        };
      }
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    const newItem: PurchaseItem = {
      productName: 'New FMCG Product',
      hsnCode: '19059020',
      quantity: 1,
      totalQty: 24,
      uom: '1PB',
      uomMapped: 'packet',
      rate: 4.25,
      grossAmt: 102.0,
      discount: 0,
      taxableAmt: 102.0,
      cgstRate: 2.5,
      cgstAmt: 2.55,
      sgstRate: 2.5,
      sgstAmt: 2.55,
      totalAmt: 107.1,
      isNewProduct: true,
      confidence: 1,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Totals calculations
  const subtotal = Math.round(items.reduce((s, i) => s + (i.grossAmt || 0), 0) * 100) / 100;
  const totalCGST = Math.round(items.reduce((s, i) => s + (i.cgstAmt || 0), 0) * 100) / 100;
  const totalSGST = Math.round(items.reduce((s, i) => s + (i.sgstAmt || 0), 0) * 100) / 100;
  const totalTax = Math.round((totalCGST + totalSGST) * 100) / 100;
  const netPayable = Math.round((subtotal + totalTax) * 100) / 100;

  const handleSubmit = async () => {
    const finalDraft: PurchaseInvoiceDraft = {
      supplierName,
      supplierGstin,
      supplierPhone,
      invoiceNo,
      items,
      subtotal,
      totalCGST,
      totalSGST,
      netPayable,
      confidence: 0.95,
    };
    await onConfirm(finalDraft);
  };

  return (
    <div style={styles.container}>
      {/* Supplier & Invoice Metadata Header */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Building2 size={18} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle', color: '#7367F0' }} />
            Supplier & Invoice Details
          </h3>
          <span style={styles.badge}>{items.length} Extracted Items</span>
        </div>
        <div style={styles.grid4}>
          <div>
            <label style={styles.label}>Wholesaler Name</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              style={styles.input}
              placeholder="e.g. N R ENTERPRISES"
            />
          </div>
          <div>
            <label style={styles.label}>GSTIN</label>
            <input
              type="text"
              value={supplierGstin}
              onChange={(e) => setSupplierGstin(e.target.value)}
              style={styles.input}
              placeholder="e.g. 23MNQPK665L120"
            />
          </div>
          <div>
            <label style={styles.label}>Phone / Mobile</label>
            <input
              type="text"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              style={styles.input}
              placeholder="e.g. 7415845631"
            />
          </div>
          <div>
            <label style={styles.label}>Invoice Number</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              style={styles.input}
              placeholder="e.g. NR/2026/0442"
            />
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div style={styles.card}>
        <div style={styles.tableHeaderRow}>
          <div>
            <h3 style={styles.cardTitle}>
              <Package size={16} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Line Items & Tax Breakdown
            </h3>
            <p style={styles.tableSubtitle}>
              Formula applied: <code>totalQty = Gross / Rate</code> | CGST 2.5% + SGST 2.5%
            </p>
          </div>
          <button type="button" onClick={handleAddItem} style={styles.addItemBtn}>
            <Plus size={14} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} /> Add Line Item
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>#</th>
                <th style={{ ...styles.th, minWidth: '220px' }}>Product Description</th>
                <th style={{ ...styles.th, minWidth: '160px' }}>Stock Link</th>
                <th style={styles.th}>HSN</th>
                <th style={styles.th}>Pack</th>
                <th style={styles.th}>Rate (₹)</th>
                <th style={styles.th}>Total Qty (Pkt)</th>
                <th style={styles.th}>Gross (₹)</th>
                <th style={styles.th}>CGST (2.5%)</th>
                <th style={styles.th}>SGST (2.5%)</th>
                <th style={styles.th}>Net (₹)</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.tdIndex}>{idx + 1}</td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      style={styles.cellInput}
                    />
                  </td>
                  <td style={styles.td}>
                    <select
                      value={item.productId || '__new__'}
                      onChange={(e) => handleProductMatch(idx, e.target.value)}
                      style={styles.cellSelect}
                    >
                      <option value="__new__">+ New Product (Catalog Entry)</option>
                      {existingProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.currentStock} in stock)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      value={item.hsnCode || ''}
                      onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                      style={{ ...styles.cellInput, width: '75px' }}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      value={item.uom || '1PB'}
                      onChange={(e) => handleItemChange(idx, 'uom', e.target.value)}
                      style={{ ...styles.cellInput, width: '55px' }}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      style={{ ...styles.cellInput, width: '70px', fontWeight: 600 }}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      value={item.totalQty}
                      onChange={(e) => handleItemChange(idx, 'totalQty', e.target.value)}
                      style={{ ...styles.cellInput, width: '65px', fontWeight: 700, color: '#059669' }}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      step="0.01"
                      value={item.grossAmt}
                      onChange={(e) => handleItemChange(idx, 'grossAmt', e.target.value)}
                      style={{ ...styles.cellInput, width: '80px', fontWeight: 600 }}
                    />
                  </td>
                  <td style={styles.td}>
                    <span style={styles.taxBadge}>₹{item.cgstAmt.toFixed(2)}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.taxBadge}>₹{item.sgstAmt.toFixed(2)}</span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700, color: '#0F172A' }}>
                    ₹{item.totalAmt.toFixed(2)}
                  </td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={styles.deleteRowBtn}
                      title="Remove Item"
                    >
                      <Trash2 size={15} color="#EA5455" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Items</span>
          <span style={styles.kpiValue}>{items.length} Items</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Subtotal (Gross)</span>
          <span style={styles.kpiValue}>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>CGST 2.5%</span>
          <span style={styles.kpiValue}>₹{totalCGST.toFixed(2)}</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>SGST 2.5%</span>
          <span style={styles.kpiValue}>₹{totalSGST.toFixed(2)}</span>
        </div>
        <div style={{ ...styles.kpiCard, backgroundColor: '#EDEBFD', borderColor: '#DBDADE' }}>
          <span style={{ ...styles.kpiLabel, color: '#7367F0' }}>Net Payable (Total)</span>
          <span style={{ ...styles.kpiValue, color: '#7367F0', fontSize: '20px' }}>
            ₹{netPayable.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div style={styles.footerRow}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          style={styles.cancelBtn}
        >
          <ArrowLeft size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Cancel / Scan Another
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || items.length === 0}
          style={{
            ...styles.confirmBtn,
            opacity: isSaving || items.length === 0 ? 0.7 : 1,
            cursor: isSaving || items.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving ? (
            'Updating Inventory & Ledger...'
          ) : (
            <>
              <CheckCircle2 size={16} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} /> Confirm & Inward {items.length} Items to Stock
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    fontWeight: 700,
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '999px',
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  tableSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: '4px 0 0 0',
  },
  addItemBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#CBD5E1',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#1E293B',
    cursor: 'pointer',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#F1F5F9',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  theadRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  tdIndex: {
    padding: '10px 12px',
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 600,
  },
  td: {
    padding: '8px 10px',
    verticalAlign: 'middle',
  },
  cellInput: {
    padding: '6px 8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  cellSelect: {
    padding: '6px 8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#0F172A',
    outline: 'none',
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  taxBadge: {
    fontSize: '11px',
    color: '#0369A1',
    backgroundColor: '#F0F9FF',
    padding: '3px 6px',
    borderRadius: '6px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  deleteRowBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '14px',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
  },
  kpiValue: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#CBD5E1',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer',
  },
  confirmBtn: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
    display: 'inline-flex',
    alignItems: 'center',
  },
};
