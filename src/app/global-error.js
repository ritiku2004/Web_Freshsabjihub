'use client';

import React from 'react';

export const dynamic = 'force-dynamic';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'sans-serif',
          backgroundColor: '#f8f9fa',
          color: '#212529',
          padding: '20px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '64px' }}>🌿</span>
          <h1 style={{ fontSize: '32px', margin: '20px 0 10px' }}>Something went wrong</h1>
          <p style={{ color: '#6c757d', marginBottom: '30px', maxWidth: '500px' }}>
            We've encountered an unexpected error. Please try refreshing or reloading the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
