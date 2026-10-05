'use client';

import React, { useState } from 'react';
import { Invoice } from '@kirana-pro/shared';

export const BillsTable: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = invoices.filter((inv) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer?.name.toLowerCase().includes(q);

    const matchesMode = filterMode === 'all' || inv.paymentMode === filterMode;
    return matchesSearch && matchesMode;
  });

  const totalSales = filtered.reduce((acc, inv) => acc + inv.grandTotal, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.container}>
      {/* Controls Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterPills}>
          {['all', 'cash', 'upi', 'credit'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                ...styles.pillBtn,
                ...(filterMode === mode ? styles.pillBtnActive : {}),
              }}
            >
              {mode === 'all' ? 'All Invoices' : mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>FILTERED INVOICES</span>
          <span style={styles.kpiVal}>{filtered.length} Bills</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>TOTAL BILLED AMOUNT</span>
          <span style={{ ...styles.kpiVal, color: '#10B981' }}>
            ₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Invoices Table */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Invoice #</th>
              <th style={styles.th}>Date & Time</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Items</th>
              <th style={styles.th}>Payment Mode</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Total (₹)</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={styles.emptyTd}>
                  No invoices found matching current filters.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} style={styles.tr}>
                  <td style={styles.tdInvoice}>{inv.invoiceNumber}</td>
                  <td style={styles.td}>
                    {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={styles.td}>
                    {inv.customer?.name ? (
                      <div>
                        <div style={styles.custName}>{inv.customer.name}</div>
                        <div style={styles.custPhone}>{inv.customer.phoneNumber}</div>
                      </div>
                    ) : (
                      <span style={styles.counterSale}>Counter Sale</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.itemsCount}>{inv.items.length} items</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.modeBadge,
                        ...(inv.paymentMode === 'cash'
                          ? styles.badgeCash
                          : inv.paymentMode === 'upi'
                          ? styles.badgeUpi
                          : styles.badgeCredit),
                      }}
                    >
                      {inv.paymentMode.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(inv.paymentStatus === 'paid' ? styles.statusPaid : styles.statusUnpaid),
                      }}
                    >
                      {inv.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                    ₹{inv.grandTotal.toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      style={styles.viewBtn}
                    >
                      View Receipt ➔
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Thermal Receipt Preview Modal */}
      {selectedInvoice && (
        <div style={styles.modalOverlay} onClick={() => setSelectedInvoice(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Thermal Receipt Preview</h3>
              <button
                style={styles.closeBtn}
                onClick={() => setSelectedInvoice(null)}
              >
                ✕
              </button>
            </div>

            {/* 58mm Thermal Print Card */}
            <div style={styles.receiptPaper} id="printable-receipt">
              <div style={styles.receiptStore}>Kirana Pro Dukaan</div>
              <div style={styles.receiptSub}>Main Market, Ward 4</div>
              <div style={styles.receiptDivider}>--------------------------------</div>
              <div style={styles.receiptMeta}>
                <span>Bill: {selectedInvoice.invoiceNumber}</span>
                <span>
                  {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
              {selectedInvoice.customer?.name && (
                <div style={styles.receiptCust}>
                  Cust: {selectedInvoice.customer.name}
                </div>
              )}
              <div style={styles.receiptDivider}>--------------------------------</div>

              <div style={styles.receiptItemsList}>
                {selectedInvoice.items.map((it, idx) => (
                  <div key={idx} style={styles.receiptItemRow}>
                    <div style={{ flex: 1 }}>{it.name}</div>
                    <div style={{ width: '60px', textAlign: 'center' }}>
                      {it.quantity} {it.unit}
                    </div>
                    <div style={{ width: '60px', textAlign: 'right' }}>
                      ₹{it.totalAmount}
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.receiptDivider}>--------------------------------</div>
              <div style={styles.receiptTotalRow}>
                <span>Subtotal:</span>
                <span>₹{selectedInvoice.subtotal}</span>
              </div>
              {selectedInvoice.discountTotal > 0 && (
                <div style={styles.receiptTotalRow}>
                  <span>Discount:</span>
                  <span>-₹{selectedInvoice.discountTotal}</span>
                </div>
              )}
              <div style={styles.receiptGrandRow}>
                <span>GRAND TOTAL:</span>
                <span>₹{selectedInvoice.grandTotal}</span>
              </div>
              <div style={styles.receiptSub}>
                Paid via {selectedInvoice.paymentMode.toUpperCase()}
              </div>
              <div style={styles.receiptDivider}>--------------------------------</div>
              <div style={styles.receiptFooter}>धन्यवाद! फिर पधारें 🙏</div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.printBtn} onClick={handlePrint}>
                🖨️ Print Receipt
              </button>
              <button
                style={styles.dismissBtn}
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #E2E8F0',
    borderRadius: '12px',
    padding: '8px 14px',
    flex: 1,
    minWidth: '280px',
    maxWidth: '460px',
  },
  searchIcon: {
    marginRight: '8px',
    fontSize: '15px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    color: '#0F172A',
  },
  filterPills: {
    display: 'flex',
    gap: '8px',
  },
  pillBtn: {
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  pillBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    color: '#FFFFFF',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  kpiVal: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
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
    padding: '14px 18px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 18px',
    fontSize: '13px',
    color: '#1E293B',
  },
  tdInvoice: {
    padding: '14px 18px',
    fontSize: '13px',
    fontWeight: 800,
    color: '#0F172A',
  },
  custName: {
    fontWeight: 700,
    color: '#0F172A',
  },
  custPhone: {
    fontSize: '11px',
    color: '#64748B',
  },
  counterSale: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  itemsCount: {
    backgroundColor: '#F1F5F9',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  modeBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 800,
  },
  badgeCash: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
  },
  badgeUpi: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
  },
  badgeCredit: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 800,
  },
  statusPaid: {
    backgroundColor: '#ECFDF5',
    color: '#059669',
  },
  statusUnpaid: {
    backgroundColor: '#FFFBEB',
    color: '#B45309',
  },
  viewBtn: {
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
    cursor: 'pointer',
  },
  emptyTd: {
    padding: '40px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '420px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#64748B',
  },
  receiptPaper: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '12px',
    lineHeight: 1.4,
    color: '#0F172A',
  },
  receiptStore: {
    fontSize: '16px',
    fontWeight: 800,
    textAlign: 'center',
  },
  receiptSub: {
    fontSize: '11px',
    color: '#64748B',
    textAlign: 'center',
  },
  receiptDivider: {
    color: '#94A3B8',
    textAlign: 'center',
    margin: '4px 0',
  },
  receiptMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 700,
  },
  receiptCust: {
    fontSize: '11px',
    color: '#475569',
  },
  receiptItemsList: {
    margin: '6px 0',
  },
  receiptItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
  },
  receiptTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  receiptGrandRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: 800,
    margin: '4px 0',
    color: '#059669',
  },
  receiptFooter: {
    textAlign: 'center',
    fontWeight: 700,
    marginTop: '6px',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
  },
  printBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
  dismissBtn: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 18px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
};
