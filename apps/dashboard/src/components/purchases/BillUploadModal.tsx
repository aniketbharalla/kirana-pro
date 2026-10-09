'use client';

import React, { useState, useRef } from 'react';
import { parseInvoiceText, PurchaseInvoiceDraft } from '@kirana-pro/shared';

interface BillUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmInwarding: (draft: PurchaseInvoiceDraft) => void;
}

export const BillUploadModal: React.FC<BillUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirmInwarding,
}) => {
  const [billText, setBillText] = useState('');
  const [draft, setDraft] = useState<PurchaseInvoiceDraft | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle file selection (from input or drop)
  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, JPEG, WebP).');
      return;
    }
    setErrorMsg('');
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Rotate preview 90 degrees using a canvas
  const handleRotateImage = () => {
    if (!imagePreview) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        const newUrl = canvas.toDataURL('image/jpeg', 0.95);
        setImagePreview(newUrl);
      }
    };
    img.src = imagePreview;
  };

  // Run Tesseract OCR on selected image
  const handleRunOcr = async () => {
    const targetSource = imagePreview || imageFile;
    if (!targetSource) {
      setErrorMsg('Please select or drop an invoice image first.');
      return;
    }

    setIsProcessing(true);
    setOcrProgress(5);
    setOcrStatus('Initializing OCR engine...');
    setErrorMsg('');

    try {
      const tesseractMod = await import('tesseract.js');
      const createWorker = tesseractMod.createWorker;

      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            setOcrProgress(pct);
            setOcrStatus(`Scanning invoice characters (${pct}%)...`);
          } else if (m.status === 'loading tesseract core') {
            setOcrStatus('Loading OCR language core...');
            setOcrProgress(15);
          } else if (m.status === 'initializing tesseract') {
            setOcrStatus('Preparing line item models...');
            setOcrProgress(30);
          }
        },
      });

      setOcrStatus('Extracting text and numbers from bill...');
      const result = await worker.recognize(targetSource);
      await worker.terminate();

      const extracted = result.data?.text || '';
      if (!extracted.trim()) {
        setErrorMsg('Could not read readable text from image. Please ensure lighting is good, or paste invoice text manually.');
        setIsProcessing(false);
        return;
      }

      setBillText(extracted);
      const parsedDraft = parseInvoiceText(extracted);
      setDraft(parsedDraft);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMsg(`OCR Processing error: ${err.message || 'Failed to parse image'}. You can paste text manually.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse text directly (fallback or manual edit)
  const handleParseText = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = parseInvoiceText(billText);
      setDraft(result);
      setIsProcessing(false);
    }, 200);
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>📷 OCR Distributor Bill Inwarding</h2>
            <p style={styles.subtitle}>
              Upload invoice photo or PDF to auto-extract items, HSN, rates, and GST into store inventory.
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={styles.body}>
          {errorMsg && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}

          {!draft ? (
            <div>
              {/* Tab Selector */}
              <div style={styles.tabBar}>
                <button
                  style={{
                    ...styles.tabBtn,
                    ...(activeTab === 'upload' ? styles.tabBtnActive : {}),
                  }}
                  onClick={() => setActiveTab('upload')}
                >
                  📸 Upload / Scan Bill Image
                </button>
                <button
                  style={{
                    ...styles.tabBtn,
                    ...(activeTab === 'text' ? styles.tabBtnActive : {}),
                  }}
                  onClick={() => setActiveTab('text')}
                >
                  📝 Paste Invoice Text
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div>
                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />

                  {/* Dropzone Area */}
                  <div
                    style={{
                      ...styles.dropzone,
                      ...(isDragging ? styles.dropzoneDragging : {}),
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {!imagePreview ? (
                      <>
                        <div style={styles.dropzoneIcon}>📄</div>
                        <div style={styles.dropzoneTitle}>
                          Click to browse or Drag & drop distributor bill image here
                        </div>
                        <div style={styles.dropzoneSub}>
                          Supports PNG, JPG, JPEG, WebP • 100% Free Client-Side OCR
                        </div>
                        <button
                          type="button"
                          style={styles.browseBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          📂 Select Bill Image File
                        </button>
                      </>
                    ) : (
                      <div
                        style={styles.previewContainer}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Bill preview"
                          style={styles.previewImage}
                        />
                        <div style={styles.previewMeta}>
                          <div style={styles.previewName}>
                            {imageFile?.name || 'Selected Bill Image'}
                          </div>
                          {imageFile && (
                            <div style={styles.previewSize}>
                              {(imageFile.size / 1024).toFixed(1)} KB
                            </div>
                          )}
                          <div style={styles.previewActions}>
                            <button
                              type="button"
                              style={styles.previewBtn}
                              onClick={handleRotateImage}
                            >
                              🔄 Rotate 90°
                            </button>
                            <button
                              type="button"
                              style={{ ...styles.previewBtn, color: '#EF4444' }}
                              onClick={() => {
                                setImagePreview(null);
                                setImageFile(null);
                              }}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OCR Progress Indicator */}
                  {isProcessing && (
                    <div style={styles.progressBox}>
                      <div style={styles.progressHeader}>
                        <span style={styles.progressText}>{ocrStatus}</span>
                        <span style={styles.progressPct}>{ocrProgress}%</span>
                      </div>
                      <div style={styles.progressBarBg}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${ocrProgress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div style={styles.actionRow}>
                    <button
                      style={styles.parseBtn}
                      onClick={handleRunOcr}
                      disabled={isProcessing || !imagePreview}
                    >
                      {isProcessing
                        ? '⏳ Scanning Bill with OCR...'
                        : '🔍 Run OCR & Extract Line Items'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={styles.label}>Invoice Text / Raw Printed Content</label>
                  <textarea
                    style={styles.textarea}
                    rows={9}
                    value={billText}
                    onChange={(e) => setBillText(e.target.value)}
                    placeholder="Paste invoice line items here..."
                  />

                  <button
                    style={styles.parseBtn}
                    onClick={handleParseText}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '⏳ Parsing...' : '⚡ Run Fast Parser'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Draft Overview Banner */}
              <div style={styles.draftBanner}>
                <div>
                  <div style={styles.supplierTitle}>
                    {draft.supplierName || 'Wholesaler Invoice'}
                  </div>
                  <div style={styles.invMeta}>
                    Bill No: {draft.invoiceNo || 'NR/2026/0892'} • Confidence:{' '}
                    {draft.confidence}%
                  </div>
                </div>
                <div style={styles.payableBadge}>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>NET PAYABLE</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#10B981' }}>
                    ₹{draft.netPayable.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Product Description</th>
                      <th style={styles.th}>HSN</th>
                      <th style={styles.th}>Pack</th>
                      <th style={styles.th}>Inward Qty</th>
                      <th style={styles.th}>Rate (₹)</th>
                      <th style={styles.th}>CGST (2.5%)</th>
                      <th style={styles.th}>SGST (2.5%)</th>
                      <th style={styles.th}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.items.map((item, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.td}>{idx + 1}</td>
                        <td
                          style={{
                            ...styles.td,
                            fontWeight: '600',
                            color: '#0F172A',
                          }}
                        >
                          {item.productName}
                        </td>
                        <td style={styles.td}>{item.hsnCode || '—'}</td>
                        <td style={styles.td}>{item.uom}</td>
                        <td
                          style={{
                            ...styles.td,
                            fontWeight: '700',
                            color: '#059669',
                          }}
                        >
                          {item.totalQty} {item.uomMapped}
                        </td>
                        <td style={styles.td}>₹{item.rate.toFixed(2)}</td>
                        <td style={styles.td}>₹{item.cgstAmt.toFixed(2)}</td>
                        <td style={styles.td}>₹{item.sgstAmt.toFixed(2)}</td>
                        <td style={{ ...styles.td, fontWeight: '700' }}>
                          ₹{item.totalAmt.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={styles.footerRow}>
                <button
                  style={styles.backBtn}
                  onClick={() => setDraft(null)}
                >
                  ← Rescan / Edit
                </button>
                <button
                  style={styles.confirmBtn}
                  onClick={() => {
                    onConfirmInwarding(draft);
                    onClose();
                  }}
                >
                  ✓ Confirm & Inward {draft.items.length} Products to Stock
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    width: '920px',
    maxWidth: '95vw',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '19px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748B',
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
  },
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '10px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    color: '#FFFFFF',
  },
  dropzone: {
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropzoneDragging: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  dropzoneIcon: {
    fontSize: '44px',
  },
  dropzoneTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1E293B',
  },
  dropzoneSub: {
    fontSize: '12px',
    color: '#64748B',
  },
  browseBtn: {
    marginTop: '8px',
    padding: '9px 18px',
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #CBD5E1',
    borderRadius: '10px',
    color: '#1E293B',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },
  previewContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#FFFFFF',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  previewImage: {
    width: '90px',
    height: '110px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
  },
  previewMeta: {
    flex: 1,
    textAlign: 'left',
  },
  previewName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    wordBreak: 'break-all',
  },
  previewSize: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },
  previewActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },
  previewBtn: {
    background: 'none',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#475569',
  },
  progressBox: {
    marginTop: '16px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '8px',
  },
  progressText: {
    color: '#059669',
  },
  progressPct: {
    color: '#0F172A',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: '#E2E8F0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    transition: 'width 0.2s ease',
  },
  actionRow: {
    marginTop: '18px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '6px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    resize: 'vertical',
  },
  parseBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: '14px',
    padding: '13px 20px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  draftBanner: {
    backgroundColor: '#0F172A',
    borderRadius: '14px',
    padding: '18px 22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  supplierTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  invMeta: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '3px',
  },
  payableBadge: {
    textAlign: 'right',
  },
  tableContainer: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    overflow: 'auto',
    maxHeight: '340px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '11px 12px',
    fontWeight: '700',
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '11px 12px',
    color: '#334155',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
  },
  backBtn: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontWeight: '700',
    padding: '11px 18px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: '800',
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
  },
};
