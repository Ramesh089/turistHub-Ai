import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Users,
  Compass,
  Package,
  CalendarCheck,
  IndianRupee,
  Star,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Hotel,
  UserCheck,
  Car,
  Navigation,
  MapPin,
  Phone,
  Languages,
  Award,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Entities
  const [allUsers, setAllUsers] = useState([]);
  const [allDestinations, setAllDestinations] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [allHotels, setAllHotels] = useState([]);
  const [allGuides, setAllGuides] = useState([]);
  const [allTransport, setAllTransport] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [states, setStates] = useState([]);

  // Modals
  const [newDestModal, setNewDestModal] = useState(false);
  const [newPkgModal, setNewPkgModal] = useState(false);
  const [newHotelModal, setNewHotelModal] = useState(false);
  const [newGuideModal, setNewGuideModal] = useState(false);
  const [newTransportModal, setNewTransportModal] = useState(false);

  // Forms state
  const [newDestData, setNewDestData] = useState({
    state_id: 1,
    name: '',
    location: '',
    category: 'Heritage',
    image_url: '',
    description: '',
    estimated_cost_per_day: 3000,
    recommended_duration_days: 3
  });

  const [newPkgData, setNewPkgData] = useState({
    destination_id: '',
    title: '',
    company_name: 'Incredible South Journeys',
    duration_days: 3,
    duration_nights: 2,
    price: 9999,
    transport_type: 'AC Luxury Coach',
    hotel_type: 'Heritage 4-Star Resort',
    food_included: true,
    guide_included: true,
    activities: 'Temple Walk, Palace Tour, Sunset Viewpoint, Cultural Show',
    description: '',
    image_url: ''
  });

  const [newHotelData, setNewHotelData] = useState({
    destination_id: '',
    name: '',
    location: '',
    price_per_night: 3500,
    rating: 4.6,
    room_type: 'Heritage Deluxe Room',
    amenities: 'Free WiFi, AC, Breakfast Included, Swimming Pool',
    contact: '+91 98765 43210',
    image_url: '',
    address: ''
  });

  const [newGuideData, setNewGuideData] = useState({
    destination_id: '',
    name: '',
    languages: 'English, Kannada, Hindi',
    experience_years: 5,
    specialization: 'Heritage & Archaeology',
    price_per_day: 1500,
    rating: 4.8,
    contact: '+91 98450 12345',
    image_url: ''
  });

  const [newTransportData, setNewTransportData] = useState({
    destination_id: '',
    transport_type: 'Train',
    provider: '',
    route: '',
    departure_time: '06:30 AM',
    arrival_time: '10:00 AM',
    price: 650,
    duration: '3h 30m',
    booking_info: 'AC Chair Car / Express'
  });

  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, usersRes, destsRes, pkgsRes, hotelsRes, guidesRes, transRes, bookingsRes, statesRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/users/all'),
        api.get('/destinations'),
        api.get('/packages'),
        api.get('/hotels'),
        api.get('/guides'),
        api.get('/transport'),
        api.get('/bookings/admin/all'),
        api.get('/states')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setAllUsers(usersRes.data.users);
      if (destsRes.data.success) {
        setAllDestinations(destsRes.data.destinations);
        const firstDestId = destsRes.data.destinations[0]?.id || 1;
        setNewPkgData(prev => ({ ...prev, destination_id: prev.destination_id || firstDestId }));
        setNewHotelData(prev => ({ ...prev, destination_id: prev.destination_id || firstDestId }));
        setNewGuideData(prev => ({ ...prev, destination_id: prev.destination_id || firstDestId }));
        setNewTransportData(prev => ({ ...prev, destination_id: prev.destination_id || firstDestId }));
      }
      if (pkgsRes.data.success) setAllPackages(pkgsRes.data.packages);
      if (hotelsRes.data.success) setAllHotels(hotelsRes.data.hotels);
      if (guidesRes.data.success) setAllGuides(guidesRes.data.guides);
      if (transRes.data.success) setAllTransport(transRes.data.transports);
      if (bookingsRes.data.success) setAllBookings(bookingsRes.data.bookings);
      if (statesRes.data.success) setStates(statesRes.data.states);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status });
      if (res.data.success) {
        setActionMsg(`Booking #${bookingId} marked as ${status}`);
        setAllBookings(allBookings.map(b => b.id === bookingId ? { ...b, status } : b));
      }
    } catch (err) {
      console.error('Update booking status error:', err);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'Admin' ? 'Tourist' : 'Admin';
    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setActionMsg(`User role toggled to ${newRole}`);
        setAllUsers(allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error('Toggle role error:', err);
    }
  };

  // --- Deletion Handlers ---
  const handleDeleteDestination = async (destId) => {
    if (!window.confirm('Are you sure you want to delete this destination?')) return;
    try {
      const res = await api.delete(`/destinations/${destId}`);
      if (res.data.success) {
        setActionMsg('Destination deleted.');
        setAllDestinations(allDestinations.filter(d => d.id !== destId));
      }
    } catch (err) {
      console.error('Delete dest error:', err);
    }
  };

  const handleDeletePackage = async (pkgId) => {
    if (!window.confirm('Are you sure you want to delete this tour package?')) return;
    try {
      const res = await api.delete(`/packages/${pkgId}`);
      if (res.data.success) {
        setActionMsg('Tour package deleted.');
        setAllPackages(allPackages.filter(p => p.id !== pkgId));
      }
    } catch (err) {
      console.error('Delete package error:', err);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel accommodation?')) return;
    try {
      const res = await api.delete(`/hotels/${hotelId}`);
      if (res.data.success) {
        setActionMsg('Hotel deleted.');
        setAllHotels(allHotels.filter(h => h.id !== hotelId));
      }
    } catch (err) {
      console.error('Delete hotel error:', err);
    }
  };

  const handleDeleteGuide = async (guideId) => {
    if (!window.confirm('Are you sure you want to delete this tourist guide?')) return;
    try {
      const res = await api.delete(`/guides/${guideId}`);
      if (res.data.success) {
        setActionMsg('Guide deleted.');
        setAllGuides(allGuides.filter(g => g.id !== guideId));
      }
    } catch (err) {
      console.error('Delete guide error:', err);
    }
  };

  const handleDeleteTransport = async (transId) => {
    if (!window.confirm('Are you sure you want to delete this transport option?')) return;
    try {
      const res = await api.delete(`/transport/${transId}`);
      if (res.data.success) {
        setActionMsg('Transport option deleted.');
        setAllTransport(allTransport.filter(t => t.id !== transId));
      }
    } catch (err) {
      console.error('Delete transport error:', err);
    }
  };

  // --- Creation Handlers ---
  const handleCreateDestination = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/destinations', newDestData);
      if (res.data.success) {
        setActionMsg(`Destination "${newDestData.name}" published successfully.`);
        setNewDestModal(false);
        setNewDestData({
          state_id: 1,
          name: '',
          location: '',
          category: 'Heritage',
          image_url: '',
          description: '',
          estimated_cost_per_day: 3000,
          recommended_duration_days: 3
        });
        loadAllData();
      }
    } catch (err) {
      console.error('Create dest error:', err);
      alert(err.response?.data?.message || 'Failed to create destination.');
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const destId = newPkgData.destination_id || (allDestinations[0]?.id || 1);
      const res = await api.post('/packages', { ...newPkgData, destination_id: destId });
      if (res.data.success) {
        setActionMsg(`Package "${newPkgData.title}" created successfully.`);
        setNewPkgModal(false);
        setNewPkgData({
          destination_id: allDestinations[0]?.id || 1,
          title: '',
          company_name: 'Incredible South Journeys',
          duration_days: 3,
          duration_nights: 2,
          price: 9999,
          transport_type: 'AC Luxury Coach',
          hotel_type: 'Heritage 4-Star Resort',
          food_included: true,
          guide_included: true,
          activities: 'Temple Walk, Palace Tour, Sunset Viewpoint',
          description: '',
          image_url: ''
        });
        loadAllData();
      }
    } catch (err) {
      console.error('Create pkg error:', err);
      alert(err.response?.data?.message || 'Failed to create package.');
    }
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      const destId = newHotelData.destination_id || (allDestinations[0]?.id || 1);
      const res = await api.post('/hotels', { ...newHotelData, destination_id: destId });
      if (res.data.success) {
        setActionMsg(`Hotel "${newHotelData.name}" added successfully.`);
        setNewHotelModal(false);
        setNewHotelData({
          destination_id: allDestinations[0]?.id || 1,
          name: '',
          location: '',
          price_per_night: 3500,
          rating: 4.6,
          room_type: 'Heritage Deluxe Room',
          amenities: 'Free WiFi, AC, Breakfast Included, Swimming Pool',
          contact: '+91 98765 43210',
          image_url: '',
          address: ''
        });
        loadAllData();
      }
    } catch (err) {
      console.error('Create hotel error:', err);
      alert(err.response?.data?.message || 'Failed to add hotel.');
    }
  };

  const handleCreateGuide = async (e) => {
    e.preventDefault();
    try {
      const destId = newGuideData.destination_id || (allDestinations[0]?.id || 1);
      const res = await api.post('/guides', { ...newGuideData, destination_id: destId });
      if (res.data.success) {
        setActionMsg(`Guide "${newGuideData.name}" added successfully.`);
        setNewGuideModal(false);
        setNewGuideData({
          destination_id: allDestinations[0]?.id || 1,
          name: '',
          languages: 'English, Kannada, Hindi',
          experience_years: 5,
          specialization: 'Heritage & Archaeology',
          price_per_day: 1500,
          rating: 4.8,
          contact: '+91 98450 12345',
          image_url: ''
        });
        loadAllData();
      }
    } catch (err) {
      console.error('Create guide error:', err);
      alert(err.response?.data?.message || 'Failed to add guide.');
    }
  };

  const handleCreateTransport = async (e) => {
    e.preventDefault();
    try {
      const destId = newTransportData.destination_id || (allDestinations[0]?.id || 1);
      const res = await api.post('/transport', { ...newTransportData, destination_id: destId });
      if (res.data.success) {
        setActionMsg(`Transport option "${newTransportData.provider}" added successfully.`);
        setNewTransportModal(false);
        setNewTransportData({
          destination_id: allDestinations[0]?.id || 1,
          transport_type: 'Train',
          provider: '',
          route: '',
          departure_time: '06:30 AM',
          arrival_time: '10:00 AM',
          price: 650,
          duration: '3h 30m',
          booking_info: 'AC Chair Car / Express'
        });
        loadAllData();
      }
    } catch (err) {
      console.error('Create transport error:', err);
      alert(err.response?.data?.message || 'Failed to add transport option.');
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '90vh', paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-banner" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        borderBottom: '4px solid #f59e0b'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <img
              src="/logo.png"
              alt="Tourist AI Hub Logo"
              className="page-banner-logo"
              style={{
                objectFit: 'contain',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '6px',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 6px 22px rgba(0, 0, 0, 0.4)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                <ShieldCheck size={18} /> Administrator Command Center
              </div>
              <h1 className="page-banner-title">
                Tourist AI Hub Management Suite
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Logged in as <strong>{user?.name || user?.fullName || 'Administrator'}</strong>. Add and manage tourist guides, packages, hotels, transport options, and Indian destinations.
              </p>
            </div>
          </div>

          {/* Quick Action Add Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setNewGuideModal(true)}
              className="btn btn-sm"
              style={{ background: '#059669', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Add a new certified tourist guide"
            >
              <Plus size={15} /> Add Guide
            </button>

            <button
              onClick={() => setNewPkgModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Create a new all-inclusive tour package"
            >
              <Plus size={15} /> Add Package
            </button>

            <button
              onClick={() => setNewHotelModal(true)}
              className="btn btn-sm"
              style={{ background: '#0284c7', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="List a verified hotel or resort"
            >
              <Plus size={15} /> Add Hotel
            </button>

            <button
              onClick={() => setNewTransportModal(true)}
              className="btn btn-sm"
              style={{ background: '#7c3aed', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Add a transit or intercity transport option"
            >
              <Plus size={15} /> Add Transport
            </button>

            <button
              onClick={() => setNewDestModal(true)}
              className="btn btn-gold btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Publish a new tourist destination"
            >
              <Plus size={15} /> Add Destination
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {actionMsg && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✓ {actionMsg}</span>
            <button onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* 1. Statistics Cards */}
        {loadingStats ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--primary)', fontWeight: '600' }}>Loading system metrics...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Tourists</span>
                <Users size={18} color="#3b82f6" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
                {stats?.total_tourists ?? allUsers.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#16a34a' }}>Registered Accounts</span>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #e65100' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Destinations</span>
                <Compass size={18} color="#e65100" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#e65100', marginTop: '4px' }}>
                {allDestinations.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate)' }}>Indian Tourist Places</span>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Packages</span>
                <Package size={18} color="#0284c7" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                {allPackages.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate)' }}>All-Inclusive Tours</span>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Hotels</span>
                <Hotel size={18} color="#059669" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {allHotels.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate)' }}>Verified Stays</span>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Guides</span>
                <UserCheck size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {allGuides.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate)' }}>Certified Storytellers</span>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Transit</span>
                <Car size={18} color="#7c3aed" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
                {allTransport.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--slate)' }}>Trains, Buses & Cabs</span>
            </div>

            <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #d97706' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Bookings</span>
                <CalendarCheck size={18} color="#d97706" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
                {allBookings.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#16a34a' }}>₹{Number(stats?.total_revenue || 0).toLocaleString('en-IN')} Vol.</span>
            </div>
          </div>
        )}

        {/* 2. Admin Navigation Tabs */}
        <div className="tabs-nav" style={{
          background: '#ffffff',
          padding: '8px 16px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          marginBottom: '24px'
        }}>
          <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}>
            Recent Bookings ({allBookings.length})
          </button>
          <button onClick={() => setActiveTab('destinations')} className={`tab-btn ${activeTab === 'destinations' ? 'active' : ''}`}>
            Destinations ({allDestinations.length})
          </button>
          <button onClick={() => setActiveTab('packages')} className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}>
            Tour Packages ({allPackages.length})
          </button>
          <button onClick={() => setActiveTab('hotels')} className={`tab-btn ${activeTab === 'hotels' ? 'active' : ''}`}>
            Hotels & Resorts ({allHotels.length})
          </button>
          <button onClick={() => setActiveTab('guides')} className={`tab-btn ${activeTab === 'guides' ? 'active' : ''}`}>
            Tourist Guides ({allGuides.length})
          </button>
          <button onClick={() => setActiveTab('transport')} className={`tab-btn ${activeTab === 'transport' ? 'active' : ''}`}>
            Transport ({allTransport.length})
          </button>
          <button onClick={() => setActiveTab('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>
            Manage Users ({allUsers.length})
          </button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>All Platform Bookings</h3>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--slate)' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>Tourist Name</th>
                    <th style={{ padding: '10px' }}>Package / Destination</th>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Guests</th>
                    <th style={{ padding: '10px' }}>Amount</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '700' }}>#{b.id}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <strong>{b.user_name}</strong><br />
                        <span style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>{b.user_email}</span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>{b.package_title || b.destination_name}</td>
                      <td style={{ padding: '12px 10px' }}>{new Date(b.travel_date).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '12px 10px' }}>{b.people_count}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{Number(b.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: b.status === 'Confirmed' ? '#dcfce7' : b.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                          color: b.status === 'Confirmed' ? '#166534' : b.status === 'Pending' ? '#92400e' : '#991b1b'
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {b.status !== 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Confirmed')}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#166534', padding: '4px 8px' }}
                              title="Approve & Confirm"
                            >
                              Confirm
                            </button>
                          )}
                          {b.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Cancelled')}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#b91c1c', padding: '4px 8px' }}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Destinations Management */}
        {activeTab === 'destinations' && (
          <div className="animate-fade-in card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Active Tourist Destinations</h3>
              <button onClick={() => setNewDestModal(true)} className="btn btn-gold btn-sm">
                <Plus size={16} /> Add Destination
              </button>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--slate)' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>State</th>
                    <th style={{ padding: '10px' }}>Category</th>
                    <th style={{ padding: '10px' }}>Est. Cost/Day</th>
                    <th style={{ padding: '10px' }}>Rating</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allDestinations.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{d.name}</td>
                      <td style={{ padding: '12px 10px' }}>{d.state_name}</td>
                      <td style={{ padding: '12px 10px' }}><span className="badge badge-heritage">{d.category}</span></td>
                      <td style={{ padding: '12px 10px' }}>₹{Math.round(d.estimated_cost_per_day)}</td>
                      <td style={{ padding: '12px 10px' }}>⭐ {d.rating}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteDestination(d.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#b91c1c' }}
                          title="Delete destination"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Packages Management */}
        {activeTab === 'packages' && (
          <div className="animate-fade-in card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Tour Packages Inventory</h3>
              <button onClick={() => setNewPkgModal(true)} className="btn btn-primary btn-sm">
                <Plus size={16} /> Add Tour Package
              </button>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--slate)' }}>
                    <th style={{ padding: '10px' }}>Title</th>
                    <th style={{ padding: '10px' }}>Destination</th>
                    <th style={{ padding: '10px' }}>Company</th>
                    <th style={{ padding: '10px' }}>Duration</th>
                    <th style={{ padding: '10px' }}>Price</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allPackages.map((pkg) => (
                    <tr key={pkg.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{pkg.title}</td>
                      <td style={{ padding: '12px 10px' }}>{pkg.destination_name}</td>
                      <td style={{ padding: '12px 10px' }}>{pkg.company_name}</td>
                      <td style={{ padding: '12px 10px' }}>{pkg.duration_days}D / {pkg.duration_nights || (pkg.duration_days - 1)}N</td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{Number(pkg.price).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#b91c1c' }}
                          title="Delete package"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Hotels Management */}
        {activeTab === 'hotels' && (
          <div className="animate-fade-in card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Hotels & Heritage Resorts Inventory</h3>
              <button onClick={() => setNewHotelModal(true)} className="btn btn-sm" style={{ background: '#0284c7', color: '#fff', border: 'none' }}>
                <Plus size={16} /> Add Hotel
              </button>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--slate)' }}>
                    <th style={{ padding: '10px' }}>Hotel Name</th>
                    <th style={{ padding: '10px' }}>Destination / Area</th>
                    <th style={{ padding: '10px' }}>Room Type</th>
                    <th style={{ padding: '10px' }}>Price / Night</th>
                    <th style={{ padding: '10px' }}>Rating</th>
                    <th style={{ padding: '10px' }}>Contact</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allHotels.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{h.name}</td>
                      <td style={{ padding: '12px 10px' }}>{h.destination_name || h.location}</td>
                      <td style={{ padding: '12px 10px' }}><span className="badge badge-sky">{h.room_type}</span></td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{Number(h.price_per_night).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 10px' }}>⭐ {h.rating}</td>
                      <td style={{ padding: '12px 10px', fontSize: '0.82rem', color: 'var(--slate)' }}>{h.contact || 'N/A'}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteHotel(h.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#b91c1c' }}
                          title="Delete hotel"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Guides Management */}
        {activeTab === 'guides' && (
          <div className="animate-fade-in card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Certified Tourist Guides Directory</h3>
              <button onClick={() => setNewGuideModal(true)} className="btn btn-sm" style={{ background: '#059669', color: '#fff', border: 'none' }}>
                <Plus size={16} /> Add Guide
              </button>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--slate)' }}>
                    <th style={{ padding: '10px' }}>Guide Name</th>
                    <th style={{ padding: '10px' }}>Destination</th>
                    <th style={{ padding: '10px' }}>Specialization</th>
                    <th style={{ padding: '10px' }}>Experience</th>
                    <th style={{ padding: '10px' }}>Languages</th>
                    <th style={{ padding: '10px' }}>Rate / Day</th>
                    <th style={{ padding: '10px' }}>Rating</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allGuides.map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{g.name}</td>
                      <td style={{ padding: '12px 10px' }}>{g.destination_name || 'All India'}</td>
                      <td style={{ padding: '12px 10px' }}><span className="badge badge-green">{g.specialization}</span></td>
                      <td style={{ padding: '12px 10px' }}>{g.experience_years} yrs</td>
                      <td style={{ padding: '12px 10px', fontSize: '0.82rem', color: 'var(--slate)' }}>{g.languages}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{Number(g.price_per_day).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 10px' }}>⭐ {g.rating}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteGuide(g.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#b91c1c' }}
                          title="Delete guide"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Transport Management */}
        {activeTab === 'transport' && (
          <div className="animate-fade-in card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Intercity Transport & Transit Options</h3>
              <button onClick={() => setNewTransportModal(true)} className="btn btn-sm" style={{ background: '#7c3aed', color: '#fff', border: 'none' }}>
                <Plus size={16} /> Add Transport
              </button>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--slate)' }}>
                    <th style={{ padding: '10px' }}>Type</th>
                    <th style={{ padding: '10px' }}>Provider / Service</th>
                    <th style={{ padding: '10px' }}>Destination / Route</th>
                    <th style={{ padding: '10px' }}>Departure - Arrival</th>
                    <th style={{ padding: '10px' }}>Duration</th>
                    <th style={{ padding: '10px' }}>Fare (₹)</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransport.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <span className="badge badge-sky">{t.transport_type}</span>
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{t.provider}</td>
                      <td style={{ padding: '12px 10px' }}>{t.route || t.destination_name}</td>
                      <td style={{ padding: '12px 10px', fontSize: '0.84rem' }}>{t.departure_time} - {t.arrival_time}</td>
                      <td style={{ padding: '12px 10px' }}>{t.duration || 'N/A'}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{Number(t.price).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteTransport(t.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#b91c1c' }}
                          title="Delete transport option"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Users Management */}
        {activeTab === 'users' && (
          <div className="animate-fade-in card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>User Accounts & Roles</h3>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--slate)' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Phone</th>
                    <th style={{ padding: '10px' }}>Role</th>
                    <th style={{ padding: '10px' }}>Bookings</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Toggle Role</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{u.name}</td>
                      <td style={{ padding: '12px 10px' }}>{u.email}</td>
                      <td style={{ padding: '12px 10px' }}>{u.phone || 'N/A'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: u.role === 'Admin' ? '#fef3c7' : '#e0f2fe',
                          color: u.role === 'Admin' ? '#92400e' : '#0369a1'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>{u.bookings_count || 0}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleUserRole(u.id, u.role)}
                          className="btn btn-secondary btn-sm"
                        >
                          Make {u.role === 'Admin' ? 'Tourist' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: ADD GUIDE                                          */}
      {/* ============================================================ */}
      {newGuideModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>Add Tourist Guide</h3>
              </div>
              <button onClick={() => setNewGuideModal(false)} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateGuide}>
              <div className="form-group">
                <label className="form-label">Destination Location *</label>
                <select
                  value={newGuideData.destination_id}
                  onChange={(e) => setNewGuideData({ ...newGuideData, destination_id: Number(e.target.value) })}
                  className="form-control"
                  required
                >
                  {allDestinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.state_name || d.location})</option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Guide Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Gowda"
                    value={newGuideData.name}
                    onChange={(e) => setNewGuideData({ ...newGuideData, name: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <select
                    value={newGuideData.specialization}
                    onChange={(e) => setNewGuideData({ ...newGuideData, specialization: e.target.value })}
                    className="form-control"
                    required
                  >
                    <option value="Heritage & Archaeology">Heritage & Archaeology</option>
                    <option value="Culture & Traditions">Culture & Traditions</option>
                    <option value="Nature & Wildlife">Nature & Wildlife</option>
                    <option value="Spiritual & Temples">Spiritual & Temples</option>
                    <option value="Architecture & Royal Palaces">Architecture & Royal Palaces</option>
                    <option value="Culinary & Street Food">Culinary & Street Food</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Languages Spoken *</label>
                  <input
                    type="text"
                    placeholder="e.g. English, Kannada, Hindi"
                    value={newGuideData.languages}
                    onChange={(e) => setNewGuideData({ ...newGuideData, languages: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newGuideData.experience_years}
                    onChange={(e) => setNewGuideData({ ...newGuideData, experience_years: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Price per Day (₹) *</label>
                  <input
                    type="number"
                    min="500"
                    step="50"
                    value={newGuideData.price_per_day}
                    onChange={(e) => setNewGuideData({ ...newGuideData, price_per_day: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number *</label>
                  <input
                    type="text"
                    placeholder="+91 98450 12345"
                    value={newGuideData.contact}
                    onChange={(e) => setNewGuideData({ ...newGuideData, contact: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Guide Photo / Avatar URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newGuideData.image_url}
                  onChange={(e) => setNewGuideData({ ...newGuideData, image_url: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setNewGuideModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669' }}>
                  Register Tourist Guide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADD TOUR PACKAGE                                   */}
      {/* ============================================================ */}
      {newPkgModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>Add Tour Package</h3>
              </div>
              <button onClick={() => setNewPkgModal(false)} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreatePackage}>
              <div className="form-group">
                <label className="form-label">Destination Location *</label>
                <select
                  value={newPkgData.destination_id}
                  onChange={(e) => setNewPkgData({ ...newPkgData, destination_id: Number(e.target.value) })}
                  className="form-control"
                  required
                >
                  {allDestinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.state_name || d.location})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Package Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Mysore & Coorg 3-Day Heritage & Plantation Expedition"
                  value={newPkgData.title}
                  onChange={(e) => setNewPkgData({ ...newPkgData, title: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Total Price (₹) *</label>
                  <input
                    type="number"
                    min="1000"
                    value={newPkgData.price}
                    onChange={(e) => setNewPkgData({ ...newPkgData, price: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Operator / Tour Company *</label>
                  <input
                    type="text"
                    value={newPkgData.company_name}
                    onChange={(e) => setNewPkgData({ ...newPkgData, company_name: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Duration (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    value={newPkgData.duration_days}
                    onChange={(e) => setNewPkgData({ ...newPkgData, duration_days: Number(e.target.value), duration_nights: Math.max(1, Number(e.target.value) - 1) })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Nights)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPkgData.duration_nights}
                    onChange={(e) => setNewPkgData({ ...newPkgData, duration_nights: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Included Transport</label>
                  <input
                    type="text"
                    placeholder="e.g. AC Luxury Coach or Private Chauffeur Cab"
                    value={newPkgData.transport_type}
                    onChange={(e) => setNewPkgData({ ...newPkgData, transport_type: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Included Hotel Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Heritage 4-Star Resort"
                    value={newPkgData.hotel_type}
                    onChange={(e) => setNewPkgData({ ...newPkgData, hotel_type: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={newPkgData.food_included}
                    onChange={(e) => setNewPkgData({ ...newPkgData, food_included: e.target.checked })}
                  />
                  <span>Meals & Authentic Food Included</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={newPkgData.guide_included}
                    onChange={(e) => setNewPkgData({ ...newPkgData, guide_included: e.target.checked })}
                  />
                  <span>Certified Local Guide Included</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Key Activities & Highlights (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Mysore Palace Walk, Chamundi Hill Viewpoint, Coffee Plantation Trail"
                  value={newPkgData.activities}
                  onChange={(e) => setNewPkgData({ ...newPkgData, activities: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newPkgData.image_url}
                  onChange={(e) => setNewPkgData({ ...newPkgData, image_url: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea
                  rows={2}
                  placeholder="Overview of the itinerary, experiences, and highlights..."
                  value={newPkgData.description}
                  onChange={(e) => setNewPkgData({ ...newPkgData, description: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setNewPkgModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Tour Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ADD HOTEL                                          */}
      {/* ============================================================ */}
      {newHotelModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hotel size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>Add Hotel & Resort</h3>
              </div>
              <button onClick={() => setNewHotelModal(false)} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateHotel}>
              <div className="form-group">
                <label className="form-label">Destination Location *</label>
                <select
                  value={newHotelData.destination_id}
                  onChange={(e) => setNewHotelData({ ...newHotelData, destination_id: Number(e.target.value) })}
                  className="form-control"
                  required
                >
                  {allDestinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.state_name || d.location})</option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Hotel / Resort Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Lalitha Mahal Palace Hotel"
                    value={newHotelData.name}
                    onChange={(e) => setNewHotelData({ ...newHotelData, name: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Area / Landmark *</label>
                  <input
                    type="text"
                    placeholder="e.g. Lalitha Mahal Nagar, Mysore"
                    value={newHotelData.location}
                    onChange={(e) => setNewHotelData({ ...newHotelData, location: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Price per Night (₹) *</label>
                  <input
                    type="number"
                    min="500"
                    value={newHotelData.price_per_night}
                    onChange={(e) => setNewHotelData({ ...newHotelData, price_per_night: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Star Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newHotelData.rating}
                    onChange={(e) => setNewHotelData({ ...newHotelData, rating: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Room Type *</label>
                  <select
                    value={newHotelData.room_type}
                    onChange={(e) => setNewHotelData({ ...newHotelData, room_type: e.target.value })}
                    className="form-control"
                    required
                  >
                    <option value="Heritage Deluxe Room">Heritage Deluxe Room</option>
                    <option value="Royal Executive Suite">Royal Executive Suite</option>
                    <option value="Standard AC Room">Standard AC Room</option>
                    <option value="Plantation Villa">Plantation Villa</option>
                    <option value="Beachfront Cottage">Beachfront Cottage</option>
                    <option value="Presidential Palace Suite">Presidential Palace Suite</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact / Front Desk Phone</label>
                  <input
                    type="text"
                    placeholder="+91 821 2470470"
                    value={newHotelData.contact}
                    onChange={(e) => setNewHotelData({ ...newHotelData, contact: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amenities (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Free WiFi, Swimming Pool, Royal Dining, Spa, Free Breakfast, AC"
                  value={newHotelData.amenities}
                  onChange={(e) => setNewHotelData({ ...newHotelData, amenities: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newHotelData.image_url}
                  onChange={(e) => setNewHotelData({ ...newHotelData, image_url: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. Lalitha Mahal Nagar, Siddhartha Layout, Mysuru, Karnataka 570028"
                  value={newHotelData.address}
                  onChange={(e) => setNewHotelData({ ...newHotelData, address: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setNewHotelModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                  Add Hotel Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ADD TRANSPORT                                      */}
      {/* ============================================================ */}
      {newTransportModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>Add Transport Option</h3>
              </div>
              <button onClick={() => setNewTransportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateTransport}>
              <div className="form-group">
                <label className="form-label">Destination Location *</label>
                <select
                  value={newTransportData.destination_id}
                  onChange={(e) => setNewTransportData({ ...newTransportData, destination_id: Number(e.target.value) })}
                  className="form-control"
                  required
                >
                  {allDestinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.state_name || d.location})</option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Transport Mode *</label>
                  <select
                    value={newTransportData.transport_type}
                    onChange={(e) => setNewTransportData({ ...newTransportData, transport_type: e.target.value })}
                    className="form-control"
                    required
                  >
                    <option value="Train">Train (Vande Bharat / Express)</option>
                    <option value="Bus">Luxury AC Bus (KSRTC / Private)</option>
                    <option value="Flight">Flight (Regional / Domestic)</option>
                    <option value="Private Driver">Private Driver / Chauffeur Cab</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Provider / Service Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Vande Bharat Express 20607"
                    value={newTransportData.provider}
                    onChange={(e) => setNewTransportData({ ...newTransportData, provider: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Route *</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru KSR Station -> Mysuru Junction"
                  value={newTransportData.route}
                  onChange={(e) => setNewTransportData({ ...newTransportData, route: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Departure Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 06:15 AM"
                    value={newTransportData.departure_time}
                    onChange={(e) => setNewTransportData({ ...newTransportData, departure_time: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Arrival Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={newTransportData.arrival_time}
                    onChange={(e) => setNewTransportData({ ...newTransportData, arrival_time: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Fare / Ticket Price (₹) *</label>
                  <input
                    type="number"
                    min="50"
                    value={newTransportData.price}
                    onChange={(e) => setNewTransportData({ ...newTransportData, price: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trip Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3h 15m"
                    value={newTransportData.duration}
                    onChange={(e) => setNewTransportData({ ...newTransportData, duration: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Class / Seat Information</label>
                <input
                  type="text"
                  placeholder="e.g. AC Chair Car (CC) / Executive Class (EC)"
                  value={newTransportData.booking_info}
                  onChange={(e) => setNewTransportData({ ...newTransportData, booking_info: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setNewTransportModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                  Add Transport Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: ADD DESTINATION                                    */}
      {/* ============================================================ */}
      {newDestModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>Add Tourist Destination</h3>
              </div>
              <button onClick={() => setNewDestModal(false)} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateDestination}>
              <div className="form-group">
                <label className="form-label">Destination Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Yadgir Fort & Sanctuaries"
                  value={newDestData.name}
                  onChange={(e) => setNewDestData({ ...newDestData, name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location (District, State) *</label>
                <input
                  type="text"
                  placeholder="e.g. Yadgir District, Karnataka"
                  value={newDestData.location}
                  onChange={(e) => setNewDestData({ ...newDestData, location: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={newDestData.category}
                    onChange={(e) => setNewDestData({ ...newDestData, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="Heritage">Heritage</option>
                    <option value="Nature">Nature</option>
                    <option value="Culture">Culture</option>
                    <option value="Beach">Beach</option>
                    <option value="Spiritual">Spiritual</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Indian State *</label>
                  <select
                    value={newDestData.state_id}
                    onChange={(e) => setNewDestData({ ...newDestData, state_id: Number(e.target.value) })}
                    className="form-control"
                  >
                    {states.length > 0 ? (
                      states.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Karnataka</option>
                        <option value={2}>Kerala</option>
                        <option value={3}>Rajasthan</option>
                        <option value={4}>Goa</option>
                        <option value={5}>Uttar Pradesh</option>
                        <option value={6}>Himachal Pradesh</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Est. Cost / Day (₹)</label>
                  <input
                    type="number"
                    min="500"
                    value={newDestData.estimated_cost_per_day}
                    onChange={(e) => setNewDestData({ ...newDestData, estimated_cost_per_day: Number(e.target.value) })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Recommended Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newDestData.recommended_duration_days}
                    onChange={(e) => setNewDestData({ ...newDestData, recommended_duration_days: Number(e.target.value) })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL *</label>
                <input
                  type="url"
                  value={newDestData.image_url}
                  onChange={(e) => setNewDestData({ ...newDestData, image_url: e.target.value })}
                  className="form-control"
                  placeholder="https://images.unsplash.com/..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  rows={3}
                  value={newDestData.description}
                  onChange={(e) => setNewDestData({ ...newDestData, description: e.target.value })}
                  className="form-control"
                  placeholder="Key cultural background, scenic attractions, and traveler advice..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setNewDestModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  Publish Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
