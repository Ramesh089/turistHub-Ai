import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Check, RefreshCw, X } from 'lucide-react';

const FIELDS = [
  ['listingTitle', 'Title'],
  ['listingDescription', 'Description'],
  ['category', 'Category'],
  ['locationOrRoute', 'Location or route'],
  ['city', 'City'],
  ['state', 'State'],
  ['price', 'Price'],
  ['capacity', 'Capacity (admin only)'],
  ['priceUnit', 'Price unit'],
  ['availability', 'Availability'],
  ['terms', 'Terms']
];

function displayValue(key, value, data) {
  if (key === 'price' && value != null && value !== '') {
    return `₹${Number(value).toLocaleString('en-IN')} ${data.priceUnit || ''}`.trim();
  }
  return value == null || value === '' ? '—' : String(value);
}

export default function PartnerServiceChangesAdmin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/listings/admin/change-requests');
      setRequests(response.data.changeRequests || []);
      setMessage(null);
    } catch (error) {
      const errText = error.response?.data?.message || 'Could not load service update requests.';
      const isAuthError = error.response?.status === 401 || error.response?.status === 403 || errText.includes('token') || errText.includes('Access denied');
      setMessage({
        error: true,
        isAuthError,
        text: isAuthError ? 'Your administrator session has expired or requires authentication. Please log in again.' : errText
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const review = async (request, action) => {
    const note = action === 'reject'
      ? window.prompt('Feedback for the partner (required):') || ''
      : window.prompt('Optional note for the partner:') || '';
    if (action === 'reject' && !note.trim()) {
      setMessage({ error: true, text: 'A feedback note is required to reject an update request.' });
      return;
    }
    setBusyId(request.id);
    setMessage(null);
    try {
      await api.patch(`/listings/admin/change-requests/${request.id}/review`, { action, note });
      setMessage({
        error: false,
        text: action === 'approve'
          ? 'Update approved and applied to the service listing.'
          : 'Update rejected. The published service remains unchanged.'
      });
      await load();
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not review this update request.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>Service update requests</h2>
          <p style={{ margin: '5px 0 0', color: '#64748b' }}>Compare partner proposals with live listing values before approving.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      {message && (
        <div role="status" style={{
          padding: 14, borderRadius: 10,
          background: message.error ? '#fee2e2' : '#dcfce7',
          border: `1px solid ${message.error ? '#fecaca' : '#bbf7d0'}`,
          color: message.error ? '#991b1b' : '#166534',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
        }}>
          <span>{message.text}</span>
          {message.isAuthError && (
            <a href="/login" style={{
              background: '#dc2626', color: 'white', padding: '6px 14px', borderRadius: '7px',
              fontWeight: '700', fontSize: '0.8rem', textDecoration: 'none'
            }}>
              Log In Again
            </a>
          )}
        </div>
      )}
      {loading ? <p style={{ color: '#64748b' }}>Loading update requests…</p>
        : requests.length === 0 ? <p style={{ color: '#64748b' }}>No service update requests have been submitted.</p>
          : requests.map(request => (
            <article key={request.id} style={{ display: 'grid', gap: 12, padding: 16, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>{request.listingTitle}</strong>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{request.businessName} · {request.partnerEmail} · {request.category}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>Submitted {new Date(request.createdAt).toLocaleString()}</div>
                </div>
                <strong style={{ color: request.status === 'Pending' ? '#92400e' : request.status === 'Approved' ? '#166534' : '#991b1b' }}>{request.status}</strong>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {FIELDS.map(([key, label]) => {
                  const current = displayValue(key, request.currentData?.[key], request.currentData || {});
                  const proposed = displayValue(key, request.proposedData?.[key], request.proposedData || {});
                  if (current === proposed) return null;
                  return (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 0.4fr) 1fr 1fr', gap: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 7 }}>
                      <strong>{label}</strong>
                      <span><small>Current: </small>{current}</span>
                      <span><small>Proposed: </small>{proposed}</span>
                    </div>
                  );
                })}
              </div>
              {request.adminNote && <div style={{ padding: 10, borderRadius: 8, background: '#eff6ff', color: '#1e3a8a' }}><strong>Previous feedback:</strong> {request.adminNote}</div>}
              {request.status === 'Pending' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-primary" disabled={busyId === request.id} onClick={() => review(request, 'approve')} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <Check size={14} /> Approve update
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={busyId === request.id} onClick={() => review(request, 'reject')} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <X size={14} /> Reject with feedback
                  </button>
                </div>
              )}
            </article>
          ))}
    </section>
  );
}
