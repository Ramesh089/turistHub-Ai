import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PackageCard from '../components/PackageCard';
import BookingModal from '../components/BookingModal';
import { Package, Search, Filter, Calendar, Users, IndianRupee, ShieldCheck, CheckCircle2 } from 'lucide-react';


export default function Packages() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [maxPrice, setMaxPrice] = useState('');
  const [duration, setDuration] = useState('');

  // Payment Gateway Modal
  const [bookingPkg, setBookingPkg] = useState(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState(null);

  useEffect(() => {
    async function loadPackages() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const destParam = searchParams.get('dest');
        if (destParam) params.append('destination_id', destParam);
        if (maxPrice) params.append('max_price', maxPrice);
        if (duration) params.append('duration', duration);

        const res = await api.get(`/packages?${params.toString()}`);
        if (res.data.success && Array.isArray(res.data.packages)) {
          setPackages(res.data.packages);
        }
      } catch (err) {
        console.error('Load packages error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPackages();
  }, [searchParams, maxPrice, duration]);

  const handleOpenBooking = (pkg) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBookingPkg(pkg);
  };

  return (
    <div style={{ background: '#faf6f0', minHeight: '90vh', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-banner" style={{
        background: 'linear-gradient(135deg, #1c1917 0%, #2f1d18 100%)',
        color: '#ffffff'
      }}>
        <div className="container">
          <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Curated Indian Expeditions
          </span>
          <h1 className="page-banner-title">
            All-Inclusive Tour Packages
          </h1>
          <p style={{ color: '#cbd5e1', maxWidth: '650px', fontSize: '0.98rem' }}>
            Book complete holiday packages including luxury transport, heritage palace hotel stays, certified guides, authentic meals, and instant online payment checkout.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Filters */}
        <div style={{
          background: '#ffffff',
          padding: 'clamp(14px, 3vw, 20px) clamp(16px, 3vw, 24px)',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '36px'
        }}>
          <div style={{ width: 'min(100%, 200px)' }}>
            <label className="form-label" style={{ marginBottom: '4px' }}>Max Package Price (₹)</label>
            <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="form-control" style={{ width: '100%' }}>
              <option value="">Any Price</option>
              <option value="10000">Under ₹10,000</option>
              <option value="15000">Under ₹15,000</option>
              <option value="20000">Under ₹20,000</option>
            </select>
          </div>

          <div style={{ width: 'min(100%, 180px)' }}>
            <label className="form-label" style={{ marginBottom: '4px' }}>Trip Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="form-control" style={{ width: '100%' }}>
              <option value="">Any Duration</option>
              <option value="3">3 Days</option>
              <option value="4">4 Days</option>
              <option value="5">5 Days</option>
            </select>
          </div>

          {(maxPrice || duration) && (
            <button
              onClick={() => { setMaxPrice(''); setDuration(''); }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '22px' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Packages Grid */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--primary)', fontWeight: '600' }}>
            Loading curated packages...
          </p>
        ) : packages.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Package size={48} color="#d97706" style={{ margin: '0 auto 16px auto' }} />
            <h3>No Packages Match Your Criteria</h3>
            <p style={{ color: 'var(--slate)', margin: '10px 0 20px 0' }}>Try clearing filters to see all packages.</p>
            <button onClick={() => { setMaxPrice(''); setDuration(''); }} className="btn btn-primary">
              View All Packages
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onBook={handleOpenBooking}
              />
            ))}
          </div>
        )}
      </div>

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

      {bookingPkg && (
        <BookingModal
          bookingType="package"
          item={bookingPkg}
          onClose={() => setBookingPkg(null)}
          onComplete={(data) => {
            setPaymentSuccessMsg(data);
            setBookingPkg(null);
          }}
        />
      )}
    </div>
  );
}
