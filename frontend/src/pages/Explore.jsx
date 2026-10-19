import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import DestinationCard from '../components/DestinationCard';
import NearbyTouristGuide from '../components/NearbyTouristGuide/NearbyTouristGuide';
import { Search, Filter, Compass, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const INITIAL_VISIBLE_COUNT = 6; // 2 rows in 3-column grid

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [destinations, setDestinations] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('budget_max') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');

  useEffect(() => {
    async function loadStates() {
      try {
        const res = await api.get('/states');
        if (res.data.success && Array.isArray(res.data.states)) {
          setStates(res.data.states);
        }
      } catch (err) {
        console.error('Failed to load states:', err);
      }
    }
    loadStates();
  }, []);

  useEffect(() => {
    async function fetchDestinations() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (selectedState) params.append('state', selectedState);
        if (selectedCategory) params.append('category', selectedCategory);
        if (maxBudget) params.append('budget_max', maxBudget);
        if (sortBy) params.append('sort', sortBy);

        const res = await api.get(`/destinations?${params.toString()}`);
        if (res.data.success && Array.isArray(res.data.destinations)) {
          setDestinations(res.data.destinations);
        }
      } catch (err) {
        console.error('Fetch destinations error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDestinations();
  }, [query, selectedState, selectedCategory, maxBudget, sortBy]);

  // Reset showAll back to false whenever filters change so results start with 2 rows
  useEffect(() => {
    setShowAll(false);
  }, [query, selectedState, selectedCategory, maxBudget, sortBy]);

  const visibleDestinations = showAll ? destinations : destinations.slice(0, INITIAL_VISIBLE_COUNT);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedState('');
    setSelectedCategory('');
    setMaxBudget('');
    setSortBy('rating');
    setShowAll(false);
    setSearchParams({});
  };

  const categories = ['Heritage', 'Culture', 'Nature', 'Beach', 'Spiritual', 'Adventure'];

  return (
    <div style={{ background: '#faf6f0', minHeight: '90vh', paddingBottom: '80px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1c1917 0%, #2e1d18 100%)',
        color: '#ffffff',
        padding: '50px 0',
        marginBottom: '40px'
      }}>
        <div className="container">
          <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Discover Incredible India
          </span>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', marginTop: '6px', marginBottom: '12px' }}>
            Explore Indian Tourist Destinations
          </h1>
          <p style={{ color: '#cbd5e1', maxWidth: '650px', fontSize: '0.98rem' }}>
            Browse iconic UNESCO world heritage sites, misty Western Ghat hill sanctuaries, serene Kerala backwaters, and golden desert forts.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Search & Filter Toolbar */}
        <div style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '36px',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            alignItems: 'flex-end'
          }}>
            {/* Keyword Search */}
            <div>
              <label className="form-label">Search Places</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Hampi, Mysore, Palace..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
              </div>
            </div>

            {/* State Filter */}
            <div>
              <label className="form-label">Indian State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="form-control"
              >
                <option value="">All States & UTs</option>
                {states.map((st) => (
                  <option key={st.id} value={st.code}>{st.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="form-label">Destination Vibe</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-control"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Max Budget Filter */}
            <div>
              <label className="form-label">Max Budget / Day (₹)</label>
              <select
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="form-control"
              >
                <option value="">Any Budget</option>
                <option value="2500">Up to ₹2,500 (Budget)</option>
                <option value="3500">Up to ₹3,500 (Moderate)</option>
                <option value="5000">Up to ₹5,000 (Comfort)</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="form-label">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-control"
              >
                <option value="rating">Top Rated First</option>
                <option value="cost_asc">Budget: Low to High</option>
                <option value="cost_desc">Budget: High to Low</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips & Reset */}
          {(query || selectedState || selectedCategory || maxBudget) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--slate)' }}>Active Filters:</span>
              {query && <span className="badge badge-heritage">Search: "{query}"</span>}
              {selectedState && <span className="badge badge-nature">State: {selectedState}</span>}
              {selectedCategory && <span className="badge badge-spiritual">Category: {selectedCategory}</span>}
              {maxBudget && <span className="badge badge-beach">Max: ₹{maxBudget}/day</span>}

              <button
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: 'auto'
                }}
              >
                <RotateCcw size={13} /> Reset All
              </button>
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--slate)' }}>
            Showing <strong>{visibleDestinations.length}</strong> of <strong>{destinations.length}</strong> incredible Indian destinations
            {!showAll && destinations.length > INITIAL_VISIBLE_COUNT && (
              <span style={{ fontSize: '0.82rem', color: '#0284c7', marginLeft: '8px', fontWeight: '600' }}>
                (Top 2 rows)
              </span>
            )}
          </div>
        </div>

        {/* Grid or Empty State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '1.1rem' }}>Loading destinations...</p>
          </div>
        ) : destinations.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }}>
            <Compass size={48} color="#d97706" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No Destinations Match Your Filter</h3>
            <p style={{ color: 'var(--slate)', maxWidth: '400px', margin: '0 auto 20px auto' }}>
              Try adjusting your search criteria, clearing category filters, or exploring all states.
            </p>
            <button onClick={handleResetFilters} className="btn btn-primary">
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {visibleDestinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} />
              ))}
            </div>

            {/* Explore More / Show Less Button */}
            {destinations.length > INITIAL_VISIBLE_COUNT && (
              <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '24px' }}>
                <button
                  onClick={() => setShowAll(!showAll)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '13px 36px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    borderRadius: '999px',
                    border: '2px solid #0284c7',
                    background: showAll ? '#0284c7' : '#ffffff',
                    color: showAll ? '#ffffff' : '#0284c7',
                    boxShadow: '0 6px 20px rgba(2, 132, 199, 0.16)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!showAll) {
                      e.currentTarget.style.background = '#0284c7';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showAll) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.color = '#0284c7';
                    }
                  }}
                >
                  {showAll ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp size={20} />
                    </>
                  ) : (
                    <>
                      <span>Explore More ({destinations.length - INITIAL_VISIBLE_COUNT} More Places)</span>
                      <ChevronDown size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI-Powered Nearby Tourist Guidance Section directly above the Footer */}
      <NearbyTouristGuide />
    </div>
  );
}

