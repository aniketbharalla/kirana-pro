'use client';

import React, { useState } from 'react';
import { StaffMember, CounterSession } from '@kirana-pro/shared';

const MOCK_STAFF: StaffMember[] = [
  {
    id: 'staff_1',
    storeId: 'demo_store_1',
    name: 'Aniket Sharma (Owner)',
    phone: '9876543210',
    role: 'owner',
    pin: '1234',
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'staff_2',
    storeId: 'demo_store_1',
    name: 'Ramu Cashier',
    phone: '9811223344',
    role: 'cashier',
    pin: '2580',
    counterAssigned: 1,
    isActive: true,
    createdAt: '2026-10-02T09:00:00.000Z',
    updatedAt: '2026-10-02T09:00:00.000Z',
  },
  {
    id: 'staff_3',
    storeId: 'demo_store_1',
    name: 'Suresh Kumar',
    phone: '9899887766',
    role: 'cashier',
    pin: '1122',
    counterAssigned: 2,
    isActive: true,
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
  },
  {
    id: 'staff_4',
    storeId: 'demo_store_1',
    name: 'Bablu Store Manager',
    phone: '9711002233',
    role: 'manager',
    pin: '0000',
    isActive: true,
    createdAt: '2026-10-04T11:00:00.000Z',
    updatedAt: '2026-10-04T11:00:00.000Z',
  },
];

const MOCK_SHIFTS: CounterSession[] = [
  {
    id: 'shift_101',
    storeId: 'demo_store_1',
    counterNumber: 1,
    staffId: 'staff_2',
    staffName: 'Ramu Cashier',
    role: 'cashier',
    openingCash: 2000,
    cashSales: 4550,
    upiSales: 5331,
    creditSales: 280,
    totalSales: 10161,
    invoiceCount: 18,
    closingCash: 6550,
    expectedCash: 6550,
    variance: 0,
    isClosed: true,
    openedAt: '2026-10-05T08:00:00.000Z',
    closedAt: '2026-10-05T14:30:00.000Z',
    notes: 'Morning shift tallies perfectly. Bank notes verified.',
  },
  {
    id: 'shift_102',
    storeId: 'demo_store_1',
    counterNumber: 2,
    staffId: 'staff_3',
    staffName: 'Suresh Kumar',
    role: 'cashier',
    openingCash: 1500,
    cashSales: 3820,
    upiSales: 2150,
    creditSales: 0,
    totalSales: 5970,
    invoiceCount: 12,
    closingCash: 5310,
    expectedCash: 5320,
    variance: -10,
    isClosed: true,
    openedAt: '2026-10-05T09:00:00.000Z',
    closedAt: '2026-10-05T15:00:00.000Z',
    notes: '₹10 shortage due to customer coin change rounding.',
  },
  {
    id: 'shift_103',
    storeId: 'demo_store_1',
    counterNumber: 1,
    staffId: 'staff_2',
    staffName: 'Ramu Cashier',
    role: 'cashier',
    openingCash: 2000,
    cashSales: 2356,
    upiSales: 3100,
    creditSales: 0,
    totalSales: 5456,
    invoiceCount: 9,
    expectedCash: 4356,
    isClosed: false,
    openedAt: '2026-10-06T08:00:00.000Z',
    notes: 'Ongoing afternoon counter shift.',
  },
];

