import React from 'react';
import { Link } from 'react-router-dom';

export default function BrandLogo({ size = 'default', showTagline = true, light = false, to = '/' }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';
  const logoSize = isSmall ? 36 : (isLarge ? 72 : 48);

  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '8px' : '12px',
        textDecoration: 'none'
      }}
    >
      <img
        src="/logo.png"
        alt="Tourist AI Hub"
        className="brand-logo-img"
        style={{
          height: `${logoSize}px`,
          width: `${logoSize}px`,
          borderRadius: '10px',
          objectFit: 'contain',
          filter: light
            ? 'drop-shadow(0 2px 10px rgba(56, 189, 248, 0.35))'
            : 'drop-shadow(0 3px 10px rgba(2, 132, 199, 0.32))',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      />

      <div>
        <div
          className="brand-logo-text"
          style={{
            fontFamily: "'Outfit', var(--font-serif), sans-serif",
            fontSize: isSmall ? '1.1rem' : (isLarge ? '1.65rem' : '1.32rem'),
            fontWeight: '800',
            lineHeight: 1.05,
            color: light ? '#ffffff' : '#0f172a',
            letterSpacing: '-0.3px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>Tourist</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '900'
            }}
          >
            AI
          </span>
          <span>Hub</span>
        </div>

        {showTagline && (
          <div
            className="brand-logo-tagline"
            style={{
              fontSize: isSmall ? '0.62rem' : (isLarge ? '0.8rem' : '0.66rem'),
              color: light ? '#94a3b8' : '#64748b',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              fontWeight: '800',
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ color: '#0ea5e9' }}>✦</span> Digital Tourism AI Suite
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 540px) {
          .brand-logo-img {
            height: 38px !important;
            width: 38px !important;
          }
          .brand-logo-text {
            font-size: 1.12rem !important;
          }
          .brand-logo-tagline {
            display: none !important;
          }
        }
      `}</style>
    </Link>
  );
}
