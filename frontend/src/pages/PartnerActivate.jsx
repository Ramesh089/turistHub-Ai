import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader,
  Briefcase,
  Lock,
  AlertTriangle,
} from 'lucide-react';

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Weak', color: '#dc2626', bg: '#fee2e2' },
    { label: 'Fair', color: '#d97706', bg: '#fef3c7' },
    { label: 'Good', color: '#2563eb', bg: '#dbeafe' },
    { label: 'Strong', color: '#059669', bg: '#dcfce7' }
  ];
  const level = levels[Math.min(score - 1, 3)] || levels[0];

  return (
    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            height: '4px', flex: 1, borderRadius: '2px',
            background: i < score ? level.color : '#e2e8f0',
            transition: 'background 0.2s'
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: level.color }}>{level.label}</span>
    </div>
  );
}

export default function PartnerActivate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const step = 2;
  const [applicationData, setApplicationData] = useState(null);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrors({ general: 'This account setup link is missing or invalid. Use the one-time link sent to your email.' });
      setLoading(false);
      return;
    }
    api.get('/partner/account-setup', { params: { token } })
      .then((res) => setApplicationData(res.data))
      .catch((err) => setErrors({
        general: err.response?.data?.message || 'This account setup link is invalid or expired. Contact the administrator for a new link.'
      }))
      .finally(() => setLoading(false));
  }, [token]);

  const validateForm = () => {
    const errs = {};
    if (!formData.password) errs.password = 'Password is required.';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(formData.password)) {
      errs.password = 'Must include uppercase, lowercase, number and special character.';
    }

    if (!formData.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    return errs;
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post('/partner/complete-account-setup', {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login', { state: { role: 'Business Partner' } }), 2500);
      } else {
        setErrors({ general: res.data.message || 'Account activation failed.' });
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        setErrors({ [data.field]: data.message });
      } else {
        setErrors({ general: data?.message || 'Activation failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-alt)', padding: '20px', fontFamily: 'var(--font-sans)' }}>
        <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#059669" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Password Created</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>
            You can now sign in using your registered email and password. Redirecting to Business Partner login…
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <div className="spin" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
            <div className="spin" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', animationDelay: '0.2s' }} />
            <div className="spin" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '460px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #0284c7, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Briefcase size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            Set Business Partner Password
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Create your login password using the secure one-time link sent after admin approval.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
          {['Application Approved', 'Set Password'].map((label, i) => {
            const isActive = step === i + 1;
            const isDone = step > i + 1;
            return (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    background: isDone ? '#059669' : isActive ? '#0284c7' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive || isDone ? 'white' : '#94a3b8',
                    fontSize: '0.75rem', fontWeight: '800', transition: 'all 0.2s'
                  }}>
                    {isDone ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#0284c7' : '#94a3b8', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {i < 1 && <div style={{ flex: 1, height: '2px', background: step > 1 ? '#059669' : '#e2e8f0', borderRadius: '1px', transition: 'background 0.3s' }} />}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(2,132,199,0.12)', boxShadow: '0 8px 24px rgba(2,132,199,0.07)', overflow: 'hidden' }}>
          {/* General error */}
          {errors.general && (
            <div style={{ background: '#fee2e2', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #fecaca' }}>
              <AlertTriangle size={15} color="#dc2626" />
              <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: '600' }}>{errors.general}</span>
            </div>
          )}

          <div style={{ padding: '28px' }}>
            {/* Step 2: Account creation */}
            {step === 2 && applicationData && (
              <form onSubmit={handleActivate}>
                {/* Application info summary */}
                <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <CheckCircle size={18} color="#059669" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534' }}>✓ Application Approved</div>
                    <div style={{ fontSize: '0.78rem', color: '#166534', opacity: 0.8 }}>{applicationData.businessName}</div>
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      className="form-control"
                      style={{ paddingLeft: '36px', paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <PasswordStrength password={formData.password} />
                  {errors.password && <div style={{ color: '#dc2626', fontSize: '0.76rem', marginTop: '4px' }}>{errors.password}</div>}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Re-enter password"
                      className="form-control"
                      style={{ paddingLeft: '36px', paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div style={{ color: '#dc2626', fontSize: '0.76rem', marginTop: '4px' }}>{errors.confirmPassword}</div>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading ? '#6ee7b7' : '#059669',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontWeight: '800', fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? <><Loader size={16} className="spin" /> Saving Password...</> : <>Create Password <CheckCircle size={16} /></>}
                </button>
              </form>
            )}
            {loading && !applicationData && (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                <Loader size={20} className="spin" /> Checking secure setup link…
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Link to="/partner/status" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>Check application status</Link>
          {' · '}
          <Link to="/" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>Go Home</Link>
        </div>
      </div>
    </div>
  );
}
