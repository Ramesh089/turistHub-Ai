import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PartnerListings from '../components/PartnerListings';
import PartnerQueries from '../components/PartnerQueries';
import {
  Briefcase,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Building2,
  Edit3,
  Save,
  X,
  RefreshCw,
  AlertTriangle,
  Star,
  ShieldCheck,
  LogOut,
  ChevronRight,
  MessageCircle,
  FilePlus2,
  Zap
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { color: '#92400e', bg: '#fef3c7', border: '#fde68a', Icon: Clock, label: 'Pending Review', desc: 'Your application is being reviewed by our team. This usually takes 3–5 business days.' },
  under_review: { color: '#1e40af', bg: '#dbeafe', border: '#bfdbfe', Icon: ShieldCheck, label: 'Under Review', desc: 'An admin is currently reviewing your application and documents.' },
  approved: { color: '#166534', bg: '#dcfce7', border: '#bbf7d0', Icon: CheckCircle, label: 'Approved', desc: 'Congratulations! Your application has been approved. Our team will set up your listing shortly.' },
  rejected: { color: '#991b1b', bg: '#fee2e2', border: '#fecaca', Icon: XCircle, label: 'Not Approved', desc: 'Your application was not approved at this time. Please review the admin note and reapply.' },
  'changes requested': { color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', Icon: AlertTriangle, label: 'Changes Requested', desc: 'Please review the administrator note and update the requested information.' }
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Himachal Pradesh',
  'Jammu & Kashmir', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other'
];

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#0f172a' }}>{value || '—'}</span>
    </div>
  );
}

