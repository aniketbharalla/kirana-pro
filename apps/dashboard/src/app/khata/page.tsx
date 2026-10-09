'use client';

import React, { useState, useEffect } from 'react';
import { KhataTable } from '../../components/KhataTable';
import { CustomerKhata } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreCustomers, saveStoreCustomer } from '../../lib/storeService';

export default function KhataPage() {
  const { storeId } = useAuth();
  const [customers, setCustomers] = useState<CustomerKhata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newCust, setNewCust] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    initialBalance: '0',
  });

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeStoreCustomers(storeId, (data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [storeId]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !newCust.name || !newCust.phoneNumber) return;
    setSaving(true);

    try {
      const initBal = parseFloat(newCust.initialBalance) || 0;
      const cust: CustomerKhata = {
        id: `cust_${Date.now()}`,
        storeId,
        name: newCust.name.trim(),
        phoneNumber: newCust.phoneNumber.trim(),
        address: newCust.address.trim() || '',
        currentBalance: initBal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveStoreCustomer(storeId, cust);
      setShowAddModal(false);
      setNewCust({
        name: '',
        phoneNumber: '',
        address: '',
        initialBalance: '0',
      });
    } catch (err: any) {
      alert(`Failed to add customer: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>📒 UDHAR LEDGER</span>
            <span style={styles.countBadge}>{customers.length} Accounts</span>
          </div>
          <h1 style={styles.title}>Customer Khata (उधार बहीखाता)</h1>
          <p style={styles.subtitle}>
            Manage regular customer credit balances, payment logs, and recovery reminders
          </p>
        </div>

        <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
          ➕ Add Khata Customer
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Syncing khata ledger from cloud...</p>
        </div>
      ) : customers.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📒</div>
          <h3 style={styles.emptyTitle}>No Khata Customers Yet</h3>
          <p style={styles.emptySubtitle}>
            Add regular customers to keep track of store credits (उधार), partial payments, and WhatsApp reminders.
          </p>
          <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>
            ➕ Add First Khata Account
          </button>
        </div>
      ) : (
        <KhataTable customers={customers} />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>➕ Add Customer to Khata</h2>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomer} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Customer Full Name *</label>
                <input
                  required
                  style={styles.input}
                  placeholder="e.g. Ramesh Sharma (Pandit Ji)"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Mobile Number *</label>
                <input
                  required
                  style={styles.input}
                  placeholder="e.g. 9876543210"
                  value={newCust.phoneNumber}
                  onChange={(e) => setNewCust({ ...newCust, phoneNumber: e.target.value })}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>House Address / Colony</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Near Shiv Mandir, Ward 4"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Opening Due Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  style={styles.input}
                  placeholder="0.00"
                  value={newCust.initialBalance}
                  onChange={(e) => setNewCust({ ...newCust, initialBalance: e.target.value })}
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
                  {saving ? 'Saving...' : '💾 Save Khata Account'}
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
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    color: '#D97706',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: '3px 9px',
    borderRadius: '999px',
    textTransform: 'uppercase',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: '3px 9px',
    borderRadius: '999px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#1D1D1F',
    letterSpacing: '-0.03em',
    margin: 0,
    lineHeight: 1.15,
  },
  subtitle: {
    fontSize: '13px',
    color: '#86868B',
    marginTop: '4px',
    margin: 0,
  },
  btnPrimary: {
    backgroundColor: '#D97706',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '11px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
  },
  btnSecondary: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: '#555558',
    border: 'none',
    borderRadius: '11px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderTopColor: '#D97706',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    color: '#86868B',
    margin: 0,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '20px',
    padding: '64px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#1D1D1F',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#86868B',
    maxWidth: '460px',
    margin: '0 auto 20px',
    lineHeight: 1.5,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '28px',
    width: '92%',
    maxWidth: '480px',
    boxShadow: '0 20px 48px -8px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '19px',
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
    color: '#475569',
  },
  input: {
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#1D1D1F',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
};
