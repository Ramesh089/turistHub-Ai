import React, { useState } from 'react';
import { useWeather } from '../../context/WeatherContext';
import {
  X,
  RotateCw,
  Search,
  MapPin,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  Sunrise,
  Sunset,
  Calendar,
  Sparkles,
  AlertCircle,
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
  Luggage,
  Compass
} from 'lucide-react';

// Get appropriate weather icon component based on condition/code
export function getWeatherIcon(condition, iconCode, size = 28) {
  const cond = (condition || '').toLowerCase();
  const isNight = (iconCode || '').endsWith('n');

  if (cond.includes('thunder') || cond.includes('storm')) {
    return <CloudLightning size={size} color="#f59e0b" />;
  }
  if (cond.includes('drizzle')) {
    return <CloudDrizzle size={size} color="#38bdf8" />;
  }
  if (cond.includes('rain')) {
    return <CloudRain size={size} color="#0284c7" />;
  }
  if (cond.includes('snow')) {
    return <CloudSnow size={size} color="#e0f2fe" />;
  }
  if (cond.includes('cloud')) {
    return isNight ? <Cloud size={size} color="#94a3b8" /> : <CloudSun size={size} color="#38bdf8" />;
  }
  if (cond.includes('clear')) {
    return isNight ? <Sun size={size} color="#fcd34d" /> : <Sun size={size} color="#f59e0b" />;
  }
  return <CloudSun size={size} color="#0284c7" />;
}

// Get dynamic background gradient based on current weather condition
function getWeatherGradient(condition, iconCode) {
  const cond = (condition || '').toLowerCase();
  const isNight = (iconCode || '').endsWith('n');

  if (isNight) {
    return 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e293b 100%)';
  }
  if (cond.includes('thunder')) {
    return 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)';
  }
  if (cond.includes('rain') || cond.includes('drizzle')) {
    return 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)';
  }
  if (cond.includes('cloud')) {
    return 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)';
  }
  if (cond.includes('snow')) {
    return 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #bae6fd 100%)';
  }
  // Clear / Sunny
  return 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #f59e0b 100%)';
}

