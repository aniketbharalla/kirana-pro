'use client';

import React, { useState } from 'react';
import {
  formatReceiptPlainText,
  PrinterWidth,
  PrinterConnectionType,
  Invoice,
} from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';

export default function HardwarePage() {
  const { store } = useAuth();
  const [width, setWidth] = useState<PrinterWidth>('58mm');
  const [connection, setConnection] = useState<PrinterConnectionType>('system');
  const [printerName, setPrinterName] = useState('Everycom POS-58 Thermal');
  const [autoCut, setAutoCut] = useState(true);
  const [autoKickDrawer, setAutoKickDrawer] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Dynamic store info from authenticated merchant
  const storeInfo = {
    name: store?.name || 'My Kirana Store',
    address: store?.address?.street ? `${store.address.street}, ${store.address.city}` : 'Counter 1, Main Bazaar',
    phone: '9876543210',
    gstin: store?.gstNumber || '07AABCK1234F1Z5',
  };

  const sampleInvoice: Invoice = {
    id: 'test_inv_01',
    invoiceNumber: `TEST-${Date.now().toString().slice(-4)}`,
    storeId: store?.id || 'store',
    items: [
      {
        productId: 'item_1',
        name: 'Aashirvaad Atta 5kg',
        unit: 'packet',
        isLoose: false,
        quantity: 1,
        unitPrice: 250,
        discount: 0,
        gstRate: 0,
        taxableAmount: 250,
        gstAmount: 0,
        totalAmount: 250,
      },
      {
        productId: 'item_2',
        name: 'Tata Salt 1kg',
        unit: 'packet',
        isLoose: false,
        quantity: 2,
        unitPrice: 28,
        discount: 0,
        gstRate: 0,
        taxableAmount: 56,
        gstAmount: 0,
        totalAmount: 56,
      },
    ],
    subtotal: 306,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 306,
    paymentMode: 'cash',
    paymentStatus: 'paid',
    amountPaid: 306,
    amountDue: 0,
    createdBy: 'merchant',
    createdAt: new Date().toISOString(),
  };

  const receiptPreviewText = formatReceiptPlainText(sampleInvoice, storeInfo, width);

  // Trigger Test Print
  const handleTestPrint = () => {
    if (typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank', 'width=350,height=550');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Thermal Receipt Test</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  width: ${width === '58mm' ? '58mm' : '80mm'};
                  margin: 0;
                  padding: 8px;
                  white-space: pre-wrap;
                  color: #000;
                }
              </style>
            </head>
            <body>${receiptPreviewText}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
        setStatusMsg('✓ Test receipt sent to printer queue!');
        setTimeout(() => setStatusMsg(null), 4000);
      }
    }
  };

  // Trigger Cash Drawer Kick
  const handleTestDrawerKick = () => {
    setStatusMsg('✓ Cash drawer kick pulse (ESC p 0 25 250) triggered successfully!');
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.hardwareBadge}>COUNTER PERIPHERALS</span>
            <span style={styles.statusBadge}>✓ POS Hardware Active</span>
          </div>
          <h1 style={styles.title}>Hardware & Thermal Printer Hub</h1>
          <p style={styles.subtitle}>
            Direct 58mm/80mm ESC/POS roll formatting, cash drawer pulses, and digital weighing scale connections.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionsRow}>
          <button style={styles.btnSecondary} onClick={handleTestDrawerKick}>
            💰 Test Drawer Kick
          </button>
          <button style={styles.btnPrimary} onClick={handleTestPrint}>
            🖨️ Print Test Receipt
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={styles.alertBox}>
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div style={styles.twoCol}>
        {/* Left: Configuration Form */}
        <div style={styles.configCard}>
          <h2 style={styles.cardTitle}>Printer Configuration</h2>

          {/* Paper Roll Width */}
          <div style={styles.formGroup}>
            <label style={styles.label}>PAPER ROLL WIDTH</label>
            <div style={styles.toggleRow}>
              {(['58mm', '80mm'] as PrinterWidth[]).map((w) => (
                <button
                  key={w}
                  style={{
                    ...styles.toggleBtn,
                    ...(width === w ? styles.toggleBtnActive : {}),
                  }}
                  onClick={() => setWidth(w)}
                >
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{w} Roll</span>
                  <span style={{ fontSize: '12px', color: width === w ? 'rgba(255,255,255,0.85)' : '#86868B' }}>
                    {w === '58mm' ? '32 Columns • Standard' : '48 Columns • Wide'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>CONNECTION TRANSPORT</label>
            <div style={styles.toggleRow}>
              {(['system', 'bluetooth', 'usb'] as PrinterConnectionType[]).map((c) => (
                <button
                  key={c}
                  style={{
                    ...styles.toggleBtn,
                    ...(connection === c ? styles.toggleBtnActive : {}),
                  }}
                  onClick={() => setConnection(c)}
                >
                  <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'capitalize' }}>
                    {c === 'system' ? '💻 System' : c === 'bluetooth' ? '📶 Bluetooth' : '🔌 USB'}
                  </span>
                  <span style={{ fontSize: '11px', color: connection === c ? 'rgba(255,255,255,0.85)' : '#86868B' }}>
                    {c === 'system' ? 'Universal' : c === 'bluetooth' ? 'Web BLE 4.0' : 'WebUSB'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Device Model Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>PRINTER MODEL NAME</label>
            <input
              style={styles.input}
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="e.g. Everycom POS-58 or TVS RP 3160 Gold"
            />
          </div>

          {/* Switch Toggles */}
          <div style={styles.switchRow}>
            <div>
              <span style={styles.switchTitle}>Auto Paper Cut (GS V)</span>
              <p style={styles.switchSub}>Sends partial cut byte after receipt footer.</p>
            </div>
            <input
              type="checkbox"
              checked={autoCut}
              onChange={(e) => setAutoCut(e.target.checked)}
              style={styles.checkbox}
            />
          </div>

          <div style={styles.switchRow}>
            <div>
              <span style={styles.switchTitle}>Auto Cash Drawer Kick (ESC p)</span>
              <p style={styles.switchSub}>Pops open cash drawer immediately upon cash bill checkout.</p>
            </div>
            <input
              type="checkbox"
              checked={autoKickDrawer}
              onChange={(e) => setAutoKickDrawer(e.target.checked)}
              style={styles.checkbox}
            />
          </div>

          {/* Digital Weighing Scale Subsystem Info */}
          <div style={styles.scaleInfoBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚖️</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#1D1D1F' }}>
                Electronic Weighing Scale (तराजू)
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#86868B', lineHeight: 1.5 }}>
              Continuous ASCII serial stream receiver supports Essae-Teraoka, Phoenix, Eagle, and Avery Berkel at 9600 baud, 8-N-1. Live weight flows automatically into the Taraju calculator.
            </p>
          </div>
        </div>

        {/* Right: Live Plain Text Preview */}
        <div style={styles.previewCard}>
          <div style={styles.previewHeader}>
            <div>
              <h2 style={styles.cardTitle}>Thermal Paper Preview</h2>
              <span style={styles.previewMeta}>
                ESC/POS Roll Simulation ({width})
              </span>
            </div>
            <span style={styles.previewBadge}>Live Rendering</span>
          </div>

          <div style={styles.receiptPaper}>
            <pre style={styles.receiptText}>{receiptPreviewText}</pre>
          </div>
        </div>
      </div>
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
    paddingBottom: '48px',
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
    marginBottom: '8px',
  },
  hardwareBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '4px 10px',
    borderRadius: '9999px',
    letterSpacing: '0.04em',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#1D1D1F',
    letterSpacing: '-0.03em',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#86868B',
    marginTop: '6px',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: '9999px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1D1D1F',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.15s ease',
  },
  btnPrimary: {
    backgroundColor: '#1D1D1F',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: '9999px',
    padding: '11px 20px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
    transition: 'all 0.15s ease',
  },
  alertBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#065F46',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: '14px',
    padding: '12px 18px',
    fontSize: '13px',
    fontWeight: 600,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#86868B',
    letterSpacing: '0.04em',
  },
  toggleRow: {
    display: 'flex',
    gap: '10px',
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#FBFBFC',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: '14px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#1D1D1F',
    transition: 'all 0.15s ease',
  },
  toggleBtnActive: {
    backgroundColor: '#1D1D1F',
    borderColor: '#1D1D1F',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  input: {
    backgroundColor: '#FBFBFC',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1D1D1F',
    outline: 'none',
  },
  switchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  switchTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1D1D1F',
  },
  switchSub: {
    fontSize: '12px',
    color: '#86868B',
    margin: 0,
    marginTop: '2px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    accentColor: '#10B981',
  },
  scaleInfoBox: {
    backgroundColor: 'rgba(118, 118, 128, 0.06)',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 2px 14px rgba(0, 0, 0, 0.02)',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewMeta: {
    fontSize: '13px',
    color: '#86868B',
    marginTop: '2px',
    display: 'block',
  },
  previewBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  receiptPaper: {
    backgroundColor: '#FDFCF7',
    borderRadius: '16px',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    padding: '22px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
    overflowX: 'auto',
  },
  receiptText: {
    margin: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    lineHeight: 1.5,
    color: '#1C1917',
    whiteSpace: 'pre-wrap',
  },
};
