import React from 'react';
import {
  MapPin,
  Star,
  Clock,
  Compass,
  Navigation,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function NearbyPlacesList({
  places = [],
  selectedCategory = 'all',
  onSelectCategory,
  selectedRadius = 25,
  onSelectRadius,
  selectedPlace,
  onSelectPlace,
  onAskAI,
  userLocation,
  hasExpandedRadius,
  strictMatchesCount
}) {
  const categories = [
    { key: 'all', label: 'All Places', emoji: '✨' },
    { key: 'attraction', label: 'Tourist Attractions', emoji: '📍' },
    { key: 'heritage', label: 'Historical Places', emoji: '🏛️' },
    { key: 'temple', label: 'Temples & Religious', emoji: '🛕' },
    { key: 'museum', label: 'Museums & Culture', emoji: '🎨' },
    { key: 'nature', label: 'Nature & Parks', emoji: '🌿' },
    { key: 'restaurant', label: 'Food & Cafes', emoji: '🍽️' }
  ];

  const radii = [1, 5, 10, 25];

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'heritage': return 'badge-heritage';
      case 'temple': return 'badge-spiritual';
      case 'nature': return 'badge-nature';
      case 'museum': return 'badge-sky';
      case 'restaurant': return 'badge-culture';
      default: return 'badge-beach';
    }
  };

  return (
    <div>
      {/* Category & Radius Filters Header */}
      <div style={{
        background: '#ffffff',
        padding: '18px 20px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px'
      }}>
        {/* Radius Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--dark)' }}>
            <Compass size={16} color="#0284c7" />
            <span>Search Radius:</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {radii.map((r) => (
              <button
                key={r}
                onClick={() => onSelectRadius(r)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: selectedRadius === r ? '700' : '500',
                  border: selectedRadius === r ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                  background: selectedRadius === r ? '#e0f2fe' : '#ffffff',
                  color: selectedRadius === r ? '#0369a1' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {r} km
              </button>
            ))}
            <button
              onClick={() => onSelectRadius(50)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: selectedRadius === 50 ? '700' : '500',
                border: selectedRadius === 50 ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                background: selectedRadius === 50 ? '#e0f2fe' : '#ffffff',
                color: selectedRadius === 50 ? '#0369a1' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              50+ km (All)
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              style={{
                whiteSpace: 'nowrap',
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: selectedCategory === cat.key ? '700' : '500',
                border: selectedCategory === cat.key ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                background: selectedCategory === cat.key ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f8fafc',
                color: selectedCategory === cat.key ? '#ffffff' : '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: selectedCategory === cat.key ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded radius notification if closest was beyond strict radius */}
      {hasExpandedRadius && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '12px 18px',
          fontSize: '0.85rem',
          color: '#92400e',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📍</span>
          <span>
            No places were found within strictly <strong>{selectedRadius} km</strong> of your exact spot. Showing the closest attractions in your area below:
          </span>
        </div>
      )}

      {/* Places Cards Grid */}
      {places.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          border: '1px solid var(--border)'
        }}>
          <Compass size={40} color="#d97706" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.15rem', color: 'var(--dark)', marginBottom: '6px' }}>No Nearby Places Found</h4>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Try expanding your search radius to 25 km or selecting "All Places".
          </p>
          <button
            onClick={() => { onSelectRadius(25); onSelectCategory('all'); }}
            className="btn btn-primary btn-sm"
          >
            Show All Places within 25 km
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {places.map((place) => {
            const isSelected = selectedPlace?.id === place.id;
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation?.latitude || ''},${userLocation?.longitude || ''}&destination=${place.latitude},${place.longitude}`;

            return (
              <div
                key={place.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: isSelected ? '2px solid #0284c7' : '1px solid rgba(2, 132, 199, 0.14)',
                  boxShadow: isSelected ? '0 12px 28px rgba(2, 132, 199, 0.16)' : 'var(--shadow-sm)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  transform: isSelected ? 'translateY(-4px)' : 'none'
                }}
              >
                {/* Image & Badges */}
                <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={place.image_url}
                    alt={place.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                  />

                  {/* Category Badge (Top-left) */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
                    <span className={`badge ${getCategoryBadgeClass(place.category)}`} style={{ fontWeight: '700' }}>
                      {place.category_label || place.category}
                    </span>
                  </div>

                  {/* Distance Pill (Top-right) */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 2,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Navigation size={12} color="#38bdf8" />
                    <span>{place.distance_text}</span>
                  </div>

                  {/* Verified Rating (Bottom-right) */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 2,
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(6px)',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star size={12} fill="#10b981" color="#10b981" />
                    <span>{place.rating || 4.8}</span>
                    <span style={{ color: '#64748b', fontSize: '0.68rem' }}>({place.reviews_count || 120})</span>
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Place Title */}
                    <h3 style={{
                      fontSize: '1.15rem',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: '700',
                      color: 'var(--dark)',
                      marginBottom: '6px',
                      lineHeight: 1.3
                    }}>
                      {place.name}
                    </h3>

                    {/* Opening hours & Status */}
                    {place.opening_hours && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.76rem',
                        color: '#059669',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}>
                        <Clock size={13} color="#059669" />
                        <span>{place.opening_hours}</span>
                      </div>
                    )}

                    {/* Short Description */}
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--slate)',
                      lineHeight: 1.5,
                      marginBottom: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {place.description}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      {/* View on Map */}
                      <button
                        onClick={() => onSelectPlace(place)}
                        style={{
                          background: isSelected ? '#0284c7' : '#f0f9ff',
                          color: isSelected ? '#ffffff' : '#0369a1',
                          border: '1px solid #bae6fd',
                          borderRadius: '8px',
                          padding: '7px 8px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <MapPin size={13} />
                        <span>{isSelected ? 'Focused on Map' : 'View on Map'}</span>
                      </button>

                      {/* Get Directions */}
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#ffffff',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '7px 8px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Navigation size={13} color="#0284c7" />
                        <span>Directions ↗</span>
                      </a>
                    </div>

                    {/* Ask AI About This Place */}
                    <button
                      onClick={() => onAskAI(place)}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '7px 12px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fef3c7';
                        e.currentTarget.style.borderColor = '#f59e0b';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
                        e.currentTarget.style.borderColor = '#fde68a';
                      }}
                    >
                      <Sparkles size={13} color="#d97706" />
                      <span>Ask AI About This Place</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
