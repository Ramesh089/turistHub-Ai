import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import AuthToolbar from '../components/AuthToolbar';
import SliderCaptcha from '../components/SliderCaptcha';
import PasswordStrengthMeter, { calculatePasswordStrength } from '../components/PasswordStrengthMeter';
import AuthVisualShowcase from '../components/AuthVisualShowcase';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Compass,
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', label: 'IN (+91)' },
  { code: '+1', label: 'US (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+86', label: 'CN (+86)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+971', label: 'UAE (+971)' }
];

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = (user.role || '').toLowerCase();
      if (role === 'super admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Visibility & Verification
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sliderVerified, setSliderVerified] = useState(false);
  const [sliderToken, setSliderToken] = useState(null);
  const [resetSliderTrigger, setResetSliderTrigger] = useState(0);

  // Validation & Status
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Field validation logic
  const validateField = (field, value) => {
    let error = null;

    if (field === 'fullName') {
      if (!value.trim()) {
        error = 'Full name is required.';
      } else if (!/^[a-zA-Z\s]{2,50}$/.test(value.trim())) {
        error = '2-50 characters, letters and spaces only.';
      }
    }

    if (field === 'username') {
      if (!value.trim()) {
        error = 'Username is required.';
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(value.trim())) {
        error = '4-20 chars, start with a letter, letters/numbers/_ only.';
      }
    }

    if (field === 'email') {
      if (!value.trim()) {
        error = 'Email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = 'Please enter a valid email address.';
      }
    }

    if (field === 'phone') {
      if (value.trim()) {
        const clean = value.replace(/[^0-9]/g, '');
        if (clean.length < 10 || clean.length > 15) {
          error = 'Must be 10-15 valid digits.';
        }
      }
    }

    if (field === 'password') {
      const strength = calculatePasswordStrength(value);
      if (!value) {
        error = 'Password is required.';
      } else if (strength.score < 3 || /\s/.test(value)) {
        error = 'Min 8 chars, 1 upper, 1 lower, 1 number, 1 special symbol, no spaces.';
      }
    }

    if (field === 'confirmPassword') {
      if (!value) {
        error = 'Please confirm your password.';
      } else if (value !== password) {
        error = 'Passwords do not match.';
      }
    }

    if (field === 'terms') {
      if (!value) {
        error = 'You must agree to the Terms of Service & Privacy Policy.';
      }
    }

    return error;
  };

  const handleBlur = (field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    if (fieldErrors[field]) {
      const error = validateField(field, value);
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateAll = () => {
    const errors = {
      fullName: validateField('fullName', fullName),
      username: validateField('username', username),
      email: validateField('email', email),
      phone: validateField('phone', phone),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
      terms: validateField('terms', termsAccepted),
      slider: !sliderVerified ? 'Please complete the slider verification.' : null
    };

    // Filter out nulls
    const cleanErrors = {};
    for (const [k, v] of Object.entries(errors)) {
      if (v) cleanErrors[k] = v;
    }

    setFieldErrors(cleanErrors);
    setTouched({
      fullName: true,
      username: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      terms: true,
      slider: true
    });

    return Object.keys(cleanErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const fullPhone = phone.trim() ? `${countryCode} ${phone.trim()}` : '';

    const res = await register({
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      phone: fullPhone,
      password,
      confirmPassword,
      termsAccepted: true,
      sliderToken,
      sliderVerified: true
    });

    setLoading(false);

    if (res.success) {
      const redirectState = location.state?.from?.pathname || location.state?.from;
      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        navigate(redirectState || '/dashboard');
      }, 1500);
    } else {
      setErrorMsg(res.message);
      if (res.field) {
        setFieldErrors(prev => ({ ...prev, [res.field]: res.message }));
      }
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
      {/* RIGHT PANEL: Registration Form (~40%)                       */}
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
          padding: '28px 48px',
          backgroundColor: bgPanelColor,
          overflowY: 'auto'
        }}
      >
        {/* Top-Right: Toolbar with Mobile Brand Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '18px' }}>
          <div className="auth-mobile-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <img
                src="/logo.png"
                alt="Tourist AI Hub"
                style={{ height: '52px', width: '52px', borderRadius: '10px', objectFit: 'contain' }}
              />
              <span style={{ fontWeight: '800', fontSize: '1.24rem', color: textColor, letterSpacing: '-0.3px' }}>
                Tourist <span style={{ color: 'var(--accent-color, #5B7CFF)' }}>AI</span> Hub
              </span>
            </Link>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <AuthToolbar />
          </div>
        </div>

        {/* Form Container */}
        <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '1.9rem',
                fontWeight: '700',
                color: textColor,
                marginBottom: '6px',
                letterSpacing: '-0.4px'
              }}
            >
              {t('createAccount')}
            </h2>
            <p style={{ fontSize: '0.86rem', color: subtextColor }}>
              {t('registerSubtext')}
            </p>
          </div>

          {/* Explore / Protected Redirect Notice */}
          {location.state?.from && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '10px',
                color: isDark ? '#34d399' : '#047857',
                fontSize: '0.85rem',
                marginBottom: '16px',
                fontWeight: '600',
                lineHeight: 1.45
              }}
            >
              <Compass size={18} style={{ flexShrink: 0, color: '#10b981' }} />
              <span>Create your account to explore Indian destinations, generate AI itineraries, and access full Tourist Hub features.</span>
            </div>
          )}

          {/* Feedback Toasts */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.84rem',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                color: '#34d399',
                fontSize: '0.84rem',
                marginBottom: '16px'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Full Name */}
            <div style={{ marginBottom: '13px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: subtextColor, marginBottom: '4px' }}>
                {t('fullName')} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    handleChange('fullName', e.target.value);
                  }}
                  onBlur={() => handleBlur('fullName', fullName)}
                  placeholder={t('fullNamePlaceholder')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: inputBgColor,
                    border: fieldErrors.fullName ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
              {touched.fullName && fieldErrors.fullName && (
                <p style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '3px' }}>
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* 2. Username */}
            <div style={{ marginBottom: '13px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: subtextColor, marginBottom: '4px' }}>
                {t('username')} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    handleChange('username', e.target.value);
                  }}
                  onBlur={() => handleBlur('username', username)}
                  placeholder={t('usernamePlaceholder')}
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: inputBgColor,
                    border: fieldErrors.username ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
              {touched.username && fieldErrors.username && (
                <p style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '3px' }}>
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* 3. Email */}
            <div style={{ marginBottom: '13px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: subtextColor, marginBottom: '4px' }}>
                {t('email')} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleChange('email', e.target.value);
                  }}
                  onBlur={() => handleBlur('email', email)}
                  placeholder={t('emailPlaceholder')}
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: inputBgColor,
                    border: fieldErrors.email ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '3px' }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* 4. Phone with Country Code */}
            <div style={{ marginBottom: '13px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: subtextColor, marginBottom: '4px' }}>
                {t('phone')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{
                    width: '95px',
                    padding: '10px 8px',
                    backgroundColor: inputBgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: '#1e2029', color: '#fff' }}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    handleChange('phone', e.target.value);
                  }}
                  onBlur={() => handleBlur('phone', phone)}
                  placeholder={t('phonePlaceholder')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    backgroundColor: inputBgColor,
                    border: fieldErrors.phone ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
              {touched.phone && fieldErrors.phone && (
                <p style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '3px' }}>
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* 5. Password with Strength Meter */}
            <div style={{ marginBottom: '13px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: subtextColor, marginBottom: '4px' }}>
                {t('password')} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    handleChange('password', e.target.value);
                  }}
                  onBlur={() => handleBlur('password', password)}
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 num, 1 sym"
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    backgroundColor: inputBgColor,
                    border: fieldErrors.password ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: subtextColor,
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
              {touched.password && fieldErrors.password && (
                <p style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '3px' }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* 6. Confirm Password */}
            <div style={{ marginBottom: '13px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: subtextColor, marginBottom: '4px' }}>
                {t('confirmPassword')} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    handleChange('confirmPassword', e.target.value);
                  }}
                  onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                  placeholder={t('confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    backgroundColor: inputBgColor,
                    border: fieldErrors.confirmPassword ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: subtextColor,
                    cursor: 'pointer'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '3px' }}>
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* 7. Role (User by default, Admin locked per requirement) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: subtextColor, marginBottom: '4px' }}>
                {t('roleLabel')}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  color: textColor,
                  fontSize: '0.86rem'
                }}
              >
                <span>{t('roleUserDefault')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.72rem' }}>
                  <LockKeyhole size={14} />
                  <span>Standard</span>
                </div>
              </div>
              <p style={{ fontSize: '0.71rem', color: '#94a3b8', marginTop: '3px' }}>
                {t('roleAdminDisabledNote')}
              </p>
            </div>

            {/* 8. Terms & Privacy Checkbox */}
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                  color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155'
                }}
              >
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    handleChange('terms', e.target.checked);
                  }}
                  style={{
                    width: '15px',
                    height: '15px',
                    marginTop: '2px',
                    accentColor: 'var(--accent-color, #5B7CFF)',
                    cursor: 'pointer'
                  }}
                />
                <span>{t('agreeTerms')}</span>
              </label>
              {touched.terms && fieldErrors.terms && (
                <p style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '3px' }}>
                  {fieldErrors.terms}
                </p>
              )}
            </div>

            {/* 9. Slider Captcha */}
            <div style={{ marginBottom: '18px' }}>
              <SliderCaptcha
                onVerify={(token) => {
                  setSliderVerified(true);
                  setSliderToken(token);
                  handleChange('slider', true);
                }}
                onReset={() => {
                  setSliderVerified(false);
                  setSliderToken(null);
                }}
                isVerified={sliderVerified}
                resetTrigger={resetSliderTrigger}
              />
              {touched.slider && fieldErrors.slider && !sliderVerified && (
                <p style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '3px' }}>
                  {fieldErrors.slider}
                </p>
              )}
            </div>

            {/* 10. Submit Button */}
            <button
              type="submit"
              disabled={loading || !sliderVerified}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: 'var(--accent-color, #5B7CFF)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.96rem',
                fontWeight: '600',
                cursor: loading || !sliderVerified ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(91, 124, 255, 0.35)',
                transition: 'all 0.2s ease',
                opacity: loading || !sliderVerified ? 0.6 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Registering...</span>
                </>
              ) : (
                t('registerButton')
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div
            style={{
              marginTop: '18px',
              textAlign: 'left',
              fontSize: '0.86rem',
              color: subtextColor
            }}
          >
            <span>{t('haveAccount')} </span>
            <Link
              to="/login"
              state={location.state}
              style={{
                color: 'var(--accent-color, #5B7CFF)',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              {t('loginLink')}
            </Link>
          </div>
        </div>

        <div style={{ height: '20px' }} />
      </div>

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
      `}</style>
    </div>
  );
}
