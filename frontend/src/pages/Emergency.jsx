import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, PhoneCall, HeartPulse, Building2, HelpCircle, MapPin } from 'lucide-react';

export default function Emergency() {
  const [nationalHelplines, setNationalHelplines] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedDest, setSelectedDest] = useState('');
  const [localServices, setLocalServices] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [helpRes, destRes] = await Promise.all([
          api.get('/emergency/national-helplines'),
          api.get('/destinations')
        ]);
        if (helpRes.data.success) setNationalHelplines(helpRes.data.helplines);
        if (destRes.data.success) {
          setDestinations(destRes.data.destinations);
          if (destRes.data.destinations.length > 0) {
            setSelectedDest(destRes.data.destinations[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load emergency data:', err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedDest) return;
    async function fetchLocal() {
      setLoadingLocal(true);
      try {
        const res = await api.get(`/emergency/${selectedDest}`);
        if (res.data.success) {
          setLocalServices(res.data.emergency_services);
        }
      } catch (err) {
        console.error('Failed to load local emergency:', err);
      } finally {
        setLoadingLocal(false);
      }
    }
    fetchLocal();
  }, [selectedDest]);

  return (
    <div style={{ background: '#faf6f0', minHeight: '90vh', paddingBottom: '90px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #450a0a 0%, #1c1917 100%)',
        color: '#ffffff',
        padding: '50px 0',
        marginBottom: '40px'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>
            <ShieldAlert size={18} /> 24x7 Safety Assistance
          </div>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', marginBottom: '12px' }}>
            Emergency Services & Tourist Helplines
          </h1>
          <p style={{ color: '#fecdd3', maxWidth: '680px', fontSize: '1rem', lineHeight: 1.6 }}>
            Tourist AI Hub is committed to ensuring every visitor in India has rapid, reliable access to emergency police desks, multi-specialty medical care, and 24x7 multi-lingual tourist assistance.
          </p>
        </div>
      </div>

      <div className="container">
        {/* National Helplines Grid */}
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PhoneCall size={20} color="#b91c1c" /> Nationwide Emergency Helplines (Toll-Free)
        </h2>

        <div className="grid-3" style={{ marginBottom: '50px' }}>
          {nationalHelplines.map((h, idx) => (
            <div key={idx} className="card" style={{ padding: '24px', borderLeft: '4px solid #b91c1c', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--dark)', marginBottom: '6px' }}>{h.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate)', lineHeight: 1.5, marginBottom: '14px' }}>{h.desc}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#b91c1c' }}>{h.number}</span>
                <a href={`tel:${h.number.split('/')[0].trim()}`} className="btn btn-primary btn-sm" style={{ background: '#b91c1c' }}>
                  <PhoneCall size={14} /> Call Now
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Local Emergency Directory by Destination */}
        <div style={{
          background: '#ffffff',
          padding: '30px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)' }}>Destination Emergency Directory</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate)' }}>Select your destination to view closest hospitals and police stations.</p>
            </div>

            <div style={{ minWidth: '240px' }}>
              <select
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
                className="form-control"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.state_name})</option>
                ))}
              </select>
            </div>
          </div>

          {loadingLocal ? (
            <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--primary)' }}>Loading local emergency contacts...</p>
          ) : localServices.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--slate)' }}>
              No destination-specific emergency services listed. In case of emergency, please dial <strong>112</strong> or <strong>1363</strong>.
            </p>
          ) : (
            <div className="grid-2">
              {localServices.map((service) => (
                <div key={service.id} className="card" style={{ padding: '22px', borderLeft: '4px solid #b91c1c' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#b91c1c' }}>
                      {service.service_type}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>Approx. {service.distance_km} km away</span>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{service.name}</h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--slate)', marginBottom: '14px' }}>
                    {service.address}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#b91c1c' }}>
                      {service.phone}
                    </span>
                    <a
                      href={`tel:${service.phone}`}
                      className="btn btn-primary btn-sm"
                      style={{ background: '#b91c1c' }}
                    >
                      <PhoneCall size={14} /> Call Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