export default function StaffPage() {
  const [staff] = useState<StaffMember[]>(MOCK_STAFF);
  const [shifts] = useState<CounterSession[]>(MOCK_SHIFTS);
  const [viewTab, setViewTab] = useState<'shifts' | 'directory'>('shifts');

  const activeCashiersCount = staff.filter((s) => s.isActive && s.role === 'cashier').length;
  const activeShiftsCount = shifts.filter((s) => !s.isClosed).length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.staffBadge}>🧑‍💼 COUNTER AUDIT & PERMISSIONS</span>
            <span style={styles.storeBadge}>Multi-Counter POS Control</span>
          </div>
          <h1 style={styles.title}>Staff & Cashier Counter Shift Register</h1>
          <p style={styles.subtitle}>
            Monitor cash drawer floats, cashier shift reconciliations, and staff PIN access.
          </p>
        </div>

        {/* Tab switch */}
        <div style={styles.tabGroup}>
          <button
            style={{ ...styles.tabBtn, ...(viewTab === 'shifts' ? styles.tabBtnActive : {}) }}
            onClick={() => setViewTab('shifts')}
          >
            🏁 Counter Shifts Log ({shifts.length})
          </button>
          <button
            style={{ ...styles.tabBtn, ...(viewTab === 'directory' ? styles.tabBtnActive : {}) }}
            onClick={() => setViewTab('directory')}
          >
            👥 Staff Directory ({staff.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>ACTIVE POS SHIFTS</span>
          <span style={{ ...styles.kpiVal, color: '#047857' }}>{activeShiftsCount} Live</span>
          <span style={styles.kpiSub}>Counters currently in operation</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>REGISTERED CASHIERS</span>
          <span style={styles.kpiVal}>{activeCashiersCount} Cashiers</span>
          <span style={styles.kpiSub}>4-digit secure PIN enabled</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>DRAWER FLOAT IN GALLA</span>
          <span style={styles.kpiVal}>₹3,500</span>
          <span style={styles.kpiSub}>Opening cash across active counters</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>NET DISCREPANCY AUDIT</span>
          <span style={{ ...styles.kpiVal, color: '#D97706' }}>-₹10</span>
          <span style={styles.kpiSub}>Over last 3 completed shifts</span>
        </div>
      </div>

      {/* VIEW 1: SHIFTS LOG */}
      {viewTab === 'shifts' && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeaderRow}>
            <div>
              <h2 style={styles.tableTitle}>Cashier Shift Settlement Log</h2>
              <span style={styles.tableSubtitle}>
                Audits opening float, recorded cash/UPI sales, expected cash in drawer vs closing physical count.
              </span>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>SHIFT ID</th>
                  <th style={styles.th}>COUNTER</th>
                  <th style={styles.th}>CASHIER</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>OPENING FLOAT</th>
                  <th style={styles.th}>CASH SALES</th>
                  <th style={styles.th}>UPI SALES</th>
                  <th style={styles.th}>EXPECTED IN DRAWER</th>
                  <th style={styles.th}>ACTUAL COUNTED</th>
                  <th style={styles.th}>DISCREPANCY</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => {
                  const expected = s.expectedCash ?? s.openingCash + s.cashSales;
                  const variance = s.variance ?? (s.closingCash !== undefined ? s.closingCash - expected : 0);
                  return (
                    <tr key={s.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{s.id}</td>
                      <td style={styles.td}>
                        <span style={styles.counterBadge}>Counter {s.counterNumber}</span>
                      </td>
                      <td style={styles.td}>{s.staffName}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: !s.isClosed ? '#DCFCE7' : '#F1F5F9',
                            color: !s.isClosed ? '#15803D' : '#475569',
                          }}
                        >
                          {!s.isClosed ? '🟢 Active' : '✓ Closed'}
                        </span>
                      </td>
                      <td style={styles.td}>₹{s.openingCash.toLocaleString('en-IN')}</td>
                      <td style={styles.td}>₹{s.cashSales.toLocaleString('en-IN')}</td>
                      <td style={styles.td}>₹{s.upiSales.toLocaleString('en-IN')}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>
                        ₹{expected.toLocaleString('en-IN')}
                      </td>
                      <td style={styles.td}>
                        {s.closingCash !== undefined ? `₹${s.closingCash.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={styles.td}>
                        {!s.isClosed ? (
                          <span style={{ color: '#94A3B8' }}>Pending Close</span>
                        ) : variance === 0 ? (
                          <span style={styles.matchedBadge}>✓ Matched (₹0)</span>
                        ) : variance < 0 ? (
                          <span style={styles.shortageBadge}>Shortage -₹{Math.abs(variance)}</span>
                        ) : (
                          <span style={styles.surplusBadge}>Surplus +₹{variance}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: STAFF DIRECTORY */}
      {viewTab === 'directory' && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeaderRow}>
            <div>
              <h2 style={styles.tableTitle}>Store Staff & Roles Directory</h2>
              <span style={styles.tableSubtitle}>
                Manage permissions, cashier shift eligibility, and login PINs.
              </span>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>NAME</th>
                  <th style={styles.th}>PHONE NUMBER</th>
                  <th style={styles.th}>ROLE</th>
                  <th style={styles.th}>PIN PROTECTION</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>JOINED DATE</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((m) => (
                  <tr key={m.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{m.name}</td>
                    <td style={styles.td}>{m.phone || '—'}</td>
                    <td style={styles.td}>
                      <span style={styles.roleBadge}>{m.role.toUpperCase()}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.pinBadge}>•••• 4-Digit Set</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: m.isActive ? '#15803D' : '#94A3B8', fontWeight: 700 }}>
                        {m.isActive ? '🟢 Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(m.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
  staffBadge: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  storeBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
  tabGroup: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '4px',
    gap: '4px',
  },
  tabBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748B',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  kpiVal: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    padding: '20px',
    borderBottom: '1px solid #F1F5F9',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  tableSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    backgroundColor: '#F8FAFC',
    color: '#475569',
    fontWeight: 700,
    fontSize: '11px',
    letterSpacing: '0.5px',
    padding: '12px 18px',
    textAlign: 'left',
    borderBottom: '1px solid #E2E8F0',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 18px',
    color: '#334155',
  },
  counterBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '11px',
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '11px',
  },
  matchedBadge: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '11px',
  },
  shortageBadge: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '11px',
  },
  surplusBadge: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '11px',
  },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    color: '#334155',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '11px',
  },
  pinBadge: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '11px',
  },
};
