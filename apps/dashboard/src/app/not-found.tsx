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
          backgroundColor: '#10B981',
          color: '#FFFFFF',
          fontWeight: 700,
          padding: '10px 18px',
          borderRadius: '10px',
        }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
