import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Star, Award, Phone, MapPin, IndianRupee, CheckCircle, Globe } from 'lucide-react';

export default function Guides() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialization, setSpecialization] = useState('');

  useEffect(() => {
    async function loadGuides() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (specialization) params.append('specialization', specialization);

        const res = await api.get(`/guides?${params.toString()}`);
        if (res.data.success) {
          setGuides(res.data.guides);
        }
      } catch (err) {
        console.error('Failed to load guides:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGuides();
  }, [specialization]);

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
            Local Storytellers & Historians
          </span>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', marginTop: '6px', marginBottom: '12px' }}>
            Government & Certified Tourist Guides
          </h1>
          <p style={{ color: '#cbd5e1', maxWidth: '650px', fontSize: '0.98rem' }}>
            Discover the living history of Indian temples, forts, and hidden village trails accompanied by licensed local guides fluent in regional languages.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Specialization Filter */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
          {['All', 'Heritage', 'Culture', 'Nature', 'Spiritual'].map((spec) => (
            <button
              key={spec}
              onClick={() => setSpecialization(spec === 'All' ? '' : spec)}
              style={{
                padding: '9px 18px',
                borderRadius: '30px',
                border: (spec === 'All' && !specialization) || specialization === spec ? 'none' : '1px solid var(--border)',
                background: (spec === 'All' && !specialization) || specialization === spec ? 'linear-gradient(135deg, #e65100, #ff8a00)' : '#ffffff',
                color: (spec === 'All' && !specialization) || specialization === spec ? '#ffffff' : 'var(--dark)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {spec === 'All' ? 'All Specializations' : `${spec} Guides`}
            </button>
          ))}
        </div>

        {/* Guides Grid */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--primary)', fontWeight: '600' }}>
            Loading licensed guides...
          </p>
        ) : (
          <div className="grid-3">
            {guides.map((g) => (
              <div key={g.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                    <img src={g.image_url} alt={g.name} style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{g.name}</h3>
                      <div style={{ fontSize: '0.82rem', color: '#e65100', fontWeight: '700' }}>
                        {g.specialization}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#d97706', marginTop: '2px' }}>
                        <Star size={13} fill="#d97706" /> {g.rating} • {g.experience_years} Years Experience
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--slate)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} color="#e65100" />
                    <span>Based in: <strong>{g.destination_name}</strong></span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Globe size={14} color="#0284c7" />
                    <span>Languages: <strong>{g.languages}</strong></span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--slate)' }}>Guiding Fee</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--dark)' }}>
                        ₹{Number(g.price_per_day).toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', fontWeight: '500' }}>/day</span>
                      </div>
                    </div>
                    <a href={`tel:${g.contact}`} className="btn btn-primary btn-sm">
                      <Phone size={14} /> Contact Guide
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

