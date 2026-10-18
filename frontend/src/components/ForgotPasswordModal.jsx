import React, { useState } from 'react';
import { X, Mail, KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useI18n } from '../context/I18nContext';
import PasswordStrengthMeter, { calculatePasswordStrength } from './PasswordStrengthMeter';

export default function ForgotPasswordModal({ isOpen, onClose, initialAccount = '' }) {
  const { t } = useI18n();

  const [step, setStep] = useState(1); // 1: request code, 2: reset password
  const [account, setAccount] = useState(initialAccount);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!account.trim()) {
      setErrorMsg('Please enter your account email or username.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/forgot-password', { account: account.trim() });
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Verification code sent!');
        if (res.data.resetCode) {
          setDemoCodeHint(res.data.resetCode);
          setResetCode(res.data.resetCode);
        }
        setStep(2);
      } else {
        setErrorMsg(res.data?.message || 'Failed to request password reset code.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Account not found or server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    const strength = calculatePasswordStrength(newPassword);
    if (strength.score < 3) {
      setErrorMsg('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/reset-password', {
        account: account.trim(),
        resetCode: resetCode.trim(),
        newPassword,
        confirmPassword
      });

      if (res.data?.success) {
        setSuccessMsg('Password reset successfully! You can now log in.');
        setTimeout(() => {
          onClose();
          setStep(1);
          setSuccessMsg('');
        }, 1800);
      } else {
        setErrorMsg(res.data?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#181a20',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          color: '#ffffff'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px'
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
          {t('resetPasswordTitle')}
        </h3>
        <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
          {step === 1 ? t('resetPasswordSubtext') : 'Enter the 6-digit code and your new password below.'}
        </p>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.84rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '8px',
              color: '#34d399',
              fontSize: '0.84rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Account Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="admin / user@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    backgroundColor: '#262933',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <Mail
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8', pointerEvents: 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--accent-color, #5B7CFF)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.92rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : t('sendCodeButton')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            {demoCodeHint && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(91, 124, 255, 0.12)',
                  border: '1px solid rgba(91, 124, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#93c5fd',
                  fontSize: '0.8rem',
                  marginBottom: '14px'
                }}
              >
                Verification code (pre-filled for testing): <strong>{demoCodeHint}</strong>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                {t('verificationCode')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder={t('codePlaceholder')}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    backgroundColor: '#262933',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    letterSpacing: '2px',
                    fontWeight: '700'
                  }}
                />
                <KeyRound
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8', pointerEvents: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                {t('newPassword')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 num, 1 sym"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 38px',
                    backgroundColor: '#262933',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8', pointerEvents: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '11px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                {t('confirmPassword')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    backgroundColor: '#262933',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8', pointerEvents: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '11px',
                  backgroundColor: '#262933',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '11px',
                  backgroundColor: 'var(--accent-color, #5B7CFF)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : t('resetButton')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
