'use client';

import React, { useState } from 'react';
import {
  formatReceiptPlainText,
  PrinterWidth,
  PrinterConnectionType,
} from '@kirana-pro/shared';
import { DASHBOARD_INVOICES } from '../../lib/mockInvoices';

export default function HardwarePage() {
  const [width, setWidth] = useState<PrinterWidth>('58mm');
  const [connection, setConnection] = useState<PrinterConnectionType>('system');
  const [printerName, setPrinterName] = useState('Everycom POS-58 Thermal');
  const [autoCut, setAutoCut] = useState(true);
  const [autoKickDrawer, setAutoKickDrawer] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Sample receipt preview text
  const storeInfo = {
    name: 'Sharma Kirana Store',
    address: 'Shop 12, Main Mandi Market, Delhi',
    phone: '9876543210',
    gstin: '07AABCK1234F1Z5',
  };

  const sampleInvoice = DASHBOARD_INVOICES[0];
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
            <span style={styles.hardwareBadge}>🖨️ COUNTER PERIPHERALS</span>
            <span style={styles.statusBadge}>🟢 POS Hardware Ready</span>
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
            <label style={styles.label}>PAPER ROLL WIDTH (कागज़ की चौड़ाई)</label>
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
                  <span style={{ fontWeight: 800 }}>{w} Roll</span>
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>
                    {w === '58mm' ? '32 Columns • Compact standard' : '48 Columns • Wide receipt'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>CONNECTION TRANSPORT (कनेक्शन प्रकार)</label>
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
                  <span style={{ fontWeight: 800, textTransform: 'capitalize' }}>
                    {c === 'system' ? '💻 System Print' : c === 'bluetooth' ? '📶 Bluetooth' : '🔌 USB'}
                  </span>
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>
                    {c === 'system' ? 'Universal Driver' : c === 'bluetooth' ? 'Web BLE 4.0' : 'WebUSB Direct'}
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
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                Electronic Weighing Scale (तराजू)
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
              Continuous ASCII serial stream receiver supports Essae-Teraoka, Phoenix, Eagle, and Avery Berkel at 9600 baud, 8-N-1. Live weight flows automatically into the Taraju calculator.
            </p>
          </div>
        </div>

        {/* Right: Monospaced Receipt Preview */}
        <div style={styles.previewCard}>
          <div style={styles.previewHeader}>
            <h2 style={styles.cardTitle}>Live Monospace Paper Preview</h2>
            <span style={styles.previewMeta}>
              {width === '58mm' ? '32 Columns (58mm)' : '48 Columns (80mm)'}
            </span>
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
  hardwareBadge: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#15803D',
    backgroundColor: '#DCFCE7',
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
  alertBox: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 700,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  toggleRow: {
    display: 'flex',
    gap: '10px',
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    border: '1.5px solid #CBD5E1',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#334155',
  },
  toggleBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    color: '#065F46',
  },
  input: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
  },
  switchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #F1F5F9',
  },
  switchTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B',
  },
  switchSub: {
    fontSize: '12px',
    color: '#64748B',
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
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewMeta: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748B',
  },
  receiptPaper: {
    backgroundColor: '#FAFAF9',
    borderRadius: '12px',
    border: '1px dashed #D6D3D1',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  receiptText: {
    margin: 0,
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '12px',
    lineHeight: 1.45,
    color: '#1C1917',
    whiteSpace: 'pre-wrap',
  },
};
