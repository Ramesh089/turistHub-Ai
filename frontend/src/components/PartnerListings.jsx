import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { AlertTriangle, Clock, FilePlus2, RefreshCw, Send, Zap } from 'lucide-react';

const CATEGORIES = ['Hotel', 'Bus Operator', 'Tour & Travel', 'Restaurant', 'Adventure', 'Guide', 'Other'];
const PRICE_UNITS = ['per night', 'per day', 'per person', 'per trip', 'fixed'];

const PRESETS = {
  Hotel: [
    { title: 'Deluxe AC Room', price: '2500', priceUnit: 'per night', availability: 'Available daily', desc: 'Spacious air-conditioned room with king-size bed, attached bathroom, high-speed Wi-Fi, and breakfast included.' },
    { title: 'Standard Double Room', price: '1500', priceUnit: 'per night', availability: 'Available daily', desc: 'Comfortable double room with essential amenities, room service, and hot water supply.' }
  ],
  'Bus Operator': [
    { title: 'AC Sleeper Coach Service', price: '950', priceUnit: 'per trip', availability: 'Daily departures 9:00 PM', desc: 'Luxury multi-axle AC sleeper coach equipped with reading lamps, blankets, charging ports, and water.' },
    { title: 'Semi-Sleeper Express Bus', price: '650', priceUnit: 'per trip', availability: 'Daily morning & evening', desc: 'Clean, sanitized 2+2 push-back seating bus with experienced driver and live tracking.' }
  ],
  'Tour & Travel': [
    { title: 'Full Day Sightseeing Package', price: '1999', priceUnit: 'per person', availability: 'All 7 days', desc: 'Comprehensive guided tour of popular heritage sites, viewpoints, and local markets with AC transport.' },
    { title: '2 Days / 1 Night Heritage Tour', price: '4500', priceUnit: 'per person', availability: 'Weekends & Holidays', desc: 'All-inclusive weekend tour with hotel stay, local guide, entrance tickets, and transport.' }
  ],
  Restaurant: [
    { title: 'Traditional Regional Thali Dining', price: '350', priceUnit: 'per person', availability: '12:00 PM – 10:30 PM', desc: 'Authentic regional feast served on banana leaf with choice of vegetarian or non-vegetarian delicacies.' },
    { title: 'Unlimited Weekend Buffet Dinner', price: '799', priceUnit: 'per person', availability: 'Sat & Sun 7:00 PM onwards', desc: 'Lavish multi-cuisine buffet spread featuring starters, live counters, main courses, and desserts.' }
  ],
  Adventure: [
    { title: 'Scenic Day Trek & Camping', price: '1200', priceUnit: 'per person', availability: 'Weekends', desc: 'Thrilling nature trek led by certified safety instructors, includes safety gear, first aid, and campfire.' }
  ],
  Guide: [
    { title: 'Certified Local Tour Guide Service', price: '1000', priceUnit: 'per day', availability: 'On request', desc: 'Friendly licensed multilingual tourist guide sharing deep history, folklore, and hidden city gems.' }
  ],
  Other: [
    { title: 'Premium Tourism Service', price: '1500', priceUnit: 'fixed', availability: 'Daily', desc: 'Dedicated customer-centric service offering top comfort, safety, and local expertise.' }
  ]
};

const blankForm = {
  listingTitle: '',
  listingDescription: '',
  category: 'Hotel',
  locationOrRoute: '',
  city: '',
  state: '',
  price: '',
  priceUnit: 'per night',
  availability: '',
  terms: '',
  capacity: '1'
};

const statusStyle = {
  Submitted: { color: '#92400e', background: '#fef3c7' },
  'Changes Requested': { color: '#1d4ed8', background: '#dbeafe' },
  Rejected: { color: '#991b1b', background: '#fee2e2' },
  Draft: { color: '#475569', background: '#f1f5f9' },
  Published: { color: '#166534', background: '#dcfce7' },
  Unpublished: { color: '#475569', background: '#e2e8f0' },
  Archived: { color: '#475569', background: '#e2e8f0' }
};