export default function WeatherModal() {
  const {
    isWeatherOpen,
    closeWeather,
    selectedDestination,
    setSelectedDestination,
    weatherData,
    currentWeather,
    forecast,
    advisory,
    loading,
    error,
    refreshWeather,
    recentDestinations
  } = useWeather();

  const [searchInput, setSearchInput] = useState('');

  if (!isWeatherOpen) return null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSelectedDestination(searchInput.trim());
    setSearchInput('');
  };

  const handleCityChipClick = (city) => {
    setSelectedDestination(city);
  };

  const POPULAR_CITIES = ['Bengaluru', 'Goa', 'Manali', 'Agra', 'Jaipur', 'Shimla', 'Munnar', 'Hampi', 'Kochi', 'Varanasi'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 3vw, 24px)',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeWeather();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          width: '100%',
          maxWidth: 720,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CloudSun size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Live Weather Forecast
                </h3>
                <span
                  style={{
                    background: '#ecfdf5',
                    color: '#059669',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 12,
                    border: '1px solid #a7f3d0'
                  }}
                >
                  ● Live Telemetry
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                Real-time meteorological forecast for TouristHub AI destinations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={refreshWeather}
              disabled={loading}
              title="Refresh weather data"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={closeWeather}
              title="Close"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Destination Search & Quick City Pills */}
        <div style={{ padding: '12px 22px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search any destination (e.g. Manali, Goa, Bengaluru, Taj Mahal)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.86rem',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#0284c7'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: (loading || !searchInput.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              Check Weather
            </button>
          </form>

          {/* Quick Destination Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Popular:
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                overflowX: 'auto',
                paddingBottom: 2,
                flex: 1,
                scrollbarWidth: 'none'
              }}
            >
              {POPULAR_CITIES.map((city) => {
                const isSelected = (selectedDestination || '').toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCityChipClick(city)}
                    style={{
                      background: isSelected ? '#0284c7' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#334155',
                      border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                      borderRadius: 16,
                      padding: '4px 12px',
                      fontSize: '0.76rem',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
                    }}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Loading State */}
          {loading && !weatherData && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  border: '4px solid #e0f2fe',
                  borderTop: '4px solid #0284c7',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 16px'
                }}
              />
              <h4 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px' }}>
                Fetching Live Telemetry for {selectedDestination}...
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Querying atmospheric sensors and 5-day forecast models
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 16,
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h4 style={{ fontSize: '1.1rem', color: '#991b1b', fontWeight: 800, margin: '0 0 6px' }}>
                Weather Telemetry Unavailable
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#7f1d1d', maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.5 }}>
                {error}
              </p>
              <button
                type="button"
                onClick={refreshWeather}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Weather Telemetry Loaded */}
          {currentWeather && (
            <>
              {/* 1. Redesigned Dynamic Hero Weather Card */}
              <div
                style={{
                  background: getWeatherGradient(currentWeather.condition, currentWeather.icon),
                  color: '#ffffff',
                  borderRadius: 22,
                  padding: '24px 26px',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  width: '100%',
                  boxShadow: '0 16px 36px -6px rgba(2, 132, 199, 0.4), 0 4px 12px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
              >
                {/* Background ambient lighting */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-10%',
                    width: 240,
                    height: 240,
                    background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                  }}
                />

                {/* Top Badge Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.22)',
                      padding: '5px 14px',
                      borderRadius: 30,
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                  >
                    <MapPin size={15} />
                    <span>{weatherData?.destination || currentWeather.city}</span>
                    <span style={{ opacity: 0.8, fontWeight: 600, fontSize: '0.78rem' }}>
                      ({currentWeather.country || 'IN'})
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#34d399',
                        boxShadow: '0 0 8px #34d399'
                      }}
                    />
                    Live Telemetry
                  </div>
                </div>

                {/* Center Weather Highlights: Massive Temp + Condition + Graphic */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span
                        style={{
                          fontSize: 'clamp(3rem, 7vw, 4rem)',
                          fontWeight: 900,
                          lineHeight: 1,
                          letterSpacing: '-1.5px',
                          color: '#ffffff'
                        }}
                      >
                        {currentWeather.temperature}°
                      </span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 700, opacity: 0.9 }}>
                        C
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        marginTop: 6,
                        textTransform: 'capitalize',
                        letterSpacing: '-0.2px'
                      }}
                    >
                      {currentWeather.description || currentWeather.condition}
                    </div>

                    <div style={{ fontSize: '0.84rem', opacity: 0.92, marginTop: 4, fontWeight: 500 }}>
                      Feels like <strong>{currentWeather.feels_like}°C</strong> • {currentWeather.humidity}% humidity
                    </div>
                  </div>

                  {/* Weather Condition Visual Icon with Glowing Disc */}
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.18)',
                      backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(255, 255, 255, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {currentWeather.icon_url ? (
                      <img
                        src={currentWeather.icon_url}
                        alt={currentWeather.condition}
                        style={{ width: 68, height: 68, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }}
                      />
                    ) : (
                      getWeatherIcon(currentWeather.condition, currentWeather.icon, 48)
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Min / Max & Meteorological Observation Station */}
                <div
                  style={{
                    marginTop: 20,
                    padding: '10px 16px',
                    borderRadius: 14,
                    background: 'rgba(0, 0, 0, 0.18)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    flexWrap: 'wrap',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#bae6fd', fontWeight: 800 }}>↓</span> Low: <strong>{currentWeather.temp_min}°C</strong>
                    </span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#fed7aa', fontWeight: 800 }}>↑</span> High: <strong>{currentWeather.temp_max}°C</strong>
                    </span>
                  </div>

                  <div style={{ opacity: 0.88, fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} />
                    <span>Station: {currentWeather.city}, {currentWeather.country || 'IN'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Key Meteorological Telemetry Grid (6 Metrics) */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Atmospheric Indicators
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: 10
                  }}
                >
                  {[
                    { label: 'Humidity', value: `${currentWeather.humidity}%`, icon: <Droplets size={18} color="#0284c7" /> },
                    { label: 'Wind Speed', value: `${currentWeather.wind_speed} km/h`, icon: <Wind size={18} color="#0284c7" /> },
                    { label: 'Visibility', value: `${currentWeather.visibility} km`, icon: <Eye size={18} color="#0284c7" /> },
                    { label: 'Feels Like', value: `${currentWeather.feels_like}°C`, icon: <Thermometer size={18} color="#0284c7" /> },
                    { label: 'Sunrise', value: currentWeather.sunrise || '06:15 AM', icon: <Sunrise size={18} color="#f59e0b" /> },
                    { label: 'Sunset', value: currentWeather.sunset || '06:30 PM', icon: <Sunset size={18} color="#ea580c" /> }
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        padding: '12px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 4
                      }}
                    >
                      <div>{metric.icon}</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{metric.label}</span>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 800 }}>{metric.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Next 5-Day Weather Forecast */}
              {forecast && forecast.days && forecast.days.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      5-Day Travel Forecast
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Daily Highs & Lows
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                      gap: 8
                    }}
                  >
                    {forecast.days.map((day) => (
                      <div
                        key={day.date}
                        style={{
                          background: day.is_today ? '#f0f9ff' : '#ffffff',
                          border: day.is_today ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: 14,
                          padding: '12px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: 4,
                          position: 'relative',
                          boxShadow: day.is_today ? '0 4px 12px rgba(2, 132, 199, 0.12)' : 'none'
                        }}
                      >
                        <strong style={{ fontSize: '0.84rem', color: day.is_today ? '#0284c7' : '#0f172a' }}>
                          {day.day_name}
                        </strong>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {day.formatted_date}
                        </span>

                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: day.is_today ? 'rgba(2, 132, 199, 0.12)' : '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '4px 0'
                          }}
                        >
                          {day.icon_url ? (
                            <img
                              src={day.icon_url}
                              alt={day.condition}
                              style={{ width: 36, height: 36 }}
                            />
                          ) : (
                            getWeatherIcon(day.condition, day.icon, 24)
                          )}
                        </div>

                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                          {day.temp_max}°<span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}> / {day.temp_min}°</span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: '#475569',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '90%'
                          }}
                          title={day.description}
                        >
                          {day.condition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. AI Travel Weather Advisory & Packing Tips */}
              {advisory && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '16px 18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                      <Sparkles size={16} color="#0284c7" /> Smart Travel Weather Advisory
                    </div>
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 20
                      }}
                    >
                      {advisory.suitability}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 10px', lineHeight: 1.5 }}>
                    {advisory.summary}
                  </p>

                  {/* Packing suggestions */}
                  {advisory.packing && advisory.packing.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Luggage size={14} color="#0284c7" /> Recommended Packing Checklist:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {advisory.packing.map((item) => (
                          <span
                            key={item}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: 12,
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#334155'
                            }}
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
