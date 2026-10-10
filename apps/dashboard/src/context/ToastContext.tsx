'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '../components/common/Toast';

export interface ToastItem {
  id: string;
  type: 'success' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  show: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      show({ type: 'success', title, message, duration });
    },
    [show]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      show({ type: 'error', title, message, duration });
    },
    [show]
  );

  return (
    <ToastContext.Provider value={{ success, error, show, dismiss }}>
      {children}
      {/* Global Floating Toast Viewport */}
      {toasts.length > 0 && (
        <div style={styles.toastViewport}>
          {toasts.map((t) => (
            <div key={t.id} style={styles.toastWrapper}>
              <Toast
                type={t.type}
                title={t.title}
                message={t.message}
                onClose={() => dismiss(t.id)}
              />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles: Record<string, React.CSSProperties> = {
  toastViewport: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    pointerEvents: 'none',
    maxWidth: 'calc(100vw - 48px)',
  },
  toastWrapper: {
    pointerEvents: 'auto',
    animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
};
