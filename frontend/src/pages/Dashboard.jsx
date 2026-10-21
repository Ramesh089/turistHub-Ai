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
  Download
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div style={{
        background: 'linear-gradient(135deg, #1c1917 0%, #2f1d18 100%)',
        color: '#ffffff',
        padding: '50px 0',
        marginBottom: '36px'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img
              src="/logo.png"
              alt="Tourist AI Hub Logo"
              style={{
                height: '84px',
                width: '84px',
                borderRadius: '16px',
                objectFit: 'contain',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '6px',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 6px 22px rgba(0, 0, 0, 0.4)',
                flexShrink: 0
              }}
            />
            <div>
              <span style={{ color: '#f59e0b', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Tourist Travel Hub
              </span>
              <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', marginTop: '6px', marginBottom: '8px' }}>
                Namaste, {user?.name}!
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Track your saved AI itineraries, review tour package reservations, and explore personalized destinations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
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
                      <div key={p.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>Estimated Budget</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px' }}>
                            ₹{Number(p.estimated_cost).toLocaleString('en-IN')}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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
                    {bookings.map((b) => (
                      <div key={b.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: b.status === 'Confirmed' ? '#dcfce7' : b.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                              color: b.status === 'Confirmed' ? '#166534' : b.status === 'Pending' ? '#92400e' : '#991b1b'
                            }}>
                              {b.status}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Booking #{b.id}</span>
                          </div>

                          <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
                            {b.package_title || b.destination_name || 'Custom Travel Package'}
                          </h3>
                          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                            Travel Date: <strong>{new Date(b.travel_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong> • Travelers: <strong>{b.people_count}</strong>
                          </div>
                          {b.special_requests && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate)', marginTop: '4px', fontStyle: 'italic' }}>
                              Note: "{b.special_requests}"
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>Total Paid / Amount</span>
                          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '8px' }}>
                            ₹{Number(b.total_amount).toLocaleString('en-IN')}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: '600' }}>
                              ✓ Confirmed
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadBookingReceipt(b)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Download Official Payment Receipt"
                            >
                              <Receipt size={13} color="#0284c7" /> Receipt
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
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
                    <div key={dest.id} className="card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img src={dest.image_url} alt={dest.name} style={{ width: '130px', height: '110px', objectFit: 'cover', borderRadius: '10px' }} />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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
    </div>
  );
}

