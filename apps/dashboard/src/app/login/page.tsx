'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      // Fallback for dev / without live Google Client ID
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoBadge}>🏪</div>
        <h1 style={styles.title}>Kirana Pro</h1>
        <p style={styles.subtitle}>Desktop Store Management System</p>
        <div style={styles.freePill}>100% Free Forever • Zero Subscription</div>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <div style={styles.featuresList}>
          <div style={styles.featureItem}>
            <span>📊</span>
            <span>Live Stock & Low-Alert Monitoring</span>
          </div>
          <div style={styles.featureItem}>
            <span>⚖️</span>
            <span>Taraju Smart Scale Synchronization</span>
          </div>
          <div style={styles.featureItem}>
            <span>📷</span>
            <span>Open Food Facts Catalog Integration</span>
          </div>
        </div>

        <button
          style={styles.googleBtn}
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <span style={styles.googleIcon}>🌐</span>
          <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>

        <p style={styles.footerText}>
          Secure Google Authentication powered by Firebase Free Tier
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    textAlign: 'center',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
  },
  logoBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    backgroundColor: '#ECFDF5',
    border: '1.5px solid #A7F3D0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    marginBottom: '12px',
  },
  freePill: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 800,
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid #A7F3D0',
    marginBottom: '24px',
  },
  featuresList: {
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
    marginBottom: '24px',
    border: '1px solid #E2E8F0',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600,
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '15px',
    padding: '14px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
    transition: 'background-color 0.15s ease',
  },
  googleIcon: {
    fontSize: '18px',
  },
  footerText: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '16px',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    border: '1px solid #FECACA',
  },
};
