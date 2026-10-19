import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ExternalLink, Compass } from 'lucide-react';

const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY || 'cb1_4odi_1_c71552aa1613daf5434cb55c';

// Custom colored pin icons using L.divIcon to avoid broken Vite image asset URLs
function createCustomPin(category, isSelected = false) {
  let bgColor = '#0284c7'; // default blue
  let iconEmoji = '📍';

  if (category === 'heritage') {
    bgColor = '#d97706'; // amber
    iconEmoji = '🏛️';
  } else if (category === 'temple') {
    bgColor = '#7c3aed'; // purple
    iconEmoji = '🛕';
  } else if (category === 'nature') {
    bgColor = '#059669'; // emerald
    iconEmoji = '🌿';
  } else if (category === 'museum') {
    bgColor = '#b45309'; // bronze
    iconEmoji = '🎨';
  } else if (category === 'restaurant') {
    bgColor = '#ea580c'; // orange
    iconEmoji = '🍽️';
  }

  const pulseRing = isSelected
    ? `<div style="position: absolute; top: -6px; left: -6px; width: 44px; height: 44px; border-radius: 50%; border: 3px solid #f59e0b; animation: pulse 1.5s infinite; pointer-events: none;"></div>`
    : '';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        ${pulseRing}
        <div style="
          width: 32px;
          height: 32px;
          background: ${bgColor};
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, background 0.2s ease;
          ${isSelected ? 'transform: rotate(-45deg) scale(1.2); box-shadow: 0 6px 18px rgba(245, 158, 11, 0.6);' : ''}
        ">
          <span style="transform: rotate(45deg); font-size: 14px; line-height: 1;">${iconEmoji}</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

// User location marker with pulsing radar effect
function createUserLocationIcon() {
  return L.divIcon({
    className: 'user-location-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="
          position: absolute;
          top: -10px;
          left: -10px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(14, 165, 233, 0.25);
          border: 2px solid rgba(14, 165, 233, 0.6);
          animation: mapRadar 2s infinite ease-out;
        "></div>
        <div style="
          width: 28px;
          height: 28px;
          background: #0284c7;
          border: 3.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

export default function NearbyMap({
  userLocation,
  places = [],
  selectedPlace,
  onSelectPlace,
  radiusKm = 25
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = userLocation?.latitude || 12.3051;
      const initialLng = userLocation?.longitude || 76.6551;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false
      });

      // Add Zoom Control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add CARTO Voyager tiles with user API key
      const cartoTileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`;
      L.tileLayer(cartoTileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when userLocation, places or selectedPlace changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds([]);

    // 1. Add User Location Marker
    if (userLocation?.latitude && userLocation?.longitude) {
      const userLatLng = [userLocation.latitude, userLocation.longitude];
      bounds.extend(userLatLng);

      const userMarker = L.marker(userLatLng, {
        icon: createUserLocationIcon(),
        zIndexOffset: 1000
      }).addTo(map);

      userMarker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; text-align: center;">
          <div style="font-weight: 700; color: #0284c7; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
            📍 Your Current Location
          </div>
          <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
            ${userLocation.city || 'Live GPS Position'}
          </div>
        </div>
      `);

      markersRef.current['user'] = userMarker;
    }

    // 2. Add Place Markers
    places.forEach(place => {
      if (!place.latitude || !place.longitude) return;

      const placeLatLng = [place.latitude, place.longitude];
      bounds.extend(placeLatLng);

      const isSelected = selectedPlace?.id === place.id;
      const marker = L.marker(placeLatLng, {
        icon: createCustomPin(place.category, isSelected)
      }).addTo(map);

      const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation?.latitude || ''},${userLocation?.longitude || ''}&destination=${place.latitude},${place.longitude}`;

      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 200px; max-width: 250px; padding: 4px;">
          ${place.image_url ? `<img src="${place.image_url}" alt="${place.name}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #ea580c; margin-bottom: 2px;">
            ${place.category_label || place.category}
          </div>
          <div style="font-weight: 700; font-size: 1rem; color: #0f172a; margin-bottom: 4px; line-height: 1.25;">
            ${place.name}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #64748b; margin-bottom: 8px;">
            <span style="color: #d97706; font-weight: 700;">★ ${place.rating || 4.8}</span>
            <span>•</span>
            <span style="font-weight: 600; color: #0284c7;">${place.distance_text || ''}</span>
          </div>
          <div style="font-size: 0.78rem; color: #475569; line-height: 1.4; margin-bottom: 10px;">
            ${place.description ? place.description.slice(0, 90) + '...' : ''}
          </div>
          <a
            href="${directionsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              width: 100%;
              padding: 7px 12px;
              background: #0284c7;
              color: #ffffff;
              border-radius: 8px;
              text-decoration: none;
              font-size: 0.82rem;
              font-weight: 700;
            "
          >
            Get Directions ↗
          </a>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(place);
      });

      markersRef.current[place.id] = marker;
    });

    // Fit map bounds if there are markers and no specific place is selected
    if (bounds.isValid() && !selectedPlace) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
    }
  }, [userLocation, places, selectedPlace]);

  // Center on selected place when clicked from cards list
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace?.latitude || !selectedPlace?.longitude) return;

    map.flyTo([selectedPlace.latitude, selectedPlace.longitude], 15, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    const marker = markersRef.current[selectedPlace.id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 400);
    }
  }, [selectedPlace]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation?.latitude || !userLocation?.longitude) return;
    map.flyTo([userLocation.latitude, userLocation.longitude], 14, { duration: 1.0 });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(2, 132, 199, 0.18)', boxShadow: 'var(--shadow-md)' }}>
      {/* Map Element */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '440px' }} />

      {/* Floating Map Controls */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 500, display: 'flex', gap: 8 }}>
        <button
          onClick={handleRecenter}
          title="Recenter to my location"
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#0f172a',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Navigation size={14} color="#0284c7" />
          <span>My Location</span>
        </button>
      </div>

      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: 14,
        left: 14,
        zIndex: 500,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '6px 12px',
        fontSize: '0.74rem',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }}></div>
          <span>You</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706' }}></div>
          <span>Heritage</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed' }}></div>
          <span>Temple</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669' }}></div>
          <span>Nature</span>
        </div>
      </div>

      {/* Inline styles for pulse animations */}
      <style>{`
        @keyframes mapRadar {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
          100% { transform: scale(0.9); opacity: 1; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.18) !important;
        }
      `}</style>
    </div>
  );
}
