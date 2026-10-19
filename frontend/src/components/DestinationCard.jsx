import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star, Clock, IndianRupee, ArrowRight } from 'lucide-react';

export default function DestinationCard({ destination }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    id,
    name,
    location,
    category,
    image_url,
    description,
    estimated_cost_per_day,
    recommended_duration_days,
    rating,
    reviews_count,
    state_name,
    famous_festival,
    famous_dance_art,
    cultural_uniqueness
  } = destination;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
        <img
          src={image_url}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        />
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 2,
          display: 'flex',
          gap: '6px'
        }}>
          <span className="badge badge-sky" style={{ fontWeight: '700' }}>
            {category || 'Heritage'}
          </span>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(6px)',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Star size={13} fill="#10b981" color="#10b981" />
          <span>{rating || 4.8}</span>
          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>({reviews_count || 120})</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Location with State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#64748b', marginBottom: '6px' }}>
            <MapPin size={14} color="#0284c7" />
            <span style={{ fontWeight: '600' }}>{location || state_name}</span>
          </div>

          {/* Place Title */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--dark)', marginBottom: '10px' }}>
            {name}
          </h3>

          {/* Respective Festival & Dance Highlight Ribbon */}
          {(famous_festival || famous_dance_art) && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '12px'
            }}>
              {famous_festival && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  color: '#0369a1',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>🎪</span>
                  <span><strong>Festival:</strong> {famous_festival}</span>
                </div>
              )}
              {famous_dance_art && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  color: '#047857',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>💃</span>
                  <span><strong>Dance/Art:</strong> {famous_dance_art}</span>
                </div>
              )}
            </div>
          )}

          {/* Unique Cultural Aspect or Description */}
          <p style={{
            fontSize: '0.86rem',
            color: '#475569',
            lineHeight: 1.55,
            marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {cultural_uniqueness || description}
          </p>
        </div>

        {/* Footer Meta */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid rgba(2, 132, 199, 0.12)',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.84rem', color: '#64748b' }}>
              <Clock size={14} color="#0284c7" />
              <span>{recommended_duration_days || 3} Days Tour</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>From</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                <IndianRupee size={15} />
                <span>{Math.round(estimated_cost_per_day)}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: '500', color: '#64748b' }}>/day</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const target = `/destination/${id}`;
              if (!isAuthenticated) {
                navigate('/login', { state: { from: target } });
              } else {
                navigate(target);
              }
            }}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '9px 14px', fontSize: '0.88rem', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
          >
            Explore Cultural Lore <ArrowRight size={14} color="#0284c7" />
          </button>
        </div>
      </div>
    </div>
  );
}

