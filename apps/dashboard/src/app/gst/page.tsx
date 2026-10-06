'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  generateGSTTaxSummary,
  generateGSTR1JSON,
  exportGSTReportCSV,
  isValidGSTIN,
  Invoice,
} from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreInvoices } from '../../lib/storeService';

export default function GSTCenterPage() {
  const { store, storeId } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [activeTab, setActiveTab] = useState<'b2b' | 'b2c' | 'hsn' | 'json'>('b2b');

  const storeGstin = store?.gstNumber || 'Unregistered / Composition';
  const fp = `${selectedMonth}${selectedYear}`;

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeStoreInvoices(storeId, (data) => {
      setInvoices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [storeId]);

  // Filter invoices by month
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const d = new Date(inv.createdAt);
      return (
        String(d.getMonth() + 1).padStart(2, '0') === selectedMonth &&
        String(d.getFullYear()) === selectedYear
      );
    });
  }, [invoices, selectedMonth, selectedYear]);

  // Generate GST Tax Summary
  const gstSummary = useMemo(() => {
    return generateGSTTaxSummary(filteredInvoices, `Month ${selectedMonth}/${selectedYear}`);
  }, [filteredInvoices, selectedMonth, selectedYear]);

  // Filter B2B Invoices
  const b2bInvoices = useMemo(() => {
    return filteredInvoices.filter((inv) =>
      Boolean(inv.isB2B || (inv.customerGstin && isValidGSTIN(inv.customerGstin)))
    );
  }, [filteredInvoices]);

  // Generate Official GSTR-1 JSON
  const gstr1Json = useMemo(() => {
    return generateGSTR1JSON(
      { gstin: store?.gstNumber || '07AAAAA0000A1Z5', stateCode: '07' },
      filteredInvoices,
      fp
    );
  }, [filteredInvoices, store?.gstNumber, fp]);

  // Handle Download JSON
  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(gstr1Json, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${storeGstin}_${fp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Download Accountant CSV using exportGSTReportCSV
  const handleDownloadCsv = () => {
    const csvContent = exportGSTReportCSV(filteredInvoices);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Sales_Register_${fp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.taxBadge}>🏛️ GST COMPLIANCE & RETURNS</span>
            <span style={styles.gstinBadge}>GSTIN: {storeGstin}</span>
          </div>
          <h1 style={styles.title}>GST Center & GSTR-1 Return Filing</h1>
          <p style={styles.subtitle}>
            One-click government portal GSTR-1 JSON export, HSN summary, and CA tax reports.
          </p>
        </div>

        {/* Month Selector & Actions */}
        <div style={styles.actionsRow}>
          <div style={styles.periodPicker}>
            <span style={styles.periodLabel}>TAX PERIOD:</span>
            <select
              style={styles.select}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="10">October (अक्टूबर)</option>
              <option value="09">September (सितम्बर)</option>
              <option value="08">August (अगस्त)</option>
            </select>
            <select
              style={styles.select}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <button style={styles.btnSecondary} onClick={handleDownloadCsv}>
            📊 Export CA Sheet (.CSV)
          </button>
          <button style={styles.btnPrimary} onClick={handleDownloadJson}>
            📥 Download GSTR-1 (.JSON)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>TOTAL GROSS SALES</span>
          <span style={styles.kpiVal}>₹{gstSummary.totalGrossSales.toLocaleString('en-IN')}</span>
          <span style={styles.kpiSub}>{filteredInvoices.length} Bills in selected period</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>TAXABLE TURNOVER</span>
          <span style={styles.kpiVal}>₹{gstSummary.totalTaxable.toLocaleString('en-IN')}</span>
          <span style={styles.kpiSub}>Net of discounts</span>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #10B981' }}>
          <span style={styles.kpiLabel}>TOTAL GST COLLECTED</span>
          <span style={{ ...styles.kpiVal, color: '#047857' }}>
            ₹{gstSummary.totalTax.toLocaleString('en-IN')}
          </span>
          <span style={styles.kpiSub}>Output Tax Liability</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>CGST + SGST SPLIT</span>
          <span style={styles.kpiVal}>
            ₹{gstSummary.totalCgst.toFixed(2)} + ₹{gstSummary.totalSgst.toFixed(2)}
          </span>
          <span style={styles.kpiSub}>Central 50% / State 50%</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>B2B REGISTERED BUYERS</span>
          <span style={styles.kpiVal}>{gstSummary.b2bCount} Invoices</span>
          <span style={styles.kpiSub}>₹{gstSummary.b2bTaxable.toLocaleString('en-IN')} Taxable</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'b2b' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('b2b')}
        >
          🏛️ B2B Invoices ({b2bInvoices.length})
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'b2c' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('b2c')}
        >
          🛒 B2C Small Summary ({gstSummary.b2cCount})
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'hsn' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('hsn')}
        >
          📋 HSN Summary ({gstSummary.hsnSummary.length} Codes)
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'json' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('json')}
        >
          💻 GSTR-1 JSON Schema Preview
        </button>
      </div>

      {/* TAB 1: B2B INVOICES */}
      {activeTab === 'b2b' && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeaderRow}>
            <h2 style={styles.tableTitle}>B2B Tax Invoices (Registered Buyers)</h2>
            <span style={styles.tableSubtitle}>
              Invoices with buyer GSTIN for input tax credit (ITC) pass-through.
            </span>
          </div>

          {b2bInvoices.length === 0 ? (
            <div style={styles.emptyState}>No B2B invoices found in this period.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>INVOICE #</th>
                    <th style={styles.th}>DATE</th>
                    <th style={styles.th}>BUYER NAME</th>
                    <th style={styles.th}>BUYER GSTIN</th>
                    <th style={styles.th}>TAXABLE (₹)</th>
                    <th style={styles.th}>CGST (₹)</th>
                    <th style={styles.th}>SGST (₹)</th>
                    <th style={styles.th}>TOTAL (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {b2bInvoices.map((inv) => (
                    <tr key={inv.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{inv.invoiceNumber}</td>
                      <td style={styles.td}>
                        {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={styles.td}>{inv.customer?.name || 'Registered Trader'}</td>
                      <td style={styles.td}>
                        <span style={styles.gstinCode}>{inv.customerGstin}</span>
                      </td>
                      <td style={styles.td}>₹{inv.subtotal.toFixed(2)}</td>
                      <td style={styles.td}>₹{(inv.taxTotal / 2).toFixed(2)}</td>
                      <td style={styles.td}>₹{(inv.taxTotal / 2).toFixed(2)}</td>
                      <td style={{ ...styles.td, fontWeight: 800, color: '#0F172A' }}>
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: B2C SUMMARY */}
      {activeTab === 'b2c' && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeaderRow}>
            <h2 style={styles.tableTitle}>B2C Small Retail Summary (Section 7)</h2>
            <span style={styles.tableSubtitle}>
              Aggregated counter walk-in sales to end consumers without GSTIN.
            </span>
          </div>

          <div style={styles.b2cStatsRow}>
            <div style={styles.b2cBox}>
              <span style={styles.b2cBoxLabel}>Total Retail Bills</span>
              <span style={styles.b2cBoxVal}>{gstSummary.b2cCount}</span>
            </div>
            <div style={styles.b2cBox}>
              <span style={styles.b2cBoxLabel}>Retail Taxable Value</span>
              <span style={styles.b2cBoxVal}>₹{gstSummary.b2cTaxable.toFixed(2)}</span>
            </div>
            <div style={styles.b2cBox}>
              <span style={styles.b2cBoxLabel}>Retail GST Collected</span>
              <span style={styles.b2cBoxVal}>₹{gstSummary.b2cTax.toFixed(2)}</span>
            </div>
            <div style={styles.b2cBox}>
              <span style={styles.b2cBoxLabel}>Place of Supply (POS)</span>
              <span style={styles.b2cBoxVal}>07 - Delhi (Intra-State)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HSN SUMMARY */}
      {activeTab === 'hsn' && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeaderRow}>
            <h2 style={styles.tableTitle}>HSN-Wise Outward Supplies Summary (Section 12)</h2>
            <span style={styles.tableSubtitle}>
              Harmonized System of Nomenclature aggregates mandatory for GSTR-1.
            </span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>HSN CODE</th>
                  <th style={styles.th}>DESCRIPTION</th>
                  <th style={styles.th}>UQC</th>
                  <th style={styles.th}>TOTAL QTY</th>
                  <th style={styles.th}>TOTAL VALUE (₹)</th>
                  <th style={styles.th}>TAXABLE VALUE (₹)</th>
                  <th style={styles.th}>CGST (₹)</th>
                  <th style={styles.th}>SGST (₹)</th>
                  <th style={styles.th}>TOTAL TAX (₹)</th>
                </tr>
              </thead>
              <tbody>
                {gstSummary.hsnSummary.map((hsn) => (
                  <tr key={hsn.hsnCode} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 700 }}>
                      <span style={styles.hsnBadge}>{hsn.hsnCode}</span>
                    </td>
                    <td style={styles.td}>{hsn.description}</td>
                    <td style={styles.td}>{hsn.uqc}</td>
                    <td style={styles.td}>{hsn.totalQty}</td>
                    <td style={styles.td}>₹{hsn.totalValue.toFixed(2)}</td>
                    <td style={styles.td}>₹{hsn.taxableValue.toFixed(2)}</td>
                    <td style={styles.td}>₹{hsn.cgstAmount.toFixed(2)}</td>
                    <td style={styles.td}>₹{hsn.sgstAmount.toFixed(2)}</td>
                    <td style={{ ...styles.td, fontWeight: 800, color: '#047857' }}>
                      ₹{(hsn.cgstAmount + hsn.sgstAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: JSON SCHEMA PREVIEW */}
      {activeTab === 'json' && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeaderRow}>
            <div>
              <h2 style={styles.tableTitle}>Government Portal GSTR-1 JSON Payload</h2>
              <span style={styles.tableSubtitle}>
                Verified schema payload compliant with the GST Offline Tool & Returns Portal.
              </span>
            </div>
            <button style={styles.btnPrimary} onClick={handleDownloadJson}>
              📥 Download This JSON
            </button>
          </div>

          <pre style={styles.jsonPreview}>
            {JSON.stringify(gstr1Json, null, 2)}
          </pre>
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
  taxBadge: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  gstinBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
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
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  periodPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '6px 12px',
  },
  periodLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
  },
  select: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    outline: 'none',
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
    cursor: 'pointer',
  },
  btnPrimary: {
    backgroundColor: '#10B981',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 800,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
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
  tabContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: '8px',
  },
  tabBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748B',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    fontWeight: 800,
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
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
  gstinCode: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  hsnBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
  },
  b2cStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    padding: '24px',
  },
  b2cBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  b2cBoxLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
  },
  b2cBoxVal: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '14px',
  },
  jsonPreview: {
    backgroundColor: '#0F172A',
    color: '#38BDF8',
    padding: '20px',
    borderRadius: '12px',
    margin: '20px',
    overflowX: 'auto',
    fontSize: '12px',
    fontFamily: 'monospace',
    maxHeight: '450px',
  },
};
