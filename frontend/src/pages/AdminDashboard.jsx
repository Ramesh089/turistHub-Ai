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
  ExternalLink
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
  const [allBookings, setAllBookings] = useState([]);

  // Modals / forms
  const [newDestModal, setNewDestModal] = useState(false);
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

  const [newPkgModal, setNewPkgModal] = useState(false);
  const [newPkgData, setNewPkgData] = useState({
    destination_id: 1,
    title: '',
    company_name: 'Incredible South Journeys',
    duration_days: 3,
    price: 9999,
    description: '',
    image_url: ''
  });

  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, usersRes, destsRes, pkgsRes, bookingsRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/users/all'),
        api.get('/destinations'),
        api.get('/packages'),
        api.get('/bookings/admin/all')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setAllUsers(usersRes.data.users);
      if (destsRes.data.success) setAllDestinations(destsRes.data.destinations);
      if (pkgsRes.data.success) setAllPackages(pkgsRes.data.packages);
      if (bookingsRes.data.success) setAllBookings(bookingsRes.data.bookings);
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

  const handleCreateDestination = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/destinations', newDestData);
      if (res.data.success) {
        setActionMsg('New destination published successfully.');
        setNewDestModal(false);
        loadAllData();
      }
    } catch (err) {
      console.error('Create dest error:', err);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/packages', newPkgData);
      if (res.data.success) {
        setActionMsg('New package created successfully.');
        setNewPkgModal(false);
        loadAllData();
      }
    } catch (err) {
      console.error('Create pkg error:', err);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '90vh', paddingBottom: '90px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '50px 0',
        marginBottom: '36px',
        borderBottom: '4px solid #f59e0b'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img
              src="/logo.png"
              alt="Tourist AI Hub Logo"
              style={{
                height: '84px',
                width: '84px',
                borderRadius: '16px',
                objectFit: 'contain',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '6px',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 6px 22px rgba(0, 0, 0, 0.4)',
                flexShrink: 0
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                <ShieldCheck size={18} /> Administrator Command Center
              </div>
              <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', marginBottom: '6px' }}>
                Tourist AI Hub Management Suite
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Logged in as <strong>{user?.name}</strong>. Monitor platform health, manage bookings, review users, and publish Indian destinations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setNewDestModal(true)} className="btn btn-gold btn-sm">
              <Plus size={16} /> Add Destination
            </button>
            <button onClick={() => setNewPkgModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add Tour Package
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {actionMsg && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '600' }}>
            ✓ {actionMsg}
          </div>
        )}

        {/* 1. Statistics Cards */}
        {loadingStats ? (
          <p style={{ textAlign: 'center', padding: '40px 0' }}>Loading system metrics...</p>
        ) : stats && (
          <div className="grid-4" style={{ marginBottom: '36px' }}>
            <div className="card" style={{ padding: '24px', borderLeft: '4px solid #3b82f6' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Total Tourists</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
                {stats.total_tourists}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Registered Travel Accounts</span>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid #e65100' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Destinations</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#e65100', marginTop: '4px' }}>
                {stats.total_destinations}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>Across 6 Indian States</span>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Total Bookings</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {stats.total_bookings}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Active reservations</span>
            </div>

            <div className="card" style={{ padding: '24px', borderLeft: '4px solid #d97706' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: '700' }}>Gross Bookings Value</span>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
                ₹{Number(stats.total_revenue).toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>Processed transactions</span>
            </div>
          </div>
        )}

        {/* 2. Admin Navigation Tabs */}
        <div className="tabs-nav" style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}>Recent Bookings</button>
          <button onClick={() => setActiveTab('destinations')} className={`tab-btn ${activeTab === 'destinations' ? 'active' : ''}`}>Manage Destinations ({allDestinations.length})</button>
          <button onClick={() => setActiveTab('packages')} className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}>Manage Packages ({allPackages.length})</button>
          <button onClick={() => setActiveTab('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>Manage Users ({allUsers.length})</button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>All Platform Bookings</h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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
          <div className="animate-fade-in card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Active Tourist Destinations</h3>
              <button onClick={() => setNewDestModal(true)} className="btn btn-primary btn-sm">
                <Plus size={16} /> New Destination
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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
          <div className="animate-fade-in card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Tour Packages Inventory</h3>
              <button onClick={() => setNewPkgModal(true)} className="btn btn-primary btn-sm">
                <Plus size={16} /> New Package
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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
                      <td style={{ padding: '12px 10px' }}>{pkg.duration_days}D / {pkg.duration_nights}N</td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--primary)' }}>
                        ₹{Number(pkg.price).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete package?')) {
                              await api.delete(`/packages/${pkg.id}`);
                              setAllPackages(allPackages.filter(p => p.id !== pkg.id));
                            }
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#b91c1c' }}
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

        {/* Tab 4: Users Management */}
        {activeTab === 'users' && (
          <div className="animate-fade-in card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>User Accounts & Roles</h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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

      {/* Modal: Add Destination */}
      {newDestModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Add New Destination</h3>
            <form onSubmit={handleCreateDestination}>
              <div className="form-group">
                <label className="form-label">Destination Name</label>
                <input
                  type="text"
                  value={newDestData.name}
                  onChange={(e) => setNewDestData({ ...newDestData, name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location (District, State)</label>
                <input
                  type="text"
                  value={newDestData.location}
                  onChange={(e) => setNewDestData({ ...newDestData, location: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
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
                  <label className="form-label">State</label>
                  <select
                    value={newDestData.state_id}
                    onChange={(e) => setNewDestData({ ...newDestData, state_id: Number(e.target.value) })}
                    className="form-control"
                  >
                    <option value={1}>Karnataka</option>
                    <option value={2}>Kerala</option>
                    <option value={3}>Rajasthan</option>
                    <option value={4}>Goa</option>
                    <option value={5}>Uttar Pradesh</option>
                    <option value={6}>Himachal Pradesh</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
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
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  value={newDestData.description}
                  onChange={(e) => setNewDestData({ ...newDestData, description: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setNewDestModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Package */}
      {newPkgModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Add New Tour Package</h3>
            <form onSubmit={handleCreatePackage}>
              <div className="form-group">
                <label className="form-label">Package Title</label>
                <input
                  type="text"
                  value={newPkgData.title}
                  onChange={(e) => setNewPkgData({ ...newPkgData, title: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    value={newPkgData.price}
                    onChange={(e) => setNewPkgData({ ...newPkgData, price: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Days)</label>
                  <input
                    type="number"
                    value={newPkgData.duration_days}
                    onChange={(e) => setNewPkgData({ ...newPkgData, duration_days: Number(e.target.value) })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Operator / Company Name</label>
                <input
                  type="text"
                  value={newPkgData.company_name}
                  onChange={(e) => setNewPkgData({ ...newPkgData, company_name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  value={newPkgData.image_url}
                  onChange={(e) => setNewPkgData({ ...newPkgData, image_url: e.target.value })}
                  className="form-control"
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={2}
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
                  Create Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