export default function PartnerDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialTab = searchParams.get('tab') || location.state?.tab || 'status';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/partner/dashboard' } });
      return;
    }
    const role = (user?.role || '').toLowerCase();
    if (role !== 'business partner') {
      navigate('/dashboard');
      return;
    }
    loadApplication();
  }, [isAuthenticated, user]);

  const loadApplication = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/partner/my-application');
      if (res.data.success && res.data.application) {
        const loadedApplication = {
          ...res.data.application,
          applicationId: res.data.application.id
        };
        setApplication(loadedApplication);
        setEditData({
          phone: loadedApplication.phone || '',
          address: loadedApplication.address || '',
          city: loadedApplication.city || '',
          state: loadedApplication.state || '',
          pincode: loadedApplication.pincode || '',
          businessDetails: loadedApplication.businessDetails || ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your application details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setSaveMsg(null);
    try {
      const res = await api.patch('/partner/my-application', editData);
      if (res.data.success) {
        setApplication(prev => ({ ...prev, ...editData }));
        setSaveMsg({ type: 'success', text: 'Profile details saved successfully.' });
        setEditing(false);
      } else {
        setSaveMsg({ type: 'error', text: res.data.message || 'Failed to save changes.' });
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save changes.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const statusKey = application?.status?.toLowerCase() || 'pending';
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.Icon;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated || (user?.role || '').toLowerCase() !== 'business partner') {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-alt)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid rgba(2,132,199,0.12)',
        padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                Welcome, {application?.businessName || user?.fullName || user?.name || 'Partner'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>TouristHub AI Partner Dashboard</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {application && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: statusCfg.bg, color: statusCfg.color,
                border: `1px solid ${statusCfg.border}`,
                padding: '4px 12px', borderRadius: '999px',
                fontSize: '0.78rem', fontWeight: '700'
              }}>
                <StatusIcon size={13} />
                {statusCfg.label}
              </span>
            )}
            <Link
              to="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.78rem', color: '#0284c7', fontWeight: '700',
                textDecoration: 'none', padding: '6px 12px', borderRadius: '8px',
                background: '#f0f9ff', border: '1px solid rgba(2,132,199,0.2)'
              }}
            >
              <Globe size={13} color="#0284c7" />
              View Tourist Site
            </Link>
            <a
              href="mailto:support@touristhub.ai"
              style={{
                fontSize: '0.78rem', color: '#64748b', fontWeight: '600',
                textDecoration: 'none', whiteSpace: 'nowrap'
              }}
            >
              Need help?
            </a>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#fee2e2', border: 'none', borderRadius: '8px',
                padding: '7px 13px', color: '#dc2626', fontSize: '0.8rem',
                fontWeight: '700', cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '28px 16px', maxWidth: '960px', margin: '0 auto' }}>
        {/* Tab navigation */}
        <div style={{
          display: 'flex', gap: '4px', background: 'white',
          border: '1px solid #e2e8f0', borderRadius: '12px',
          padding: '5px', marginBottom: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          {[
            { id: 'status', label: 'Application Status', icon: ShieldCheck },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'listings', label: 'My Services & Prices', icon: Briefcase },
            { id: 'questions', label: 'Questions to Admin', icon: MessageCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1, border: 'none', cursor: 'pointer',
                background: activeTab === id ? '#f0f9ff' : 'transparent',
                color: activeTab === id ? '#0284c7' : '#64748b',
                fontWeight: activeTab === id ? '700' : '600',
                fontSize: '0.87rem', padding: '10px 16px',
                borderRadius: '9px', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                boxShadow: activeTab === id ? 'inset 0 0 0 1.5px rgba(2,132,199,0.2)' : 'none'
              }}
            >
              <Icon size={15} color={activeTab === id ? '#0284c7' : '#94a3b8'} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <RefreshCw size={28} className="spin" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '0.9rem' }}>Loading your application...</div>
          </div>
        ) : error ? (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px', textAlign: 'center', color: '#991b1b' }}>
            <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: '600' }}>{error}</div>
            <button onClick={loadApplication} style={{ marginTop: '12px', background: 'white', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 16px', color: '#dc2626', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
              Try Again
            </button>
          </div>
        ) : activeTab === 'listings' ? (
          <PartnerListings application={application} applicationStatus={application?.status} />
        ) : activeTab === 'questions' ? (
          <PartnerQueries />
        ) : activeTab === 'status' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <Link to="/partner/register" className="btn btn-secondary btn-sm">Business application</Link>
              <Link
                to={application
                  ? `/partner/status?applicationId=${encodeURIComponent(application.applicationId)}&email=${encodeURIComponent(application.email)}`
                  : '/partner/status'}
                className="btn btn-secondary btn-sm"
              >
                Open status tracker
              </Link>
            </div>
            {/* Status Banner */}
            {application ? (
              <>
                <div style={{
                  background: statusCfg.bg,
                  border: `1px solid ${statusCfg.border}`,
                  borderRadius: '16px', padding: '24px',
                  marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <StatusIcon size={24} color={statusCfg.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: statusCfg.color, marginBottom: '6px' }}>
                      {statusCfg.label}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: statusCfg.color, opacity: 0.85, lineHeight: 1.6 }}>
                      {statusCfg.desc}
                    </div>
                    {application.adminNote && (
                      <div style={{
                        marginTop: '14px', background: 'rgba(255,255,255,0.6)',
                        borderRadius: '8px', padding: '12px 14px',
                        fontSize: '0.85rem', color: '#0f172a', fontStyle: 'italic'
                      }}>
                        <strong>Admin Note:</strong> {application.adminNote}
                      </div>
                    )}
                    {statusKey === 'approved' && (
                      <div style={{
                        marginTop: '16px', background: '#ffffff',
                        borderRadius: '12px', padding: '16px 20px',
                        border: '1.5px solid #10b981', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between',
                        gap: '16px', flexWrap: 'wrap',
                        boxShadow: '0 4px 14px rgba(16,185,129,0.1)'
                      }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ fontWeight: '800', color: '#065f46', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚡</span> Ready to add your services?
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '3px', lineHeight: 1.5 }}>
                            Your business application is approved! Quick Add your services (rooms, buses, tours, dining) so tourists can find and book with you.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('listings')}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white', border: 'none', borderRadius: '10px',
                            padding: '11px 22px', fontWeight: '700', fontSize: '0.88rem',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                          }}
                        >
                          <FilePlus2 size={16} />
                          Quick Add Service
                        </button>
                      </div>
                    )}
                    {statusKey === 'rejected' && (
                      <Link to="/partner/register" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        marginTop: '14px', background: '#dc2626', color: 'white',
                        padding: '9px 18px', borderRadius: '8px', textDecoration: 'none',
                        fontSize: '0.85rem', fontWeight: '700'
                      }}>
                        Reapply Now <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Application Details */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="#0284c7" />
                      Application Details
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                      Submitted {application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <InfoRow label="Application ID" value={application.applicationId} />
                    <InfoRow label="Business Name" value={application.businessName} />
                    <InfoRow label="Category" value={application.category} />
                    <InfoRow label="Contact Person" value={application.contactPerson} />
                    <InfoRow label="Email" value={application.email} />
                    <InfoRow label="City & State" value={`${application.city || ''}, ${application.state || ''}`} />
                    {application.reviewedAt && (
                      <InfoRow label="Reviewed On" value={new Date(application.reviewedAt).toLocaleDateString('en-IN')} />
                    )}
                  </div>
                </div>

                {/* Documents */}
                {application.documents && application.documents.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#0284c7" />
                        Submitted Documents ({application.documents.length})
                      </h3>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {application.documents.map((doc, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          background: '#f8fafc', borderRadius: '8px', padding: '10px 14px',
                          border: '1px solid #f1f5f9'
                        }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={15} color="#dc2626" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>{doc.documentType}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{doc.originalName}</div>
                          </div>
                          <a href={`${api.defaults.baseURL.replace(/\/api\/?$/, '')}${doc.documentUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700 }}>View PDF</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <Briefcase size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '6px' }}>No Application Found</div>
                <div style={{ fontSize: '0.85rem', marginBottom: '20px' }}>It looks like your application hasn't been linked yet.</div>
                <Link to="/partner/status" style={{
                  background: '#0284c7', color: 'white', textDecoration: 'none',
                  padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem'
                }}>
                  Check Application Status
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Profile Tab */
          <div>
            {saveMsg && (
              <div style={{
                background: saveMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: saveMsg.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${saveMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
                fontWeight: '600', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                {saveMsg.text}
                <button onClick={() => setSaveMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="#0284c7" />
                  My Profile
                </h3>
                {!editing && statusKey !== 'approved' && (
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: '#e0f2fe', border: 'none', borderRadius: '8px',
                      padding: '7px 13px', color: '#0284c7', fontSize: '0.82rem',
                      fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
                {editing && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { setEditing(false); setSaveMsg(null); }}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '7px 13px', color: '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saveLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#059669', border: 'none', borderRadius: '8px',
                        padding: '7px 13px', color: 'white', fontSize: '0.82rem',
                        fontWeight: '700', cursor: 'pointer', opacity: saveLoading ? 0.7 : 1
                      }}
                    >
                      {saveLoading ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div style={{ padding: '20px' }}>
                {/* Account Info (read-only) */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    Account Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <InfoRow label="Full Name" value={user?.fullName || user?.name} />
                    <InfoRow label="Username" value={user?.username} />
                    <InfoRow label="Email" value={user?.email} />
                    <InfoRow label="Role" value={user?.role} />
                  </div>
                </div>

                {/* Business Info (editable) */}
                {statusKey !== 'approved' && (
                  <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                      Business Details {editing ? '(Editable)' : ''}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {editing ? (
                        <>
                          {[
                            { key: 'phone', label: 'Phone Number', type: 'tel' },
                            { key: 'city', label: 'City', type: 'text' },
                            { key: 'pincode', label: 'Pincode', type: 'text' }
                          ].map(({ key, label, type }) => (
                            <div key={key}>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>{label}</label>
                              <input
                                type={type}
                                value={editData[key] || ''}
                                onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                                className="form-control"
                                style={{ fontSize: '0.85rem' }}
                              />
                            </div>
                          ))}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>State</label>
                            <select
                              value={editData.state || ''}
                              onChange={e => setEditData(prev => ({ ...prev, state: e.target.value }))}
                              className="form-control"
                              style={{ fontSize: '0.85rem' }}
                            >
                              <option value="">Select State</option>
                              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>Address</label>
                            <textarea
                              value={editData.address || ''}
                              onChange={e => setEditData(prev => ({ ...prev, address: e.target.value }))}
                              className="form-control"
                              rows={2}
                              style={{ fontSize: '0.85rem', resize: 'vertical' }}
                            />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>Business Details</label>
                            <textarea
                              value={editData.businessDetails || ''}
                              onChange={e => setEditData(prev => ({ ...prev, businessDetails: e.target.value }))}
                              className="form-control"
                              rows={3}
                              style={{ fontSize: '0.85rem', resize: 'vertical' }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <InfoRow label="Phone" value={application?.phone} />
                          <InfoRow label="City" value={application?.city} />
                          <InfoRow label="State" value={application?.state} />
                          <InfoRow label="Pincode" value={application?.pincode} />
                          <div style={{ gridColumn: '1 / -1' }}>
                            <InfoRow label="Address" value={application?.address} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {statusKey === 'approved' && (
                  <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{
                      background: '#dcfce7', border: '1px solid #bbf7d0',
                      borderRadius: '10px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                      <CheckCircle size={18} color="#166534" />
                      <div>
                        <div style={{ fontSize: '0.87rem', fontWeight: '700', color: '#166534' }}>Account Approved</div>
                        <div style={{ fontSize: '0.8rem', color: '#166534', opacity: 0.8 }}>Your listing is being set up by our team. Contact <a href="mailto:support@touristhub.ai" style={{ color: '#166534' }}>support@touristhub.ai</a> for updates.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
