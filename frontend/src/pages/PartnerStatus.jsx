import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  ArrowRight,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    color: '#d97706',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
  },
  under_review: {
    label: 'Under Review',
    icon: RefreshCw,
    color: '#0284c7',
    bg: 'rgba(2,132,199,0.1)',
    border: 'rgba(2,132,199,0.3)',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: '#059669',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.3)',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: '#dc2626',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
  },
  changes_requested: {
    label: 'Corrections Requested',
    icon: RefreshCw,
    color: '#b45309',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
  },
};

const CATEGORY_EMOJI = {
  hotel: '🏨',
  bus: '🚌',
  travel: '✈️',
  restaurant: '🍽️',
  adventure: '🏄',
  other: '🏢',
};

const CATEGORY_LABEL = {
  hotel: 'Hotel / Resort',
  bus: 'Bus Operator',
  travel: 'Tour & Travel Package',
  restaurant: 'Restaurant / Dining',
  adventure: 'Adventure / Activity',
  other: 'Other Tourism Service',
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 14px',
        borderRadius: 20,
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <Icon size={14} />
      {cfg.label}
    </span>
  );
}

// ─── Timeline Step ────────────────────────────────────────────────────────────

function Timeline({ status }) {
  const steps = [
    { key: 'pending',      label: 'Application Submitted', desc: 'Your application has been received.' },
    { key: 'under_review', label: 'Under Review',          desc: 'Our team is reviewing your documents.' },
    { key: 'approved',     label: 'Decision',              desc: 'Application approved or rejected.' },
  ];

  const ORDER = ['pending', 'under_review', 'approved', 'rejected'];
  const currentIdx = ORDER.indexOf(status);
  const isRejected = status === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, i) => {
        const stepOrder = ORDER.indexOf(step.key);
        const isDone = currentIdx > stepOrder;
        const isActive =
          step.key === status ||
          (step.key === 'approved' && (status === 'approved' || status === 'rejected'));

        let dotColor = '#e2e8f0';
        if (isRejected && step.key === 'approved') dotColor = '#ef4444';
        else if (isDone || isActive) dotColor = isDone ? '#10b981' : '#0284c7';

        return (
          <div key={step.key} style={{ display: 'flex', gap: 14 }}>
            {/* Spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: dotColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.3s',
                }}
              >
                {(isDone || isActive) && (
                  isRejected && step.key === 'approved'
                    ? <XCircle size={14} color="#fff" />
                    : <CheckCircle size={14} color="#fff" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: 2,
                    flexGrow: 1,
                    minHeight: 28,
                    background: isDone ? '#10b981' : '#e2e8f0',
                    margin: '4px 0',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </div>
            {/* Content */}
            <div style={{ paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isActive ? '#1e293b' : '#64748b',
                }}
              >
                {step.key === 'approved' && status === 'rejected' ? 'Rejected' : step.label}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {step.key === 'approved' && status === 'rejected'
                  ? 'Application was not approved.'
                  : step.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PartnerStatus() {
  const [searchParams] = useSearchParams();

  const [applicationId, setApplicationId] = useState(searchParams.get('applicationId') || searchParams.get('id') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [setupRequestLoading, setSetupRequestLoading] = useState(false);
  const [setupRequestMessage, setSetupRequestMessage] = useState('');
  const [setupRequestError, setSetupRequestError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCheck = async (e) => {
    e && e.preventDefault();

    if (!applicationId.trim() && !email.trim()) {
      setError('Please enter your Application ID or registered Email address.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSetupRequestMessage('');
    setSetupRequestError('');
    setTemporaryPassword('');
    setCopied(false);

    try {
      const res = await api.get('/partner/status', {
        params: { applicationId: applicationId.trim(), email: email.trim() },
      });
      setResult(res.data.application);
      if (res.data.application.status === 'approved' && res.data.application.temporaryPasswordStatus !== 'account_created') {
        requestTemporaryPassword(res.data.application);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Application not found. Please check your Application ID.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const requestTemporaryPassword = async (targetApp) => {
    // Avoid treating a click event as an application object
    const app = (targetApp && typeof targetApp === 'object' && ('applicationId' in targetApp || 'email' in targetApp))
      ? targetApp
      : (result || {});

    const targetAppId = String(app.applicationId || app.id || applicationId || '').trim();
    const targetEmail = String(app.email || email || '').trim();

    if (!targetAppId && !targetEmail) {
      setSetupRequestError('A valid Application ID or Email address is required.');
      return;
    }

    setSetupRequestLoading(true);
    setSetupRequestMessage('');
    setSetupRequestError('');
    try {
      const payload = { revealPassword: true };
      if (targetAppId) payload.applicationId = targetAppId;
      if (targetEmail) payload.email = targetEmail;

      const response = await api.post('/partner/status/request-temporary-password', payload, {
        params: payload
      });
      setSetupRequestMessage(response.data.message);
      if (response.data.temporaryPassword) {
        setTemporaryPassword(response.data.temporaryPassword);
      }
      setResult(current => current ? ({ ...current, temporaryPasswordStatus: 'sent' }) : current);
    } catch (requestError) {
      setSetupRequestError(requestError.response?.data?.message || 'Could not generate the temporary password. Please try again.');
      if (requestError.response?.status === 503) {
        setResult(current => current ? ({ ...current, temporaryPasswordStatus: 'failed' }) : current);
      }
    } finally {
      setSetupRequestLoading(false);
    }
  };

  useEffect(() => {
    if ((searchParams.get('applicationId') || searchParams.get('id')) && searchParams.get('email')) {
      handleCheck();
    }
  }, [searchParams]);

  const inputStyle = (hasErr) => ({
    padding: '11px 14px',
    borderRadius: 10,
    border: `1.5px solid ${hasErr ? '#ef4444' : 'rgba(2,132,199,0.25)'}`,
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
    background: '#fff',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0f9ff 0%, #f8fafc 50%, #f0fdf4 100%)',
        padding: '40px 16px 80px',
      }}
    >
      {/* Blobs */}
      <div style={{ position: 'fixed', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,132,199,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -80, right: -80, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #0284c7, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(2,132,199,0.3)' }}>
              <span style={{ fontSize: 22 }}>✈️</span>
            </div>
            <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 20, color: '#0284c7' }}>
              TouristHub AI
            </span>
          </Link>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, color: '#0284c7', marginBottom: 8 }}>
            Check Application Status
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Enter your Application ID to track your partner registration.
          </p>
        </div>

        {/* Search card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(2,132,199,0.15)', boxShadow: '0 8px 40px rgba(2,132,199,0.08)', padding: 'clamp(24px, 5vw, 40px)', marginBottom: 24 }}>
          <form onSubmit={handleCheck}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  Application ID *
                </label>
                <input
                  type="text"
                  value={applicationId}
                  onChange={(e) => { setApplicationId(e.target.value); setError(''); }}
                  placeholder="e.g. TH-M5XKZ1-AB12CD"
                  style={inputStyle(!!error && !applicationId.trim())}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  Email Address{' '}
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>(required to protect your application)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@example.com"
                  style={inputStyle(false)}
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
                  <AlertTriangle size={15} color="#ef4444" />
                  <span style={{ fontSize: 13, color: '#b91c1c' }}>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.75s linear infinite' }} />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search size={17} />
                    Check Status
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Result card */}
        {result && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(2,132,199,0.15)', boxShadow: '0 8px 40px rgba(2,132,199,0.08)', padding: 'clamp(24px, 5vw, 40px)' }}>

            {/* App header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 26 }}>{CATEGORY_EMOJI[result.category] || '🏢'}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{result.businessName}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{CATEGORY_LABEL[result.category] || result.category}</div>
                  </div>
                </div>
                <code style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(0,0,0,0.04)', padding: '3px 8px', borderRadius: 6 }}>
                  {result.applicationId}
                </code>
              </div>
              <StatusBadge status={result.status} />
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Contact Person', value: result.contactPerson },
                { label: 'Email', value: result.email },
                { label: 'Location', value: `${result.city}, ${result.state}` },
                { label: 'Submitted', value: new Date(result.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Last Updated', value: new Date(result.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(2,132,199,0.03)', border: '1px solid rgba(2,132,199,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Admin notes */}
            {result.adminNotes && (
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Review Notes from TouristHub AI Team</div>
                  <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>{result.adminNotes}</div>
                </div>
              </div>
            )}

            {/* Documents */}
            {result.documents && result.documents.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(2,132,199,0.15)' }}>
                  Submitted Documents ({result.documents.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.documents.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
                      <FileText size={15} color="#10b981" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{doc.docType}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} KB</div>
                      </div>
                      <CheckCircle size={15} color="#10b981" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status timeline */}
            <div style={{ background: 'rgba(2,132,199,0.03)', border: '1px solid rgba(2,132,199,0.1)', borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
                Application Progress
              </div>
              <Timeline status={result.status} />
            </div>

            {/* Approved CTA */}
            {result.status === 'approved' && (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
                <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#065f46', marginBottom: 6 }}>
                  🎉 Congratulations! Your application is approved.
                </div>
                <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
                  {result.temporaryPasswordStatus === 'account_created'
                    ? 'Your account is ready. Sign in with the password you created.'
                    : temporaryPassword
                      ? <>Your temporary password has been generated below. It expires in 24 hours and must be changed at first sign-in.</>
                      : 'Generate your temporary password below to sign in to your dashboard.'}
                </p>

                {temporaryPassword && (
                  <div style={{ background: '#fff', border: '1.5px solid #10b981', borderRadius: 12, padding: '16px', marginBottom: 20, textAlign: 'left', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🔑</span> Generated Temporary Password (8 Characters):
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <code style={{ fontSize: 17, fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '8px 14px', borderRadius: 8, letterSpacing: '1.5px', border: '1px solid #a7f3d0' }}>
                        {temporaryPassword}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(temporaryPassword);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: copied ? '#059669' : '#0284c7', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        {copied ? '✓ Copied!' : 'Copy Password'}
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                      Contains uppercase & lowercase letters, numbers, and special characters. Valid for 24 hours. You must change it upon first login.
                    </div>
                  </div>
                )}
                {(['account_created', 'sent'].includes(result.temporaryPasswordStatus) || temporaryPassword) && (
                  <div style={{ marginTop: '16px', padding: '16px 20px', background: '#f0fdf4', borderRadius: '12px', border: '1.5px solid #86efac', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ fontWeight: '800', color: '#166534', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⚡</span> Next Step: Quick Add Your Services
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '3px', lineHeight: 1.5 }}>
                        Sign in with your password to access your partner dashboard where you can <strong>Quick Add your services</strong> (Rooms, Bus Tickets, Tour Packages) directly to our catalogue!
                      </div>
                    </div>
                    <Link
                      to="/login"
                      state={{ role: 'Business Partner', from: '/partner/dashboard?tab=listings' }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '10px 22px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff', fontWeight: 700, fontSize: 13,
                        textDecoration: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Login & Add Services <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
                {result.temporaryPasswordStatus !== 'account_created' && (
                  <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => requestTemporaryPassword(result)}
                      disabled={setupRequestLoading}
                      style={{ border: 0, borderRadius: 12, padding: '10px 22px', background: '#059669', color: '#fff', fontWeight: 700, cursor: setupRequestLoading ? 'wait' : 'pointer' }}
                    >
                      {setupRequestLoading ? 'Generating password…' : (result.temporaryPasswordStatus === 'sent' || temporaryPassword) ? 'Regenerate temporary password' : 'Generate temporary password'}
                    </button>
                    {setupRequestMessage && <p role="status" style={{ margin: 0, color: '#166534', fontSize: 13 }}>{setupRequestMessage}</p>}
                    {setupRequestError && <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: 13 }}>{setupRequestError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Rejected CTA */}
            {result.status === 'rejected' && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
                <XCircle size={32} color="#ef4444" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#7f1d1d', marginBottom: 6 }}>
                  Application Not Approved
                </div>
                <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
                  Unfortunately your application was not approved at this time. Please review the admin notes above and reapply after making necessary corrections.
                </p>
                <Link to="/partner/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                  Apply Again <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
            <ChevronLeft size={15} />
            Back to Home
          </Link>
          {' · '}
          <Link to="/partner/register" style={{ color: '#0284c7', fontSize: 14, textDecoration: 'underline' }}>
            New Application
          </Link>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
