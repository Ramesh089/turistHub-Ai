import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import AuthToolbar from '../components/AuthToolbar';
import SliderCaptcha from '../components/SliderCaptcha';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import AuthVisualShowcase from '../components/AuthVisualShowcase';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2,
  AlertCircle,
  Compass,
  CheckCircle2
} from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = (user.role || '').toLowerCase();
      if (role === 'admin' || role === 'super admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Form states - simplified to Admin and User
  const [role, setRole] = useState('Admin');
  const [account, setAccount] = useState(() => localStorage.getItem('touristhub_remember_account') || 'admin');
  const [password, setPassword] = useState('Admin@1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(true);

  // Slider captcha states
  const [sliderVerified, setSliderVerified] = useState(false);
  const [sliderToken, setSliderToken] = useState(null);
  const [resetSliderTrigger, setResetSliderTrigger] = useState(0);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Quick Demo Selector for testing convenience
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
    setFieldErrors({});
    if (newRole === 'Admin') {
      setAccount('admin');
      setPassword('Admin@1234');
    } else {
      setAccount('user01');
      setPassword('User@1234');
    }
  };

  const handleSliderVerify = (token) => {
    setSliderVerified(true);
    setSliderToken(token);
    setErrorMsg('');
  };

  const handleSliderReset = () => {
    setSliderVerified(false);
    setSliderToken(null);
  };

  const validate = () => {
    const errors = {};
    if (!account.trim()) {
      errors.account = 'Please enter your username or email.';
    }
    if (!password) {
      errors.password = 'Please enter your password.';
    }
    if (!sliderVerified) {
      errors.slider = 'Please slide to verify before logging in.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMsg('');

    const res = await login({
      account: account.trim(),
      password,
      role,
      rememberPassword,
      sliderToken,
      sliderVerified: true
    });

    setLoading(false);

    if (res.success) {
      const loggedRole = (res.user?.role || '').toLowerCase();
      const redirectState = location.state?.from?.pathname;

      if (redirectState) {
        navigate(redirectState, { replace: true });
      } else if (loggedRole === 'admin' || loggedRole === 'super admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setErrorMsg(res.message);
      // Reset slider on failure
      setSliderVerified(false);
      setSliderToken(null);
      setResetSliderTrigger(prev => prev + 1);
    }
  };

  const bgPanelColor = isDark ? '#0e1015' : '#f8fafc';
  const inputBgColor = isDark ? '#1a1d26' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subtextColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bgPanelColor,
        color: textColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: 'hidden'
      }}
    >
      {/* ============================================================ */}
      {/* LEFT PANEL: Dynamic Multi-Image Animated Showcase (~60%)    */}
      {/* ============================================================ */}
      <div
        className="auth-left-panel"
        style={{
          flex: '1.45',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <AuthVisualShowcase />
      </div>

      {/* ============================================================ */}
      {/* RIGHT PANEL: Dark card-less panel, centered form (~40%)     */}
      {/* ============================================================ */}
      <div
        className="auth-right-panel"
        style={{
          flex: '1',
          minWidth: '380px',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 48px',
          backgroundColor: bgPanelColor,
          position: 'relative'
        }}
      >
        {/* Top-Right: Toolbar with Theme, Language, Light/Dark */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
          <div className="auth-mobile-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <img
                src="/logo.png"
                alt="Tourist AI Hub"
                style={{ height: '52px', width: '52px', borderRadius: '10px', objectFit: 'contain' }}
              />
              <span style={{ fontWeight: '800', fontSize: '1.24rem', color: textColor, letterSpacing: '-0.3px' }}>
                Tourist <span style={{ color: '#5B7CFF' }}>AI</span> Hub
              </span>
            </Link>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <AuthToolbar />
          </div>
        </div>

        {/* Center: Form Container */}
        <div style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '26px' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: textColor,
                marginBottom: '8px',
                letterSpacing: '-0.4px'
              }}
            >
              {t('welcomeBack')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: subtextColor }}>
              {t('loginSubtext')}
            </p>
          </div>

          {/* General Error Alert */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '18px'
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Role Dropdown */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 38px 12px 16px',
                    backgroundColor: inputBgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.92rem',
                    fontWeight: '500',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-color, #5B7CFF)')}
                  onBlur={(e) => (e.target.style.borderColor = borderColor)}
                >
                  <option value="Admin" style={{ background: '#1e2029', color: '#fff' }}>
                    {t('roleAdmin')}
                  </option>
                  <option value="User" style={{ background: '#1e2029', color: '#fff' }}>
                    {t('roleUser')}
                  </option>
                </select>
                <ChevronDown
                  size={18}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '14px',
                    color: subtextColor,
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>

            {/* 2. Username / Email Input */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => {
                    setAccount(e.target.value);
                    if (fieldErrors.account) setFieldErrors({ ...fieldErrors, account: null });
                  }}
                  placeholder={t('accountPlaceholder')}
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: inputBgColor,
                    border: fieldErrors.account ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-color, #5B7CFF)')}
                  onBlur={(e) => (e.target.style.borderColor = fieldErrors.account ? '#ef4444' : borderColor)}
                />
              </div>
              {fieldErrors.account && (
                <p style={{ fontSize: '0.76rem', color: '#ef4444', marginTop: '4px' }}>
                  {fieldErrors.account}
                </p>
              )}
            </div>

            {/* 3. Password Input */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                  }}
                  placeholder={t('passwordPlaceholder')}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 16px',
                    backgroundColor: inputBgColor,
                    border: fieldErrors.password ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.92rem',
                    outline: 'none',
                    letterSpacing: showPassword ? 'normal' : '2px',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-color, #5B7CFF)')}
                  onBlur={(e) => (e.target.style.borderColor = fieldErrors.password ? '#ef4444' : borderColor)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: subtextColor,
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p style={{ fontSize: '0.76rem', color: '#ef4444', marginTop: '4px' }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* 4. Slider Captcha */}
            <div style={{ marginBottom: '18px' }}>
              <SliderCaptcha
                onVerify={handleSliderVerify}
                onReset={handleSliderReset}
                isVerified={sliderVerified}
                resetTrigger={resetSliderTrigger}
              />
              {fieldErrors.slider && !sliderVerified && (
                <p style={{ fontSize: '0.76rem', color: '#ef4444', marginTop: '4px' }}>
                  {fieldErrors.slider}
                </p>
              )}
            </div>

            {/* 5. Row: Remember password checkbox (left) & Forgot password (right) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '22px',
                fontSize: '0.86rem'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155'
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--accent-color, #5B7CFF)',
                    cursor: 'pointer'
                  }}
                />
                <span>{t('rememberPassword')}</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-color, #5B7CFF)',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                  fontWeight: '500',
                  padding: '2px 0'
                }}
              >
                {t('forgotPassword')}
              </button>
            </div>

            {/* 6. Primary Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: 'var(--accent-color, #5B7CFF)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.96rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(91, 124, 255, 0.35)',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.75 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.filter = 'brightness(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                t('loginButton')
              )}
            </button>
          </form>

          {/* 7. Footer: Register Link */}
          <div
            style={{
              marginTop: '22px',
              textAlign: 'left',
              fontSize: '0.86rem',
              color: subtextColor
            }}
          >
            <span>{t('noAccount')} </span>
            <Link
              to="/register"
              style={{
                color: 'var(--accent-color, #5B7CFF)',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              {t('registerLink')}
            </Link>
          </div>
        </div>

        {/* Bottom subtle note / spacer */}
        <div style={{ height: '24px' }} />
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        initialAccount={account}
      />

      {/* Responsive Styles */}
      <style>{`
        .auth-mobile-logo {
          display: none;
        }
        @media (max-width: 960px) {
          .auth-left-panel {
            display: none !important;
          }
          .auth-mobile-logo {
            display: flex !important;
          }
          .auth-right-panel {
            min-width: 100% !important;
            max-width: 100% !important;
            padding: 24px 20px !important;
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
