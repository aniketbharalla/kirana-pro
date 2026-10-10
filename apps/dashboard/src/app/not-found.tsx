import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#64748B', marginBottom: '20px' }}>
        The page you are looking for does not exist in Kirana Pro dashboard.
      </p>
      <Link
        href="/"
        style={{
          backgroundColor: '#7367F0',
          color: '#FFFFFF',
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
