import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const WeatherContext = createContext(null);

const STORAGE_KEY_DEST = 'touristhub_selected_destination';
const STORAGE_KEY_RECENTS = 'touristhub_recent_destinations';

export function WeatherProvider({ children }) {
  // Initial destination from storage or fallback to Bengaluru
  const [selectedDestination, setSelectedDestinationState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DEST) || 'Bengaluru';
    } catch {
      return 'Bengaluru';
    }
  });

  const [recentDestinations, setRecentDestinations] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENTS);
      return stored ? JSON.parse(stored) : ['Bengaluru', 'Goa', 'Manali', 'Jaipur', 'Agra'];
    } catch {
      return ['Bengaluru', 'Goa', 'Manali', 'Jaipur', 'Agra'];
    }
  });

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);

  // Fetch weather for destination
  const fetchWeather = useCallback(async (destinationName) => {
    const query = (destinationName || selectedDestination || 'Bengaluru').trim();
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/weather/details/${encodeURIComponent(query)}`);
      if (res.data && res.data.success) {
        setWeatherData(res.data);
        setError(null);
      } else {
        throw new Error(res.data?.message || 'Weather telemetry unavailable.');
      }
    } catch (err) {
      console.warn('Weather fetch error:', err.response?.data?.message || err.message);
      setError(
        err.response?.data?.message ||
        `Unable to fetch live weather for "${query}". Please check the destination name or your internet connection.`
      );
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDestination]);

  // Set destination and automatically fetch
  const setSelectedDestination = useCallback((destinationName) => {
    if (!destinationName || typeof destinationName !== 'string') return;
    const clean = destinationName.trim();
    if (!clean) return;

    setSelectedDestinationState(clean);

    // Save to storage
    try {
      localStorage.setItem(STORAGE_KEY_DEST, clean);
    } catch (e) {}

    // Add to recents (max 8)
    setRecentDestinations((prev) => {
      const filtered = prev.filter((d) => d.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    fetchWeather(clean);
  }, [fetchWeather]);

  // Initial load or on destination change
  useEffect(() => {
    fetchWeather(selectedDestination);
  }, [selectedDestination]);

  // Modal controls
  const openWeather = useCallback((destinationOverride) => {
    if (destinationOverride && typeof destinationOverride === 'string') {
      setSelectedDestination(destinationOverride);
    }
    setIsWeatherOpen(true);
  }, [setSelectedDestination]);

  const closeWeather = useCallback(() => {
    setIsWeatherOpen(false);
  }, []);

  const toggleWeather = useCallback(() => {
    setIsWeatherOpen((prev) => !prev);
  }, []);

  const refreshWeather = useCallback(() => {
    fetchWeather(selectedDestination);
  }, [fetchWeather, selectedDestination]);

  const value = {
    selectedDestination,
    setSelectedDestination,
    weatherData,
    currentWeather: weatherData?.current || null,
    forecast: weatherData?.forecast || null,
    advisory: weatherData?.advisory || null,
    loading,
    error,
    isWeatherOpen,
    openWeather,
    closeWeather,
    toggleWeather,
    refreshWeather,
    recentDestinations
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
