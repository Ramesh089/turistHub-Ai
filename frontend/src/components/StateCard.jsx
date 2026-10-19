import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Sparkles, ArrowRight } from 'lucide-react';

export default function StateCard({ state }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { code, name, capital, description, image_url, best_time, highlights, places_count } = state;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
        <img
          src={image_url}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(7, 89, 133, 0.9) 0%, transparent 60%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#6ee7b7', letterSpacing: '1px' }}>
            Capital: {capital}
          </span>
          <h3 style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-serif)', margin: 0 }}>
            {name}
          </h3>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: '0.88rem',
            color: '#475569',
            lineHeight: 1.5,
            marginBottom: '14px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {description}
          </p>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} color="#0284c7" /> Key Highlights:
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
              {highlights}
            </div>
          </div>
        </div>

        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderTop: '1px solid rgba(2, 132, 199, 0.12)',
            fontSize: '0.82rem',
            color: '#64748b'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} color="#10b981" /> {best_time}
            </span>
            <span style={{ fontWeight: '700', color: '#0284c7' }}>
              {places_count || 1}+ Places
            </span>
          </div>

          <button
            onClick={() => {
              const target = `/explore?state=${code}`;
              if (!isAuthenticated) {
                navigate('/login', { state: { from: target } });
              } else {
                navigate(target);
              }
            }}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '10px', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
          >
            Explore {name} <ArrowRight size={13} color="#0284c7" />
          </button>
        </div>
      </div>
    </div>
  );
}

