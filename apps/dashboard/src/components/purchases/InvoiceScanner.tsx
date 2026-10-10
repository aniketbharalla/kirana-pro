'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Product, PurchaseInvoiceDraft } from '@kirana-pro/shared';
import { recognizeInvoice } from '../../lib/ocr/tesseract';
import { parseInvoiceText, getReferenceParleInvoiceDraft } from '../../lib/ocr/parser';
import { FileText, X, ScanLine, AlertTriangle, Sparkles, UploadCloud, FolderOpen, Camera, Paperclip, RotateCw } from 'lucide-react';
import { Toast } from '../common/Toast';

interface InvoiceScannerProps {
  existingProducts?: Product[];
  onParsed: (draft: PurchaseInvoiceDraft) => void;
}

export default function InvoiceScanner({ existingProducts = [], onParsed }: InvoiceScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Match items with existing store products by name
  const matchWithStoreProducts = (draft: PurchaseInvoiceDraft): PurchaseInvoiceDraft => {
    const updatedItems = draft.items.map((item) => {
      const match = existingProducts.find(
        (p) =>
          p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
          item.productName.toLowerCase().includes(p.name.toLowerCase())
      );
      if (match) {
        return {
          ...item,
          productId: match.id,
          isNewProduct: false,
        };
      }
      return item;
    });

    return {
      ...draft,
      items: updatedItems,
    };
  };

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setRotationAngle(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRotate = () => {
    setRotationAngle((prev) => (prev + 90) % 360);
  };

  const handleStartOCR = async () => {
    if (!selectedFile && !imagePreviewUrl) {
      setErrorMsg('Please select or drop a wholesaler bill image first.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setProgressPercent(5);
      setStatusMessage('Initializing Tesseract OCR (WASM)...');

      const source = selectedFile || imagePreviewUrl!;
      const ocrResult = await recognizeInvoice(
        source,
        (status, pct) => {
          setStatusMessage(status);
          setProgressPercent(pct);
        },
        rotationAngle
      );

      setStatusMessage('Parsing bill items, taxes and quantities...');
      setProgressPercent(95);

      const parsedDraft = parseInvoiceText(ocrResult.text);
      const matchedDraft = matchWithStoreProducts(parsedDraft);

      setProgressPercent(100);
      setStatusMessage('Parsing complete!');

      setTimeout(() => {
        setIsProcessing(false);
        onParsed(matchedDraft);
      }, 400);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setIsProcessing(false);
      setErrorMsg(err?.message || 'Failed to process bill image with OCR. Please try again.');
    }
  };

  const handleUseReferenceParleBill = () => {
    const refDraft = getReferenceParleInvoiceDraft();
    const matched = matchWithStoreProducts(refDraft);
    onParsed(matched);
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>
            <ScanLine size={20} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle', color: '#7367F0' }} />
            Wholesaler Bill OCR Scanner
          </h2>
          <p style={styles.subtitle}>
            Upload or drop your distributor invoice (e.g. Parle / N R ENTERPRISES). 100% free client-side WASM OCR.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseReferenceParleBill}
          style={styles.sampleBtn}
          title="Instantly test with the 13-item reference Parle bill"
        >
          <FileText size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Load Parle Reference (13 Items)
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
      />

      {/* Drag & Drop Zone */}
      {!imagePreviewUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...styles.dropzone,
            backgroundColor: isDragging ? '#EDEBFD' : '#F8F7FA',
            borderColor: isDragging ? '#7367F0' : '#DBDADE',
          }}
        >
          <div style={styles.dropIcon}>
            <UploadCloud size={44} color="#7367F0" />
          </div>
          <h3 style={styles.dropTitle}>Drag & Drop Invoice Image Here</h3>
          <p style={styles.dropHint}>Supports JPG, PNG, WEBP receipts & bills</p>

          <div style={styles.btnRow}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={styles.primaryUploadBtn}
            >
              <FolderOpen size={16} /> Browse Files
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              style={styles.secondaryUploadBtn}
            >
              <Camera size={16} /> Capture with Camera
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.previewContainer}>
          <div style={styles.previewToolbar}>
            <span style={styles.fileNameBadge}>
              <Paperclip size={13} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
              {selectedFile?.name || 'Invoice Image'} ({rotationAngle}°)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleRotate}
                disabled={isProcessing}
                style={styles.toolBtn}
              >
                <RotateCw size={13} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
                Rotate 90°
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setImagePreviewUrl(null);
                  setRotationAngle(0);
                }}
                disabled={isProcessing}
                style={styles.toolBtnDanger}
              >
                <X size={14} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} /> Clear
              </button>
            </div>
          </div>

          <div style={styles.imageFrame}>
            <img
              src={imagePreviewUrl}
              alt="Invoice Preview"
              style={{
                ...styles.previewImage,
                transform: `rotate(${rotationAngle}deg)`,
              }}
            />
          </div>

          {/* Action Bar */}
          <div style={styles.actionRow}>
            <button
              type="button"
              onClick={handleStartOCR}
              disabled={isProcessing}
              style={{
                ...styles.startOcrBtn,
                opacity: isProcessing ? 0.7 : 1,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
              }}
            >
              {isProcessing ? (
                'Scanning Invoice...'
              ) : (
                <>
                  <ScanLine size={16} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} /> Scan & Extract Bill Items
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isProcessing && (
        <div style={styles.progressCard}>
          <div style={styles.progressHeader}>
            <span style={styles.progressStatus}>{statusMessage}</span>
            <span style={styles.progressNumber}>{progressPercent}%</span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${progressPercent}%`,
              }}
            />
          </div>
          <p style={styles.progressSubtext}>
            Extracting HSN, packaging units, rates, quantities (Gross / Rate) & GST splits...
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div style={{ marginTop: '16px' }}>
          <Toast
            type="error"
            title="Invoice Scan Failed"
            message={errorMsg}
            onClose={() => setErrorMsg('')}
          />
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
  },
  sampleBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#C7D2FE',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#4F46E5',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  dropzone: {
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderRadius: '14px',
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropIcon: {
    fontSize: '44px',
    marginBottom: '10px',
  },
  dropTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0,
  },
  dropHint: {
    fontSize: '13px',
    color: '#64748B',
    margin: '6px 0 16px 0',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryUploadBtn: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
  },
  secondaryUploadBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#DBDADE',
    color: '#2F2B3D',
    borderRadius: '8px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    backgroundColor: '#F8FAFC',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    borderRadius: '14px',
    padding: '16px',
  },
  previewToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  fileNameBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    backgroundColor: '#E2E8F0',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  toolBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#CBD5E1',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
  },
  toolBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#FECACA',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#DC2626',
    cursor: 'pointer',
  },
  imageFrame: {
    width: '100%',
    maxHeight: '360px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderRadius: '10px',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '360px',
    objectFit: 'contain',
    transition: 'transform 0.2s ease',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '6px',
  },
  startOcrBtn: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: 600,
    color: '#2F2B3D',
  },
  progressStatus: {
    color: '#2F2B3D',
  },
  progressNumber: {
    color: '#7367F0',
    fontWeight: 700,
  },
  progressBarBg: {
    height: '8px',
    width: '100%',
    backgroundColor: '#EDEBFD',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7367F0',
    transition: 'width 0.2s ease',
  },
  progressSubtext: {
    fontSize: '11px',
    color: '#64748B',
    margin: 0,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#FCA5A5',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#B91C1C',
    fontWeight: 600,
  },
};
