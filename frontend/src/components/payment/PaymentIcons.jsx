import React from 'react';

/**
 * High-definition brand vector icons for modern Indian payment systems:
 * UPI (GPay, PhonePe, Paytm, BHIM), Cards (Visa, Mastercard, RuPay, Amex),
 * and Indian Net Banking (SBI, HDFC, ICICI, Axis, Kotak, PNB).
 */

// ─── UPI BRAND ICONS ──────────────────────────────────────────────────────────

export function UpiLogo({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="6" fill="#0f172a" />
      <path d="M19.5 8L12.5 16H18L13 24L21 15H15.5L19.5 8Z" fill="#22c55e" />
      <path d="M19.5 8L15.5 13H19L14 20L21 15H17L19.5 8Z" fill="#f97316" />
    </svg>
  );
}

export function GPayIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
      <path d="M16 13.5v2.8h4.5c-.2 1.1-1.3 3.2-4.5 3.2-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9c1.5 0 2.5.6 3.1 1.2l2.2-2.2C19.9 7.3 18.1 6.5 16 6.5 10.8 6.5 6.5 10.8 6.5 16s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.7H16z" fill="#4285F4" />
      <path d="M7.7 12.3l2.8 2.1c.8-2.3 2.9-4 5.5-4 1.5 0 2.5.6 3.1 1.2l2.2-2.2C19.9 7.3 18.1 6.5 16 6.5c-3.7 0-6.9 2.2-8.3 5.8z" fill="#EA4335" />
      <path d="M16 25.5c2.6 0 4.8-.9 6.4-2.4l-2.7-2.2c-.8.6-1.9 1-3.7 1-3.2 0-4.3-2.1-4.5-3.2L8.6 20.8c1.5 3.3 4.6 4.7 7.4 4.7z" fill="#34A853" />
      <path d="M7.7 19.7l3.7-2.1c-.2-.7-.3-1.4-.3-2.1 0-.7.1-1.4.3-2.1L7.7 11.3C7 12.7 6.5 14.3 6.5 16s.5 3.3 1.2 4.7l0-1z" fill="#FBBC05" />
    </svg>
  );
}

export function PhonePeIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#5f259f" />
      {/* PhonePe 'Pe' symbol in white */}
      <path
        d="M17.5 7.5H12C10.6 7.5 9.5 8.6 9.5 10V22C9.5 23.4 10.6 24.5 12 24.5H14.5V18.5H17.5C20.5 18.5 22.5 16.5 22.5 13C22.5 9.5 20.5 7.5 17.5 7.5ZM17.2 14.8H14.5V11.2H17.2C18.6 11.2 19.5 11.9 19.5 13C19.5 14.1 18.6 14.8 17.2 14.8Z"
        fill="#ffffff"
      />
      <circle cx="21.5" cy="9.5" r="2" fill="#00d2b5" />
    </svg>
  );
}

export function PaytmIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
      <path d="M6 13h5.5c1.8 0 3 1.2 3 2.8 0 1.6-1.2 2.8-3 2.8H8.5V23H6V13zm2.5 3.8h2.8c.6 0 1-.4 1-1s-.4-1-1-1H8.5v2z" fill="#002970" />
      <path d="M15 13h3l2.8 5.6L23.6 13h3l-4.5 8.2v3.8H19.5v-3.8L15 13z" fill="#00BAF2" />
    </svg>
  );
}

export function BhimIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#042a38" />
      <path d="M8 8h6c3 0 5 1.5 5 3.8 0 1.5-.8 2.6-2.2 3.2 1.8.6 2.8 1.9 2.8 3.6 0 2.5-2 4.4-5.6 4.4H8V8zm3.5 5.8h2.5c1 0 1.8-.6 1.8-1.5s-.8-1.5-1.8-1.5h-2.5v3zm0 6.6h2.8c1.2 0 2.1-.6 2.1-1.7 0-1.1-.9-1.7-2.1-1.7h-2.8v3.4z" fill="#ffffff" />
      <path d="M19 14l5-6v16l-5-6v-4z" fill="#00a859" />
      <path d="M21 8l4 6-4 4V8z" fill="#f37021" />
    </svg>
  );
}

// ─── CARD BRAND ICONS ─────────────────────────────────────────────────────────

export function VisaIcon({ size = 24, className = '' }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 48 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="48" height="32" rx="6" fill="#1a1f71" />
      <path d="M19.5 21.5l2.2-11h3.5l-2.2 11h-3.5zm14-10.7c-.7-.3-1.8-.5-3.1-.5-3.4 0-5.8 1.7-5.8 4.2 0 1.8 1.7 2.8 3 3.4 1.3.6 1.8 1 1.8 1.6 0 .9-1.1 1.3-2.1 1.3-1.4 0-2.2-.2-3.3-.7l-.5-.2-.5 2.9c.8.4 2.3.7 3.8.7 3.6 0 6-1.7 6-4.3 0-1.4-.9-2.5-2.9-3.4-1.2-.6-1.9-1-1.9-1.6 0-.6.7-1.1 2-1.1 1.2 0 2 .2 2.7.5l.3.2.6-2.5zm8.5 0h-2.7c-.8 0-1.5.2-1.8 1.1l-5.2 9.9h3.7l.7-2h4.6l.4 2h3.3l-2.9-11zm-4.7 6.4l1.9-5.1.8 5.1h-2.7zm-23.7-6.4l-3.4 8.7-.4-1.8c-.6-2.1-2.6-4.4-4.8-5.5l3.1 9.6h3.7l5.5-11h-3.7z" fill="#ffffff" />
      <path d="M10.2 10.8H5l-.1.4c4 1 6.7 3.4 7.8 6.3l-1.1-5.6c-.2-.7-.7-1-1.4-1.1z" fill="#f7b600" />
    </svg>
  );
}

