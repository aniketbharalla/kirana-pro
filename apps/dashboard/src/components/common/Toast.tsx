'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type: 'success' | 'error';
  title: string;
  message?: string;
  onClose?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onClose,
  style,
  className,
}) => {
  const isSuccess = type === 'success';

  return (
    <div
      role="alert"
      className={className}
      style={{
        ...styles.toastCard,
        backgroundColor: isSuccess ? '#C2E7D0' : '#F7C2C7',
        ...style,
      }}
    >
      {/* Decorative organic abstract background shapes */}
      <div
        style={{
          ...styles.bgBlobTop,
          backgroundColor: isSuccess ? '#A7DCB9' : '#F4AEB6',
        }}
      />
      <div
        style={{
          ...styles.bgBlobBottom,
          backgroundColor: isSuccess ? '#99D4AC' : '#EDA0AA',
        }}
      />

      {/* Pure White Circular Icon Badge */}
      <div style={styles.iconCircle}>
        {isSuccess ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <path
              d="M5 12.5L10 17.5L19 7"
              stroke="#238352"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <path
              d="M12 6V13"
              stroke="#D32F2F"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="18" r="1.6" fill="#D32F2F" />
          </svg>
        )}
      </div>

      {/* Content: Title & Description */}
      <div style={styles.content}>
        <h4 style={styles.title}>{title}</h4>
        {message && <p style={styles.message}>{message}</p>}
      </div>

      {/* Top Right Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            ...styles.closeBtn,
            color: isSuccess ? '#487163' : '#8C575D',
          }}
          aria-label="Close notification"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toastCard: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 24px',
    borderRadius: '28px',
    boxShadow: '0 12px 32px -4px rgba(26, 32, 44, 0.12), 0 4px 10px -2px rgba(26, 32, 44, 0.05)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '470px',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    zIndex: 100,
  },
  bgBlobTop: {
    position: 'absolute',
    top: '-24px',
    left: '-16px',
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0.95,
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: '-28px',
    left: '26px',
    width: '92px',
    height: '92px',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0.8,
  },
  iconCircle: {
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.015em',
    lineHeight: 1.3,
  },
  message: {
    margin: '3px 0 0 0',
    fontSize: '13.5px',
    fontWeight: 400,
    color: '#374151',
    lineHeight: 1.45,
  },
  closeBtn: {
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: '2px',
    marginRight: '-4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.15s ease',
  },
};
