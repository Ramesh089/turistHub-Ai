import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { Check, Eye, FileImage, RefreshCw, Save, Send, Trash2, X } from 'lucide-react';

const STATUSES = ['All', 'Submitted', 'Changes Requested', 'Rejected', 'Draft', 'Published', 'Unpublished', 'Archived'];
const CATEGORIES = ['Hotel', 'Bus Operator', 'Tour & Travel', 'Restaurant', 'Adventure', 'Guide', 'Other'];
const PRICE_UNITS = ['per night', 'per day', 'per person', 'per trip', 'fixed'];
const initialFilters = { status: 'Submitted', category: '', partner: '', dateFrom: '', dateTo: '' };
const listingFields = [
  ['listingTitle', 'Listing title'],
  ['listingDescription', 'Description'],
  ['category', 'Category'],
  ['locationOrRoute', 'Location or route'],
  ['city', 'City'],
  ['state', 'State'],
  ['price', 'Price (₹)'],
  ['capacity', 'Capacity (admin only)'],
  ['priceUnit', 'Price unit'],
  ['availability', 'Availability'],
  ['terms', 'Terms']
];

function imageSource(image) {
  const origin = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${origin}${image.adminImageUrl}`;
}

export default function PartnerListingsAdmin() {
  const [filters, setFilters] = useState(initialFilters);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'All') params.set(key, value);
      });
      params.set('limit', '100');
      const response = await api.get(`/listings/admin?${params}`);
      setListings(response.data.listings || []);
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not load partner listings.' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const loadDetail = async (id) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await api.get(`/listings/admin/${id}`);
      setSelected(response.data.listing);
      setForm({ ...response.data.listing, extraInfo: response.data.listing.extraInfo || '' });
      setAuditLogs(response.data.auditLogs || []);
      setSubmissionHistory(response.data.submissionHistory || []);
      setPreview(false);
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not load listing details.' });
    } finally {
      setBusy(false);
    }
  };

  const updateListing = async () => {
    if (!selected || !form) return;
    let extraInfo = form.extraInfo;
    if (typeof extraInfo === 'string' && extraInfo.trim()) {
      try {
        extraInfo = JSON.parse(extraInfo);
      } catch {
        setMessage({ error: true, text: 'Category-specific details must be valid JSON.' });
        return;
      }
    } else if (!extraInfo) {
      extraInfo = null;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = { ...form, extraInfo, price: form.price === '' ? null : Number(form.price) };
      payload.capacity = Number(form.capacity);
      const response = await api.put(`/listings/admin/${selected.id}`, payload);
      setSelected(response.data.listing);
      setForm({ ...response.data.listing, extraInfo: response.data.listing.extraInfo || '' });
      setMessage({ error: false, text: 'Listing edits saved and recorded in the audit history.' });
      await loadDetail(selected.id);
      await loadListings();
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not save listing edits.' });
    } finally {
      setBusy(false);
    }
  };

  const review = async (action) => {
    if (!selected) return;
    let note = '';
    if (action !== 'approve') {
      note = window.prompt(action === 'reject' ? 'Reason for rejecting this submission:' : 'Corrections required from the partner:') || '';
      if (!note.trim()) {
        setMessage({ error: true, text: 'A reason is required for rejection or correction requests.' });
        return;
      }
    }
    setBusy(true);
    setMessage(null);
    try {
      await api.patch(`/listings/admin/${selected.id}/review`, { action, note });
      setMessage({ error: false, text: action === 'request_changes' ? 'Corrections requested.' : `Submission ${action === 'approve' ? 'approved' : 'rejected'}.` });
      await loadDetail(selected.id);
      await loadListings();
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not review this submission.' });
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.patch(`/listings/admin/${selected.id}/publish`);
      setMessage({ error: false, text: 'Listing published and visible to tourists.' });
      await loadDetail(selected.id);
      await loadListings();
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not publish listing.' });
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.patch(`/listings/admin/${selected.id}/unpublish`);
      setMessage({ error: false, text: 'Listing unpublished.' });
      await loadDetail(selected.id);
      await loadListings();
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not unpublish listing.' });
    } finally {
      setBusy(false);
    }
  };

  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !selected) return;
    const data = new FormData();
    files.forEach(file => data.append('images', file));
    data.append('isPrimary', selected.images?.length ? 'false' : 'true');
    setBusy(true);
    setMessage(null);
    try {
      await api.post(`/listings/admin/${selected.id}/images`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ error: false, text: 'Listing image(s) uploaded.' });
      await loadDetail(selected.id);
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not upload listing images.' });
    } finally {
      setBusy(false);
    }
  };

  const updateImage = async (image, patch) => {
    setBusy(true);
    setMessage(null);
    try {
      await api.patch(`/listings/admin/${selected.id}/images/${image.id}`, patch);
      await loadDetail(selected.id);
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not update image details.' });
    } finally {
      setBusy(false);
    }
  };

  const removeImage = async (image) => {
    if (!window.confirm(`Remove "${image.originalName}" from this listing?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.delete(`/listings/admin/${selected.id}/images/${image.id}`);
      setMessage({ error: false, text: 'Listing image removed.' });
      await loadDetail(selected.id);
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not remove listing image.' });
    } finally {
      setBusy(false);
    }
  };

  const fieldInput = (key) => {
    const common = {
      value: form?.[key] ?? '',
      onChange: event => setForm(current => ({ ...current, [key]: event.target.value })),
      className: 'form-control'
    };
    if (key === 'category') {
      return <select {...common}>{CATEGORIES.map(item => <option key={item}>{item}</option>)}</select>;
    }
    if (key === 'priceUnit') {
      return <select {...common}><option value="">Select unit</option>{PRICE_UNITS.map(item => <option key={item}>{item}</option>)}</select>;
    }
    if (key === 'listingDescription' || key === 'availability' || key === 'terms') {
      return <textarea {...common} rows={key === 'listingDescription' ? 5 : 3} maxLength={key === 'listingDescription' ? 10000 : 5000} />;
    }
    if (key === 'price') {
      return <input {...common} type="number" min="0" step="0.01" />;
    }
    if (key === 'capacity') {
      return <input {...common} type="number" min="1" max="1000000" step="1" />;
    }
    return <input {...common} maxLength={key === 'listingTitle' ? 255 : 255} />;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(0, 1.5fr)', gap: 18, alignItems: 'start' }}>
      <aside style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Partner listing queue</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadListings} aria-label="Refresh queue"><RefreshCw size={15} /></button>
        </div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          <select className="form-control" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}>
            {STATUSES.map(status => <option key={status}>{status}</option>)}
          </select>
          <select className="form-control" value={filters.category} onChange={event => setFilters(current => ({ ...current, category: event.target.value }))}>
            <option value="">All categories</option>{CATEGORIES.map(category => <option key={category}>{category}</option>)}
          </select>
          <input className="form-control" placeholder="Partner/business name" value={filters.partner} onChange={event => setFilters(current => ({ ...current, partner: event.target.value }))} />
          <label className="form-label">Submitted from<input className="form-control" type="date" value={filters.dateFrom} onChange={event => setFilters(current => ({ ...current, dateFrom: event.target.value }))} /></label>
          <label className="form-label">Submitted to<input className="form-control" type="date" value={filters.dateTo} onChange={event => setFilters(current => ({ ...current, dateTo: event.target.value }))} /></label>
        </div>
        {loading ? <div style={{ padding: 15, color: '#64748b' }}>Loading queue…</div> : listings.length === 0 ? (
          <div style={{ padding: 15, color: '#64748b' }}>No listings match these filters.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8, maxHeight: '70vh', overflowY: 'auto' }}>
            {listings.map(listing => (
              <button type="button" key={listing.id} onClick={() => loadDetail(listing.id)} style={{
                textAlign: 'left', border: selected?.id === listing.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: selected?.id === listing.id ? '#f0f9ff' : 'white', borderRadius: 9, padding: 11, cursor: 'pointer'
              }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>{listing.listingTitle}</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{listing.businessName} · {listing.category}</span>
                <span style={{ display: 'block', marginTop: 4, fontSize: '0.75rem', color: '#475569' }}>Capacity: {listing.capacity} · Booked: {listing.bookedUnits}</span>
                <span style={{ display: 'block', marginTop: 5, fontSize: '0.75rem', color: '#475569' }}>{listing.status} · {new Date(listing.createdAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}
      </aside>

      <main style={{ minWidth: 0 }}>
        {message && (
          <div role="status" style={{
            padding: 11, borderRadius: 9, marginBottom: 12,
            color: message.error ? '#991b1b' : '#166534',
            background: message.error ? '#fee2e2' : '#dcfce7'
          }}>{message.text}</div>
        )}
        {!selected || !form ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 30, textAlign: 'center', color: '#64748b' }}>
            <FileImage size={28} style={{ marginBottom: 8 }} />
            <div>Select a partner submission to review and prepare its public listing.</div>
          </div>
        ) : busy ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading or saving…</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>{selected.listingTitle}</h3>
                  <div style={{ marginTop: 4, color: '#64748b', fontSize: '0.82rem' }}>
                    {selected.businessName} · {selected.partnerEmail} · {selected.category} · submitted {new Date(selected.createdAt).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 6, color: '#334155', fontSize: '0.82rem' }}>
                    Capacity: {selected.capacity} · Booked: {selected.bookedUnits ?? 0}
                  </div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSelected(null); setForm(null); }} aria-label="Close listing review"><X size={15} /></button>
              </div>
              {selected.adminNote && <div style={{ marginBottom: 12, padding: 10, background: '#eff6ff', borderRadius: 8, color: '#1e3a8a' }}><strong>Previous decision note:</strong> {selected.adminNote}</div>}

              {submissionHistory.length > 0 && (
                <details style={{ marginBottom: 12 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#334155' }}>Partner-submitted versions ({submissionHistory.length})</summary>
                  {submissionHistory.map((entry, index) => (
                    <div key={`${entry.submittedAt}-${index}`} style={{ marginTop: 9, padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: 6 }}>{new Date(entry.submittedAt).toLocaleString()}</div>
                      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, margin: 0 }}>
                        {Object.entries(entry.data || {}).map(([key, value]) => <div key={key}><dt style={{ fontSize: '0.72rem', color: '#64748b' }}>{key}</dt><dd style={{ margin: 0, fontSize: '0.82rem', color: '#0f172a' }}>{value ?? '—'}</dd></div>)}
                      </dl>
                    </div>
                  ))}
                </details>
              )}
            </section>

            <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Final tourist listing</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreview(value => !value)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={14} /> {preview ? 'Edit listing' : 'Preview'}
                </button>
              </div>
              {preview ? (
                <article style={{ maxWidth: 520, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  {selected.images?.[0] && <img src={imageSource(selected.images.find(image => image.isPrimary) || selected.images[0])} alt={(selected.images.find(image => image.isPrimary) || selected.images[0]).altText || form.listingTitle} style={{ width: '100%', height: 220, objectFit: 'cover' }} />}
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>{form.category} · {[form.city, form.state].filter(Boolean).join(', ')}</div>
                    <h4 style={{ margin: '6px 0', color: '#0f172a', fontSize: '1.15rem' }}>{form.listingTitle || 'Listing title'}</h4>
                    <p style={{ margin: '8px 0', color: '#475569', whiteSpace: 'pre-wrap' }}>{form.listingDescription}</p>
                    {form.price !== '' && <strong style={{ color: '#0284c7' }}>₹{Number(form.price).toLocaleString('en-IN')} {form.priceUnit}</strong>}
                    {form.availability && <p style={{ color: '#475569' }}>Availability: {form.availability}</p>}
                    {form.terms && <small style={{ color: '#64748b' }}>Terms: {form.terms}</small>}
                  </div>
                </article>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 11 }}>
                  {listingFields.map(([key, label]) => (
                    <label key={key} className="form-label" style={['listingDescription', 'availability', 'terms'].includes(key) ? { gridColumn: '1 / -1' } : undefined}>
                      {label}{fieldInput(key)}
                    </label>
                  ))}
                  <label className="form-label" style={{ gridColumn: '1 / -1' }}>Category-specific details (JSON)
                    <textarea className="form-control" rows="3" value={typeof form.extraInfo === 'string' ? form.extraInfo : JSON.stringify(form.extraInfo || {}, null, 2)} onChange={event => setForm(current => ({ ...current, extraInfo: event.target.value }))} />
                  </label>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={updateListing} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Save size={14} /> Save edits</button>
                {selected.status === 'Submitted' && <>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => review('request_changes')} disabled={busy}>Request corrections</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => review('reject')} disabled={busy}>Reject</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => review('approve')} disabled={busy}><Check size={14} /> Approve for publication</button>
                </>}
                {['Draft', 'Unpublished'].includes(selected.status) && <button type="button" className="btn btn-primary btn-sm" onClick={publish} disabled={busy}><Send size={14} /> Publish</button>}
                {selected.status === 'Published' && <button type="button" className="btn btn-secondary btn-sm" onClick={unpublish} disabled={busy}>Unpublish</button>}
              </div>
            </section>

            <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 10px', color: '#0f172a' }}>Public listing images</h3>
              <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '0.82rem' }}>Images remain inaccessible to tourists until the listing is published. JPEG, PNG, or WebP; maximum 8 MB each.</p>
              <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <FileImage size={14} /> Add images
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={uploadImages} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
                {(selected.images || []).map(image => (
                  <div key={image.id} style={{ border: '1px solid #e2e8f0', borderRadius: 9, overflow: 'hidden' }}>
                    <img src={imageSource(image)} alt={image.altText || image.originalName} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    <div style={{ padding: 9, display: 'grid', gap: 7 }}>
                      <input className="form-control" aria-label="Alt text" placeholder="Alt text" maxLength={255} defaultValue={image.altText || ''} onBlur={event => event.target.value !== (image.altText || '') && updateImage(image, { altText: event.target.value })} />
                      <input className="form-control" aria-label="Caption" placeholder="Caption" maxLength={255} defaultValue={image.caption || ''} onBlur={event => event.target.value !== (image.caption || '') && updateImage(image, { caption: event.target.value })} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.76rem', color: '#475569' }}><input type="radio" name={`primary-${selected.id}`} checked={image.isPrimary} onChange={() => updateImage(image, { isPrimary: true })} /> Primary</label>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeImage(image)} aria-label="Remove image"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {auditLogs.length > 0 && (
              <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: '0 0 10px', color: '#0f172a' }}>Review and edit history</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  {auditLogs.map(log => <div key={log.id} style={{ padding: 9, background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem', color: '#334155' }}>
                    <strong>{log.action}</strong> · {log.actorRole || 'Admin'} · {new Date(log.createdAt).toLocaleString()}
                    {log.note && <div>{log.note}</div>}
                  </div>)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
