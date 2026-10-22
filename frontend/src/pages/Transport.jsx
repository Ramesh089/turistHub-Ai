import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Bus,
  Plane,
  Train,
  Car,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Calendar,
  Users,
  Search,
  ArrowLeftRight,
  Filter,
  SlidersHorizontal,
  Clock,
  MapPin,
  Star,
  ShieldCheck,
  Luggage,
  Sparkles,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

import TrainBookingModal from '../components/transport/TrainBookingModal';
import BusBookingModal from '../components/transport/BusBookingModal';
import FlightBookingModal from '../components/transport/FlightBookingModal';
import PrivateDriverModal from '../components/transport/PrivateDriverModal';

const TRANSPORT_TABS = [
  { id: 'Any', label: 'All Modes', icon: <Sparkles size={18} /> },
  { id: 'Train', label: 'Train', icon: <Train size={18} /> },
  { id: 'Bus', label: 'Bus', icon: <Bus size={18} /> },
  { id: 'Flight', label: 'Flight', icon: <Plane size={18} /> },
  { id: 'Private Driver', label: 'Private Driver', icon: <Car size={18} /> }
];

export default function Transport() {
  const [selectedType, setSelectedType] = useState('Any');
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [journeyDate, setJourneyDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  // Available distinct cities from DB
  const [cityOptions, setCityOptions] = useState({ from_cities: [], to_cities: [] });

  // Filters & Sorting
  const [sortBy, setSortBy] = useState('recommended'); // recommended, price_asc, price_desc, dep_time, duration, rating
  const [maxPriceFilter, setMaxPriceFilter] = useState(10000);
  const [departureTimeSlot, setDepartureTimeSlot] = useState('all'); // all, morning, afternoon, evening, night
  const [acOnly, setAcOnly] = useState(false);

  // Modal states
  const [activeTrain, setActiveTrain] = useState(null);
  const [activeBus, setActiveBus] = useState(null);
  const [activeFlight, setActiveFlight] = useState(null);
  const [activeDriver, setActiveDriver] = useState(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState(null);

  // Load cities metadata once
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await api.get('/transport/meta/cities');
        if (res.data.success) {
          setCityOptions({
            from_cities: res.data.from_cities || [],
            to_cities: res.data.to_cities || []
          });
        }
      } catch (err) {
        console.error('Failed to load cities meta:', err);
      }
    }
    loadCities();
  }, []);

  // Fetch transport listings from backend
  const loadTransports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType && selectedType !== 'Any') {
        params.append('transport_type', selectedType);
      }
      if (fromCity.trim()) params.append('from_city', fromCity.trim());
      if (toCity.trim()) params.append('to_city', toCity.trim());
      if (maxPriceFilter < 10000) params.append('max_price', maxPriceFilter);

      const res = await api.get(`/transport?${params.toString()}`);
      if (res.data.success && Array.isArray(res.data.transports)) {
        setTransports(res.data.transports);
      }
    } catch (err) {
      console.error('Failed to load transports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransports();
  }, [selectedType, fromCity, toCity, maxPriceFilter]);

  // City Swap
  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  // Filtered & Sorted transports client-side enhancements
  const displayedTransports = useMemo(() => {
    let result = [...transports];

    // Filter by departure time slot
    if (departureTimeSlot !== 'all') {
      result = result.filter((t) => {
        const dep = t.departure_time || '00:00';
        const hour = parseInt(dep.split(':')[0], 10);
        if (departureTimeSlot === 'early_morning') return hour >= 0 && hour < 6;
        if (departureTimeSlot === 'morning') return hour >= 6 && hour < 12;
        if (departureTimeSlot === 'afternoon') return hour >= 12 && hour < 18;
        if (departureTimeSlot === 'night') return hour >= 18 && hour <= 23;
        return true;
      });
    }

    // Filter AC
    if (acOnly) {
      result = result.filter(
        (t) =>
          (t.vehicle_model || '').toLowerCase().includes('ac') ||
          (t.provider || '').toLowerCase().includes('ac') ||
          t.transport_type === 'Flight' ||
          t.transport_type === 'Train'
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
      if (sortBy === 'rating') return (Number(b.rating) || 4.5) - (Number(a.rating) || 4.5);
      if (sortBy === 'duration') {
        const durA = parseInt(a.duration || '5', 10);
        const durB = parseInt(b.duration || '5', 10);
        return durA - durB;
      }
      return 0; // recommended default order from DB
    });

    return result;
  }, [transports, departureTimeSlot, acOnly, sortBy]);

  // Open appropriate booking modal for card
  const handleOpenBooking = (item) => {
    if (item.transport_type === 'Train') {
      setActiveTrain(item);
    } else if (item.transport_type === 'Bus') {
      setActiveBus(item);
    } else if (item.transport_type === 'Flight') {
      setActiveFlight(item);
    } else {
      setActiveDriver(item);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '92vh', paddingBottom: 100 }}>
      {/* Header Banner */}
      <div
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #0c4a6e 100%)',
          color: '#ffffff',
          padding: '48px 0 36px',
          boxShadow: '0 4px 20px rgba(2, 132, 199, 0.2)'
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}
            >
              Unified Transit Hub
            </span>
            <span style={{ fontSize: '0.82rem', color: '#bae6fd' }}>
              • Real-time Seat Inventory & Instant Booking
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 10px', color: '#ffffff' }}>
            Book Intercity Travel
          </h1>
          <p style={{ color: '#e0f2fe', maxWidth: 720, fontSize: '1rem', lineHeight: 1.5, margin: 0 }}>
            Compare Vande Bharat trains, luxury Volvo multi-axle buses, regional domestic flights, and private chauffeur cabs across India. Choose your seat and receive instant confirmed tickets.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: -24 }}>
        {/* Unified Search Box Container */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            padding: '24px 28px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            marginBottom: 30
          }}
        >
          {/* Horizontal Transport Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 16,
              marginBottom: 20,
              overflowX: 'auto'
            }}
          >
            {TRANSPORT_TABS.map((tab) => {
              const isActive = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedType(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 22px',
                    borderRadius: 30,
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    border: 'none',
                    background: isActive ? '#0284c7' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#475569',
                    boxShadow: isActive ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
                    transition: 'all 0.18s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Inputs Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr auto 1.4fr 1fr 1fr auto',
              gap: 12,
              alignItems: 'center'
            }}
          >
            {/* From City */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                From (Source)
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} color="#0284c7" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  list="from-cities-list"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  placeholder="e.g. Bengaluru or New Delhi"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                />
                <datalist id="from-cities-list">
                  {cityOptions.from_cities.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Swap Button */}
            <div style={{ paddingTop: 18 }}>
              <button
                type="button"
                onClick={handleSwapCities}
                title="Swap origin and destination"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0284c7',
                  transition: 'background 0.2s'
                }}
              >
                <ArrowLeftRight size={16} />
              </button>
            </div>

            {/* To City */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                To (Destination)
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} color="#dc2626" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  list="to-cities-list"
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  placeholder="e.g. Mysuru or Goa"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                />
                <datalist id="to-cities-list">
                  {cityOptions.to_cities.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Journey Date */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                Journey Date
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} color="#0284c7" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                />
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                Passengers
              </label>
              <div style={{ position: 'relative' }}>
                <Users size={16} color="#0284c7" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Traveler' : 'Travelers'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <div style={{ paddingTop: 18 }}>
              <button
                type="button"
                onClick={loadTransports}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '11px 22px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Search size={16} /> Search
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Results Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left Sidebar: Filter Panel */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                <SlidersHorizontal size={16} color="#0284c7" /> Filters
              </div>
              <button
                type="button"
                onClick={() => {
                  setDepartureTimeSlot('all');
                  setAcOnly(false);
                  setMaxPriceFilter(10000);
                  setFromCity('');
                  setToCity('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>

            {/* Departure Time Slots */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                Departure Time
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: 'all', label: 'Any Time' },
                  { id: 'early_morning', label: 'Early Morning (00:00 - 06:00)' },
                  { id: 'morning', label: 'Morning (06:00 - 12:00)' },
                  { id: 'afternoon', label: 'Afternoon (12:00 - 18:00)' },
                  { id: 'night', label: 'Night (18:00 - 24:00)' }
                ].map((slot) => (
                  <label key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="departureTime"
                      checked={departureTimeSlot === slot.id}
                      onChange={() => setDepartureTimeSlot(slot.id)}
                    />
                    {slot.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                <span>Max Price</span>
                <span style={{ color: '#0284c7' }}>₹{maxPriceFilter.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="300"
                max="10000"
                step="200"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                <span>₹300</span>
                <span>₹10,000+</span>
              </div>
            </div>

            {/* Amenities Checklist */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                Preferences
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acOnly}
                  onChange={(e) => setAcOnly(e.target.checked)}
                />
                Air Conditioned (AC) Only
              </label>
            </div>
          </div>

          {/* Right Area: Results Counter, Sorter, and Transport Cards */}
          <div>
            {/* Top Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {displayedTransports.length} Options Available
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 8 }}>
                  for {selectedType === 'Any' ? 'All Transit Modes' : selectedType}
                </span>
              </div>

              {/* Sorter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#fff'
                  }}
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">User Rating</option>
                  <option value="duration">Fastest Duration</option>
                </select>
              </div>
            </div>

            {/* Listing Cards */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#0284c7', fontWeight: 700 }}>
                Loading live transport availability from central database...
              </div>
            ) : displayedTransports.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: '50px 20px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0'
                }}
              >
                <Car size={48} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                  No Direct Services Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 16px' }}>
                  Try switching tabs or adjusting origin/destination filters to view more routes.
                </p>
                <button
                  onClick={() => {
                    setSelectedType('Any');
                    setFromCity('');
                    setToCity('');
                  }}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View All Available Routes
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {displayedTransports.map((t) => {
                  const isTrain = t.transport_type === 'Train';
                  const isBus = t.transport_type === 'Bus';
                  const isFlight = t.transport_type === 'Flight';
                  const isDriver = t.transport_type === 'Private Driver';

                  const badgeColor = isTrain
                    ? { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' }
                    : isBus
                    ? { bg: '#fffbeb', border: '#fde68a', text: '#b45309' }
                    : isFlight
                    ? { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' }
                    : { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' };

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        padding: '20px 24px',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        alignItems: 'center',
                        gap: 20,
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                      }}
                    >
                      {/* Left: Mode Icon */}
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 14,
                          background: badgeColor.bg,
                          border: `1.5px solid ${badgeColor.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isTrain && <Train size={26} color="#1d4ed8" />}
                        {isBus && <Bus size={26} color="#b45309" />}
                        {isFlight && <Plane size={26} color="#0284c7" />}
                        {isDriver && <Car size={26} color="#15803d" />}
                      </div>

                      {/* Middle: Service Information */}
                      <div>
                        {/* Tags */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              background: badgeColor.bg,
                              color: badgeColor.text,
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: '0.72rem',
                              fontWeight: 800
                            }}
                          >
                            {t.transport_type}
                          </span>
                          {t.service_number && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                              #{t.service_number}
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                            <Star size={13} fill="#16a34a" /> {t.rating || '4.8'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 6px', color: '#0f172a' }}>
                          {t.provider}
                        </h3>

                        {/* Route & Times */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.88rem', color: '#334155', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700 }}>
                            {t.from_city} &rarr; {t.to_city}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={13} />
                            Dep: <strong>{t.departure_time}</strong> • Arr: <strong>{t.arrival_time}</strong> ({t.duration})
                          </div>
                        </div>

                        {/* Vehicle details & amenities */}
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                            {t.vehicle_model}
                          </span>
                          {isDriver && (
                            <span style={{ color: '#15803d', fontWeight: 700 }}>
                              • Full Cab Hire ({t.seats_total || 5} Seats)
                            </span>
                          )}
                          {(isTrain || isBus) && (
                            <span style={{ color: '#0284c7', fontWeight: 700 }}>
                              • Live Seat Map Available
                            </span>
                          )}
                          {isFlight && (
                            <span style={{ color: '#0284c7', fontWeight: 700 }}>
                              • 3x3 Aircraft Cabin Map
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Fare & Action Button */}
                      <div style={{ textAlign: 'right', minWidth: 150 }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {isDriver ? 'Starting Vehicle Fare' : 'Starting Fare / Person'}
                        </div>
                        <div
                          style={{
                            fontSize: '1.6rem',
                            fontWeight: 900,
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            margin: '2px 0 6px'
                          }}
                        >
                          <IndianRupee size={20} />{Number(t.price).toLocaleString('en-IN')}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenBooking(t)}
                          style={{
                            background: isDriver
                              ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
                              : isBus
                              ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)'
                              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: 10,
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                            transition: 'transform 0.12s'
                          }}
                        >
                          <CreditCard size={15} />
                          {isDriver ? 'Book Chauffeur' : isTrain ? 'Select Train Seats' : isBus ? 'Select Bus Berths' : 'Select Flight Seat'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Success Toast */}
      {paymentSuccessMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 99999,
            background: '#ffffff',
            border: '2px solid #10b981',
            borderRadius: 14,
            padding: '16px 20px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
            maxWidth: 440,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ background: '#ecfdf5', color: '#059669', borderRadius: '50%', padding: 6, flexShrink: 0 }}>
            <CheckCircle2 size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1rem' }}>🎉 Booking Confirmed!</div>
            <div style={{ fontSize: '0.84rem', color: '#334155', marginTop: 2 }}>
              Your reservation <strong>{paymentSuccessMsg.booking_reference || `TH-BK-${paymentSuccessMsg.booking_id}`}</strong> has been confirmed.
            </div>
            <div style={{ marginTop: 8 }}>
              <Link to="/dashboard" style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 800, textDecoration: 'underline' }}>
                View E-Ticket & Receipt in Dashboard &rarr;
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Train Booking Modal */}
      {activeTrain && (
        <TrainBookingModal
          train={activeTrain}
          initialDate={journeyDate}
          onClose={() => setActiveTrain(null)}
          onComplete={(ticket) => {
            setPaymentSuccessMsg(ticket);
            loadTransports();
          }}
        />
      )}

      {/* Bus Booking Modal */}
      {activeBus && (
        <BusBookingModal
          bus={activeBus}
          initialDate={journeyDate}
          onClose={() => setActiveBus(null)}
          onComplete={(ticket) => {
            setPaymentSuccessMsg(ticket);
            loadTransports();
          }}
        />
      )}

      {/* Flight Booking Modal */}
      {activeFlight && (
        <FlightBookingModal
          flight={activeFlight}
          initialDate={journeyDate}
          onClose={() => setActiveFlight(null)}
          onComplete={(ticket) => {
            setPaymentSuccessMsg(ticket);
            loadTransports();
          }}
        />
      )}

      {/* Private Driver Modal */}
      {activeDriver && (
        <PrivateDriverModal
          driverService={activeDriver}
          initialDate={journeyDate}
          onClose={() => setActiveDriver(null)}
          onComplete={(ticket) => {
            setPaymentSuccessMsg(ticket);
            loadTransports();
          }}
        />
      )}
    </div>
  );
}
