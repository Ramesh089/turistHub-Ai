import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, HeartHandshake } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Footer() {
  return (
    <footer style={{
      background: '#f0f9ff',
      color: '#334155',
      padding: '60px 0 28px 0',
      borderTop: '3px solid #0284c7'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '36px',
          marginBottom: '44px'
        }}>
          {/* Col 1: Brand & Philosophy */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <BrandLogo />
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.7, marginBottom: '14px' }}>
              Discover Incredible India – Travel Beyond Destinations. An intelligent travel companion connecting cultural heritage, personalized AI itineraries, safe transport, and verified guide bookings.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: '#047857',
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid #a7f3d0',
              fontWeight: '700'
            }}>
              Ministry of Tourism Compliant System
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ color: '#0c4a6e', fontFamily: 'var(--font-serif)', marginBottom: '16px', fontSize: '1.05rem', fontWeight: '700' }}>
              Explore India
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.88rem' }}>
              <li><Link to="/explore" style={{ color: '#475569' }}>All Destinations</Link></li>
              <li><Link to="/explore?category=Heritage" style={{ color: '#475569' }}>UNESCO Heritage Sites</Link></li>
              <li><Link to="/explore?category=Nature" style={{ color: '#475569' }}>Hill Stations & Nature</Link></li>
              <li><Link to="/explore?category=Spiritual" style={{ color: '#475569' }}>Spiritual Pilgrimages</Link></li>
              <li><Link to="/explore?category=Beach" style={{ color: '#475569' }}>Coastal & Beaches</Link></li>
              <li><Link to="/packages" style={{ color: '#475569' }}>Curated Tour Packages</Link></li>
            </ul>
          </div>

          {/* Col 3: Services & AI Tools */}
          <div>
            <h4 style={{ color: '#0c4a6e', fontFamily: 'var(--font-serif)', marginBottom: '16px', fontSize: '1.05rem', fontWeight: '700' }}>
              Travel Services
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.88rem' }}>
              <li><Link to="/ai-planner" style={{ color: '#0284c7', fontWeight: '700' }}>AI Itinerary Planner &rarr;</Link></li>
              <li><Link to="/hotels" style={{ color: '#475569' }}>Heritage Hotels & Resorts</Link></li>
              <li><Link to="/transport" style={{ color: '#475569' }}>Trains, Flights & Cabs</Link></li>
              <li><Link to="/guides" style={{ color: '#475569' }}>Certified Tourist Guides</Link></li>
              <li><Link to="/dashboard" style={{ color: '#475569' }}>My Trips & Bookings</Link></li>
              <li><Link to="/login" style={{ color: '#475569' }}>Tourist & Admin Portal</Link></li>
            </ul>
          </div>

          {/* Col 4: Safety & Emergency */}
          <div>
            <h4 style={{ color: '#0c4a6e', fontFamily: 'var(--font-serif)', marginBottom: '16px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              <ShieldAlert size={18} color="#0284c7" /> Safety & Helplines
            </h4>
            <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.2)', marginBottom: '10px', boxShadow: '0 4px 10px rgba(2, 132, 199, 0.05)' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>National Emergency Helpline</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0284c7' }}>112</div>
            </div>
            <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '12px', border: '1px solid #a7f3d0', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.05)' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Tourist Helpline (24x7)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#059669' }}>1363</div>
            </div>
            <Link to="/emergency" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px', color: '#0284c7', fontSize: '0.85rem', fontWeight: '700' }}>
              <HeartHandshake size={14} /> View Emergency Directory &rarr;
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(2, 132, 199, 0.15)',
          paddingTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.82rem',
          color: '#64748b'
        }}>
          <div>
            &copy; {new Date().getFullYear()} <strong>Tourist AI Hub</strong>. Dedicated to promoting Incredible India and authentic cultural journeys.
          </div>
          <div style={{ display: 'flex', gap: '16px', fontWeight: '600', color: '#0284c7' }}>
            <span>Karnataka</span>
            <span>Kerala</span>
            <span>Rajasthan</span>
            <span>Goa</span>
            <span>Uttar Pradesh</span>
            <span>Himachal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

