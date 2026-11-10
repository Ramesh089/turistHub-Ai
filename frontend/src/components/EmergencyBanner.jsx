import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmergencyBanner() {
  return (
    <div
      style={{
        background: '#07131e',
        color: '#f8fafc',
        fontSize: '0.78rem',
        padding: '5px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 901
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {/* Left: Tourist Helpline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
          <span style={{ color: '#ffffff', fontWeight: '600' }}>
            India 24×7 Tourist Helpline:{' '}
            <a
              href="tel:1363"
              style={{
                color: '#38bdf8',
                fontWeight: '800',
                textDecoration: 'none'
              }}
            >
              1363 / 1800-11-1363
            </a>
          </span>
        </div>

        {/* Right: All-in-One Emergency 112 Capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="tel:112"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              padding: '2px 14px',
              borderRadius: '999px',
              fontWeight: '600',
              fontSize: '0.76rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
            }}
          >
            All-in-One Emergency: <strong style={{ color: '#ffffff' }}>112</strong>
          </a>
        </div>
      </div>
    </div>
  );
}
