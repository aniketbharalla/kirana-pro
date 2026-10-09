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
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
    padding: '9px 14px',
    flex: 1,
    minWidth: '280px',
    maxWidth: '460px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
  },
  searchIcon: {
    marginRight: '8px',
    fontSize: '14px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    color: '#1D1D1F',
    backgroundColor: 'transparent',
  },
  filterPills: {
    display: 'flex',
    gap: '6px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: '4px',
    borderRadius: '12px',
  },
  pillBtn: {
    padding: '6px 14px',
    borderRadius: '9px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#636366',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  pillBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#1D1D1F',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    padding: '18px 20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
  },
  kpiLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#86868B',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  kpiVal: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#1D1D1F',
    letterSpacing: '-0.025em',
    fontVariantNumeric: 'tabular-nums',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
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
    padding: '12px 18px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '14px 18px',
    fontSize: '13px',
    color: '#1D1D1F',
  },
  tdInvoice: {
    padding: '14px 18px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#1D1D1F',
    fontVariantNumeric: 'tabular-nums',
  },
  custName: {
    fontWeight: 600,
    color: '#1D1D1F',
  },
  custPhone: {
    fontSize: '11px',
    color: '#86868B',
  },
  counterSale: {
    color: '#A1A1A6',
    fontStyle: 'italic',
  },
  itemsCount: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#555558',
  },
  modeBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeCash: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
  },
  badgeUpi: {
    backgroundColor: 'rgba(0, 113, 227, 0.09)',
    color: '#0071E3',
  },
  badgeCredit: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#DC2626',
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  statusPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
  },
  statusUnpaid: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#D97706',
  },
  viewBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#1D1D1F',
    cursor: 'pointer',
  },
  emptyTd: {
    padding: '44px',
    textAlign: 'center',
    color: '#86868B',
    fontSize: '13px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    maxWidth: '440px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 20px 48px -8px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#86868B',
  },
  receiptPaper: {
    backgroundColor: '#FBFBFC',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '16px',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '12px',
    lineHeight: 1.4,
    color: '#1D1D1F',
  },
  receiptStore: {
    fontSize: '16px',
    fontWeight: 800,
    textAlign: 'center',
  },
  receiptSub: {
    fontSize: '11px',
    color: '#86868B',
    textAlign: 'center',
  },
  receiptDivider: {
    color: '#C7C7CC',
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
    color: '#636366',
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
    borderRadius: '12px',
    padding: '12px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
  },
  dismissBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: '#555558',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 18px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
  },
};
