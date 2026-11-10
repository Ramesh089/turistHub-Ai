import React, { useState } from 'react';
import { useWeather } from '../../context/WeatherContext';
import { CloudSun, Sun, CloudRain, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { getWeatherIcon } from './WeatherModal';

export default function FloatingWeatherWidget() {
  const {
    openWeather,
    selectedDestination,
    currentWeather,
    loading,
    error
  } = useWeather();

  const [isHovered, setIsHovered] = useState(false);

  // If loading and no prior data
  const tempDisplay = currentWeather ? `${currentWeather.temperature}°C` : (loading ? '...' : '--°C');
  const cityDisplay = selectedDestination || currentWeather?.city || 'Bengaluru';
  const condDisplay = currentWeather?.condition || 'Weather';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <button
        type="button"
        onClick={() => openWeather()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={`Check live weather forecast for ${cityDisplay}`}
        aria-label="Open Weather Forecast"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: isHovered
            ? 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          border: isHovered ? '1.5px solid #0284c7' : '1.5px solid rgba(2, 132, 199, 0.25)',
          borderRadius: '40px',
          padding: '8px 16px 8px 10px',
          boxShadow: isHovered
            ? '0 14px 28px -4px rgba(2, 132, 199, 0.35), 0 8px 10px -6px rgba(2, 132, 199, 0.25)'
            : '0 10px 24px -5px rgba(15, 23, 42, 0.15)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-3px) scale(1.02)' : 'none',
          color: '#0f172a'
        }}
      >
        {/* Weather Icon with soft glowing aura */}
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)'
          }}
        >
          {currentWeather?.icon_url ? (
            <img
              src={currentWeather.icon_url}
              alt={condDisplay}
              style={{ width: '32px', height: '32px' }}
            />
          ) : (
            getWeatherIcon(condDisplay, '01d', 20)
          )}

          {/* Active live pulse dot */}
          <span
            style={{
              position: 'absolute',
              top: '1px',
              right: '1px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: error ? '#ef4444' : '#10b981',
              border: '1.5px solid #ffffff'
            }}
          />
        </div>

        {/* Text Details */}
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.94rem', fontWeight: '800', color: '#0f172a' }}>
              {tempDisplay}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '700' }}>
              {condDisplay}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <MapPin size={11} color="#0284c7" />
            <span>{cityDisplay}</span>
          </div>
        </div>

        {/* Right arrow chip */}
        <div
          style={{
            marginLeft: '2px',
            color: isHovered ? '#0284c7' : '#94a3b8',
            transition: 'color 0.15s'
          }}
        >
          <ChevronRight size={16} />
        </div>
      </button>
    </div>
  );
}
