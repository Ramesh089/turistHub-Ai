import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, MapPin, Star, ShieldCheck, Volume2, ArrowRight } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export const SHOWCASE_DESTINATIONS = [
  {
    id: 1,
    title: 'Mysore Grand Palace',
    state: 'Karnataka',
    category: 'Royal Heritage',
    tagline: 'City of Palaces & illuminated nocturnal royal grandeur',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=85',
    rating: '4.9',
    badge: 'AI Narration Active'
  },
  {
    id: 2,
    title: 'Munnar Emerald Hills',
    state: 'Kerala',
    category: 'Nature & Tea Valleys',
    tagline: "God's Own Country with mist-laden tea estates and serenity",
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=85',
    rating: '4.8',
    badge: 'Eco Trails Verified'
  },
  {
    id: 3,
    title: 'Hampi Vijayanagara Ruins',
    state: 'Karnataka',
    category: 'UNESCO World Heritage',
    tagline: 'Colossal stone temples, musical pillars & timeless Kishkindha myth',
    image: 'https://images.unsplash.com/photo-1600100397608-f010f443b740?auto=format&fit=crop&w=1600&q=85',
    rating: '4.95',
    badge: '360° AR Tour Ready'
  },
  {
    id: 4,
    title: 'Varanasi Ancient Ghats',
    state: 'Uttar Pradesh',
    category: 'Spiritual Capital',
    tagline: 'Timeless sanctum where sacred Ganga Aarti echoes through the night',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=85',
    rating: '4.9',
    badge: 'Maha Aarti Schedule'
  },
  {
    id: 5,
    title: 'Udaipur City of Lakes',
    state: 'Rajasthan',
    category: 'Regal Romance',
    tagline: 'Shimmering Lake Pichola, floating marble palaces & Rajput valor',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1600&q=85',
    rating: '4.85',
    badge: 'Heritage Cruise Booking'
  }
];

