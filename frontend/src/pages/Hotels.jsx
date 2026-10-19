import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Hotel, Star, IndianRupee, MapPin, CreditCard } from 'lucide-react';
import BookingModal from '../components/BookingModal';

export default function Hotels() {
  const [hotels,     setHotels]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [budgetTier, setBudgetTier] = useState('');
  const [minRating,  setMinRating]  = useState('');
  const [bookingHotel, setBookingHotel] = useState(null); // opens BookingModal

  useEffect(() => {
    async function loadHotels() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (budgetTier) params.append('budget_tier', budgetTier);
        if (minRating)  params.append('min_rating', minRating);
        const res = await api.get(`/hotels?${params.toString()}`);
        if (res.data.success && Array.isArray(res.data.hotels)) setHotels(res.data.hotels);
      } catch (err) {
        console.error('Failed to load hotels:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHotels();
  }, [budgetTier, minRating]);

  return (
    <div style={{ background: '#f8fafc', minHeight: '90vh', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #065f46 100%)', color: '#fff', padding: '50px 0', marginBottom: 40 }}>
        <div className="container">
          <span style={{ color: '#6ee7b7', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Heritage & Luxury Stays
          </span>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', marginTop: 6, marginBottom: 10 }}>
            Verified Hotels & Resorts
          </h1>
          <p style={{ color: '#e0f2fe', maxWidth: 620, fontSize: '0.97rem' }}>
            Stay in royal palaces, misty plantation villas, and beachfront cottages with authentic Indian hospitality. Select your room and book instantly.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Filters */}
        <div style={{ background: '#fff', padding: '18px 24px', borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 36, boxShadow: '0 1px 4px rgba(2,132,199,0.06)' }}>
          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>Budget Category</label>
            <select value={budgetTier} onChange={e => setBudgetTier(e.target.value)} className="form-control" style={{ width: 220 }}>
              <option value="">All Price Tiers</option>
              <option value="Budget">Budget (Under ₹3,000/night)</option>
              <option value="Moderate">Moderate (₹3,000 – ₹6,000/night)</option>
              <option value="Luxury">Luxury (₹6,000+/night)</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 4 }}>Min Rating</label>
            <select value={minRating} onChange={e => setMinRating(e.target.value)} className="form-control" style={{ width: 180 }}>
              <option value="">All Ratings</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.7">4.7+ Stars (Top Rated)</option>
            </select>
          </div>
          {(budgetTier || minRating) && (
            <button onClick={() => { setBudgetTier(''); setMinRating(''); }} className="btn btn-secondary btn-sm" style={{ marginTop: 22 }}>
              Reset Filters
            </button>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: '#0284c7', fontWeight: 600 }}>Loading verified accommodations...</p>
        ) : hotels.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Hotel size={48} color="#0284c7" style={{ margin: '0 auto 16px' }} />
            <h3>No hotels found</h3>
            <p style={{ color: '#64748b' }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid-3">
            {hotels.map(h => (
              <div key={h.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderRadius: 14 }}>
                {/* Image */}
                <div style={{ position: 'relative', height: 210 }}>
                  <img src={h.image_url} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(15,23,42,0.8)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />{h.rating}
                  </div>
                  <div style={{ position: 'absolute', top: 10, left: 12, background: '#0284c7', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                    {h.budget_tier || 'Standard'}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>
                      <MapPin size={12} color="#0284c7" />{h.destination_name} • {h.location}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>{h.name}</h3>
                    <div style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 12 }}>Room: <strong>{h.room_type}</strong></div>

                    {/* Amenities */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {h.amenities?.slice(0, 4).map((a, i) => (
                        <span key={i} style={{ fontSize: '0.72rem', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: 4, color: '#0369a1' }}>
                          ✓ {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>From / Night</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                        <IndianRupee size={16} />{Number(h.price_per_night).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button
                      onClick={() => setBookingHotel(h)}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                    >
                      <CreditCard size={14} /> Book Room
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bookingHotel && (
        <BookingModal
          bookingType="hotel"
          item={bookingHotel}
          onClose={() => setBookingHotel(null)}
          onComplete={() => setBookingHotel(null)}
        />
      )}
    </div>
  );
}