export function MastercardIcon({ size = 24, className = '' }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 48 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="48" height="32" rx="6" fill="#0f172a" />
      <circle cx="19" cy="16" r="9" fill="#eb001b" />
      <circle cx="29" cy="16" r="9" fill="#f79e1b" />
      <path d="M24 9.4c1.9 1.7 3.1 4.1 3.1 6.6s-1.2 5-3.1 6.6c-1.9-1.7-3.1-4.1-3.1-6.6s1.2-5 3.1-6.6z" fill="#ff5f00" />
    </svg>
  );
}

export function RupayIcon({ size = 24, className = '' }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 48 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="48" height="32" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
      <path d="M10 9h6.5c2.5 0 4.2 1.5 4.2 3.8 0 1.8-1.2 3.2-2.8 3.6l3.5 6.6H17l-3-6h-2v6h-2V9zm2 6h4.5c1.4 0 2.2-.8 2.2-1.9 0-1.1-.8-1.9-2.2-1.9H12V15z" fill="#004c8f" />
      <path d="M26 12l4-3 4 3-4 11-4-11z" fill="#f37021" />
      <path d="M32 12l4-3 4 3-4 11-4-11z" fill="#00a651" />
    </svg>
  );
}

export function AmexIcon({ size = 24, className = '' }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 48 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="48" height="32" rx="6" fill="#006fcf" />
      <text x="24" y="19" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
        AMEX
      </text>
    </svg>
  );
}

// ─── INDIAN BANK BRAND ICONS ──────────────────────────────────────────────────

export function SbiIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#280071" />
      <circle cx="16" cy="16" r="10.5" fill="#00b4d8" />
      <circle cx="16" cy="14" r="3.2" fill="#280071" />
      <rect x="14.6" y="14" width="2.8" height="8.5" fill="#280071" />
    </svg>
  );
}

export function HdfcIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#004c8f" />
      <rect x="6" y="6" width="20" height="20" fill="#004c8f" stroke="#ffffff" strokeWidth="2.5" />
      <rect x="12" y="12" width="8" height="8" fill="#ed1c24" />
      <rect x="14.5" y="6" width="3" height="20" fill="#ffffff" />
      <rect x="6" y="14.5" width="20" height="3" fill="#ffffff" />
      <rect x="13.5" y="13.5" width="5" height="5" fill="#ed1c24" />
    </svg>
  );
}

export function IciciIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#b02a30" />
      <circle cx="16" cy="16" r="10" stroke="#f58220" strokeWidth="2.5" fill="none" />
      <path d="M16 10v12M12 16h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="9.5" r="1.5" fill="#f58220" />
    </svg>
  );
}

export function AxisIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#97144d" />
      <path d="M16 8L8 23h5.5l2.5-5 2.5 5H24L16 8z" fill="#ffffff" />
      <path d="M16 14l2 4h-4l2-4z" fill="#97144d" />
    </svg>
  );
}

export function KotakIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#ed1c24" />
      <circle cx="13" cy="16" r="4.5" stroke="#ffffff" strokeWidth="2.2" fill="none" />
      <circle cx="19" cy="16" r="4.5" stroke="#1b365d" strokeWidth="2.2" fill="none" />
      <path d="M13 13.5c2 0 4 5 6 5s4-5 6-5" stroke="#ffffff" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

export function PnbIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={{ display: 'inline-block' }}>
      <rect width="32" height="32" rx="8" fill="#a20032" />
      <circle cx="16" cy="16" r="9" fill="#ffcc00" />
      <circle cx="16" cy="16" r="6" fill="#a20032" />
      <circle cx="16" cy="16" r="3" fill="#ffcc00" />
    </svg>
  );
}

// ─── CARD CHIP & CONTACTLESS WAVE ─────────────────────────────────────────────

export function EmvChipIcon({ size = 32 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 40 30" fill="none" style={{ display: 'inline-block' }}>
      <rect width="40" height="30" rx="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <path d="M0 10h12v10H0M28 10h12v10H28M12 0v10M12 20v10M28 0v10M28 20v10M12 15h16" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="20" cy="15" r="3" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
    </svg>
  );
}

export function ContactlessWaveIcon({ size = 20, color = '#ffffff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block' }}>
      <path d="M8.5 16.5a6 6 0 0 1 0-9" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      <path d="M12 19a9.5 9.5 0 0 1 0-14" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      <path d="M15.5 21.5a13 13 0 0 1 0-19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ─── TRUST & SECURITY BADGES ──────────────────────────────────────────────────

export function PciDssBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        padding: '3px 7px',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#334155'
      }}
    >
      <span style={{ color: '#0284c7' }}>🛡️</span> PCI-DSS Certified
    </span>
  );
}

export function SslEncryptionBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        padding: '3px 7px',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#334155'
      }}
    >
      <span style={{ color: '#16a34a' }}>🔒</span> 256-bit TLS Encrypted
    </span>
  );
}

export function RbiSandboxBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 6,
        padding: '3px 7px',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#1d4ed8'
      }}
    >
      <span>🏛️</span> RBI Sandbox Verified
    </span>
  );
}