export default function AuthVisualShowcase() {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance slides every 6 seconds unless paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SHOWCASE_DESTINATIONS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeDest = SHOWCASE_DESTINATIONS[currentIndex];

  return (
    <div
      className="auth-visual-showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px 44px',
        backgroundColor: '#0a0d14'
      }}
    >
      {/* ============================================================ */}
      {/* Background Animated Images Stack with Ken Burns Zoom        */}
      {/* ============================================================ */}
      {SHOWCASE_DESTINATIONS.map((dest, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={dest.id}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isActive ? 1 : 0,
              visibility: isActive ? 'visible' : 'hidden',
              transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              zIndex: 0
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url('${dest.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                animation: isActive ? 'kenBurnsZoom 7s ease-out forwards' : 'none',
                filter: 'brightness(0.92)'
              }}
            />
          </div>
        );
      })}

      {/* Cinematic Gradient Overlays */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 80% 20%, rgba(91, 124, 255, 0.15) 0%, transparent 50%),
            linear-gradient(180deg, rgba(10, 14, 26, 0.72) 0%, rgba(10, 14, 26, 0.2) 35%, rgba(6, 9, 18, 0.92) 100%)
          `,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* ============================================================ */}
      {/* Top Header: Logo + App Name + Live indicator                */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="/logo.png"
            alt="Tourist AI Hub Logo"
            style={{
              height: '78px',
              width: '78px',
              borderRadius: '16px',
              objectFit: 'contain',
              boxShadow: '0 6px 22px rgba(0, 0, 0, 0.5)',
              filter: 'drop-shadow(0 6px 18px rgba(91, 124, 255, 0.55))',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '4px',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0
            }}
          />
          <div>
            <div
              style={{
                fontSize: '1.52rem',
                fontWeight: '800',
                color: '#ffffff',
                letterSpacing: '0.2px',
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.75)'
              }}
            >
              {t('appName')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#93c5fd', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>
              Digital Tourism AI Suite
            </div>
          </div>
        </div>

        {/* Live Weather / Spot Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#e2e8f0',
            fontSize: '0.78rem',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block',
              animation: 'pulseDot 1.8s infinite'
            }}
          />
          <span>AI Spot Guide Live</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Floating Animated Feature Badges (Interactive Glassmorphism) */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          margin: 'auto 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '360px',
          pointerEvents: 'none'
        }}
      >
        {/* Floating Badge 1: Rating & Recognition */}
        <div
          className="floating-badge-1"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: '14px',
            backgroundColor: 'rgba(15, 23, 42, 0.68)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.38)',
            width: 'fit-content',
            animation: 'floatGentle 4.5s ease-in-out infinite'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)'
            }}
          >
            <Star size={18} fill="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: '700', color: '#ffffff' }}>
              {activeDest.rating} ★ Rated Tourist Hub
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
              Over 28,000+ AI Itineraries Generated
            </div>
          </div>
        </div>

        {/* Floating Badge 2: Realtime Voice Narration */}
        <div
          className="floating-badge-2"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: '14px',
            backgroundColor: 'rgba(15, 23, 42, 0.68)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.38)',
            width: 'fit-content',
            animation: 'floatGentle 5s ease-in-out infinite 0.7s',
            marginLeft: '24px'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <Volume2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: '700', color: '#ffffff' }}>
              {activeDest.badge}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>
              Multilingual Audio in 12 Indian Languages
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Bottom Area: Active Destination Info + Thumbnails Switcher  */}
      {/* ============================================================ */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Main Info Card */}
        <div
          key={activeDest.id}
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '18px',
            padding: '20px 24px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
            marginBottom: '18px',
            animation: 'fadeSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Tag + Location Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '999px',
                backgroundColor: 'rgba(91, 124, 255, 0.25)',
                color: '#93c5fd',
                border: '1px solid rgba(91, 124, 255, 0.4)'
              }}
            >
              {activeDest.category}
            </span>
            <span
              style={{
                fontSize: '0.76rem',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <MapPin size={13} color="#38bdf8" />
              {activeDest.state}, India
            </span>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: '800',
              color: '#ffffff',
              marginBottom: '6px',
              letterSpacing: '-0.3px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
            }}
          >
            {activeDest.title}
          </h2>

          {/* Tagline */}
          <p
            style={{
              fontSize: '0.88rem',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            {activeDest.tagline}
          </p>
        </div>

        {/* Thumbnail Navigation Bar with progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          {/* Thumbnails */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflowX: 'auto', paddingBottom: '4px' }}>
            {SHOWCASE_DESTINATIONS.map((dest, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  title={dest.title}
                  style={{
                    position: 'relative',
                    width: '68px',
                    height: '46px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: isSelected ? '2px solid #5B7CFF' : '1px solid rgba(255, 255, 255, 0.25)',
                    padding: 0,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 12px rgba(91, 124, 255, 0.6)' : 'none',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.25s ease',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={dest.image}
                    alt={dest.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {/* Active highlight overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: isSelected ? 'rgba(91, 124, 255, 0.2)' : 'rgba(0, 0, 0, 0.35)',
                      transition: 'background-color 0.2s'
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Record Badge */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.72rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {t('icpBadge')}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CSS Keyframe Animations                                     */}
      {/* ============================================================ */}
      <style>{`
        @keyframes kenBurnsZoom {
          0% {
            transform: scale(1.0) translate(0, 0);
          }
          50% {
            transform: scale(1.08) translate(-1%, -1%);
          }
          100% {
            transform: scale(1.12) translate(-2%, 0);
          }
        }

        @keyframes floatGentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes subtlePulse {
          0% {
            box-shadow: 0 0 14px rgba(91, 124, 255, 0.4);
          }
          100% {
            box-shadow: 0 0 28px rgba(91, 124, 255, 0.85);
          }
        }

        @keyframes pulseDot {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.25);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
