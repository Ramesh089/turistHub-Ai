import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DestinationCard from '../components/DestinationCard';
import {
  LayoutDashboard,
  Compass,
  Calendar,
  Sparkles,
  Package,
  Clock,
  IndianRupee,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Receipt,
  Download,
  Train,
  Bus,
  Plane,
  Car,
  Ticket,
  XCircle
} from 'lucide-react';
import TicketModal from '../components/transport/TicketModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      const bookingsRes = await api.get('/bookings/my-bookings');
      if (bookingsRes.data.success) setBookings(bookingsRes.data.bookings);
    } catch (err) {
      console.error('Failed to reload bookings:', err);
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [plansRes, bookingsRes, recsRes] = await Promise.all([
          api.get('/ai/my-plans'),
          api.get('/bookings/my-bookings'),
          api.post('/ai/recommend', {})
        ]);

        if (plansRes.data.success) setPlans(plansRes.data.plans);
        if (bookingsRes.data.success) setBookings(bookingsRes.data.bookings);
        if (recsRes.data.success) setRecommendations(recsRes.data.recommendations.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleCancelTransportBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this transport booking? Any applicable refund will be processed to your original payment method.')) {
      return;
    }
    setCancellingId(bookingId);
    try {
      const res = await api.post(`/transport/bookings/${bookingId}/cancel`, {
        reason: 'Traveler requested cancellation via Tourist Hub dashboard'
      });
      if (res.data.success) {
        alert(`Booking cancelled successfully. Refund of ₹${Number(res.data.refund_amount || 0).toLocaleString('en-IN')} has been initiated (${res.data.refund_percentage}% refund per policy).`);
        fetchBookings();
      } else {
        alert(res.data.message || 'Failed to cancel booking.');
      }
    } catch (err) {
      console.error('Cancel booking error:', err);
      alert(err.response?.data?.message || 'Error cancelling booking.');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [plansRes, bookingsRes, recsRes] = await Promise.all([
          api.get('/ai/my-plans'),
          api.get('/bookings/my-bookings'),
          api.post('/ai/recommend', {})
        ]);

        if (plansRes.data.success) setPlans(plansRes.data.plans);
        if (bookingsRes.data.success) setBookings(bookingsRes.data.bookings);
        if (recsRes.data.success) setRecommendations(recsRes.data.recommendations.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleDeletePlan = async (planId) => {
    try {
      const res = await api.delete(`/ai/my-plans/${planId}`);
      if (res.data.success) {
        setPlans(plans.filter((p) => p.id !== planId));
      }
    } catch (err) {
      console.error('Delete plan error:', err);
    }
  };

  const downloadBookingReceipt = (b) => {
    const itemName = b.package_title || b.destination_name || b.hotel_name || b.transport_provider || 'Travel Booking';
    const bkRef = `TH-BK-${b.id}`;
    const txnId = b.transaction_id || `DEMO_TXN_${b.id}_PAID`;
    const recNo = `REC-${new Date(b.created_at || Date.now()).getFullYear()}-${String(b.id).padStart(6, '0')}`;
    const nowStr = new Date(b.created_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' });

    const textReceipt = `
================================================================================
                    TOURIST HUB AI — OFFICIAL PAYMENT RECEIPT
                         Incredible India Travel Companion
================================================================================
RECEIPT NO:         ${recNo}
BOOKING REFERENCE:  ${bkRef}
DEMO TXN ID:        ${txnId}
DATE & TIME:        ${nowStr}
PAYMENT STATUS:     PAID • DEMO SIMULATION

--------------------------------------------------------------------------------
CUSTOMER DETAILS:
--------------------------------------------------------------------------------
Name:               ${user?.name || user?.full_name || 'Valued Traveler'}
Email:              ${user?.email || 'traveler@touristhub.ai'}

--------------------------------------------------------------------------------
RESERVATION DETAILS:
--------------------------------------------------------------------------------
Service / Item:     ${itemName}
Booking Type:       ${b.booking_type || 'Package'}
Travel Date:        ${new Date(b.travel_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
Travelers / Guests: ${b.people_count} Person(s)
Special Requests:   ${b.special_requests || 'None'}

--------------------------------------------------------------------------------
FINANCIAL BREAKDOWN:
--------------------------------------------------------------------------------
Total Amount Paid:  ₹${Number(b.total_amount).toLocaleString('en-IN')}
Payment Method:     ${b.payment_method || 'UPI / Online'}
Payment Status:     Authorized & Settled (Simulated)
--------------------------------------------------------------------------------

================================================================================
NOTICE: This is an academic demo simulation transaction.
        No actual money was charged or transferred.
Thank you for choosing Tourist Hub AI!
================================================================================
`;
    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TouristHub_Payment_Receipt_${bkRef}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: '#faf6f0', minHeight: '90vh', paddingBottom: '90px' }}>
      {/* Welcome Banner */}
      <div className="page-banner" style={{
        background: 'linear-gradient(135deg, #1c1917 0%, #2f1d18 100%)',
        color: '#ffffff'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <img
              src="/logo.png"
              alt="Tourist AI Hub Logo"
              className="page-banner-logo"
              style={{
                objectFit: 'contain',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '6px',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 6px 22px rgba(0, 0, 0, 0.4)'
              }}
            />
            <div>
              <span style={{ color: '#f59e0b', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Tourist Travel Hub
              </span>
              <h1 className="page-banner-title">
                Namaste, {user?.name}!
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Track your saved AI itineraries, review tour package reservations, and explore personalized destinations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/ai-planner" className="btn btn-primary">
              <Sparkles size={16} /> Plan New Trip
            </Link>
            <Link to="/profile" className="btn btn-secondary">
              <Settings size={16} /> Edit Preferences
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Navigation Tabs */}
        <div className="tabs-nav" style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <button onClick={() => setActiveTab('plans')} className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}>
            My AI Travel Plans ({plans.length})
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}>
            My Bookings ({bookings.length})
          </button>
          <button onClick={() => setActiveTab('recommendations')} className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}>
            Recommended For You
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--primary)', fontWeight: '600' }}>
            Loading your dashboard...
          </p>
        ) : (
          <div>
            {/* Tab 1: AI Saved Plans */}
            {activeTab === 'plans' && (
              <div className="animate-fade-in">
                {plans.length === 0 ? (
                  <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <Compass size={48} color="#d97706" style={{ margin: '0 auto 16px auto' }} />
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No Saved Travel Plans Yet</h3>
                    <p style={{ color: 'var(--slate)', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                      Use our AI Travel Planner to generate and save your personalized Day 1..N trip itinerary.
                    </p>
                    <Link to="/ai-planner" className="btn btn-primary">
                      Generate Your First Plan &rarr;
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {plans.map((p) => (
                      <div key={p.id} className="card dashboard-item-card">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span className="badge badge-heritage">AI Itinerary</span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>
                              Created on {new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', marginBottom: '6px' }}>
                            {p.destination_name} ({p.days} Days Expedition)
                          </h3>

                          <div style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '12px' }}>
                            Origin: <strong>{p.origin}</strong> • Travelers: <strong>{p.traveller_type} ({p.people_count} People)</strong> • Food: <strong>{p.food_preference}</strong>
                          </div>

                          {/* Preview Days */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                            {p.itinerary?.slice(0, 3).map((d, i) => (
                              <span key={i} style={{ fontSize: '0.78rem', background: '#f8fafc', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px' }}>
                                Day {d.day}: {d.attractions?.[0] || 'Attractions'}
                              </span>
                            ))}
                            {p.itinerary?.length > 3 && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--slate)', alignSelf: 'center' }}>
                                +{p.itinerary.length - 3} more days
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="dashboard-card-action">
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>Estimated Budget</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px' }}>
                            ₹{Number(p.estimated_cost).toLocaleString('en-IN')}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <Link
                              to={`/ai-planner?origin=${encodeURIComponent(p.origin)}&dest=${encodeURIComponent(p.destination_name)}&days=${p.days}`}
                              className="btn btn-secondary btn-sm"
                            >
                              View Full Schedule
                            </Link>
                            <button
                              onClick={() => handleDeletePlan(p.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#b91c1c' }}
                              title="Delete Plan"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Bookings */}
            {activeTab === 'bookings' && (
              <div className="animate-fade-in">
                {bookings.length === 0 ? (
                  <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <Package size={48} color="#d97706" style={{ margin: '0 auto 16px auto' }} />
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No Active Bookings Found</h3>
                    <p style={{ color: 'var(--slate)', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                      Browse our curated all-inclusive tour packages to reserve trips with verified hotels and guides.
                    </p>
                    <Link to="/packages" className="btn btn-primary">
                      Explore Tour Packages &rarr;
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {bookings.map((b) => {
                      const isTransport = b.booking_type === 'transport' || Boolean(b.transport_id) || Boolean(b.transport_provider);
                      const isCancelled = b.status === 'Cancelled';
                      const details = b.booking_details || {};

                      return (
                        <div key={b.id} className="card dashboard-item-card" style={{ borderLeft: isTransport ? '4px solid #0284c7' : '4px solid #d97706' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: isCancelled ? '#fee2e2' : b.status === 'Confirmed' ? '#dcfce7' : '#fef3c7',
                                color: isCancelled ? '#991b1b' : b.status === 'Confirmed' ? '#166534' : '#92400e'
                              }}>
                                {b.status}
                              </span>

                              {isTransport && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '800',
                                  padding: '3px 10px',
                                  borderRadius: '20px',
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}>
                                  {b.transport_type === 'Train' && <Train size={13} />}
                                  {b.transport_type === 'Bus' && <Bus size={13} />}
                                  {b.transport_type === 'Flight' && <Plane size={13} />}
                                  {b.transport_type === 'Private Driver' && <Car size={13} />}
                                  {b.transport_type || 'Transit'}
                                </span>
                              )}

                              <span style={{ fontSize: '0.8rem', color: 'var(--slate)', fontWeight: 600 }}>
                                PNR / Ref: <strong style={{ color: '#0f172a' }}>{b.booking_reference || `TH-BK-${b.id}`}</strong>
                              </span>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
                              {b.transport_provider || b.package_title || b.destination_name || 'Custom Travel Package'}
                              {b.transport_number && <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}> ({b.transport_number})</span>}
                            </h3>

                            {isTransport && b.transport_from && (
                              <div style={{ fontSize: '0.88rem', color: '#0284c7', fontWeight: 700, marginBottom: 4 }}>
                                {b.transport_from} &rarr; {b.transport_to}
                              </div>
                            )}

                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                              Travel Date: <strong>{new Date(b.travel_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong> • Travelers: <strong>{b.people_count || 1}</strong>
                            </div>

                            {/* Transport specific details */}
                            {isTransport && (
                              <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {details.seats && details.seats.length > 0 && (
                                  <span>Allocated Seats: <strong style={{ color: '#0284c7' }}>{details.seats.join(', ')}</strong></span>
                                )}
                                {details.coach_class && (
                                  <span>Class: <strong>{details.coach_class}</strong></span>
                                )}
                                {details.boarding_point && (
                                  <span>Boarding: <strong>{details.boarding_point}</strong></span>
                                )}
                                {details.pickup_location && (
                                  <span>Pickup: <strong>{details.pickup_location}</strong></span>
                                )}
                              </div>
                            )}

                            {isCancelled && b.refund_amount > 0 && (
                              <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#b91c1c', background: '#fef2f2', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                                Refund Amount: <strong>₹{Number(b.refund_amount).toLocaleString('en-IN')}</strong> ({b.refund_status || 'Processed'})
                              </div>
                            )}

                            {b.special_requests && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--slate)', marginTop: '4px', fontStyle: 'italic' }}>
                                Note: "{b.special_requests}"
                              </div>
                            )}
                          </div>

                          <div className="dashboard-card-action">
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>Total Paid / Amount</span>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: isCancelled ? '#94a3b8' : 'var(--primary)', marginBottom: '8px', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                              ₹{Number(b.total_amount).toLocaleString('en-IN')}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                              {/* View / Print Ticket */}
                              {isTransport && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTicket(b)}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.76rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  title="View Official Travel E-Ticket / Boarding Pass"
                                >
                                  <Ticket size={14} /> View Ticket
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => downloadBookingReceipt(b)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.74rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="Download Official Payment Receipt"
                              >
                                <Receipt size={13} color="#0284c7" /> Receipt
                              </button>

                              {/* Cancel Booking button */}
                              {isTransport && !isCancelled && (
                                <button
                                  type="button"
                                  disabled={cancellingId === b.id}
                                  onClick={() => handleCancelTransportBooking(b.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.74rem', padding: '5px 10px', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="Cancel Transport Booking"
                                >
                                  <XCircle size={13} /> Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Personalized Recommendations */}
            {activeTab === 'recommendations' && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.3rem' }}>Personalized Destination Matches</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--slate)' }}>
                    Generated using content-based similarity algorithm matching your saved interests and travel profile.
                  </p>
                </div>

                <div className="grid-2">
                  {recommendations.map((dest) => (
                    <div key={dest.id} className="card dashboard-recom-card">
                      <img src={dest.image_url} alt={dest.name} style={{ width: '130px', height: '110px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                          <span className="badge badge-heritage">{dest.category}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
                            {dest.matchScore}% Match
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{dest.name}</h4>
                        <div style={{ fontSize: '0.78rem', color: '#0369a1', marginBottom: '8px' }}>
                          {dest.matchReasons?.[0] || 'Matches your travel interests'}
                        </div>
                        <Link to={`/destination/${dest.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                          Explore Details &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}

