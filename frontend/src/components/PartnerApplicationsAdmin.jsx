import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,

  Plus,

  Sparkles
} from 'lucide-react';

const STATUS_COLORS = {
  Pending: { bg: '#fef3c7', text: '#92400e', border: '#fde68a', icon: Clock },
  Approved: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: CheckCircle },
  Rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icon: XCircle }
};

const CATEGORY_ICONS = {
  'Hotel': '🏨',
  'Bus Operator': '🚌',
  'Tour & Travel': '✈️',
  'Restaurant': '🍽️',
  'Adventure': '🏄',
  'Other': '🏢'
};

function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: cfg.bg,
      color: cfg.text,
      border: `1px solid ${cfg.border}`,
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '0.78rem',
      fontWeight: '700'
    }}>
      <Icon size={13} />
      {status}
    </span>
  );
}

function normalizeApplication(application) {
  return {
    ...application,
    business_name: application.businessName ?? application.business_name,
    contact_person: application.contactPerson ?? application.contact_person,
    admin_note: application.adminNote ?? application.admin_note,
    created_at: application.createdAt ?? application.created_at,
    reviewed_at: application.reviewedAt ?? application.reviewed_at,
    reviewed_by: application.reviewedBy ?? application.reviewed_by,
    document_count: application.documentCount ?? application.document_count,
    documents: application.documents?.map(document => ({
      ...document,
      document_type: document.documentType ?? document.document_type,
      original_name: document.originalName ?? document.original_name,
      file_size: document.fileSize ?? document.file_size,
      mime_type: document.mimeType ?? document.mime_type
    }))
  };
}

