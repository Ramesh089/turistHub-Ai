import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  X,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Quick Action Dropdown state
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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

  // Search & Filter State
  const [searchBookings, setSearchBookings] = useState('');
  const [filterBookingStatus, setFilterBookingStatus] = useState('All');
  const [searchDests, setSearchDests] = useState('');
  const [searchPkgs, setSearchPkgs] = useState('');
  const [searchHotels, setSearchHotels] = useState('');
  const [searchGuides, setSearchGuides] = useState('');
  const [searchTrans, setSearchTrans] = useState('');
  const [searchUsers, setSearchUsers] = useState('');

  // Modals & Editing State
  const [newDestModal, setNewDestModal] = useState(false);
  const [editingDestId, setEditingDestId] = useState(null);

  const [newPkgModal, setNewPkgModal] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState(null);

  const [newHotelModal, setNewHotelModal] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState(null);

  const [newGuideModal, setNewGuideModal] = useState(false);
  const [editingGuideId, setEditingGuideId] = useState(null);

  const [newTransportModal, setNewTransportModal] = useState(false);
  const [editingTransId, setEditingTransId] = useState(null);

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

  // --- Edit Openers ---
  const handleOpenEditDestination = (d) => {
    setEditingDestId(d.id);
    setNewDestData({
      state_id: d.state_id || 1,
      name: d.name || '',
      location: d.location || '',
      category: d.category || 'Heritage',
      image_url: d.image_url || '',
      description: d.description || '',
      estimated_cost_per_day: d.estimated_cost_per_day || 3000,
      recommended_duration_days: d.recommended_duration_days || 3
    });
    setNewDestModal(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPkgId(pkg.id);
    setNewPkgData({
      destination_id: pkg.destination_id || (allDestinations[0]?.id || 1),
      title: pkg.title || '',
      company_name: pkg.company_name || 'Incredible South Journeys',
      duration_days: pkg.duration_days || 3,
      duration_nights: pkg.duration_nights || 2,
      price: pkg.price || 9999,
      transport_type: pkg.transport_type || 'AC Luxury Coach',
      hotel_type: pkg.hotel_type || 'Heritage 4-Star Resort',
      food_included: pkg.food_included !== undefined ? Boolean(pkg.food_included) : true,
      guide_included: pkg.guide_included !== undefined ? Boolean(pkg.guide_included) : true,
      activities: Array.isArray(pkg.activities) ? pkg.activities.join(', ') : (pkg.activities || ''),
      description: pkg.description || '',
      image_url: pkg.image_url || ''
    });
    setNewPkgModal(true);
  };

  const handleOpenEditHotel = (h) => {
    setEditingHotelId(h.id);
    setNewHotelData({
      destination_id: h.destination_id || (allDestinations[0]?.id || 1),
      name: h.name || '',
      location: h.location || '',
      price_per_night: h.price_per_night || 3500,
      rating: h.rating || 4.6,
      room_type: h.room_type || 'Heritage Deluxe Room',
      amenities: Array.isArray(h.amenities) ? h.amenities.join(', ') : (h.amenities || ''),
      contact: h.contact || '+91 98765 43210',
      image_url: h.image_url || '',
      address: h.address || ''
    });
    setNewHotelModal(true);
  };

  const handleOpenEditGuide = (g) => {
    setEditingGuideId(g.id);
    setNewGuideData({
      destination_id: g.destination_id || (allDestinations[0]?.id || 1),
      name: g.name || '',
      languages: g.languages || 'English, Kannada, Hindi',
      experience_years: g.experience_years || 5,
      specialization: g.specialization || 'Heritage & Archaeology',
      price_per_day: g.price_per_day || 1500,
      rating: g.rating || 4.8,
      contact: g.contact || '+91 98450 12345',
      image_url: g.image_url || ''
    });
    setNewGuideModal(true);
  };

  const handleOpenEditTransport = (t) => {
    setEditingTransId(t.id);
    setNewTransportData({
      destination_id: t.destination_id || (allDestinations[0]?.id || 1),
      transport_type: t.transport_type || 'Train',
      provider: t.provider || '',
      route: t.route || '',
      departure_time: t.departure_time || '06:30 AM',
      arrival_time: t.arrival_time || '10:00 AM',
      price: t.price || 650,
      duration: t.duration || '3h 30m',
      booking_info: t.booking_info || 'AC Chair Car / Express'
    });
    setNewTransportModal(true);
  };

  // --- Save (Create or Update) Handlers ---
  const handleSaveDestination = async (e) => {
    e.preventDefault();
    try {
      if (editingDestId) {
        const res = await api.put(`/destinations/${editingDestId}`, newDestData);
        if (res.data.success) {
          setActionMsg(`Destination "${newDestData.name}" updated successfully.`);
          setNewDestModal(false);
          setEditingDestId(null);
          loadAllData();
        }
      } else {
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
      }
    } catch (err) {
      console.error('Save dest error:', err);
      alert(err.response?.data?.message || 'Failed to save destination.');
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      const destId = newPkgData.destination_id || (allDestinations[0]?.id || 1);
      const pkgPayload = { ...newPkgData, destination_id: destId };
      if (editingPkgId) {
        const res = await api.put(`/packages/${editingPkgId}`, pkgPayload);
        if (res.data.success) {
          setActionMsg(`Package "${newPkgData.title}" updated successfully.`);
          setNewPkgModal(false);
          setEditingPkgId(null);
          loadAllData();
        }
      } else {
        const res = await api.post('/packages', pkgPayload);
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
      }
    } catch (err) {
      console.error('Save pkg error:', err);
      alert(err.response?.data?.message || 'Failed to save package.');
    }
  };

  const handleSaveHotel = async (e) => {
    e.preventDefault();
    try {
      const destId = newHotelData.destination_id || (allDestinations[0]?.id || 1);
      const hotelPayload = { ...newHotelData, destination_id: destId };
      if (editingHotelId) {
        const res = await api.put(`/hotels/${editingHotelId}`, hotelPayload);
        if (res.data.success) {
          setActionMsg(`Hotel "${newHotelData.name}" updated successfully.`);
          setNewHotelModal(false);
          setEditingHotelId(null);
          loadAllData();
        }
      } else {
        const res = await api.post('/hotels', hotelPayload);
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
      }
    } catch (err) {
      console.error('Save hotel error:', err);
      alert(err.response?.data?.message || 'Failed to save hotel.');
    }
  };

  const handleSaveGuide = async (e) => {
    e.preventDefault();
    try {
      const destId = newGuideData.destination_id || (allDestinations[0]?.id || 1);
      const guidePayload = { ...newGuideData, destination_id: destId };
      if (editingGuideId) {
        const res = await api.put(`/guides/${editingGuideId}`, guidePayload);
        if (res.data.success) {
          setActionMsg(`Guide "${newGuideData.name}" updated successfully.`);
          setNewGuideModal(false);
          setEditingGuideId(null);
          loadAllData();
        }
      } else {
        const res = await api.post('/guides', guidePayload);
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
      }
    } catch (err) {
      console.error('Save guide error:', err);
      alert(err.response?.data?.message || 'Failed to save guide.');
    }
  };

  const handleSaveTransport = async (e) => {
    e.preventDefault();
    try {
      const destId = newTransportData.destination_id || (allDestinations[0]?.id || 1);
      const transPayload = { ...newTransportData, destination_id: destId };
      if (editingTransId) {
        const res = await api.put(`/transport/${editingTransId}`, transPayload);
        if (res.data.success) {
          setActionMsg(`Transport option "${newTransportData.provider}" updated successfully.`);
          setNewTransportModal(false);
          setEditingTransId(null);
          loadAllData();
        }
      } else {
        const res = await api.post('/transport', transPayload);
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
      }
    } catch (err) {
      console.error('Save transport error:', err);
      alert(err.response?.data?.message || 'Failed to save transport option.');
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '90vh', paddingBottom: '90px' }}>
      {/* Modern Executive Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '24px 0 20px',
        marginBottom: '28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 16px rgba(2, 132, 199, 0.22)'
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <Sparkles size={12} /> Management Console
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>•</span>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
                  Logged in as <strong style={{ color: '#0f172a' }}>{user?.name || user?.fullName || 'Administrator'}</strong>
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.35rem, 2.4vw, 1.7rem)', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Platform Operations & Inventory
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0' }}>
                Live overview of tourist bookings, packages, verified stays, tour guides, and transit across India.
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <button
              onClick={loadAllData}
              className="btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontWeight: '600',
                fontSize: '0.85rem',
                padding: '9px 15px',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Refresh dashboard data"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>

            {/* Quick Add Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.28)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} />
                <span>Quick Create</span>
                <ChevronDown size={15} style={{ transform: quickAddOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {quickAddOpen && (
                <>
                  <div
                    onClick={() => setQuickAddOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    padding: '6px',
                    zIndex: 95,
                    animation: 'fadeIn 0.15s ease'
                  }}>
                    <button
                      onClick={() => { setNewDestModal(true); setQuickAddOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Compass size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>New Destination</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Publish tourist places & spots</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setNewPkgModal(true); setQuickAddOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>New Tour Package</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Create all-inclusive journeys</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setNewHotelModal(true); setQuickAddOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Hotel size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>New Hotel / Resort</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>List verified accommodations</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setNewGuideModal(true); setQuickAddOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCheck size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>New Tourist Guide</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Register certified local expert</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setNewTransportModal(true); setQuickAddOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>New Transport Option</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Add coach, train, or cab transit</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {actionMsg && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #bbf7d0' }}>
            <span>✓ {actionMsg}</span>
            <button onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* 1. Statistics Cards */}
        {loadingStats ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#0284c7', fontWeight: '600' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
            <div>Loading system metrics...</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 155px), 1fr))',
            gap: '14px',
            marginBottom: '26px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Tourists</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                  {stats?.total_tourists ?? allUsers.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600', marginTop: '4px' }}>Registered Accounts</div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Bookings</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarCheck size={16} />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                  {allBookings.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600', marginTop: '4px' }}>₹{Number(stats?.total_revenue || 0).toLocaleString('en-IN')} Vol.</div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Destinations</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={16} />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                  {allDestinations.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Indian Tourist Places</div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Packages</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={16} />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                  {allPackages.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>All-Inclusive Tours</div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Hotels</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hotel size={16} />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                  {allHotels.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Verified Stays</div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Guides</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={16} />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                  {allGuides.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Certified Guides</div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Transit</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={16} />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                  {allTransport.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Trains, Buses & Cabs</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Admin Segmented Navigation Tabs */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          marginBottom: '24px'
        }}>
          {[
            { id: 'overview', label: 'Recent Bookings', count: allBookings.length, icon: CalendarCheck, activeColor: '#0284c7' },
            { id: 'destinations', label: 'Destinations', count: allDestinations.length, icon: Compass, activeColor: '#ea580c' },
            { id: 'packages', label: 'Tour Packages', count: allPackages.length, icon: Package, activeColor: '#0284c7' },
            { id: 'hotels', label: 'Hotels & Stays', count: allHotels.length, icon: Hotel, activeColor: '#059669' },
            { id: 'guides', label: 'Tourist Guides', count: allGuides.length, icon: UserCheck, activeColor: '#0d9488' },
            { id: 'transport', label: 'Transport', count: allTransport.length, icon: Car, activeColor: '#7c3aed' },
            { id: 'users', label: 'User Accounts', count: allUsers.length, icon: Users, activeColor: '#2563eb' }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  border: 'none',
                  background: isActive ? '#f0f9ff' : 'transparent',
                  color: isActive ? t.activeColor : '#475569',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '0.84rem',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? 'inset 0 0 0 1.5px rgba(2, 132, 199, 0.2)' : 'none'
                }}
              >
                <Icon size={16} color={isActive ? t.activeColor : '#94a3b8'} />
                <span>{t.label}</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: isActive ? '#0284c7' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>All Platform Bookings</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Manage tourist bookings, approvals, and cancellations</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchBookings}
                    onChange={(e) => setSearchBookings(e.target.value)}
                    className="form-control"
                    style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>
                <select
                  value={filterBookingStatus}
                  onChange={(e) => setFilterBookingStatus(e.target.value)}
                  className="form-control"
                  style={{ width: 'auto', padding: '7px 12px', fontSize: '0.82rem' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

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
                  {allBookings
                    .filter((b) => {
                      if (filterBookingStatus !== 'All' && b.status !== filterBookingStatus) return false;
                      if (!searchBookings.trim()) return true;
                      const q = searchBookings.toLowerCase();
                      return (
                        String(b.id).includes(q) ||
                        (b.user_name || '').toLowerCase().includes(q) ||
                        (b.user_email || '').toLowerCase().includes(q) ||
                        (b.package_title || '').toLowerCase().includes(q) ||
                        (b.destination_name || '').toLowerCase().includes(q)
                      );
                    })
                    .map((b) => (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Active Tourist Destinations</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Add, edit, or remove destinations catalog</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    value={searchDests}
                    onChange={(e) => setSearchDests(e.target.value)}
                    className="form-control"
                    style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>
                <button
                  onClick={() => {
                    setEditingDestId(null);
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
                    setNewDestModal(true);
                  }}
                  className="btn btn-gold btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Destination
                </button>
              </div>
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
                  {allDestinations
                    .filter((d) => {
                      if (!searchDests.trim()) return true;
                      const q = searchDests.toLowerCase();
                      return (
                        (d.name || '').toLowerCase().includes(q) ||
                        (d.state_name || '').toLowerCase().includes(q) ||
                        (d.category || '').toLowerCase().includes(q) ||
                        (d.location || '').toLowerCase().includes(q)
                      );
                    })
                    .map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{d.name}</td>
                      <td style={{ padding: '12px 10px' }}>{d.state_name}</td>
                      <td style={{ padding: '12px 10px' }}><span className="badge badge-heritage">{d.category}</span></td>
                      <td style={{ padding: '12px 10px' }}>₹{Math.round(d.estimated_cost_per_day)}</td>
                      <td style={{ padding: '12px 10px' }}>⭐ {d.rating}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditDestination(d)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#0284c7' }}
                            title="Edit destination details"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteDestination(d.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#b91c1c' }}
                            title="Delete destination"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Tour Packages Inventory</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Curate and manage all-inclusive holiday tour packages</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchPkgs}
                    onChange={(e) => setSearchPkgs(e.target.value)}
                    className="form-control"
                    style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>
                <button
                  onClick={() => {
                    setEditingPkgId(null);
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
                    setNewPkgModal(true);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Tour Package
                </button>
              </div>
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
                  {allPackages
                    .filter((pkg) => {
                      if (!searchPkgs.trim()) return true;
                      const q = searchPkgs.toLowerCase();
                      return (
                        (pkg.title || '').toLowerCase().includes(q) ||
                        (pkg.company_name || '').toLowerCase().includes(q) ||
                        (pkg.destination_name || '').toLowerCase().includes(q) ||
                        (pkg.hotel_type || '').toLowerCase().includes(q)
                      );
                    })
                    .map((pkg) => (
                    <tr key={pkg.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{pkg.title}</td>
                      <td style={{ padding: '12px 10px' }}>{pkg.destination_name}</td>
                      <td style={{ padding: '12px 10px' }}>{pkg.company_name}</td>
                      <td style={{ padding: '12px 10px' }}>{pkg.duration_days}D / {pkg.duration_nights || (pkg.duration_days - 1)}N</td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{Number(pkg.price).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#0284c7' }}
                            title="Edit package details"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#b91c1c' }}
                            title="Delete package"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Hotels & Heritage Resorts Inventory</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Manage verified accommodations, room types, and pricing</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search hotels..."
                    value={searchHotels}
                    onChange={(e) => setSearchHotels(e.target.value)}
                    className="form-control"
                    style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>
                <button
                  onClick={() => {
                    setEditingHotelId(null);
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
                    setNewHotelModal(true);
                  }}
                  className="btn btn-sm"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Hotel
                </button>
              </div>
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
                  {allHotels
                    .filter((h) => {
                      if (!searchHotels.trim()) return true;
                      const q = searchHotels.toLowerCase();
                      return (
                        (h.name || '').toLowerCase().includes(q) ||
                        (h.location || '').toLowerCase().includes(q) ||
                        (h.destination_name || '').toLowerCase().includes(q) ||
                        (h.room_type || '').toLowerCase().includes(q)
                      );
                    })
                    .map((h) => (
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
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditHotel(h)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#0284c7' }}
                            title="Edit hotel details"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteHotel(h.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#b91c1c' }}
                            title="Delete hotel"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Certified Tourist Guides Directory</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Onboard and manage authorized local guides and storytellers</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search guides..."
                    value={searchGuides}
                    onChange={(e) => setSearchGuides(e.target.value)}
                    className="form-control"
                    style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>
                <button
                  onClick={() => {
                    setEditingGuideId(null);
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
                    setNewGuideModal(true);
                  }}
                  className="btn btn-sm"
                  style={{ background: '#059669', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Guide
                </button>
              </div>
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
                  {allGuides
                    .filter((g) => {
                      if (!searchGuides.trim()) return true;
                      const q = searchGuides.toLowerCase();
                      return (
                        (g.name || '').toLowerCase().includes(q) ||
                        (g.specialization || '').toLowerCase().includes(q) ||
                        (g.languages || '').toLowerCase().includes(q) ||
                        (g.destination_name || '').toLowerCase().includes(q)
                      );
                    })
                    .map((g) => (
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
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditGuide(g)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#0284c7' }}
                            title="Edit guide details"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteGuide(g.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#b91c1c' }}
                            title="Delete guide"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Intercity Transport & Transit Options</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Manage trains, luxury coaches, cabs, and flight links</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search transit..."
                    value={searchTrans}
                    onChange={(e) => setSearchTrans(e.target.value)}
                    className="form-control"
                    style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>
                <button
                  onClick={() => {
                    setEditingTransId(null);
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
                    setNewTransportModal(true);
                  }}
                  className="btn btn-sm"
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Transport
                </button>
              </div>
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
                  {allTransport
                    .filter((t) => {
                      if (!searchTrans.trim()) return true;
                      const q = searchTrans.toLowerCase();
                      return (
                        (t.provider || '').toLowerCase().includes(q) ||
                        (t.transport_type || '').toLowerCase().includes(q) ||
                        (t.route || '').toLowerCase().includes(q) ||
                        (t.destination_name || '').toLowerCase().includes(q)
                      );
                    })
                    .map((t) => (
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
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditTransport(t)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#0284c7' }}
                            title="Edit transport route"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteTransport(t.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#b91c1c' }}
                            title="Delete transport option"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>User Accounts & Roles</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Monitor user credentials, roles, and administrative access</span>
              </div>
              <div style={{ position: 'relative', width: '240px' }}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="form-control"
                  style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                />
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              </div>
            </div>

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
                  {allUsers
                    .filter((u) => {
                      if (!searchUsers.trim()) return true;
                      const q = searchUsers.toLowerCase();
                      return (
                        (u.name || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.phone || '').toLowerCase().includes(q) ||
                        (u.role || '').toLowerCase().includes(q)
                      );
                    })
                    .map((u) => (
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
      {/* MODAL 1: ADD / EDIT GUIDE                                   */}
      {/* ============================================================ */}
      {newGuideModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                  {editingGuideId ? 'Edit Tourist Guide' : 'Add Tourist Guide'}
                </h3>
              </div>
              <button onClick={() => { setNewGuideModal(false); setEditingGuideId(null); }} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveGuide}>
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
                <button type="button" onClick={() => { setNewGuideModal(false); setEditingGuideId(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669' }}>
                  {editingGuideId ? 'Save Changes' : 'Register Tourist Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADD / EDIT TOUR PACKAGE                             */}
      {/* ============================================================ */}
      {newPkgModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                  {editingPkgId ? 'Edit Tour Package' : 'Add Tour Package'}
                </h3>
              </div>
              <button onClick={() => { setNewPkgModal(false); setEditingPkgId(null); }} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSavePackage}>
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
                <button type="button" onClick={() => { setNewPkgModal(false); setEditingPkgId(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPkgId ? 'Save Changes' : 'Publish Tour Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ADD / EDIT HOTEL                                    */}
      {/* ============================================================ */}
      {newHotelModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hotel size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                  {editingHotelId ? 'Edit Hotel & Resort' : 'Add Hotel & Resort'}
                </h3>
              </div>
              <button onClick={() => { setNewHotelModal(false); setEditingHotelId(null); }} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveHotel}>
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
                <button type="button" onClick={() => { setNewHotelModal(false); setEditingHotelId(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                  {editingHotelId ? 'Save Changes' : 'Add Hotel Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ADD / EDIT TRANSPORT                                */}
      {/* ============================================================ */}
      {newTransportModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                  {editingTransId ? 'Edit Transport Option' : 'Add Transport Option'}
                </h3>
              </div>
              <button onClick={() => { setNewTransportModal(false); setEditingTransId(null); }} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveTransport}>
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
                <button type="button" onClick={() => { setNewTransportModal(false); setEditingTransId(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                  {editingTransId ? 'Save Changes' : 'Add Transport Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: ADD / EDIT DESTINATION                             */}
      {/* ============================================================ */}
      {newDestModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: 'clamp(20px, 4vw, 32px)', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={18} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                  {editingDestId ? 'Edit Tourist Destination' : 'Add Tourist Destination'}
                </h3>
              </div>
              <button onClick={() => { setNewDestModal(false); setEditingDestId(null); }} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveDestination}>
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
                <button type="button" onClick={() => { setNewDestModal(false); setEditingDestId(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  {editingDestId ? 'Save Changes' : 'Publish Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Dedicated Footer */}
      <footer style={{
        marginTop: '60px',
        padding: '24px 16px',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldCheck size={18} color="#0284c7" />
          <strong style={{ color: '#0f172a' }}>Tourist AI Hub — Administrator Control Center</strong>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem' }}>
          Real-time administrative operations for bookings, destinations, packages, hotels, guides, transport, and user accounts.
        </p>
      </footer>
    </div>
  );
}
