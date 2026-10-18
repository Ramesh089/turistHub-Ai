import React from 'react';
import { useI18n } from '../context/I18nContext';

export function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;
  if (/\s/.test(password)) score = 0; // spaces not allowed

  if (score <= 1) {
    return { score: 1, key: 'strengthWeak', color: '#ef4444', percent: 33 };
  } else if (score <= 3) {
    return { score: 2, key: 'strengthMedium', color: '#f59e0b', percent: 66 };
  } else {
    return { score: 3, key: 'strengthStrong', color: '#10b981', percent: 100 };
  }
}

export default function PasswordStrengthMeter({ password }) {
  const { t } = useI18n();
  if (!password) return null;

  const { key, color, percent } = calculatePasswordStrength(password);

  return (
    <div style={{ marginTop: '6px', marginBottom: '8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}
      >
        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Password Strength:</span>
        <span style={{ fontSize: '0.74rem', fontWeight: '700', color }}>{t(key)}</span>
      </div>

      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}
