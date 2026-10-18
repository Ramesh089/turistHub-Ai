import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bus, Plane, Train, Car, IndianRupee, CreditCard } from 'lucide-react';
import BookingModal from '../components/BookingModal';

const TRANSPORT_ICONS = {
  Train:          <Train size={24} color="#e65100" />,
  Bus:            <Bus   size={24} color="#d97706" />,
  Flight:         <Plane size={24} color="#0284c7" />,
  'Private Driver': <Car size={24} color="#16a34a" />,
  'Rental Car':   <Car  size={24} color="#4f46e5" />,
  Cab:            <Car  size={24} color="#ea580c" />,
};

export default function Transport() {
  const [transports,    setTransports]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedType,  setSelectedType]  = useState('Any');
  const [bookingVehicle, setBookingVehicle] = useState(null); // opens BookingModal

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedType && selectedType !== 'Any') params.append('transport_type', selectedType);
        const res = await api.get(`/transport?${params.toString()}`);
        if (res.data.success) setTransports(res.data.transports);
      } catch (err) {
        console.error('Failed to load transport:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedType]);

  return (
    <div style={{ background: '#f8fafc', minHeight: '90vh', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1 60%, #065f46)', color: '#fff', padding: '50px 0', marginBottom: 40 }}>
        <div className="container">
          <span style={{ color: '#6ee7b7', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Seamless Transit
          </span>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', marginTop: 6, marginBottom: 10 }}>
            Intercity Transportation
          </h1>
          <p style={{ color: '#e0f2fe', maxWidth: 640, fontSize: '0.97rem' }}>
            Compare Vande Bharat trains, luxury Volvo coaches, regional flights, and private chauffeur services. Pick your seat and pay instantly.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 30 }}>
          {['Any', 'Train', 'Bus', 'Flight', 'Private Driver'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                padding: '9px 22px', borderRadius: 30, fontWeight: 600, cursor: 'pointer',
                border: selectedType === type ? 'none' : '1px solid #e2e8f0',
                background: selectedType === type ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#fff',
                color: selectedType === type ? '#fff' : '#334155',
                boxShadow: selectedType === type ? '0 2px 8px rgba(2,132,199,0.3)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {type === 'Any' ? 'All Modes' : type}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: '#0284c7', fontWeight: 600 }}>Loading transport options...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {transports.map(t => (
              <div key={t.id} className="card" style={{ padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                {/* Left: icon + details */}
                <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {TRANSPORT_ICONS[t.transport_type] || <Bus size={24} />}
                  </div>
                  <div>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{t.transport_type}</span>
                    <h3 style={{ fontSize: '1.2rem', margin: '6px 0 4px', color: '#0f172a' }}>{t.provider}</h3>
                    <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>{t.route}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 3 }}>
                      Dep: <strong>{t.departure_time}</strong> &nbsp;•&nbsp; Arr: <strong>{t.arrival_time}</strong> &nbsp;•&nbsp; {t.duration}
                    </div>
                  </div>
                </div>

                {/* Right: price + book */}
                <div style={{ textAlign: 'right', minWidth: 130 }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Fare / Seat</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <IndianRupee size={18} />{Number(t.price).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, marginBottom: 8 }}>
                    Instant Seat Booking
                  </div>
                  <button
                    onClick={() => setBookingVehicle(t)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginLeft: 'auto' }}
                  >
                    <CreditCard size={14} /> Select Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingVehicle && (
        <BookingModal
          bookingType="transport"
          item={bookingVehicle}
          onClose={() => setBookingVehicle(null)}
          onComplete={() => setBookingVehicle(null)}
        />
      )}
    </div>
  );
}

