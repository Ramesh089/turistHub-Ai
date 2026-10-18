import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Send,
  Compass,
  IndianRupee,
  Utensils,
  Bus,
  BookmarkCheck,
  Printer,
  Clock,
  MapPin,
  CreditCard,
  Gift
} from 'lucide-react';
import BookingModal from '../components/BookingModal';

const quickPrompts = [
  'Plan a 3-day couple trip from Bengaluru to Mysore with heritage, food, and shopping within ₹12,000',
  'Create a 4-day family holiday from Delhi to Jaipur with culture, forts, and budget hotels under ₹20,000',
  'Design a 2-day weekend getaway from Mumbai to Goa with beaches, nightlife, and vegetarian food',
  'Suggest a spiritual 5-day tour from Hyderabad to Varanasi with temples, ghats, and train travel'
];

export default function AIPlanner() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState(
    searchParams.get('origin') && searchParams.get('dest')
      ? `Plan a ${searchParams.get('days') || 3}-day trip from ${searchParams.get('origin')} to ${searchParams.get('dest')} for a couple with heritage and food in a ${searchParams.get('budget') ? 'budget' : 'moderate'} plan`
      : 'Plan a 3-day couple trip from Bengaluru to Mysore with heritage, food, and shopping within ₹12,000'
  );

  const [generating, setGenerating] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [bookingModalPkg, setBookingModalPkg] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I can plan your India trip in a natural chat style. Tell me where you are starting from, your destination, budget, travel dates, and vibe — I will turn that into a day-by-day itinerary.'
    }
  ]);

  const handleGeneratePlan = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setGenerating(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const lower = userText.toLowerCase();

      let origin = 'Bengaluru';
      let destination = 'Mysore (Mysuru)';
      let days = 3;
      let budget = 15000;
      let interests = ['Heritage', 'Culture'];
      let travellerType = 'couple';

      if (lower.includes('jaipur') || lower.includes('rajasthan')) {
        destination = 'Jaipur';
        origin = 'Delhi';
        interests = ['Heritage', 'Forts', 'Shopping'];
      } else if (lower.includes('hampi')) {
        destination = 'Hampi';
        origin = 'Bengaluru';
        interests = ['Heritage', 'History', 'Temples'];
      } else if (lower.includes('goa')) {
        destination = 'Goa (Panaji & North Beaches)';
        origin = 'Mumbai';
        interests = ['Beach', 'Nightlife', 'Seafood'];
      } else if (lower.includes('varanasi') || lower.includes('kashi')) {
        destination = 'Varanasi';
        origin = 'Delhi';
        interests = ['Spiritual', 'Temples', 'Ghats'];
      } else if (lower.includes('alleppey') || lower.includes('alappuzha') || lower.includes('kerala')) {
        destination = 'Alappuzha (Alleppey)';
        origin = 'Kochi';
        interests = ['Backwaters', 'Nature', 'Ayurveda'];
      } else if (lower.includes('coorg')) {
        destination = 'Coorg (Kodagu)';
        origin = 'Bengaluru';
        interests = ['Nature', 'Coffee', 'Trekking'];
      }

      const matchDays = lower.match(/(\d+)\s*-?\s*days?/);
      if (matchDays && matchDays[1]) days = Math.min(Math.max(parseInt(matchDays[1]), 1), 7);

      const matchCost = lower.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/);
      if (matchCost && matchCost[1]) {
        const parsed = parseInt(matchCost[1].replace(/,/g, ''));
        if (parsed > 0) budget = parsed;
      }

      if (lower.includes('family')) travellerType = 'family';
      else if (lower.includes('solo')) travellerType = 'solo';
      else if (lower.includes('friends') || lower.includes('group')) travellerType = 'friends';

      const res = await api.post('/ai/plan-itinerary', {
        origin,
        destination,
        days,
        people: travellerType === 'family' ? 4 : travellerType === 'solo' ? 1 : 2,
        budget,
        interests,
        pace: 'Moderate',
        diet: lower.includes('veg') ? 'Vegetarian' : 'No Preference'
      });

      if (res.data.success) {
        setPlanResult(res.data.plan);
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `I’ve created your ${days}-day itinerary for ${destination}. Check out the day-by-day plan on the right, complete with estimated costs, timing, and local food highlights.`
          }
        ]);
      } else {
        setErrorMsg(res.data.message || 'Could not create itinerary. Please retry.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Itinerary generation error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ background: '#f8fafc', minHeight: '90vh', paddingBottom: '90px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #065f46 100%)',
        color: '#ffffff',
        padding: '50px 0',
        marginBottom: '32px'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(110, 231, 183, 0.4)',
              color: '#6ee7b7',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              <Sparkles size={14} /> AI Travel Intelligence
            </div>
            <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', margin: '0 0 10px 0' }}>
              Chat with your itinerary planner
            </h1>
            <p style={{ color: '#e0f2fe', maxWidth: '760px', fontSize: '1rem', margin: 0 }}>
              Just describe your trip in plain language and I’ll turn it into a polished, day-by-day route with food, transport, and total cost planning.
            </p>
          </div>
          <img
            src="/logo.png"
            alt="Tourist AI Hub Logo"
            style={{
              height: '94px',
              width: '94px',
              borderRadius: '18px',
              objectFit: 'contain',
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '6px',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 26px rgba(0, 0, 0, 0.3)',
              flexShrink: 0
            }}
          />
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '420px minmax(0, 1fr)', gap: '28px', alignItems: 'start' }}>
          <div className="card" style={{ padding: '18px', background: '#fff', height: 'fit-content' }}>
            <div style={{
              background: '#f0f9ff',
              borderRadius: '16px',
              padding: '18px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#0284c7', fontWeight: '700' }}>
                <Compass size={18} /> Trip Assistant
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {chatMessages.map((message, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                      background: message.role === 'user' ? '#0284c7' : '#ffffff',
                      color: message.role === 'user' ? '#fff' : '#0f172a',
                      borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '12px 14px',
                      maxWidth: '92%',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.06)',
                      border: message.role === 'user' ? 'none' : '1px solid rgba(2, 132, 199, 0.15)'
                    }}
                  >
                    {message.text}
                  </div>
                ))}
                {generating && (
                  <div style={{ alignSelf: 'flex-start', background: '#ffffff', borderRadius: '16px 16px 16px 4px', padding: '12px 14px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
                      <span style={{ color: '#475569' }}>Planning your route...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleGeneratePlan} style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', marginBottom: '8px', textTransform: 'uppercase' }}>
                Ask the planner
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="Example: Plan a 3-day couple trip from Bengaluru to Mysore with heritage, food and shopping within ₹12,000"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit',
                  background: '#fff'
                }}
              />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', marginBottom: '14px' }}>
                {quickPrompts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPrompt(item)}
                    style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      color: '#0369a1',
                      borderRadius: '999px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {item.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {errorMsg && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.85rem' }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: '700' }}
                disabled={generating}
              >
                <Send size={16} />
                {generating ? 'Generating itinerary...' : 'Generate itinerary'}
              </button>
            </form>
          </div>

          <div>
            {planResult ? (
              <div className="animate-fade-in" id="printable-itinerary">
                <div className="card" style={{ padding: '26px', marginBottom: '22px', borderLeft: '6px solid #0284c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <span className="badge badge-sky">AI itinerary summary</span>
                      <h2 style={{ fontSize: '1.9rem', margin: '10px 0 6px', fontFamily: 'var(--font-serif)', color: 'var(--dark)' }}>
                        {planResult.destination} plan
                      </h2>
                      <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                        {planResult.origin} → {planResult.destination} • {planResult.days} days • {planResult.traveller_type} • {planResult.people} travelers
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b' }}>Estimated total</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '1.8rem', fontWeight: '800', color: '#0284c7' }}>
                        <IndianRupee size={20} />
                        {Number(planResult.estimated_cost).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Accommodation</div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>₹{planResult.cost_breakdown?.accommodation?.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Food</div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>₹{planResult.cost_breakdown?.food_dining?.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Travel</div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>₹{planResult.cost_breakdown?.transportation?.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Sightseeing</div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>₹{planResult.cost_breakdown?.sightseeing_activities?.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '18px' }}>
                    {savedSuccess ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '999px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: '700', fontSize: '0.85rem' }}>
                        <BookmarkCheck size={16} color="#10b981" /> Saved to trips
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => (isAuthenticated ? setSavedSuccess(true) : navigate('/login'))}>
                        <BookmarkCheck size={16} color="#0284c7" /> Save to My Trips
                      </button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                      <Printer size={16} color="#0284c7" /> Print Route
                    </button>
                  </div>

                  {/* Complete Plan to Package Booking with Instant Discount */}
                  <div style={{
                    marginTop: '20px',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    background: '#ecfdf5',
                    border: '1.5px dashed #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.94rem', fontWeight: '800', color: '#065f46' }}>
                        <Gift size={18} color="#10b981" /> Turn this AI Itinerary into a Guaranteed Package!
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#047857', marginTop: '3px' }}>
                        Includes Hotel + Private Transport + Meals + Guide • <strong>Special ₹1,500 Discount (AIPLAN1500)</strong> pre-applied!
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBookingModalPkg({
                          id: 1,
                          title: `${planResult.destination} All-Inclusive Holiday Package`,
                          destination_name: planResult.destination,
                          company_name: 'Incredible South Journeys',
                          duration_days: planResult.days,
                          duration_nights: Math.max(1, planResult.days - 1),
                          price: Math.round(planResult.estimated_cost / planResult.people),
                          hotel_type: 'Heritage Deluxe Hotel',
                          transport_type: planResult.transport || 'AC Private Sedan',
                          food_included: true,
                          guide_included: true
                        });
                      }}
                      className="btn btn-green"
                      style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <CreditCard size={18} /> Book Package with Discounts &rarr;
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {planResult.itinerary?.map((dayItem) => (
                    <div key={dayItem.day} className="card" style={{ padding: '22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(2, 132, 199, 0.12)', paddingBottom: '10px' }}>
                        <h3 style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--dark)' }}>{dayItem.title}</h3>
                        <span className="badge badge-sky">₹{dayItem.estimated_cost?.toLocaleString('en-IN')}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: '700', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>Morning</div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>{dayItem.morning}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#ecfdf5', color: '#047857', fontWeight: '700', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>Afternoon</div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>{dayItem.afternoon}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#f0f9ff', color: '#0284c7', fontWeight: '700', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>Evening</div>
                          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>{dayItem.evening}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', fontSize: '0.82rem', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Utensils size={14} color="#0284c7" /> {dayItem.food_recommendations?.specialty}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bus size={14} color="#10b981" /> {dayItem.suggested_transport}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {dayItem.travel_time}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {dayItem.attractions?.[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '52px 28px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', marginBottom: '16px' }}>
                  <Sparkles size={32} />
                </div>
                <h3 style={{ fontSize: '1.45rem', marginBottom: '10px', color: 'var(--dark)' }}>Your itinerary will appear here</h3>
                <p style={{ margin: 0, color: '#64748b', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                  Ask in plain English like “Plan a 3-day couple trip from Bengaluru to Mysore with heritage and vegetarian food under ₹12,000.”
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {bookingModalPkg && (
        <BookingModal
          bookingType="package"
          item={bookingModalPkg}
          initialPlan={planResult}
          onClose={() => setBookingModalPkg(null)}
          onComplete={() => {
            setSavedSuccess(true);
            setBookingModalPkg(null);
          }}
        />
      )}
    </div>
  );
}

