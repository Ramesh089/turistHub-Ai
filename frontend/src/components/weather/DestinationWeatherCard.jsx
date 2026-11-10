import React, { useEffect } from 'react';
import { useWeather } from '../../context/WeatherContext';
import {
  CloudSun,
  MapPin,
  Wind,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  Thermometer,
  RotateCw,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { getWeatherIcon } from './WeatherModal';

export default function DestinationWeatherCard({ destinationName }) {
  const {
    selectedDestination,
    setSelectedDestination,
    currentWeather,
    forecast,
    advisory,
    loading,
    error,
    openWeather,
    refreshWeather
  } = useWeather();

  // If the destinationName differs from selected, sync it
  useEffect(() => {
    if (destinationName && destinationName.toLowerCase() !== (selectedDestination || '').toLowerCase()) {
      setSelectedDestination(destinationName);
    }
  }, [destinationName, selectedDestination, setSelectedDestination]);

  const cityTitle = destinationName || selectedDestination || 'Destination';

  if (loading && !currentWeather) {
    return (
      <div
        className="card"
        style={{
          padding: '24px',
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid #e0f2fe',
            borderTop: '3px solid #0284c7',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 10px'
          }}
        />
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Loading real-time weather telemetry for {cityTitle}...
        </span>
      </div>
    );
  }

  if (error && !currentWeather) {
    return (
      <div
        className="card"
        style={{
          padding: '20px',
          background: '#fef2f2',
          border: '1.5px solid #fecaca',
          borderRadius: 16,
          color: '#991b1b',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <strong>Weather Telemetry Offline:</strong> {error}
        </div>
        <button
          type="button"
          onClick={refreshWeather}
          style={{
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!currentWeather) return null;

  return (
    <div
      className="card"
      style={{
        padding: '22px 24px',
        background: '#ffffff',
        borderRadius: 18,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        marginBottom: '24px'
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <CloudSun size={15} /> Real-Time Climate Telemetry
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '3px 0 0' }}>
            Weather Forecast for {cityTitle}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => openWeather(cityTitle)}
          style={{
            background: '#f0f9ff',
            color: '#0284c7',
            border: '1px solid #bae6fd',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e0f2fe'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
        >
          Full Forecast <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Main Temperature & Metric Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: 16,
          padding: '16px 20px',
          border: '1px solid #bae6fd',
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {currentWeather.icon_url ? (
            <img
              src={currentWeather.icon_url}
              alt={currentWeather.condition}
              style={{ width: 56, height: 56, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
            />
          ) : (
            getWeatherIcon(currentWeather.condition, currentWeather.icon, 44)
          )}
          <div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0c4a6e', lineHeight: 1 }}>
              {currentWeather.temperature}°C
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369a1', marginTop: 2 }}>
              {currentWeather.description} • Feels like {currentWeather.feels_like}°C
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
              Low: {currentWeather.temp_min}°C • High: {currentWeather.temp_max}°C
            </div>
          </div>
        </div>

        {/* 4 Mini Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: '#ffffff', borderRadius: 10, padding: '8px 12px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#64748b' }}>
              <Droplets size={12} color="#0284c7" /> Humidity
            </div>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{currentWeather.humidity}%</strong>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, padding: '8px 12px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#64748b' }}>
              <Wind size={12} color="#0284c7" /> Wind
            </div>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{currentWeather.wind_speed} km/h</strong>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, padding: '8px 12px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#64748b' }}>
              <Sunrise size={12} color="#f59e0b" /> Sunrise
            </div>
            <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{currentWeather.sunrise || '06:15 AM'}</strong>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, padding: '8px 12px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#64748b' }}>
              <Sunset size={12} color="#ea580c" /> Sunset
            </div>
            <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{currentWeather.sunset || '06:30 PM'}</strong>
          </div>
        </div>
      </div>

      {/* 5-Day Mini Strip */}
      {forecast && forecast.days && forecast.days.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            5-Day Outlook
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
            {forecast.days.map((day) => (
              <div
                key={day.date}
                style={{
                  background: day.is_today ? '#f0f9ff' : '#f8fafc',
                  border: day.is_today ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '8px 6px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: day.is_today ? '#0284c7' : '#0f172a' }}>
                  {day.day_name}
                </div>
                <img
                  src={day.icon_url}
                  alt={day.condition}
                  style={{ width: 32, height: 32, margin: '2px auto' }}
                />
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                  {day.temp_max}° <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{day.temp_min}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisory Note */}
      {advisory && advisory.summary && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: '#f8fafc',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            fontSize: '0.78rem',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Sparkles size={14} color="#0284c7" style={{ flexShrink: 0 }} />
          <span>{advisory.summary}</span>
        </div>
      )}
    </div>
  );
}