export default function PartnerListings({ application, applicationStatus }) {
  const [listings, setListings] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [requestingUpdate, setRequestingUpdate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Auto pre-fill location & category from approved partner application
  useEffect(() => {
    if (application && !editing && !requestingUpdate) {
      setForm(prev => ({
        ...prev,
        category: application.category || prev.category || 'Hotel',
        city: application.city || prev.city || '',
        state: application.state || prev.state || '',
        locationOrRoute: application.address || prev.locationOrRoute || ''
      }));
    }
  }, [application]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const [listingResponse, requestResponse] = await Promise.all([
        api.get('/listings/my'),
        api.get('/listings/my/change-requests')
      ]);
      setListings(listingResponse.data.listings || []);
      setChangeRequests(requestResponse.data.changeRequests || []);
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not load your service listings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const startCorrection = (listing) => {
    setEditing(listing.id);
    setRequestingUpdate(null);
    setForm({
      listingTitle: listing.listingTitle || '',
      listingDescription: listing.listingDescription || '',
      category: listing.category || 'Other',
      locationOrRoute: listing.locationOrRoute || '',
      city: listing.city || '',
      state: listing.state || '',
      price: listing.price == null ? '' : String(listing.price),
      priceUnit: listing.priceUnit || 'fixed',
      availability: listing.availability || '',
      terms: listing.terms || '',
      capacity: String(listing.capacity || 1)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startUpdateRequest = (listing) => {
    setEditing(null);
    setRequestingUpdate(listing.id);
    setForm({
      listingTitle: listing.listingTitle || '',
      listingDescription: listing.listingDescription || '',
      category: listing.category || 'Other',
      locationOrRoute: listing.locationOrRoute || '',
      city: listing.city || '',
      state: listing.state || '',
      price: listing.price == null ? '' : String(listing.price),
      priceUnit: listing.priceUnit || 'fixed',
      availability: listing.availability || '',
      terms: listing.terms || '',
      capacity: String(listing.capacity || 1)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form, price: form.price === '' ? null : Number(form.price), capacity: Number(form.capacity) };
      if (requestingUpdate) {
        await api.post(`/listings/my/${requestingUpdate}/change-requests`, payload);
      } else if (editing) {
        await api.put(`/listings/my/${editing}`, payload);
      } else {
        await api.post('/listings/my', payload);
      }
      setMessage({
        error: false,
        text: requestingUpdate
          ? 'Service update request sent. Your published listing will stay unchanged until an administrator approves it.'
          : editing ? 'Corrections submitted for administrator review.' : 'Service submitted for administrator review successfully!'
      });
      setForm({
        ...blankForm,
        category: application?.category || 'Hotel',
        city: application?.city || '',
        state: application?.state || '',
        locationOrRoute: application?.address || ''
      });
      setEditing(null);
      setRequestingUpdate(null);
      await loadListings();
    } catch (error) {
      setMessage({ error: true, text: error.response?.data?.message || 'Could not submit your service listing.' });
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const categoryPresets = PRESETS[form.category] || PRESETS.Hotel;

  return (
    <section>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.25rem' }}>My Service Listings</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
          Submit your service details for review. Only an administrator can approve and publish a listing.
        </p>
      </header>

      {message && (
        <div role="status" style={{
          marginBottom: 16, padding: '11px 14px', borderRadius: 9,
          color: message.error ? '#991b1b' : '#166534',
          background: message.error ? '#fee2e2' : '#dcfce7'
        }}>
          {message.text}
        </div>
      )}

      {applicationStatus !== 'Approved' && (
        <div style={{ marginBottom: 18, padding: 14, border: '1px solid #fde68a', borderRadius: 10, background: '#fffbeb', color: '#92400e' }}>
          Your business application must be approved before you can submit a service listing.
        </div>
      )}

      {applicationStatus === 'Approved' && (
        <form onSubmit={submit} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, marginBottom: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '0 0 14px', flexWrap: 'wrap' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>
              {editing || requestingUpdate ? <RefreshCw size={18} color="#0284c7" /> : <FilePlus2 size={18} color="#10b981" />}
              {requestingUpdate ? 'Request changes to a published service' : editing ? 'Correct service details' : '⚡ Quick Add Service Listing'}
            </h3>
            {application?.businessName && (
              <span style={{ fontSize: '0.8rem', color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: 8, fontWeight: '600' }}>
                Business: {application.businessName}
              </span>
            )}
          </div>

          {/* Quick Preset Templates */}
          {!editing && !requestingUpdate && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'linear-gradient(135deg, #f0fdf4, #f0f9ff)', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#166534', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} color="#16a34a" /> Quick Add Templates (Click any to auto-fill):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {categoryPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        listingTitle: preset.title,
                        price: preset.price || prev.price,
                        priceUnit: preset.priceUnit || prev.priceUnit,
                        availability: preset.availability || prev.availability,
                        listingDescription: preset.desc || prev.listingDescription
                      }));
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      color: '#15803d',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dcfce7'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <label className="form-label">Listing title *
              <input className="form-control" required maxLength={255} value={form.listingTitle} onChange={event => setField('listingTitle', event.target.value)} placeholder="e.g. Deluxe Room or Morning AC Bus" />
            </label>
            <label className="form-label">Category *
              <select className="form-control" required value={form.category} onChange={event => setField('category', event.target.value)}>
                {CATEGORIES.map(category => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="form-label">Location or route
              <input className="form-control" maxLength={255} value={form.locationOrRoute} onChange={event => setField('locationOrRoute', event.target.value)} placeholder="e.g. Near City Center or Mysuru to Ooty" />
            </label>
            <label className="form-label">City
              <input className="form-control" maxLength={100} value={form.city} onChange={event => setField('city', event.target.value)} />
            </label>
            <label className="form-label">State
              <input className="form-control" maxLength={100} value={form.state} onChange={event => setField('state', event.target.value)} />
            </label>
            <label className="form-label">Price (₹) *
              <input className="form-control" type="number" min="0" step="0.01" required value={form.price} onChange={event => setField('price', event.target.value)} placeholder="e.g. 1500" />
            </label>
            <label className="form-label">Service capacity *
              <input className="form-control" type="number" min="1" max="1000000" step="1" required value={form.capacity} onChange={event => setField('capacity', event.target.value)} placeholder="e.g. 20 seats or rooms" />
              <small style={{ color: '#64748b' }}>Total units or guests available. Admins can review this; tourists will not see it.</small>
            </label>
            <label className="form-label">Price unit
              <select className="form-control" value={form.priceUnit} onChange={event => setField('priceUnit', event.target.value)}>
                {PRICE_UNITS.map(unit => <option key={unit}>{unit}</option>)}
              </select>
            </label>
            <label className="form-label">Availability
              <input className="form-control" maxLength={5000} value={form.availability} onChange={event => setField('availability', event.target.value)} placeholder="e.g. Daily or Mon-Fri" />
            </label>
            <label className="form-label" style={{ gridColumn: '1 / -1' }}>Description
              <textarea className="form-control" rows="3" maxLength={10000} value={form.listingDescription} onChange={event => setField('listingDescription', event.target.value)} placeholder="Describe what is included in this service..." />
            </label>
            <label className="form-label" style={{ gridColumn: '1 / -1' }}>Terms and conditions
              <textarea className="form-control" rows="2" maxLength={5000} value={form.terms} onChange={event => setField('terms', event.target.value)} placeholder="Cancellation policy or check-in rules..." />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, fontWeight: '700' }}>
              <Send size={15} /> {saving ? 'Submitting…' : requestingUpdate ? 'Send update request' : editing ? 'Resubmit for review' : 'Submit Service for Review'}
            </button>
            {(editing || requestingUpdate) && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setRequestingUpdate(null); setForm(blankForm); }}>Cancel</button>}
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading service listings…</div>
      ) : listings.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#64748b', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <Clock size={20} style={{ marginBottom: 8 }} />
          <div>You have not submitted any service listings yet. Use the form above to add your first service!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {listings.map(listing => {
            const style = statusStyle[listing.status] || statusStyle.Submitted;
            return (
              <article key={listing.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px', fontSize: '1rem', color: '#0f172a' }}>{listing.listingTitle}</h3>
                    <div style={{ color: '#64748b', fontSize: '0.84rem' }}>{listing.category} · {[listing.city, listing.state].filter(Boolean).join(', ') || 'Location not provided'}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 3 }}>Capacity set: {listing.capacity}</div>
                    {listing.price != null && (
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', marginTop: 4 }}>
                        ₹{Number(listing.price).toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '400' }}>{listing.priceUnit}</span>
                      </div>
                    )}
                  </div>
                  <span style={{ padding: '4px 9px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, color: style.color, background: style.background, whiteSpace: 'nowrap' }}>
                    {listing.status}
                  </span>
                </div>
                {listing.adminNote && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: 11, borderRadius: 8, background: '#eff6ff', color: '#1e3a8a', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} /> <span><strong>Administrator note:</strong> {listing.adminNote}</span>
                  </div>
                )}
                {['Published', 'Unpublished'].includes(listing.status) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={changeRequests.some(request => request.listingId === listing.id && request.status === 'Pending')}
                    onClick={() => startUpdateRequest(listing)}
                    style={{ marginTop: 12 }}
                  >
                    {changeRequests.some(request => request.listingId === listing.id && request.status === 'Pending')
                      ? 'Update request awaiting review'
                      : 'Request service or price update'}
                  </button>
                )}
                {listing.status === 'Changes Requested' && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => startCorrection(listing)} style={{ marginTop: 12 }}>
                    Edit and resubmit
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
      {changeRequests.length > 0 && (
        <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Service update requests</h3>
          {changeRequests.map(request => (
            <article key={request.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{request.listingTitle}</strong>
                <span style={{ color: request.status === 'Pending' ? '#92400e' : request.status === 'Approved' ? '#166534' : '#991b1b' }}>{request.status}</span>
              </div>
              {request.adminNote && <p style={{ margin: '8px 0 0', color: '#1e3a8a' }}><strong>Admin feedback:</strong> {request.adminNote}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
