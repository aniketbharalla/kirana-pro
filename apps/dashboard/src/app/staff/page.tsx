'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StaffMember, CounterSession } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreStaff, saveStoreStaff } from '../../lib/storeService';

export default function StaffPage() {
  const { storeId, user, store } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<CounterSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'shifts' | 'directory'>('directory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newStaff, setNewStaff] = useState<{
    name: string;
    phone: string;
    role: 'owner' | 'manager' | 'cashier';
    pin: string;
  }>({
    name: '',
    phone: '',
    role: 'cashier',
    pin: '1234',
  });

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeStoreStaff(storeId, (data) => {
      if (data.length === 0 && user) {
        // Auto provide the store owner
        const ownerMember: StaffMember = {
          id: `staff_${user.uid}`,
          storeId,
          name: user.displayName || 'Store Owner',
          phone: user.phoneNumber || '',
          role: 'owner',
          pin: '0000',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setStaff([ownerMember]);
      } else {
        setStaff(data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [storeId, user, store]);

  const activeCashiersCount = staff.filter((s) => s.isActive && s.role === 'cashier').length;
  const activeShiftsCount = shifts.filter((s) => !s.isClosed).length;

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !newStaff.name) return;
    setSaving(true);

    try {
      const member: StaffMember = {
        id: `staff_${Date.now()}`,
        storeId,
        name: newStaff.name.trim(),
        phone: newStaff.phone.trim(),
        role: newStaff.role,
        pin: newStaff.pin.trim() || '1234',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveStoreStaff(storeId, member);
      setShowAddModal(false);
      setNewStaff({
        name: '',
        phone: '',
        role: 'cashier',
        pin: '1234',
      });
    } catch (err: any) {
      alert(`Failed to add staff member: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.staffBadge}>🧑‍💼 COUNTER AUDIT & PERMISSIONS</span>
            <span style={styles.storeBadge}>{store?.name || 'Store'} Staff</span>
          </div>
          <h1 style={styles.title}>Staff & Cashier Counter Shift Register</h1>
          <p style={styles.subtitle}>
            Monitor cash drawer floats, cashier shift reconciliations, and staff PIN access.
          </p>
        </div>

        {/* Tab switch and Add button */}
        <div style={styles.headerActions}>
          <div style={styles.tabGroup}>
            <button
              style={{ ...styles.tabBtn, ...(viewTab === 'directory' ? styles.tabBtnActive : {}) }}
              onClick={() => setViewTab('directory')}
            >
              👥 Staff Directory ({staff.length})
            </button>
            <button
              style={{ ...styles.tabBtn, ...(viewTab === 'shifts' ? styles.tabBtnActive : {}) }}
              onClick={() => setViewTab('shifts')}
            >
              🏁 Counter Shifts Log ({shifts.length})
            </button>
          </div>

          <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
            ➕ Add Staff Member
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing store team members...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>TOTAL TEAM MEMBERS</span>
              <span style={styles.kpiVal}>{staff.length} Members</span>
              <span style={styles.kpiSub}>Registered in your store directory</span>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>REGISTERED CASHIERS</span>
              <span style={styles.kpiVal}>{activeCashiersCount} Cashiers</span>
              <span style={styles.kpiSub}>4-digit secure PIN enabled</span>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>ACTIVE POS SHIFTS</span>
              <span style={{ ...styles.kpiVal, color: activeShiftsCount > 0 ? '#047857' : '#0F172A' }}>
                {activeShiftsCount} Live
              </span>
              <span style={styles.kpiSub}>Counters currently in operation</span>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>COMPLETED SHIFTS</span>
              <span style={styles.kpiVal}>{shifts.filter((s) => s.isClosed).length} Shifts</span>
              <span style={styles.kpiSub}>Historical drawer audits</span>
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

              {shifts.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏁</div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#0F172A', fontSize: '16px' }}>
                    No Counter Shifts Recorded Yet
                  </h4>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>
                    When cashiers open counters and close their registers from the mobile POS, all shifts will appear here.
                  </p>
                </div>
              ) : (
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
                        const variance =
                          s.variance ??
                          (s.closingCash !== undefined ? s.closingCash - expected : 0);
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
                              {s.closingCash !== undefined
                                ? `₹${s.closingCash.toLocaleString('en-IN')}`
                                : '—'}
                            </td>
                            <td style={styles.td}>
                              {!s.isClosed ? (
                                <span style={{ color: '#94A3B8' }}>Pending Close</span>
                              ) : variance === 0 ? (
                                <span style={styles.matchedBadge}>✓ Matched (₹0)</span>
                              ) : variance < 0 ? (
                                <span style={styles.shortageBadge}>
                                  Shortage -₹{Math.abs(variance)}
                                </span>
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
              )}
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
                          <span style={styles.pinBadge}>•••• {m.pin ? 'PIN Active' : 'No PIN'}</span>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              color: m.isActive ? '#15803D' : '#94A3B8',
                              fontWeight: 700,
                            }}
                          >
                            {m.isActive ? '🟢 Active' : '⚪ Inactive'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>➕ Add Store Staff Member</h2>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name *</label>
                <input
                  required
                  style={styles.input}
                  placeholder="e.g. Ramu Cashier"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Phone Number</label>
                <input
                  style={styles.input}
                  placeholder="e.g. 9811223344"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <select
                  style={styles.input}
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({
                      ...newStaff,
                      role: e.target.value as 'owner' | 'manager' | 'cashier',
                    })
                  }
                >
                  <option value="cashier">Cashier (POS Counter Operations)</option>
                  <option value="manager">Store Manager (Inventory & Purchases)</option>
                  <option value="owner">Store Co-Owner / Partner</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>4-Digit Quick PIN (For Fast POS Login) *</label>
                <input
                  required
                  maxLength={4}
                  style={styles.input}
                  placeholder="e.g. 2580"
                  value={newStaff.pin}
                  onChange={(e) => setNewStaff({ ...newStaff, pin: e.target.value })}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.btnSecondary}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={styles.btnPrimary}>
                  {saving ? 'Saving...' : '💾 Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  staffBadge: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.5px',
    color: '#0891B2',
    backgroundColor: '#ECFEFF',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  storeBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tabGroup: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    padding: '4px',
    borderRadius: '10px',
    gap: '4px',
  },
  tabBtn: {
    border: 'none',
    background: 'none',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontWeight: 700,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  btnPrimary: {
    backgroundColor: '#0891B2',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(8, 145, 178, 0.2)',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    color: '#334155',
    border: '1.5px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
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
    borderTopColor: '#0891B2',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  kpiVal: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: '4px',
  },
  kpiSub: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '24px',
  },
  tableHeaderRow: {
    marginBottom: '18px',
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
    marginTop: '4px',
    display: 'block',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#334155',
  },
  counterBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  matchedBadge: {
    color: '#059669',
    fontWeight: 700,
    fontSize: '12px',
  },
  shortageBadge: {
    color: '#DC2626',
    fontWeight: 700,
    fontSize: '12px',
  },
  surplusBadge: {
    color: '#2563EB',
    fontWeight: 700,
    fontSize: '12px',
  },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 800,
  },
  pinBadge: {
    fontFamily: 'monospace',
    color: '#64748B',
    fontSize: '12px',
  },
  emptyState: {
    padding: '48px 20px',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '28px',
    width: '92%',
    maxWidth: '480px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    border: '1.5px solid #CBD5E1',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
};
