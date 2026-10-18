import React from 'react';
import { Star, MapPin, IndianRupee, ShieldCheck } from 'lucide-react';

export default function PackageCard({ pkg, onBook }) {
  const {
    id,
    title,
    destination_name,
    company_name,
    duration_days,
    duration_nights,
    price,
    transport_type,
    hotel_type,
    food_included,
    guide_included,
    image_url,
    rating
  } = pkg;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', height: '210px', width: '100%', overflow: 'hidden' }}>
        <img
          src={image_url}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
          color: '#ffffff',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: '700',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
        }}>
          {duration_days} Days / {duration_nights} Nights
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
          <span>{rating || 4.9}</span>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#64748b', marginBottom: '4px' }}>
            <MapPin size={13} color="#0284c7" />
            <span style={{ fontWeight: '600' }}>{destination_name}</span>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--dark)', marginBottom: '6px', lineHeight: 1.3 }}>
            {title}
          </h3>

          <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '600', marginBottom: '12px' }}>
            Operated by {company_name}
          </div>

          {/* Inclusions Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.75rem', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '6px', color: '#0369a1', fontWeight: '600' }}>
              🏨 {hotel_type}
            </span>
            <span style={{ fontSize: '0.75rem', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '6px', color: '#0369a1', fontWeight: '600' }}>
              🚗 {transport_type}
            </span>
            {food_included && (
              <span style={{ fontSize: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', color: '#047857', fontWeight: '600' }}>
                🍽️ Meals Included
              </span>
            )}
            {guide_included && (
              <span style={{ fontSize: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', color: '#047857', fontWeight: '600' }}>
                🧭 Tour Guide
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Booking Action */}
        <div style={{ paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Package Price</div>
              <div style={{ fontSize: '1.28rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center' }}>
                <IndianRupee size={17} color="#d97706" />
                <span>{Math.round(price).toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: '500', color: '#64748b', marginLeft: '3px' }}>/guest</span>
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '700', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px' }}>
              ✦ Instant Confirmation
            </div>
          </div>

          <button
            onClick={() => onBook && onBook(pkg)}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Book This Package
          </button>
        </div>
      </div>
    </div>
  );
}
