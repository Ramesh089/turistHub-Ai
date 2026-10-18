import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Star,
  Clock,
  IndianRupee,
  Sparkles,
  Utensils,
  Compass,
  Bus,
  Hotel,
  Users,
  ShieldAlert,
  Send,
  Calendar,
  CheckCircle,
  PhoneCall
} from 'lucide-react';

export default function DestinationDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  useEffect(() => {
    async function loadDestination() {
      setLoading(true);
      try {
        const res = await api.get(`/destinations/${id}`);
        if (res.data.success) {
          setDest(res.data.destination);
        }
      } catch (err) {
        console.error('Failed to load destination details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDestination();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!reviewText.trim()) return;

    setReviewSubmitting(true);
    setReviewMsg(null);
    try {
      const res = await api.post('/reviews', {
        destination_id: id,
        rating,
        review_text: reviewText
      });
      if (res.data.success) {
        setReviewMsg({ type: 'success', text: 'Thank you! Your review has been published.' });
        setReviewText('');
        // Reload details to include new review
        const updated = await api.get(`/destinations/${id}`);
        if (updated.data.success) setDest(updated.data.destination);
      }
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit review.' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', minHeight: '60vh' }}>
        <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '1.2rem' }}>
          Loading destination details...
        </p>
      </div>
    );
  }

  if (!dest) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Destination Not Found</h2>
        <Link to="/explore" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#fcf9f4', paddingBottom: '90px' }}>
      {/* Hero Header */}
      <div style={{
        position: 'relative',
        minHeight: '440px',
        background: `linear-gradient(to top, rgba(28,25,23,0.95) 0%, rgba(28,25,23,0.4) 60%, rgba(28,25,23,0.3) 100%), url(${dest.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        color: '#ffffff',
        padding: '50px 0'
      }}>
        <div className="container" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="badge badge-heritage">{dest.category}</span>
            <span style={{ fontSize: '0.88rem', color: '#fef3c7' }}>•</span>
            <span style={{ fontSize: '0.9rem', color: '#fef3c7', fontWeight: '600' }}>{dest.state_name}</span>
          </div>

          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', fontWeight: '800', marginBottom: '10px' }}>
            {dest.name}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', fontSize: '0.92rem', color: '#e2e8f0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={16} color="#fbbf24" /> {dest.location}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={16} color="#fbbf24" /> Best Time: {dest.best_time_to_visit}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Star size={16} fill="#f59e0b" color="#f59e0b" /> {dest.rating} ({dest.reviews_count} Reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '30px' }}>
        {/* Navigation Tabs */}
        <div className="tabs-nav" style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}>Overview & History</button>
          <button onClick={() => setActiveTab('attractions')} className={`tab-btn ${activeTab === 'attractions' ? 'active' : ''}`}>Attractions & Activities</button>
          <button onClick={() => setActiveTab('culture_food')} className={`tab-btn ${activeTab === 'culture_food' ? 'active' : ''}`}>Culture & Cuisine</button>
          <button onClick={() => setActiveTab('hotels')} className={`tab-btn ${activeTab === 'hotels' ? 'active' : ''}`}>Hotels ({dest.hotels?.length || 0})</button>
          <button onClick={() => setActiveTab('transport')} className={`tab-btn ${activeTab === 'transport' ? 'active' : ''}`}>Transport ({dest.transport?.length || 0})</button>
          <button onClick={() => setActiveTab('guides')} className={`tab-btn ${activeTab === 'guides' ? 'active' : ''}`}>Tourist Guides ({dest.guides?.length || 0})</button>
          <button onClick={() => setActiveTab('emergency')} className={`tab-btn ${activeTab === 'emergency' ? 'active' : ''}`} style={{ color: '#b91c1c' }}>Emergency Support</button>
          <button onClick={() => setActiveTab('reviews')} className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}>Reviews ({dest.reviews?.length || 0})</button>
        </div>

        {/* Tab 1: Overview & History */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }} className="animate-fade-in">
            <div>
              <div className="card" style={{ padding: '30px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '14px', color: 'var(--dark)' }}>About {dest.name}</h3>
                <p style={{ fontSize: '1rem', color: '#334155', lineHeight: 1.8, marginBottom: '20px' }}>
                  {dest.description}
                </p>

                <h4 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--dark)' }}>Historical Legacy</h4>
                <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7 }}>
                  {dest.history}
                </p>
              </div>

              {/* Photo Gallery */}
              {dest.gallery_urls && dest.gallery_urls.length > 0 && (
                <div className="card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Visual Panorama</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {dest.gallery_urls.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${dest.name} gallery ${idx + 1}`}
                        style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Trip Action Widget */}
            <div>
              <div className="card" style={{ padding: '26px', background: '#ffffff', borderTop: '4px solid #e65100', position: 'sticky', top: '100px' }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Plan Your Visit</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--slate)' }}>Recommended Duration:</span>
                    <strong>{dest.recommended_duration_days} Days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--slate)' }}>Estimated Daily Cost:</span>
                    <strong style={{ color: 'var(--primary)' }}>₹{Math.round(dest.estimated_cost_per_day)} / day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--slate)' }}>Ideal Season:</span>
                    <strong>{dest.best_time_to_visit}</strong>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/ai-planner?dest=${encodeURIComponent(dest.name)}&days=${dest.recommended_duration_days}`)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }}
                >
                  <Sparkles size={16} /> Generate AI Itinerary
                </button>

                <Link
                  to={`/packages?dest=${dest.id}`}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  View Tour Packages &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Attractions & Activities */}
        {activeTab === 'attractions' && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div className="card" style={{ padding: '26px' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={20} color="#e65100" /> Must-Visit Attractions
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dest.major_attractions?.map((attr, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem' }}>
                      <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{attr}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card" style={{ padding: '26px' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#d97706" /> Things to Do & Experiences
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dest.activities?.map((act, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem' }}>
                      <CheckCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Culture & Food */}
        {activeTab === 'culture_food' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '14px', color: '#78350f' }}>Cultural Traditions & Folklore</h3>
              <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.7 }}>
                {dest.culture_info}
              </p>
            </div>

            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b' }}>
                <Utensils size={20} /> Authentic Local Culinary Treats
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {dest.local_food?.map((food, idx) => (
                  <div key={idx} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 14px', borderRadius: '8px', fontSize: '0.9rem', color: '#991b1b', fontWeight: '500' }}>
                    🍛 {food}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Hotels */}
        {activeTab === 'hotels' && (
          <div className="animate-fade-in">
            {dest.hotels && dest.hotels.length > 0 ? (
              <div className="grid-3">
                {dest.hotels.map((h) => (
                  <div key={h.id} className="card" style={{ padding: '20px' }}>
                    <img src={h.image_url} alt={h.name} style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '1.15rem' }}>{h.name}</h4>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#d97706', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star size={13} fill="#d97706" /> {h.rating}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate)', marginBottom: '8px' }}>{h.location}</div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '14px' }}>Room: <strong>{h.room_type}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>Per Night</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>₹{Number(h.price_per_night).toLocaleString('en-IN')}</div>
                      </div>
                      <a href={`tel:${h.contact}`} className="btn btn-outline-primary btn-sm">
                        <PhoneCall size={14} /> Contact
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate)' }}>No hotels currently listed for this destination.</p>
            )}
          </div>
        )}

        {/* Tab 5: Transport */}
        {activeTab === 'transport' && (
          <div className="animate-fade-in">
            {dest.transport && dest.transport.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {dest.transport.map((t) => (
                  <div key={t.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <span className="badge badge-heritage">{t.transport_type}</span>
                      <h4 style={{ fontSize: '1.15rem', marginTop: '6px', marginBottom: '4px' }}>{t.provider}</h4>
                      <div style={{ fontSize: '0.88rem', color: 'var(--slate)' }}>Route: {t.route}</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>Duration: {t.duration} • Departure: {t.departure_time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '6px' }}>
                        ₹{Number(t.price).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '600' }}>Available Daily</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate)' }}>No transport options currently listed.</p>
            )}
          </div>
        )}

        {/* Tab 6: Guides */}
        {activeTab === 'guides' && (
          <div className="animate-fade-in">
            {dest.guides && dest.guides.length > 0 ? (
              <div className="grid-3">
                {dest.guides.map((g) => (
                  <div key={g.id} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                      <img src={g.image_url} alt={g.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <h4 style={{ fontSize: '1.1rem' }}>{g.name}</h4>
                        <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '600' }}>{g.specialization}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>{g.experience_years} Years Experience</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '14px' }}>
                      <strong>Languages:</strong> {g.languages}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate)' }}>Fee per day</span>
                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--dark)' }}>₹{g.price_per_day}</div>
                      </div>
                      <a href={`tel:${g.contact}`} className="btn btn-primary btn-sm">
                        Hire Guide
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate)' }}>No tourist guides registered for this destination yet.</p>
            )}
          </div>
        )}

        {/* Tab 7: Emergency Support */}
        {activeTab === 'emergency' && (
          <div className="animate-fade-in">
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h4 style={{ color: '#9f1239', fontSize: '1.1rem', marginBottom: '4px' }}>National Emergency Helplines</h4>
                <p style={{ color: '#be123c', fontSize: '0.88rem' }}>Police / Emergency: <strong>112</strong> | Tourist Helpline: <strong>1363</strong> | Medical: <strong>108</strong></p>
              </div>
              <a href="tel:112" className="btn btn-primary" style={{ background: '#e11d48' }}>
                <PhoneCall size={16} /> Dial 112
              </a>
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Local Support Near {dest.name}</h3>

            <div className="grid-2">
              {dest.emergency_services?.map((em) => (
                <div key={em.id} className="card" style={{ padding: '20px', borderLeft: '4px solid #e11d48' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#e11d48' }}>
                      {em.service_type}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>~{em.distance_km} km away</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{em.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate)', marginBottom: '12px' }}>{em.address}</p>
                  <a href={`tel:${em.contact_number}`} className="btn btn-outline-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    <PhoneCall size={14} /> Call: {em.contact_number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 8: Reviews */}
        {activeTab === 'reviews' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Reviews List */}
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Tourist Reviews & Ratings</h3>
              {dest.reviews && dest.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {dest.reviews.map((r) => (
                    <div key={r.id} className="card" style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong>{r.user_name}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b' }}>
                          {[...Array(r.rating)].map((_, i) => (
                            <Star key={i} size={14} fill="#f59e0b" />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>{r.review_text}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate)', marginTop: '8px' }}>
                        {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--slate)' }}>No reviews yet. Be the first to share your experience!</p>
              )}
            </div>

            {/* Submit Review Form */}
            <div>
              <div className="card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Share Your Experience</h4>

                {reviewMsg && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    background: reviewMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: reviewMsg.type === 'success' ? '#15803d' : '#b91c1c',
                    fontSize: '0.88rem'
                  }}>
                    {reviewMsg.text}
                  </div>
                )}

                {isAuthenticated ? (
                  <form onSubmit={handleReviewSubmit}>
                    <div className="form-group">
                      <label className="form-label">Your Rating (1 - 5 Stars)</label>
                      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="form-control">
                        <option value={5}>⭐⭐⭐⭐⭐ (5 Stars - Exceptional)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 Stars - Very Good)</option>
                        <option value={3}>⭐⭐⭐ (3 Stars - Average)</option>
                        <option value={2}>⭐⭐ (2 Stars - Disappointing)</option>
                        <option value={1}>⭐ (1 Star - Poor)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Your Review & Travel Tips</label>
                      <textarea
                        rows={4}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tell other tourists about your favorite sights, dining spots, and recommendations..."
                        className="form-control"
                        required
                      />
                    </div>

                    <button type="submit" disabled={reviewSubmitting} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      <Send size={16} /> {reviewSubmitting ? 'Submitting...' : 'Post Tourist Review'}
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: 'var(--slate)', marginBottom: '14px', fontSize: '0.92rem' }}>
                      Please log in to submit reviews and rate destinations.
                    </p>
                    <Link to="/login" className="btn btn-primary btn-sm">
                      Log In to Review
                    </Link>
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