export default function PartnerApplicationsAdmin({ onNavigateToListings }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(null); // { id, action }
  const [reviewNote, setReviewNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  // Quick Add state for approved partner applications
  const [quickAddModal, setQuickAddModal] = useState(null);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    listingTitle: '',
    category: 'Hotel',
    city: '',
    state: '',
    price: '2000',
    capacity: 10,
    priceUnit: 'per night',
    availability: 'Daily from 09:00 AM to 08:00 PM',
    terms: 'Free cancellation up to 24 hours prior to travel.',
    listingDescription: ''
  });

  const openQuickAddModal = (app) => {
    const isHotel = (app.category || '').toLowerCase().includes('hotel');
    const isTransport = (app.category || '').toLowerCase().includes('bus') || (app.category || '').toLowerCase().includes('travel') || (app.category || '').toLowerCase().includes('transport');
    const isRestaurant = (app.category || '').toLowerCase().includes('restaurant');

    const defaultPrice = isHotel ? '2500' : isTransport ? '650' : isRestaurant ? '800' : '1500';
    const defaultCapacity = isHotel ? 10 : isTransport ? 40 : isRestaurant ? 50 : 20;
    const defaultUnit = isHotel ? 'per night' : isTransport ? 'per person' : isRestaurant ? 'per person' : 'fixed';

    setQuickAddForm({
      listingTitle: `${app.business_name} Service`,
      category: app.category || 'Hotel',
      city: app.city || '',
      state: app.state || '',
      price: defaultPrice,
      capacity: defaultCapacity,
      priceUnit: defaultUnit,
      availability: 'Available daily with advance confirmation',
      terms: 'Free cancellation up to 24 hours before service.',
      listingDescription: app.business_details || `Official verified service listing for ${app.business_name}.`,
      publishImmediately: true
    });
    setQuickAddModal(app);
  };

  const handleCreateQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddModal) return;
    setQuickAddLoading(true);
    try {
      const payload = {
        applicationId: quickAddModal.id,
        listingTitle: quickAddForm.listingTitle.trim(),
        listingDescription: quickAddForm.listingDescription.trim(),
        category: quickAddForm.category,
        locationOrRoute: `${quickAddForm.city}, ${quickAddForm.state}`.trim(),
        city: quickAddForm.city.trim(),
        state: quickAddForm.state.trim(),
        price: quickAddForm.price ? parseFloat(quickAddForm.price) : 0,
        capacity: parseInt(quickAddForm.capacity, 10) || 1,
        priceUnit: quickAddForm.priceUnit,
        availability: quickAddForm.availability.trim(),
        terms: quickAddForm.terms.trim()
      };

      const res = await api.post('/listings/admin', payload);
      if (res.data.success) {
        const listingId = res.data.listing?.id;
        if (quickAddForm.publishImmediately && listingId) {
          try {
            await api.patch(`/listings/admin/${listingId}/publish`);
          } catch (pubErr) {
            console.warn('Publish warning:', pubErr);
          }
        }
        setActionMsg(`Service listing "${quickAddForm.listingTitle}" created and published successfully for ${quickAddModal.business_name}!`);
        setQuickAddModal(null);
        setTimeout(() => setActionMsg(null), 6000);
      } else {
        setActionMsg('Failed to create listing: ' + (res.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Quick Add Listing error:', err);
      setActionMsg('Failed to create listing: ' + (err.response?.data?.message || err.message || 'Server error'));
    } finally {
      setQuickAddLoading(false);
    }
  };

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadApplications();
  }, [statusFilter, page, searchQuery, dateFrom, dateTo, categoryFilter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      params.set('page', page);
      params.set('limit', '20');
      if (searchQuery.trim()) params.set('partner', searchQuery.trim());
      if (categoryFilter) params.set('category', categoryFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await api.get(`/partner/admin/applications?${params}`);
      if (res.data.success) {
        setApplications(res.data.applications.map(normalizeApplication));
        setTotalCount(res.data.pagination?.total || res.data.applications.length);
      }
    } catch (err) {
      console.error('Failed to load partner applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationDetail = async (id) => {
    setViewLoading(true);
    try {
      const res = await api.get(`/partner/admin/applications/${id}`);
      if (res.data.success) {
        setSelectedApp(normalizeApplication({
          ...res.data.application,
          documents: res.data.documents
        }));
      }
    } catch (err) {
      console.error('Failed to load application detail:', err);
    } finally {
      setViewLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = selectedApp ? `?application_id=${selectedApp.id}` : '';
      const res = await api.get(`/partner/admin/audit-logs${params}`);
      if (res.data.success) {
        setAuditLogs((res.data.auditLogs || []).map(log => ({
          ...log,
          application_id: log.applicationId,
          previous_status: log.previousStatus,
          new_status: log.newStatus,
          business_name: log.businessName,
          admin_name: log.adminName
        })));
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    const token = localStorage.getItem('touristhub_token');
    if (!token) {
      setActionMsg('Authentication session expired. Please log in again to review applications.');
      return;
    }
    setReviewLoading(true);
    try {
      const res = await api.patch(`/partner/admin/applications/${reviewModal.id}/review`, {
        action: reviewModal.action,
        note: reviewNote.trim()
      });
      if (res.data.success) {
        const newStatus = reviewModal.action === 'approve' ? 'Approved' : 'Rejected';
        setActionMsg(res.data.message || `Application ${newStatus} successfully.`);
        setApplications(prev => prev.map(a =>
          a.id === reviewModal.id ? { ...a, status: newStatus, admin_note: reviewNote.trim() } : a
        ));
        if (selectedApp?.id === reviewModal.id) {
          setSelectedApp(prev => ({ ...prev, status: newStatus, admin_note: reviewNote.trim() }));
        }
        setReviewModal(null);
        setReviewNote('');
        setTimeout(() => setActionMsg(null), 4000);
      }
    } catch (err) {
      const currentStatus = err.response?.data?.application?.status;
      if (currentStatus && selectedApp?.id === reviewModal.id) {
        setSelectedApp(prev => ({ ...prev, status: currentStatus }));
        setApplications(prev => prev.map(application =>
          application.id === reviewModal.id ? { ...application, status: currentStatus } : application
        ));
      }
      if (err.response?.status === 401 || err.response?.status === 403) {
        setActionMsg('Authentication failed: Your session has expired or you do not have admin permissions. Please log in again.');
      } else {
        setActionMsg('Failed to process review: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      }
    } finally {
      setReviewLoading(false);
    }
  };

  const filteredApps = applications.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.business_name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q)
    );
  });

  const pendingCount = applications.filter(a => a.status === 'Pending').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} color="#0284c7" />
            Partner Applications
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>
            Review and manage business partner registrations
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {pendingCount > 0 && (
            <span style={{
              background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
              padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Clock size={13} />
              {pendingCount} Pending
            </span>
          )}
          <button
            onClick={loadApplications}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '7px 12px',
              fontSize: '0.82rem', fontWeight: '600', color: '#475569', cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div style={{
          background: actionMsg.startsWith('Failed') ? '#fee2e2' : '#dcfce7',
          color: actionMsg.startsWith('Failed') ? '#991b1b' : '#166534',
          padding: '10px 16px', borderRadius: '10px', marginBottom: '16px',
          fontWeight: '600', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          {actionMsg}
          <button onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <input
            type="text"
            placeholder="Search by name, email, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ padding: '8px 12px 8px 34px', fontSize: '0.82rem' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '11px', color: '#94a3b8' }} />
        </div>

        <select aria-label="Filter application category" className="form-control" value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); setPage(1); }} style={{ width: 'auto', minWidth: 150 }}>
          <option value="">All categories</option>
          {Object.keys(CATEGORY_ICONS).map(category => <option key={category}>{category}</option>)}
        </select>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', whiteSpace: 'nowrap' }}>From</span>
          <input
            aria-label="Submitted from"
            className="form-control"
            type="date"
            value={dateFrom}
            onChange={event => { setDateFrom(event.target.value); setPage(1); }}
            style={{ width: 'auto', minWidth: '135px', height: '38px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', background: 'white', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', whiteSpace: 'nowrap' }}>To</span>
          <input
            aria-label="Submitted to"
            className="form-control"
            type="date"
            value={dateTo}
            onChange={event => { setDateTo(event.target.value); setPage(1); }}
            style={{ width: 'auto', minWidth: '135px', height: '38px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', background: 'white', boxSizing: 'border-box' }}
          />
        </div>

        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            style={{
              height: '38px', padding: '0 10px', fontSize: '0.76rem', fontWeight: '700',
              color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: '8px',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center'
            }}
          >
            Clear Dates
          </button>
        )}

        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                border: 'none', cursor: 'pointer', borderRadius: '6px',
                padding: '5px 12px', fontSize: '0.8rem', fontWeight: '600',
                background: statusFilter === s ? 'white' : 'transparent',
                color: statusFilter === s ? '#0284c7' : '#64748b',
                boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setShowAudit(!showAudit); if (!showAudit) loadAuditLogs(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: showAudit ? '#e0f2fe' : 'white',
            border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '7px 12px', fontSize: '0.82rem', fontWeight: '600',
            color: showAudit ? '#0284c7' : '#475569', cursor: 'pointer'
          }}
        >
          <ShieldCheck size={14} />
          Audit Log
        </button>
      </div>

      {/* Audit Log Panel */}
      {showAudit && (
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
          padding: '16px', marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Admin Audit Records</h4>
            <button onClick={() => setShowAudit(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={16} />
            </button>
          </div>
          {auditLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>Loading...</div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>No audit records found.</div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  padding: '10px 0', borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: log.new_status === 'Approved' ? '#dcfce7' : log.new_status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: log.new_status === 'Approved' ? '#166534' : log.new_status === 'Rejected' ? '#991b1b' : '#92400e'
                  }}>
                    {log.new_status === 'Approved' ? <CheckCircle size={15} /> : log.new_status === 'Rejected' ? <XCircle size={15} /> : <Clock size={15} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: '600', color: '#0f172a' }}>
                      Application #{log.application_id} — {log.previous_status} → <strong>{log.new_status}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      By {log.admin_name || 'Admin'} · {new Date(log.created_at).toLocaleString('en-IN')}
                    </div>
                    {log.note && (
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', fontStyle: 'italic' }}>
                        "{log.note}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main layout: list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '1fr 1.4fr' : '1fr', gap: '16px', alignItems: 'start' }}>
        {/* Applications list */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <RefreshCw size={22} className="spin" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem' }}>Loading applications...</div>
            </div>
          ) : filteredApps.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <Briefcase size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>No applications found</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                {statusFilter !== 'All' ? `No ${statusFilter} applications` : 'No applications yet'}
              </div>
            </div>
          ) : (
            filteredApps.map(app => (
              <div
                key={app.id}
                onClick={() => { setSelectedApp(null); loadApplicationDetail(app.id); }}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: selectedApp?.id === app.id ? '#f0f9ff' : 'transparent',
                  borderLeft: selectedApp?.id === app.id ? '3px solid #0284c7' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (selectedApp?.id !== app.id) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (selectedApp?.id !== app.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1rem' }}>{CATEGORY_ICONS[app.category] || '🏢'}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.business_name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{app.category}</span>
                      <span>·</span>
                      <span>{app.city}, {app.state}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                      {app.email} · {app.document_count || 0} docs
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
                  Submitted {new Date(app.created_at).toLocaleDateString('en-IN')}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Application Detail Panel */}
        {viewLoading ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={22} className="spin" />
          </div>
        ) : selectedApp ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            {/* Detail header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Application #{selectedApp.id}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  {CATEGORY_ICONS[selectedApp.category] || '🏢'} {selectedApp.business_name}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <StatusBadge status={selectedApp.status} />
                <button
                  onClick={() => setSelectedApp(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Business info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Category', value: selectedApp.category, icon: Briefcase },
                  { label: 'Contact Person', value: selectedApp.contact_person, icon: Building2 },
                  { label: 'Email', value: selectedApp.email, icon: Mail },
                  { label: 'Phone', value: selectedApp.phone, icon: Phone },
                  { label: 'GST Number', value: selectedApp.gst_number || '—', icon: ShieldCheck },
                  { label: 'Submitted', value: new Date(selectedApp.created_at).toLocaleDateString('en-IN'), icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon size={10} /> {label}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={10} /> Address
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                  {selectedApp.address}, {selectedApp.city}, {selectedApp.state} — {selectedApp.pincode}
                </div>
              </div>

              {/* Business details */}
              {selectedApp.business_details && (
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Business Details</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>{selectedApp.business_details}</div>
                </div>
              )}

              {/* Admin note */}
              {selectedApp.admin_note && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={10} /> Admin Note
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#78350f' }}>{selectedApp.admin_note}</div>
                </div>
              )}

              {/* Documents */}
              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="#0284c7" />
                    Uploaded Documents ({selectedApp.documents.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedApp.documents.map(doc => (
                      <div key={doc.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#f0f9ff', border: '1px solid rgba(2,132,199,0.15)',
                        borderRadius: '8px', padding: '8px 12px'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a' }}>{doc.document_type}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {doc.original_name} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)}KB` : ''}
                          </div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/partner/admin/documents/${doc.id}${localStorage.getItem('touristhub_token') ? `?token=${encodeURIComponent(localStorage.getItem('touristhub_token'))}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            color: '#0284c7', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '600',
                            background: '#e0f2fe', borderRadius: '6px', padding: '4px 10px'
                          }}
                          title="View Document (Admin Only)"
                        >
                          <ExternalLink size={12} />
                          View PDF
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review actions */}
              {selectedApp.status === 'Pending' && (
                <div style={{
                  display: 'flex', gap: '10px', paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <button
                    onClick={() => { setReviewModal({ id: selectedApp.id, action: 'approve' }); setReviewNote(''); }}
                    title="Approve and email the one-time setup link"
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      background: '#059669', color: 'white', border: 'none',
                      borderRadius: '10px', padding: '11px 16px', fontWeight: '700',
                      fontSize: '0.85rem', cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                    onMouseLeave={e => e.currentTarget.style.background = '#059669'}
                  >
                    <CheckCircle size={16} />
                    Approve Application
                  </button>
                  <button
                    onClick={() => { setReviewModal({ id: selectedApp.id, action: 'reject' }); setReviewNote(''); }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      background: '#dc2626', color: 'white', border: 'none',
                      borderRadius: '10px', padding: '11px 16px', fontWeight: '700',
                      fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
                  >
                    <XCircle size={16} />
                    Reject Application
                  </button>
                </div>
              )}

              {selectedApp.status !== 'Pending' && (
                <div style={{
                  background: '#f8fafc', borderRadius: '8px', padding: '10px 14px',
                  fontSize: '0.8rem', color: '#64748b', marginTop: '8px',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <ShieldCheck size={13} color="#94a3b8" />
                  Reviewed by Admin on {selectedApp.reviewed_at ? new Date(selectedApp.reviewed_at).toLocaleDateString('en-IN') : '—'}
                </div>
              )}
              {/* Quick Add Action Workflow */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                {selectedApp.status === 'Approved' ? (
                  <button
                    type="button"
                    onClick={() => openQuickAddModal(selectedApp)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#0284c7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 18px',
                      fontWeight: '700',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0369a1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Plus size={18} />
                    Quick Add Service for {selectedApp.business_name}
                  </button>
                ) : (
                  <button
                    disabled
                    title="Quick Add is only available after administrator approves this application."
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '11px 18px',
                      fontWeight: '600',
                      fontSize: '0.84rem',
                      cursor: 'not-allowed'
                    }}
                  >
                    <Plus size={15} />
                    Quick Add Service (Requires Approval)
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>


      {/* Quick Add Service Listing Modal */}
      {quickAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', maxWidth: '640px', width: '100%',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Plus size={20} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>
                    Quick Add Service Listing
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Partner: <strong>{quickAddModal.business_name}</strong> ({quickAddModal.category || 'Business'})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateQuickAdd} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Service / Listing Title *
                </label>
                <input
                  type="text"
                  required
                  value={quickAddForm.listingTitle}
                  onChange={e => setQuickAddForm({ ...quickAddForm, listingTitle: e.target.value })}
                  placeholder="e.g. Luxury AC Sleeper / Deluxe Suite / Tour Package"
                  className="form-control"
                  style={{ height: '38px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    value={quickAddForm.category}
                    onChange={e => setQuickAddForm({ ...quickAddForm, category: e.target.value })}
                    className="form-control"
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  >
                    {['Hotel', 'Bus Operator', 'Tour & Travel', 'Restaurant', 'Adventure', 'Guide', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Price Unit *
                  </label>
                  <select
                    value={quickAddForm.priceUnit}
                    onChange={e => setQuickAddForm({ ...quickAddForm, priceUnit: e.target.value })}
                    className="form-control"
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  >
                    <option value="per night">per night</option>
                    <option value="per person">per person</option>
                    <option value="per day">per day</option>
                    <option value="per trip">per trip</option>
                    <option value="fixed">fixed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={quickAddForm.city}
                    onChange={e => setQuickAddForm({ ...quickAddForm, city: e.target.value })}
                    placeholder="e.g. Mysuru / Bengaluru"
                    className="form-control"
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={quickAddForm.state}
                    onChange={e => setQuickAddForm({ ...quickAddForm, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className="form-control"
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={quickAddForm.price}
                    onChange={e => setQuickAddForm({ ...quickAddForm, price: e.target.value })}
                    placeholder="2500"
                    className="form-control"
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Total Capacity / Units *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={quickAddForm.capacity}
                    onChange={e => setQuickAddForm({ ...quickAddForm, capacity: e.target.value })}
                    placeholder="10"
                    className="form-control"
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Availability Schedule
                </label>
                <input
                  type="text"
                  value={quickAddForm.availability}
                  onChange={e => setQuickAddForm({ ...quickAddForm, availability: e.target.value })}
                  placeholder="e.g. Daily departures 9:00 PM / Check-in 12:00 PM"
                  className="form-control"
                  style={{ height: '38px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Service Description
                </label>
                <textarea
                  rows={3}
                  value={quickAddForm.listingDescription}
                  onChange={e => setQuickAddForm({ ...quickAddForm, listingDescription: e.target.value })}
                  placeholder="Official verified service listing details..."
                  className="form-control"
                  style={{ fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Terms & Cancellation Policy
                </label>
                <input
                  type="text"
                  value={quickAddForm.terms}
                  onChange={e => setQuickAddForm({ ...quickAddForm, terms: e.target.value })}
                  placeholder="e.g. Free cancellation up to 24 hours prior to travel."
                  className="form-control"
                  style={{ height: '38px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px',
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <input
                  type="checkbox"
                  id="publishImmediately"
                  checked={quickAddForm.publishImmediately}
                  onChange={e => setQuickAddForm({ ...quickAddForm, publishImmediately: e.target.checked })}
                  style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#16a34a' }}
                />
                <label htmlFor="publishImmediately" style={{ fontSize: '0.83rem', color: '#166534', fontWeight: '600', cursor: 'pointer' }}>
                  Publish immediately to public service catalogue (Live for tourists to book)
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setQuickAddModal(null)}
                  style={{
                    flex: 1, padding: '11px', border: '1px solid #cbd5e1',
                    borderRadius: '8px', background: 'white', color: '#475569',
                    fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAddLoading}
                  style={{
                    flex: 1.5, padding: '11px', border: 'none',
                    borderRadius: '8px', background: '#0284c7',
                    color: 'white', fontWeight: '700', fontSize: '0.85rem',
                    cursor: quickAddLoading ? 'not-allowed' : 'pointer',
                    opacity: quickAddLoading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {quickAddLoading ? (
                    <><RefreshCw size={14} className="spin" /> Creating Listing...</>
                  ) : (
                    <><Plus size={16} /> Create & Publish Service</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Confirmation Modal */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            maxWidth: '440px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {reviewModal.action === 'approve' ? (
                  <><CheckCircle size={20} color="#059669" /> Approve Application</>
                ) : (
                  <><XCircle size={20} color="#dc2626" /> Reject Application</>
                )}
              </h3>
              <button onClick={() => setReviewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.87rem', color: '#475569', marginBottom: '16px', lineHeight: 1.6 }}>
              {reviewModal.action === 'approve'
                ? 'Approving this application will allow the business to create a partner account and be listed on the platform.'
                : 'Rejecting this application will notify the applicant. They may correct issues and reapply.'}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                Admin Note {reviewModal.action === 'reject' ? '(Recommended — explain reason)' : '(Optional)'}
              </label>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder={reviewModal.action === 'reject'
                  ? 'e.g. Documents are unclear. Please upload higher quality scans of your license.'
                  : 'Optional internal note...'}
                rows={3}
                className="form-control"
                style={{ resize: 'vertical', fontSize: '0.85rem' }}
              />
              {reviewModal.action === 'reject' && !reviewNote.trim() && (
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={11} />
                  A rejection note helps the applicant understand and correct their application.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setReviewModal(null)}
                style={{
                  flex: 1, padding: '10px', border: '1px solid #e2e8f0',
                  borderRadius: '10px', background: 'white', color: '#475569',
                  fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewLoading}
                style={{
                  flex: 1, padding: '10px', border: 'none',
                  borderRadius: '10px',
                  background: reviewModal.action === 'approve' ? '#059669' : '#dc2626',
                  color: 'white', fontWeight: '700', fontSize: '0.85rem',
                  cursor: reviewLoading ? 'not-allowed' : 'pointer',
                  opacity: reviewLoading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {reviewLoading ? (
                  <><RefreshCw size={14} className="spin" /> Processing...</>
                ) : (
                  reviewModal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
