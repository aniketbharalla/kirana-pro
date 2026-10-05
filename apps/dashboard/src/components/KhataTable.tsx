'use client';

import React, { useState } from 'react';
import { CustomerKhata } from '@kirana-pro/shared';

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
          <span style={styles.searchIcon}>🔍</span>
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
          {filterDueOnly ? '✓ Pending Due Only' : 'All Customers'}
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
                      View Ledger ➔
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
                  📞 +91 {activeCustomer.phoneNumber}
                  {activeCustomer.address ? ` • 📍 ${activeCustomer.address}` : ''}
                </div>
              </div>
              <button
                style={styles.closeBtn}
                onClick={() => setActiveCustomer(null)}
              >
                ✕
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
  filterBtn: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    color: '#DC2626',
    fontWeight: 800,
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
  tdName: {
    padding: '14px 18px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '13px',
  },
  dim: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  balanceBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 800,
  },
  balanceDue: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
  },
  balanceClear: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
  },
  actionBtn: {
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
    maxWidth: '460px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  modalSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '4px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#64748B',
  },
  drawerBalance: {
    backgroundColor: '#F8FAFC',
    borderRadius: '14px',
    padding: '16px',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
  },
  drawerBalanceLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  drawerBalanceVal: {
    fontSize: '28px',
    fontWeight: 900,
    marginTop: '4px',
  },
  statementSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statementTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748B',
    margin: '0 0 4px 0',
    textTransform: 'uppercase',
  },
  txRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: '10px 14px',
    borderRadius: '10px',
  },
  txName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
  },
  txSub: {
    fontSize: '11px',
    color: '#64748B',
  },
  closeDrawerBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
  },
};
