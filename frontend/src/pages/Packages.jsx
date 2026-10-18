import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PackageCard from '../components/PackageCard';
import BookingModal from '../components/BookingModal';
import { Package, Search, Filter, Calendar, Users, IndianRupee, ShieldCheck } from 'lucide-react';


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
        if (res.data.success) {
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
      <div style={{
        background: 'linear-gradient(135deg, #1c1917 0%, #2f1d18 100%)',
        color: '#ffffff',
        padding: '50px 0',
        marginBottom: '40px'
      }}>
        <div className="container">
          <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Curated Indian Expeditions
          </span>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', marginTop: '6px', marginBottom: '12px' }}>
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
          padding: '20px 24px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '36px'
        }}>
          <div>
            <label className="form-label" style={{ marginBottom: '4px' }}>Max Package Price (₹)</label>
            <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="form-control" style={{ width: '200px' }}>
              <option value="">Any Price</option>
              <option value="10000">Under ₹10,000</option>
              <option value="15000">Under ₹15,000</option>
              <option value="20000">Under ₹20,000</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '4px' }}>Trip Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="form-control" style={{ width: '180px' }}>
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

      {bookingPkg && (
        <BookingModal
          bookingType="package"
          item={bookingPkg}
          onClose={() => setBookingPkg(null)}
          onComplete={() => setBookingPkg(null)}
        />
      )}
    </div>
  );
}
