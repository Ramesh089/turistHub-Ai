import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import NearbyMap from './NearbyMap';
import NearbyPlacesList from './NearbyPlacesList';
import NearbyAIAssistant from './NearbyAIAssistant';
import {
  Compass,
  MapPin,
  Navigation,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Search,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function NearbyTouristGuide() {
  // Discovery State
  const [hasInitiated, setHasInitiated] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // User Location
  const [userLocation, setUserLocation] = useState(null);
  const [manualCityInput, setManualCityInput] = useState('');

  // Places Data & Filters
  const [places, setPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRadius, setSelectedRadius] = useState(25);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [hasExpandedRadius, setHasExpandedRadius] = useState(false);
  const [strictMatchesCount, setStrictMatchesCount] = useState(0);

  // AI Assistant State
  const [aiResponse, setAiResponse] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Popular quick city presets for instant demonstration or manual fallback
  const quickCityPresets = ['Mysore', 'Bengaluru', 'Hampi', 'Coorg', 'Jaipur', 'Goa'];

  // 1. Fetch Nearby Places from API
  const fetchNearbyPlaces = async (lat, lng, radius, category, city) => {
    setLoadingPlaces(true);
    try {
      const params = new URLSearchParams();
      if (lat && !isNaN(lat)) params.append('lat', lat);
      if (lng && !isNaN(lng)) params.append('lng', lng);
      if (radius) params.append('radius', radius);
      if (category && category !== 'all') params.append('category', category);
      if (city) params.append('city', city);

      const res = await api.get(`/nearby/places?${params.toString()}`);
      if (res.data.success) {
        setPlaces(res.data.places || []);
        setHasExpandedRadius(res.data.has_expanded_radius || false);
        setStrictMatchesCount(res.data.strict_matches_count || 0);

        if (res.data.user_location) {
          setUserLocation(prev => ({
            ...prev,
            ...res.data.user_location
          }));
        }

        // Auto-generate initial AI briefing for the location
        generateInitialAIGuide(res.data.places, res.data.user_location);
      }
    } catch (err) {
      console.error('Fetch nearby places failed:', err);
    } finally {
      setLoadingPlaces(false);
    }
  };

  // 2. Generate AI Guidance
  const generateAIGuide = async (prompt, placeToAsk = null) => {
    setLoadingAI(true);
    try {
      const res = await api.post('/nearby/ai-guide', {
        prompt,
        user_location: userLocation,
        places: places,
        selected_place: placeToAsk
      });

      if (res.data.success) {
        setAiResponse(res.data.ai_response);
      }
    } catch (err) {
      console.error('AI Guide Error:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  const generateInitialAIGuide = (placesList, loc) => {
    if (!placesList || placesList.length === 0) return;
    api.post('/nearby/ai-guide', {
      prompt: 'Best places near me',
      user_location: loc,
      places: placesList
    }).then(res => {
      if (res.data.success) {
        setAiResponse(res.data.ai_response);
      }
    }).catch(e => console.warn('Auto AI guide note:', e.message));
  };

  // 3. User Clicks "Find Places Near Me" (Geolocation API)
  const handleFindPlacesNearMe = () => {
    setHasInitiated(true);
    setLocationError(null);
    setLoadingLocation(true);

    if (!navigator.geolocation) {
      setLocationError({
        type: 'UNSUPPORTED',
        message: 'Geolocation is not supported by your browser. Please enter your city manually.'
      });
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({
          latitude: lat,
          longitude: lng,
          city: 'Your GPS Location',
          is_manual_city: false
        });
        setLoadingLocation(false);
        fetchNearbyPlaces(lat, lng, selectedRadius, selectedCategory);
      },
      (error) => {
        setLoadingLocation(false);
        let errorMsg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. You can enable it in your browser address bar (click the lock icon 🔒) or type a city manually below.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is currently unavailable. Please enter a city or landmark manually.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please retry or enter your city manually.';
        }
        setLocationError({
          type: 'PERMISSION_DENIED',
          message: errorMsg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // 4. Manual City Lookup Fallback
  const handleManualSearch = (cityName) => {
    const city = cityName || manualCityInput;
    if (!city || !city.trim()) return;

    setHasInitiated(true);
    setLocationError(null);
    setUserLocation({
      latitude: null,
      longitude: null,
      city: city.trim(),
      is_manual_city: true
    });
    fetchNearbyPlaces(null, null, selectedRadius, selectedCategory, city.trim());
  };

  // 5. Radius and Category Changes
  const handleCategoryChange = (catKey) => {
    setSelectedCategory(catKey);
    if (userLocation) {
      fetchNearbyPlaces(
        userLocation.latitude,
        userLocation.longitude,
        selectedRadius,
        catKey,
        userLocation.is_manual_city ? userLocation.city : null
      );
    }
  };

  const handleRadiusChange = (radiusKm) => {
    setSelectedRadius(radiusKm);
    if (userLocation) {
      fetchNearbyPlaces(
        userLocation.latitude,
        userLocation.longitude,
        radiusKm,
        selectedCategory,
        userLocation.is_manual_city ? userLocation.city : null
      );
    }
  };

  // 6. Ask AI about specific place clicked from card
  const handleAskAIAboutPlace = (place) => {
    setSelectedPlace(place);
    generateAIGuide(`Tell me all about ${place.name}: opening times, best photography angle, and local tips`, place);

    // Smooth scroll down to AI section
    const aiEl = document.getElementById('nearby-ai-assistant-section');
    if (aiEl) {
      aiEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectPlaceByName = (placeName) => {
    const found = places.find(p => p.name.toLowerCase().includes(placeName.toLowerCase()) || placeName.toLowerCase().includes(p.name.toLowerCase()));
    if (found) {
      setSelectedPlace(found);
      const mapEl = document.getElementById('nearby-interactive-map-section');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <section
      id="explore-near-me-section"
      style={{
        marginTop: '60px',
        paddingTop: '60px',
        paddingBottom: '20px',
        borderTop: '2px solid rgba(2, 132, 199, 0.12)',
        background: 'linear-gradient(180deg, #faf6f0 0%, #f4f0e8 100%)'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(2, 132, 199, 0.1)',
            color: '#0369a1',
            padding: '5px 14px',
            borderRadius: '30px',
            fontSize: '0.82rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: '10px'
          }}>
            <Navigation size={13} color="#0284c7" />
            <span>Explore Near Me • Your Local Travel Guide</span>
          </div>

          <h2 style={{
            fontSize: '2.3rem',
            fontFamily: 'var(--font-serif)',
            fontWeight: '800',
            color: 'var(--dark)',
            marginBottom: '10px'
          }}>
            Explore Amazing Places Near You
          </h2>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--slate)',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            “Discover hidden gems, famous attractions, and unforgettable experiences around your current location.”
          </p>
        </div>

        {/* ── STATE 1: INITIAL STATE (Before Location Lookup) ── */}
        {!hasInitiated && (
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '48px 32px',
            textAlign: 'center',
            maxWidth: '820px',
            margin: '0 auto 40px auto',
            border: '1px solid rgba(2, 132, 199, 0.16)',
            boxShadow: '0 12px 35px rgba(2, 132, 199, 0.08)'
          }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)'
            }}>
              <MapPin size={32} />
            </div>

            <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--dark)', marginBottom: '12px' }}>
              Find Attractions, Temples & Heritage Around You
            </h3>

            <p style={{ color: 'var(--slate)', fontSize: '0.96rem', maxWidth: '580px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
              Allow one-time location access to view verified historical places, museums, parks, viewpoints, and local food spots plotted directly on your live interactive map.
            </p>

            {/* Primary Action Button */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
              <button
                onClick={handleFindPlacesNearMe}
                className="btn btn-primary btn-lg"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 25px rgba(2, 132, 199, 0.35)',
                  fontSize: '1rem',
                  padding: '14px 32px'
                }}
              >
                <Navigation size={18} />
                <span>Find Places Near Me</span>
              </button>
            </div>

            {/* Manual City Lookup Bar */}
            <div style={{
              borderTop: '1px solid #f1f5f9',
              paddingTop: '24px',
              maxWidth: '540px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px', fontWeight: '600' }}>
                Or explore a specific city or destination:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. Mysore, Bengaluru, Hampi, Jaipur..."
                  value={manualCityInput}
                  onChange={(e) => setManualCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  className="form-control"
                  style={{ fontSize: '0.88rem' }}
                />
                <button
                  onClick={() => handleManualSearch()}
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Search size={15} />
                  <span>Search</span>
                </button>
              </div>

              {/* Quick City Chips */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Try:</span>
                {quickCityPresets.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleManualSearch(city)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '3px 10px',
                      fontSize: '0.74rem',
                      color: '#0369a1',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STATE 2: LOADING LOCATION ── */}
        {loadingLocation && (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '50px 20px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 40px auto',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              animation: 'spin 2s linear infinite'
            }}>
              <Navigation size={26} />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--dark)', marginBottom: '6px' }}>
              Finding amazing places near you...
            </h4>
            <p style={{ color: 'var(--slate)', fontSize: '0.9rem' }}>
              Requesting live browser location to calculate exact road distances and landmarks.
            </p>
          </div>
        )}

        {/* ── STATE 3: PERMISSION DENIED / ERROR WITH MANUAL SEARCH ── */}
        {locationError && (
          <div style={{
            background: '#fff7ed',
            borderRadius: '18px',
            padding: '24px',
            border: '1.5px solid #ffedd5',
            maxWidth: '720px',
            margin: '0 auto 36px auto',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle size={22} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#9a3412', marginBottom: '4px' }}>
                  Location Access Required
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#7c2d12', lineHeight: 1.5, marginBottom: '16px' }}>
                  {locationError.message}
                </p>

                {/* Manual Search in Error State */}
                <div style={{ display: 'flex', gap: '8px', maxWidth: '480px' }}>
                  <input
                    type="text"
                    placeholder="Enter city (e.g. Mysore, Jaipur, Bengaluru)..."
                    value={manualCityInput}
                    onChange={(e) => setManualCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    className="form-control"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button
                    onClick={() => handleManualSearch()}
                    className="btn btn-primary btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Explore City
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATE 4: SUCCESS STATE (Location Detected + Places Loaded) ── */}
        {hasInitiated && !loadingLocation && (
          <div>
            {/* Top Bar with Live Location Status & Refresh */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              background: '#ffffff',
              padding: '14px 20px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Current Exploration Center:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} color="#0284c7" />
                    <span>{userLocation?.city || 'Your Live Location'}</span>
                    {userLocation?.is_manual_city && (
                      <span className="badge badge-sky" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>Manual</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Refresh & Change City */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleFindPlacesNearMe}
                  title="Detect GPS location again"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={13} />
                  <span>Refresh Location</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Change city..."
                    value={manualCityInput}
                    onChange={(e) => setManualCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      width: '130px'
                    }}
                  />
                  <button
                    onClick={() => handleManualSearch()}
                    className="btn btn-primary btn-sm"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Layout: Two-column (Places List + Interactive Map) */}
            <div className="nearby-guide-grid">
              {/* Left Column: Places List & Filters */}
              <div>
                <NearbyPlacesList
                  places={places}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleCategoryChange}
                  selectedRadius={selectedRadius}
                  onSelectRadius={handleRadiusChange}
                  selectedPlace={selectedPlace}
                  onSelectPlace={(place) => setSelectedPlace(place)}
                  onAskAI={handleAskAIAboutPlace}
                  userLocation={userLocation}
                  hasExpandedRadius={hasExpandedRadius}
                  strictMatchesCount={strictMatchesCount}
                />
              </div>

              {/* Right Column: Sticky Interactive Map */}
              <div
                id="nearby-interactive-map-section"
                style={{
                  position: 'sticky',
                  top: '90px'
                }}
              >
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={16} color="#0284c7" />
                    <span>Interactive Local Map</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
                    {places.length} markers shown
                  </span>
                </div>

                <NearbyMap
                  userLocation={userLocation}
                  places={places}
                  selectedPlace={selectedPlace}
                  onSelectPlace={(place) => setSelectedPlace(place)}
                  radiusKm={selectedRadius}
                />
              </div>
            </div>

            {/* Bottom Row: AI Travel Concierge Assistant */}
            <div id="nearby-ai-assistant-section">
              <NearbyAIAssistant
                aiResponse={aiResponse}
                loadingAI={loadingAI}
                onAskQuery={(query) => generateAIGuide(query)}
                onSelectPlaceByName={handleSelectPlaceByName}
                userLocation={userLocation}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .nearby-guide-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .nearby-guide-grid {
            grid-template-columns: 1fr;
          }
          #nearby-interactive-map-section {
            position: static !important;
            margin-bottom: 24px;
            order: -1;
          }
        }
      `}</style>
    </section>
  );
}
