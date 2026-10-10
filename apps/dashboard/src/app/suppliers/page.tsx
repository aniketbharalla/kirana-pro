'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreSuppliers, saveStoreSupplier } from '../../lib/storeService';
import { Building2, Plus, X, Search, Phone, Save } from 'lucide-react';

export default function SuppliersPage() {
  const { storeId } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newSup, setNewSup] = useState<{
    name: string;
    phone: string;
    gstin: string;
    type: 'Wholesaler' | 'Distributor' | 'Direct';
    balance: string;
  }>({
    name: '',
    phone: '',
    gstin: '',
    type: 'Distributor',
    balance: '0',
  });

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeStoreSuppliers(storeId, (data) => {
      setSuppliers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [storeId]);

  const totalBalance = suppliers.reduce((sum, s) => sum + s.balance, 0);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !newSup.name || !newSup.phone) return;
    setSaving(true);

    try {
      const bal = parseFloat(newSup.balance) || 0;
      const supplier: Supplier = {
        id: `sup_${Date.now()}`,
        storeId,
        name: newSup.name.trim(),
        phone: newSup.phone.trim(),
        gstin: newSup.gstin.trim() || '',
        type: newSup.type,
        totalPurchases: 0,
        totalPaid: 0,
        balance: bal,
        invoiceCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveStoreSupplier(storeId, supplier);
      setShowAddModal(false);
      setNewSup({
        name: '',
        phone: '',
        gstin: '',
        type: 'Distributor',
        balance: '0',
      });
    } catch (err: any) {
      alert(`Failed to save supplier: ${err.message}`);
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
            <span style={styles.badge}>VENDOR DIRECTORY</span>
            <span style={styles.countBadge}>{suppliers.length} Vendors</span>
          </div>
          <h1 style={styles.title}>Wholesalers & Mandi Distributors</h1>
          <p style={styles.subtitle}>
            Manage your suppliers, vendor credit balances, and contacts.
          </p>
        </div>

        <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
          <Plus size={15} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Add New Supplier
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing supplier accounts...</p>
        </div>
      ) : (
        <>
          {/* Top Banner */}
          <div style={styles.banner}>
            <div>
              <div style={styles.bannerLabel}>Total Pending Payable to Wholesalers</div>
              <div style={styles.bannerAmount}>₹{totalBalance.toFixed(2)}</div>
            </div>
            <div style={styles.searchBox}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#6F6B7D" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  style={{ ...styles.searchInput, paddingLeft: '34px' }}
                  placeholder="Search wholesaler name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table or Empty State */}
          {suppliers.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '12px', backgroundColor: '#EDEBFD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={28} color="#7367F0" />
                </div>
              </div>
              <h3 style={styles.emptyTitle}>No Suppliers Added Yet</h3>
              <p style={styles.emptySubtitle}>
                Add your wholesale mandi distributors and company sales reps to track pending ledger dues and inward billing history.
              </p>
              <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
                <Plus size={15} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Add First Wholesaler
              </button>
            </div>
          ) : (
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Wholesaler Name</th>
                    <th style={styles.th}>Contact Phone</th>
                    <th style={styles.th}>GSTIN</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Total Invoices</th>
                    <th style={styles.th}>Total Purchased</th>
                    <th style={styles.th}>Pending Due (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '36px' }}>
                        No suppliers matching &quot;{search}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#0F172A' }}>
                          {s.name}
                        </td>
                        <td style={styles.td}>
                          <Phone size={13} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle', color: '#6F6B7D' }} />
                          {s.phone}
                        </td>
                        <td style={{ ...styles.td, fontFamily: 'monospace' }}>
                          {s.gstin || '—'}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.typeBadge}>{s.type}</span>
                        </td>
                        <td style={styles.td}>{s.invoiceCount} bills</td>
                        <td style={styles.td}>₹{s.totalPurchases.toFixed(2)}</td>
                        <td
                          style={{
                            ...styles.td,
                            fontWeight: '800',
                            color: s.balance > 0 ? '#EF4444' : '#059669',
                          }}
                        >
                          ₹{s.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <Building2 size={18} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} /> Add Wholesaler / Distributor
              </h2>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Agency / Business Name *</label>
                <input
                  required
                  style={styles.input}
                  placeholder="e.g. N R ENTERPRISES (Parle Distributor)"
                  value={newSup.name}
                  onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Contact Phone Number *</label>
                <input
                  required
                  style={styles.input}
                  placeholder="e.g. 9826012345"
                  value={newSup.phone}
                  onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>GSTIN (Optional)</label>
                <input
                  style={styles.input}
                  placeholder="e.g. 23NMQPK6686L1Z0"
                  value={newSup.gstin}
                  onChange={(e) => setNewSup({ ...newSup, gstin: e.target.value })}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Vendor Category</label>
                <select
                  style={styles.input}
                  value={newSup.type}
                  onChange={(e) =>
                    setNewSup({
                      ...newSup,
                      type: e.target.value as 'Wholesaler' | 'Distributor' | 'Direct',
                    })
                  }
                >
                  <option value="Distributor">Authorized FMCG Distributor</option>
                  <option value="Wholesaler">Mandi Grain Wholesaler</option>
                  <option value="Direct">Direct Farm / Local Dealer</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Opening Pending Payable Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  style={styles.input}
                  placeholder="0.00"
                  value={newSup.balance}
                  onChange={(e) => setNewSup({ ...newSup, balance: e.target.value })}
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
                  <Save size={15} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
                  {saving ? 'Saving...' : 'Save Vendor'}
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
  badge: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.5px',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  countBadge: {
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
  btnPrimary: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    color: '#2F2B3D',
    border: '1px solid #DBDADE',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #DBDADE',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #EDEBFD',
    borderTopColor: '#7367F0',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#6F6B7D',
    margin: 0,
  },
  banner: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DBDADE',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    boxShadow: '0 2px 4px rgba(165, 163, 174, 0.1)',
  },
  bannerLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#6F6B7D',
  },
  bannerAmount: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#EA5455',
  },
  searchBox: {
    width: '320px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #DBDADE',
    fontSize: '13px',
    color: '#2F2B3D',
    outline: 'none',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DBDADE',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(165, 163, 174, 0.1)',
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
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#334155',
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: '16px',
    padding: '60px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#64748B',
    maxWidth: '460px',
    margin: '0 auto 20px',
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
