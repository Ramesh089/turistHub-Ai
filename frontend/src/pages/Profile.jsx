import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Settings, CheckCircle, Save, Sparkles, Compass } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Preferences fields
  const [travelType, setTravelType] = useState('Couple');
  const [budgetRange, setBudgetRange] = useState('Moderate');
  const [preferredTransport, setPreferredTransport] = useState('Train');
  const [interests, setInterests] = useState(['Heritage', 'Nature', 'Culture']);
  const [foodPreference, setFoodPreference] = useState('Vegetarian');
  const [duration, setDuration] = useState(3);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const interestOptions = ['Heritage', 'Nature', 'Culture', 'Food', 'Spiritual', 'Beach', 'Adventure', 'Photography', 'Shopping', 'Wildlife'];

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await api.get('/users/profile');
        if (res.data.success && res.data.preferences) {
          const p = res.data.preferences;
          if (p.travel_type) setTravelType(p.travel_type);
          if (p.budget_range) setBudgetRange(p.budget_range);
          if (p.preferred_transport) setPreferredTransport(p.preferred_transport);
          if (p.food_preference) setFoodPreference(p.food_preference);
          if (p.preferred_duration) setDuration(p.preferred_duration);
          if (p.interests && Array.isArray(p.interests)) setInterests(p.interests);
        }
      } catch (err) {
        console.error('Load profile error:', err);
      }
    }
    loadPreferences();
  }, []);

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      // 1. Update Profile
      await api.put('/users/profile', { name, phone });
      updateUser({ name, phone });

      // 2. Update Preferences
      await api.put('/users/preferences', {
        travel_type: travelType,
        budget_range: budgetRange,
        preferred_transport: preferredTransport,
        interests,
        food_preference: foodPreference,
        preferred_duration: duration
      });

      setStatusMsg({ type: 'success', text: 'Profile and travel preferences updated successfully!' });
    } catch (err) {
      console.error('Update profile error:', err);
      setStatusMsg({ type: 'error', text: 'Failed to update profile settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#faf6f0', minHeight: '90vh', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-banner" style={{
        background: 'linear-gradient(135deg, #1c1917 0%, #2f1d18 100%)',
        color: '#ffffff'
      }}>
        <div className="container">
          <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Account Settings
          </span>
          <h1 className="page-banner-title">
            Profile & Travel Preferences
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
            Customize your culinary, transportation, and interest preferences to power our AI recommendation algorithms.
          </p>
        </div>
      </div>

      <div className="container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {statusMsg && (
            <div style={{
              background: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: statusMsg.type === 'success' ? '#166534' : '#b91c1c',
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '24px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={18} /> {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveAll}>
            {/* Personal Details Card */}
            <div className="card" style={{ padding: 'clamp(18px, 4vw, 30px)', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="#e65100" /> Personal Account Details
              </h3>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-control"
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Role</label>
                  <input
                    type="text"
                    value={user?.role || 'Tourist'}
                    disabled
                    className="form-control"
                    style={{ background: '#f1f5f9', cursor: 'not-allowed', fontWeight: '700', color: '#0369a1' }}
                  />
                </div>
              </div>
            </div>

            {/* AI Travel Preferences Card */}
            <div className="card" style={{ padding: 'clamp(18px, 4vw, 30px)', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#d97706" /> AI Personalization Preferences
              </h3>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Typical Travel Style</label>
                  <select value={travelType} onChange={(e) => setTravelType(e.target.value)} className="form-control">
                    <option value="Solo">Solo</option>
                    <option value="Couple">Couple / Romantic</option>
                    <option value="Family">Family</option>
                    <option value="Friends">Friends Group</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Budget Tier</label>
                  <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className="form-control">
                    <option value="Budget">Budget Friendly (&lt; ₹2,500/day)</option>
                    <option value="Moderate">Moderate (₹2,500 - ₹5,000/day)</option>
                    <option value="Luxury">Luxury Heritage (&gt; ₹5,000/day)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Preferred Transportation</label>
                  <select value={preferredTransport} onChange={(e) => setPreferredTransport(e.target.value)} className="form-control">
                    <option value="Any">Any Mode</option>
                    <option value="Train">Train (Vande Bharat / Express)</option>
                    <option value="Bus">Luxury AC Bus</option>
                    <option value="Car">Private Chauffeur / Cab</option>
                    <option value="Flight">Flight</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Food Preference</label>
                  <select value={foodPreference} onChange={(e) => setFoodPreference(e.target.value)} className="form-control">
                    <option value="Vegetarian">Pure Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="No Preference">No Preference</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Interests & Vibes (Multi-select)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {interestOptions.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleInterest(item)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        background: interests.includes(item) ? '#e65100' : '#ffffff',
                        color: interests.includes(item) ? '#ffffff' : 'var(--dark)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Save size={18} /> {saving ? 'Saving Profile...' : 'Save Profile & Preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

