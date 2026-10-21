import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BrandLogo from '../components/BrandLogo';
import CultureSlider from '../components/CultureSlider';
import DestinationCard from '../components/DestinationCard';
import StateCard from '../components/StateCard';
import PackageCard from '../components/PackageCard';
import PaymentModal from '../components/PaymentModal';
import {
  Sparkles,
  Compass,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Award,
  HeartHandshake,
  Tag,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [destinations, setDestinations] = useState([]);
  const [states, setStates] = useState([]);
  const [packages, setPackages] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [quickOrigin, setQuickOrigin] = useState('Bengaluru');
  const [quickDest, setQuickDest] = useState('Mysore (Mysuru)');
  const [quickDays, setQuickDays] = useState(3);
  const [selectedBookingPkg, setSelectedBookingPkg] = useState(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const results = await Promise.allSettled([
          api.get('/destinations'),
          api.get('/states'),
          api.get('/packages')
        ]);
        const [destRes, stateRes, pkgRes] = results;

        if (destRes.status === 'fulfilled' && destRes.value.data?.success) {
          setDestinations(destRes.value.data.destinations || []);
        }
        if (stateRes.status === 'fulfilled' && stateRes.value.data?.success) {
          setStates(stateRes.value.data.states || []);
        }
        if (pkgRes.status === 'fulfilled' && pkgRes.value.data?.success) {
          setPackages((pkgRes.value.data.packages || []).slice(0, 3));
        }
      } catch (err) {
        console.error('Home data load error:', err.message);
      }
    }
    loadData();
  }, []);

  const handleProtectedAction = (e, targetPath) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: targetPath } });
    } else {
      navigate(targetPath);
    }
  };

  const handleQuickPlan = (e) => {
    e.preventDefault();
    const target = `/ai-planner?origin=${encodeURIComponent(quickOrigin)}&dest=${encodeURIComponent(quickDest)}&days=${quickDays}`;
    handleProtectedAction(e, target);
  };

  const categories = ['All', 'Heritage', 'Culture', 'Nature', 'Beach', 'Spiritual'];
  const filteredDestinations = activeCategory === 'All'
    ? destinations.slice(0, 6)
    : destinations.filter(d => d.category?.toLowerCase() === activeCategory.toLowerCase()).slice(0, 6);

  // Cultural Highlights Matrix (Location paired with Festival, Dance Form, and Cultural Uniqueness)
  const culturalHighlights = [
    {
      place: 'Mysore (Karnataka)',
      festival: 'Mysore Dasara (Jumboo Savari)',
      dance: 'Carnatic Royal Court Dance & Ganjifa',
      unique: 'The City of Palaces, illuminated by 100,000 golden bulbs amidst fragrant sandalwood, Mysore Silk, and melt-in-mouth Mysore Pak.',
      image: 'https://images.unsplash.com/photo-1580835845971-a393b73bf370?auto=format&fit=crop&w=800&q=80',
      tag: 'Royal Heritage'
    },
    {
      place: 'Hampi (Karnataka)',
      festival: 'Hampi Utsav (Vijaya Utsav)',
      dance: 'Yakshagana Classical Folk Theatre',
      unique: 'Capital of the 14th-century Vijayanagara Empire with colossal stone monolithic temples, musical pillars, and Tungabhadra coracles.',
      image: 'https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&w=800&q=80',
      tag: 'UNESCO Heritage'
    },
    {
      place: 'Alappuzha (Kerala)',
      festival: 'Nehru Trophy Snake Boat Race',
      dance: 'Kathakali Dance-Drama & Theyyam',
      unique: 'Venice of the East with tranquil palm-fringed backwaters, thatch-roofed Kettuvallam houseboats, and below-sea-level rice farming.',
      image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
      tag: 'Backwaters'
    },
    {
      place: 'Jaipur (Rajasthan)',
      festival: 'Teej, Gangaur & Elephant Festival',
      dance: 'Ghoomar & Kalbelia Gypsy Folk Dance',
      unique: 'India\'s first planned terracotta pink city, featuring Amber Fort Sheesh Mahal, astronomical Jantar Mantar, and Johari gem craftsmanship.',
      image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
      tag: 'The Pink City'
    },
    {
      place: 'Varanasi (Uttar Pradesh)',
      festival: 'Dev Deepawali (1M Diyas) & Shivratri',
      dance: 'Kathak Classical (Benares Gharana)',
      unique: 'One of Earth\'s oldest living cities, where thousands gather as bells echo and priests perform the multi-tiered brass lamp Ganga Aarti.',
      image: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80',
      tag: 'Spiritual Sanctum'
    },
    {
      place: 'Goa (Panaji & Coast)',
      festival: 'Goan Carnival & Shigmo Spring',
      dance: 'Goan Fado & Dekhni Folk Melodies',
      unique: '450-year Portuguese-Indian cultural synthesis featuring colorful Latin Quarter Fontainhas, ancient cathedrals, and spice plantation feni.',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
      tag: 'Coastal Heritage'
    }
  ];

  return (
    <div>
      {/* 1. Large Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '88vh',
        background: 'linear-gradient(to bottom, rgba(3, 105, 161, 0.72), rgba(15, 23, 42, 0.82)), url(https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1920&q=85)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        color: '#ffffff',
        padding: '60px 0 100px 0'
      }}>
        <div className="container" style={{ width: '100%', textAlign: 'center' }}>
          {/* Emblem Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(2, 132, 199, 0.3)',
            backdropFilter: 'blur(10px)',
            color: '#e0f2fe',
            padding: '7px 20px',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: '700',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '22px',
            border: '1px solid rgba(56, 189, 248, 0.4)'
          }}>
            <Sparkles size={15} color="#34d399" /> Intelligent Indian Tourism & Heritage Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            fontWeight: '800',
            lineHeight: 1.15,
            marginBottom: '18px',
            fontFamily: 'var(--font-serif)',
            textShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}>
            Discover Incredible India<br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Travel Beyond Destinations
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: '#f0f9ff',
            maxWidth: '780px',
            margin: '0 auto 28px auto',
            lineHeight: 1.6,
            fontWeight: '300'
          }}>
            Explore India's timeless heritage, classical arts, vibrant festivals, and scenic landscapes with a personalized AI travel planner, verified local guides, and 24x7 safety assistance.
          </p>

          {/* Prominent Explore / Auth Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '34px' }}>
            <button
              onClick={(e) => handleProtectedAction(e, '/explore')}
              className="btn btn-green btn-lg"
              style={{ fontWeight: '700', padding: '12px 28px', fontSize: '1rem', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)', cursor: 'pointer' }}
            >
              <Compass size={18} /> Explore Indian Destinations &rarr;
            </button>
            {!isAuthenticated ? (
              <button
                onClick={() => navigate('/login', { state: { from: '/explore' } })}
                className="btn btn-secondary btn-lg"
                style={{ fontWeight: '700', padding: '12px 28px', fontSize: '1rem', background: '#ffffff', color: '#0369a1', cursor: 'pointer' }}
              >
                Sign In / Register
              </button>
            ) : (
              <button
                onClick={(e) => handleProtectedAction(e, '/ai-planner')}
                className="btn btn-secondary btn-lg"
                style={{ fontWeight: '700', padding: '12px 28px', fontSize: '1rem', background: '#ffffff', color: '#0369a1', cursor: 'pointer' }}
              >
                <Sparkles size={18} color="#0284c7" /> Open AI Planner
              </button>
            )}
          </div>

          {/* Instant AI Trip Finder Bar */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 20px 45px rgba(2, 132, 199, 0.16)',
            maxWidth: '920px',
            margin: '0 auto',
            color: 'var(--dark)',
            border: '1px solid rgba(2, 132, 199, 0.15)'
          }}>
            <form onSubmit={handleQuickPlan} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 160px',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#0284c7" /> Starting From
                </label>
                <input
                  type="text"
                  value={quickOrigin}
                  onChange={(e) => setQuickOrigin(e.target.value)}
                  placeholder="e.g. Bengaluru, Mumbai"
                  className="form-control"
                  style={{ marginTop: '4px', padding: '10px 12px' }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Compass size={13} color="#0284c7" /> Dream Destination
                </label>
                <input
                  type="text"
                  value={quickDest}
                  onChange={(e) => setQuickDest(e.target.value)}
                  placeholder="e.g. Mysore, Hampi, Munnar"
                  className="form-control"
                  style={{ marginTop: '4px', padding: '10px 12px' }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} color="#0284c7" /> Duration (Days)
                </label>
                <select
                  value={quickDays}
                  onChange={(e) => setQuickDays(e.target.value)}
                  className="form-control"
                  style={{ marginTop: '4px', padding: '10px 12px' }}
                >
                  <option value={2}>2 Days Weekend</option>
                  <option value={3}>3 Days Explorer</option>
                  <option value={4}>4 Days Grand</option>
                  <option value={5}>5 Days Expedition</option>
                  <option value={7}>7 Days Comprehensive</option>
                </select>
              </div>

              <button type="submit" className="btn btn-green" style={{ height: '46px', marginTop: '16px', fontWeight: '700' }}>
                <Sparkles size={16} /> Plan My Trip
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. Indian Culture Slider */}
      <section className="section-padding" style={{ background: '#f8fafc' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle section-subtitle-green">Living Heritage</span>
            <h2 className="section-title">The Soul of Indian Culture</h2>
            <p className="section-desc">
              From the classical mudras of Kathakali and royal splendors of Mysore Dasara to ancient ghat rituals in Varanasi.
            </p>
          </div>
          <CultureSlider />
        </div>
      </section>

      {/* 3. Cultural Heritage Showcase: Location paired with Festival & Dance Form */}
      <section className="section-padding" style={{ background: '#ffffff', borderTop: '1px solid rgba(2, 132, 199, 0.1)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Cultural Identity</span>
            <h2 className="section-title">Destinations, Festivals & Classical Arts</h2>
            <p className="section-desc">
              India is not just places on a map—every region breathes through centuries of sacred festivals, distinct dance forms, and living folklore.
            </p>
          </div>

          <div className="grid-3">
            {culturalHighlights.map((item, idx) => (
              <div key={idx} className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: '190px', width: '100%' }}>
                  <img src={item.image} alt={item.place} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span className="badge badge-sky">{item.tag}</span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(7,89,133,0.92) 0%, transparent 60%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '16px'
                  }}>
                    <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
                      {item.place}
                    </h3>
                  </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Festival */}
                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', color: '#0369a1' }}>
                        🎪 Famous Festival
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0c4a6e' }}>
                        {item.festival}
                      </div>
                    </div>

                    {/* Dance Form */}
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', color: '#047857' }}>
                        💃 Classical Dance / Art
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#065f46' }}>
                        {item.dance}
                      </div>
                    </div>

                    {/* Uniqueness */}
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55, marginBottom: '16px' }}>
                      {item.unique}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleProtectedAction(e, `/explore?q=${encodeURIComponent(item.place.split(' ')[0])}`)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    Explore Cultural Journey &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Popular Destinations by Category */}
      <section className="section-padding" style={{ background: '#f0f9ff' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Top Destinations</span>
            <h2 className="section-title">Explore Indian Heritage Hubs</h2>
            <p className="section-desc">
              Discover timeless architectural marvels, tranquil backwaters, and sun-soaked coastlines curated with rich folklore.
            </p>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '24px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '999px',
                    border: activeCategory === cat ? 'none' : '1px solid rgba(2, 132, 199, 0.2)',
                    background: activeCategory === cat ? 'linear-gradient(135deg, #0284c7, #0ea5e9)' : '#ffffff',
                    color: activeCategory === cat ? '#ffffff' : '#334155',
                    fontWeight: '700',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: activeCategory === cat ? '0 4px 14px rgba(2, 132, 199, 0.25)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat === 'All' ? 'All Destinations' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-3">
            {filteredDestinations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button
              onClick={(e) => handleProtectedAction(e, '/explore')}
              className="btn btn-secondary btn-lg"
              style={{ gap: '8px', cursor: 'pointer' }}
            >
              View All Indian Destinations <ArrowRight size={16} color="#0284c7" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Explore Indian States */}
      <section className="section-padding" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle section-subtitle-green">State Highlights</span>
            <h2 className="section-title">Explore Indian States</h2>
            <p className="section-desc">
              Each Indian state represents a distinct civilization of art, food, architecture, and dance traditions.
            </p>
          </div>

          <div className="grid-3">
            {states.slice(0, 6).map((st) => (
              <StateCard key={st.id} state={st} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. AI Travel Planner Spotlight */}
      <section className="section-padding" style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #065f46 100%)',
        color: '#ffffff'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '50px',
            alignItems: 'center'
          }}>
            <div>
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#6ee7b7',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                border: '1px solid rgba(110, 231, 183, 0.4)',
                display: 'inline-block',
                marginBottom: '16px'
              }}>
                Smart Travel Companion
              </span>
              <h2 style={{
                fontSize: '2.4rem',
                fontFamily: 'var(--font-serif)',
                fontWeight: '800',
                lineHeight: 1.2,
                marginBottom: '18px'
              }}>
                Intelligent AI Travel Planner & Custom Itineraries
              </h2>
              <p style={{ fontSize: '1rem', color: '#e0f2fe', lineHeight: 1.7, marginBottom: '24px' }}>
                Stop spending weeks juggling spreadsheets. Simply select your travel origin, budget, dietary choices (Vegetarian / Regional), and passions (Heritage, Nature, Photography). Our AI crafts an optimized Day 1..N schedule featuring Morning, Afternoon, and Evening slots.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} color="#34d399" />
                  <span style={{ fontSize: '0.92rem' }}>Dynamic Day 1 to Day N schedule with timing, sights & dining</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} color="#34d399" />
                  <span style={{ fontSize: '0.92rem' }}>Instant ₹1,500 discount when booking via generated AI plans</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} color="#34d399" />
                  <span style={{ fontSize: '0.92rem' }}>Integrated UPI, RuPay, Card & NetBanking payment gateway</span>
                </div>
              </div>

              <button
                onClick={(e) => handleProtectedAction(e, '/ai-planner')}
                className="btn btn-green btn-lg"
                style={{ display: 'inline-flex', cursor: 'pointer' }}
              >
                <Sparkles size={18} /> Launch AI Travel Planner
              </button>
            </div>

            {/* Visual Demo Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              color: 'var(--dark)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid rgba(56, 189, 248, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(2, 132, 199, 0.12)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' }}>Sample AI Output</span>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Mysore 3-Day Cultural Trail</h4>
                </div>
                <span className="badge badge-green">Budget: ₹9,500</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #0284c7' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0369a1' }}>Day 1 • Morning</strong>
                  <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0', color: '#334155' }}>
                    Guided exploration of Mysore Palace. Marvel at stained glass and golden throne.
                  </p>
                </div>
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#047857' }}>Day 1 • Afternoon</strong>
                  <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0', color: '#334155' }}>
                    Authentic Mylari Dosa with white butter, followed by Devaraja silk market walk.
                  </p>
                </div>
                <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #0ea5e9' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0284c7' }}>Day 1 • Evening</strong>
                  <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0', color: '#334155' }}>
                    Musical fountain illumination at Brindavan Gardens & royal dinner.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Popular Tour Packages with Direct Payment Gateway Booking */}
      <section className="section-padding" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Complete Packages</span>
            <h2 className="section-title">Curated Holiday Packages</h2>
            <p className="section-desc">
              All-inclusive travel packages with instant UPI & card checkout, seasonal discounts, and verified guide support.
            </p>
          </div>

          <div className="grid-3">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onBook={(selectedPkg) => {
                  if (!isAuthenticated) {
                    navigate('/login', { state: { from: '/packages' } });
                  } else {
                    setSelectedBookingPkg(selectedPkg);
                  }
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button
              onClick={(e) => handleProtectedAction(e, '/packages')}
              className="btn btn-secondary"
              style={{ cursor: 'pointer' }}
            >
              Browse All Tour Packages &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 8. Why Tourist AI Hub? */}
      <section className="section-padding" style={{ background: '#f8fafc', borderTop: '1px solid rgba(2, 132, 199, 0.1)', borderBottom: '1px solid rgba(2, 132, 199, 0.1)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle section-subtitle-green">Why Choose Us</span>
            <h2 className="section-title">Built for the Modern Indian Traveler</h2>
            <p className="section-desc">
              One unified platform to take you from discovery to verified trip booking, instant discounts, and on-ground safety.
            </p>
          </div>

          <div className="grid-4">
            <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#0284c7' }}>
                <Sparkles size={26} />
              </div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#0f172a' }}>AI-Powered Planning</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Generates personalized day-by-day itineraries aligned with your travel companions, dates, and budget.
              </p>
            </div>

            <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#10b981' }}>
                <Award size={26} />
              </div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#0f172a' }}>Certified Guides</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Verified local historians and storytellers with multi-lingual expertise across Hindi, Kannada, Malayalam, and English.
              </p>
            </div>

            <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#0284c7' }}>
                <Tag size={26} />
              </div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#0f172a' }}>Discounts & Fast Gateway</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Apply festive coupon codes and pay instantly through UPI QR, RuPay, Cards, and Net Banking.
              </p>
            </div>

            <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#dc2626' }}>
                <ShieldAlert size={26} />
              </div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#0f172a' }}>24x7 Safety Assistance</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Destination-specific tourist police desks, hospitals, and national 112/1363 emergency integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Emergency Assistance Spotlight */}
      <section className="section-padding" style={{ background: '#ffffff' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #075985 0%, #0369a1 50%, #065f46 100%)',
            borderRadius: '20px',
            padding: '40px',
            color: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '30px',
            boxShadow: '0 20px 40px rgba(2, 132, 199, 0.18)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6ee7b7', fontWeight: '700', fontSize: '0.88rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                <HeartHandshake size={18} /> Tourist Safety First
              </div>
              <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '10px' }}>
                Traveling to India? Help is Always 1-Click Away.
              </h3>
              <p style={{ color: '#e0f2fe', maxWidth: '600px', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Every destination on Tourist AI Hub includes nearest verified Police stations, multi-specialty trauma hospitals, ambulance dispatch, and tourist facilitation counters.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={(e) => handleProtectedAction(e, '/emergency')}
                className="btn btn-primary btn-lg"
                style={{ cursor: 'pointer' }}
              >
                View Emergency Contacts
              </button>
              <a href="tel:1363" className="btn btn-green btn-lg">
                Call Helpline: 1363
              </a>
            </div>
          </div>
        </div>
      </section>

      {paymentSuccessMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            background: '#ffffff',
            border: '2px solid #10b981',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
            maxWidth: '440px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ background: '#ecfdf5', color: '#059669', borderRadius: '50%', padding: '6px', flexShrink: 0 }}>
            <CheckCircle2 size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1rem' }}>🎉 Payment Successful!</div>
            <div style={{ fontSize: '0.84rem', color: '#334155', marginTop: '2px' }}>
              Your booking <strong>{paymentSuccessMsg.booking_reference || `TH-BK-${paymentSuccessMsg.booking_id}`}</strong> has been confirmed.
            </div>
            <div style={{ marginTop: '8px' }}>
              <Link to="/dashboard" style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 800, textDecoration: 'underline' }}>
                View Booking & Receipt in Dashboard &rarr;
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Payment Gateway Modal (Integrated directly on Home for any package selection) */}
      {selectedBookingPkg && (
        <PaymentModal
          pkg={selectedBookingPkg}
          onClose={() => setSelectedBookingPkg(null)}
          onBookingComplete={(data) => {
            setPaymentSuccessMsg(data);
            setSelectedBookingPkg(null);
          }}
        />
      )}
    </div>
  );
}

