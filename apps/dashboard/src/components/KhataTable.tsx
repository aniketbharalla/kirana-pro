'use client';

import React, { useState } from 'react';
import { CustomerKhata } from '@kirana-pro/shared';
import { Search, ArrowRight, Phone, MapPin, X, Check } from 'lucide-react';

export const KhataTable: React.FC<{ customers: CustomerKhata[] }> = ({ customers }) => {
  const [search, setSearch] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<CustomerKhata | null>(null);

  const filtered = customers.filter((cust) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      cust.name.toLowerCase().includes(q) ||
      cust.phoneNumber.includes(q) ||
      (cust.address && cust.address.toLowerCase().includes(q));

    const matchesDue = !filterDueOnly || cust.currentBalance > 0;
    return matchesSearch && matchesDue;
  });

  const totalMarketUdhar = customers.reduce(
    (acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0),
    0
  );

  return (
    <div style={styles.container}>
      {/* Search and Filter */}
      <div style={styles.controlsBar}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#6F6B7D" style={{ marginRight: 8 }} />
          <input
            type="text"
            placeholder="Search customer by name, mobile, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <button
          onClick={() => setFilterDueOnly(!filterDueOnly)}
          style={{
            ...styles.filterBtn,
            ...(filterDueOnly ? styles.filterBtnActive : {}),
          }}
        >
          {filterDueOnly ? (
            <>
              <Check size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Pending Due Only
            </>
          ) : (
            'All Customers'
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>TOTAL MARKET UDHAR (कुल उधारी)</span>
          <span style={{ ...styles.kpiVal, color: '#DC2626' }}>
            ₹{totalMarketUdhar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>ACTIVE KHATA CUSTOMERS</span>
          <span style={styles.kpiVal}>{customers.length} Accounts</span>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Customer Name</th>
              <th style={styles.th}>Mobile Phone</th>
              <th style={styles.th}>Address / Area</th>
              <th style={styles.th}>Joined Date</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Pending Balance (₹)</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.emptyTd}>
                  No customer khata accounts found.
                </td>
              </tr>
            ) : (
              filtered.map((cust) => (
                <tr key={cust.id} style={styles.tr}>
                  <td style={styles.tdName}>
                    <div style={styles.nameRow}>
                      <div style={styles.avatar}>
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div>{cust.name}</div>
                    </div>
                  </td>
                  <td style={styles.td}>+91 {cust.phoneNumber}</td>
                  <td style={styles.td}>
                    {cust.address ? cust.address : <span style={styles.dim}>Not specified</span>}
                  </td>
                  <td style={styles.td}>
                    {new Date(cust.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <span
                      style={{
                        ...styles.balanceBadge,
                        ...(cust.currentBalance > 0
                          ? styles.balanceDue
                          : styles.balanceClear),
                      }}
                    >
                      {cust.currentBalance > 0
                        ? `₹${cust.currentBalance.toFixed(2)} Due`
                        : 'All Clear (₹0)'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button
                      onClick={() => setActiveCustomer(cust)}
                      style={styles.actionBtn}
                    >
                      View Ledger <ArrowRight size={13} style={{ marginLeft: 4 }} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Ledger Drawer Modal */}
      {activeCustomer && (
        <div style={styles.modalOverlay} onClick={() => setActiveCustomer(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{activeCustomer.name}</h3>
                <div style={styles.modalSub}>
                  <Phone size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> +91 {activeCustomer.phoneNumber}
                  {activeCustomer.address ? (
                    <>
                      {' • '}
                      <MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {activeCustomer.address}
                    </>
                  ) : ''}
                </div>
              </div>
              <button
                style={styles.closeBtn}
                onClick={() => setActiveCustomer(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={styles.drawerBalance}>
              <div style={styles.drawerBalanceLabel}>CURRENT DUE BALANCE</div>
              <div
                style={{
                  ...styles.drawerBalanceVal,
                  color: activeCustomer.currentBalance > 0 ? '#DC2626' : '#059669',
                }}
              >
                ₹{activeCustomer.currentBalance.toFixed(2)}
              </div>
            </div>

            <div style={styles.statementSection}>
              <h4 style={styles.statementTitle}>Recent Ledger Transactions</h4>
              <div style={styles.txRow}>
                <div>
                  <div style={styles.txName}>Opening Account Balance</div>
                  <div style={styles.txSub}>Joined Kirana Pro Khata</div>
                </div>
                <div style={{ fontWeight: 700, color: '#64748B' }}>₹0.00</div>
              </div>

              {activeCustomer.currentBalance > 0 && (
                <div style={styles.txRow}>
                  <div>
                    <div style={styles.txName}>Store Purchase on Udhar</div>
                    <div style={styles.txSub}>Counter bill</div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#DC2626' }}>
                    +₹{activeCustomer.currentBalance.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <button
              style={styles.closeDrawerBtn}
              onClick={() => setActiveCustomer(null)}
            >
              Done
            </button>
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
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: '#555558',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#DC2626',
    fontWeight: 700,
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
  tdName: {
    padding: '14px 18px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#1D1D1F',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EDEBFD',
    color: '#7367F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '12px',
  },
  dim: {
    color: '#A1A1A6',
    fontStyle: 'italic',
  },
  balanceBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  balanceDue: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#DC2626',
  },
  balanceClear: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
  },
  actionBtn: {
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
    maxWidth: '460px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 20px 48px -8px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: '19px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  modalSub: {
    fontSize: '12px',
    color: '#86868B',
    marginTop: '4px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#86868B',
  },
  drawerBalance: {
    backgroundColor: '#FBFBFC',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'center',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },
  drawerBalanceLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  drawerBalanceVal: {
    fontSize: '30px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
    marginTop: '4px',
  },
  statementSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statementTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    margin: '0 0 4px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  txRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.04)',
  },
  txName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1D1D1F',
  },
  txSub: {
    fontSize: '11px',
    color: '#86868B',
  },
  closeDrawerBtn: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
  },
};
