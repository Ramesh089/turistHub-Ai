import React from 'react';
import { PhoneCall, ShieldAlert, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmergencyBanner() {
  return (
    <div style={{
      background: '#f0f9ff',
      color: '#1e293b',
      fontSize: '0.82rem',
      padding: '7px 0',
      borderBottom: '1px solid rgba(2, 132, 199, 0.14)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={14} color="#0284c7" />
          <span>
            <strong style={{ color: '#0369a1' }}>Incredible India 24x7 Tourist Helpline:</strong>{' '}
            <a href="tel:1363" style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'underline' }}>
              1363 / 1800-11-1363
            </a>{' '}
            (Toll-Free, 12 Languages)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '2px 10px',
            borderRadius: '999px',
            fontWeight: '600'
          }}>
            <PhoneCall size={12} color="#10b981" /> All-in-One Emergency: <strong>112</strong>
          </span>
          <Link to="/emergency" style={{ color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HeartHandshake size={14} /> Emergency Directory &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

