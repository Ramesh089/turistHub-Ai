import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Copy,
  Check,
  X,
  FileText,
  Users,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';

const STATUS_BADGES = {
  Confirmed: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: CheckCircle2 },
  Pending: { bg: '#fef3c7', text: '#92400e', border: '#fde68a', icon: Clock },
  Completed: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', icon: ShieldCheck },
  Cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icon: XCircle }
};

const PAYMENT_BADGES = {
  Paid: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  Pending: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  Refunded: { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  Failed: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }
};

const CATEGORY_ICONS = {
  Hotel: '🏨',
  'Bus Operator': '🚌',
  'Tour & Travel': '✈️',
  Restaurant: '🍽️',
  Adventure: '🧗',
  Guide: '🧭',
  Other: '🏢'
};

export default function PartnerBookings({ application }) {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0,
    guests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateType, setDateType] = useState('travel'); // 'travel' or 'booking'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // UI state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusActionMsg, setStatusActionMsg] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter);
      if (paymentFilter && paymentFilter !== 'All') params.set('payment_status', paymentFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (dateType) params.set('date_type', dateType);
      if (search.trim()) params.set('search', search.trim());
      if (sortBy) params.set('sort', sortBy);

      const res = await api.get(`/bookings/partner?${params.toString()}`);
      if (res.data.success) {
        setBookings(res.data.bookings || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        setError(res.data.message || 'Could not load bookings.');
      }
    } catch (err) {
      console.error('Error fetching partner bookings:', err);
      setError(
        err.response?.data?.message ||
        'Failed to connect to bookings service. Please ensure your partner account is active and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, dateFrom, dateTo, dateType, search, sortBy]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    setStatusActionMsg(null);
    try {
      const res = await api.patch(`/bookings/partner/${bookingId}/status`, { status: newStatus });
      if (res.data.success) {
        setStatusActionMsg({ type: 'success', text: `Booking #${bookingId} marked as ${newStatus}.` });
        // Immediate local state update
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, bookingStatus: newStatus } : b));
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(prev => ({ ...prev, bookingStatus: newStatus }));
        }
        // Refresh aggregate stats in background
        loadBookings();
        setTimeout(() => setStatusActionMsg(null), 3500);
      }
    } catch (err) {
      setStatusActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update booking status.'
      });
      setTimeout(() => setStatusActionMsg(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setPaymentFilter('All');
    setDateFrom('');
    setDateTo('');
    setDateType('travel');
    setSortBy('newest');
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {statusActionMsg && (
        <div style={{
          background: statusActionMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: statusActionMsg.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${statusActionMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          padding: '12px 16px', borderRadius: '10px',
          fontWeight: '600', fontSize: '0.85rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{statusActionMsg.text}</span>
          <button onClick={() => setStatusActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        <div style={{
          background: 'white', borderRadius: '14px', padding: '16px 18px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Bookings
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={16} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>{stats.total}</div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            {stats.guests} total tourist guests
          </div>
        </div>

        <div style={{
          background: 'white', borderRadius: '14px', padding: '16px 18px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Confirmed
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#166534" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#166534' }}>{stats.confirmed}</div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            {stats.pending} pending confirmation
          </div>
        </div>

        <div style={{
          background: 'white', borderRadius: '14px', padding: '16px 18px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed Trips
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="#0369a1" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0369a1' }}>{stats.completed}</div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            {stats.cancelled} cancelled
          </div>
        </div>

        <div style={{
          background: 'white', borderRadius: '14px', padding: '16px 18px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Earned Revenue
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={16} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669' }}>
            {formatCurrency(stats.revenue)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            From confirmed & completed services
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px',
        padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search reference, service, tourist name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', paddingRight: search ? '32px' : '12px', fontSize: '0.84rem' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '10px', flexWrap: 'wrap' }}>
            {['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  border: 'none', cursor: 'pointer', borderRadius: '7px',
                  padding: '6px 12px', fontSize: '0.78rem', fontWeight: '700',
                  background: statusFilter === status ? 'white' : 'transparent',
                  color: statusFilter === status ? '#0284c7' : '#64748b',
                  boxShadow: statusFilter === status ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={loadBookings}
              title="Refresh bookings"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                padding: '7px 12px', fontSize: '0.8rem', fontWeight: '600', color: '#475569',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              Refresh
            </button>
            {(search || statusFilter !== 'All' || paymentFilter !== 'All' || dateFrom || dateTo) && (
              <button
                onClick={handleResetFilters}
                style={{
                  border: 'none', background: '#fee2e2', color: '#dc2626',
                  borderRadius: '8px', padding: '7px 12px', fontSize: '0.78rem',
                  fontWeight: '700', cursor: 'pointer'
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Date & Detailed Filters Accordion */}
        <div style={{
          marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9',
          display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center'
        }}>
          {/* Date Type Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Filter by:</span>
            <div style={{ display: 'flex', gap: '3px', background: '#f8fafc', padding: '2px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setDateType('travel')}
                style={{
                  border: 'none', cursor: 'pointer', borderRadius: '5px',
                  padding: '4px 8px', fontSize: '0.73rem', fontWeight: '600',
                  background: dateType === 'travel' ? '#0284c7' : 'transparent',
                  color: dateType === 'travel' ? 'white' : '#64748b'
                }}
              >
                Travel Date
              </button>
              <button
                onClick={() => setDateType('booking')}
                style={{
                  border: 'none', cursor: 'pointer', borderRadius: '5px',
                  padding: '4px 8px', fontSize: '0.73rem', fontWeight: '600',
                  background: dateType === 'booking' ? '#0284c7' : 'transparent',
                  color: dateType === 'booking' ? 'white' : '#64748b'
                }}
              >
                Booking Date
              </button>
            </div>
          </div>

          {/* Date From */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.78rem', padding: '5px 8px', width: 'auto' }}
            />
          </div>

          {/* Date To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.78rem', padding: '5px 8px', width: 'auto' }}
            />
          </div>

          {/* Payment Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.78rem', padding: '5px 8px', width: 'auto' }}
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <ArrowUpDown size={13} color="#94a3b8" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.78rem', padding: '5px 8px', width: 'auto' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="travel_date_asc">Travel Date (Upcoming)</option>
              <option value="travel_date_desc">Travel Date (Latest)</option>
              <option value="amount_high">Amount (High to Low)</option>
              <option value="amount_low">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Content Area */}
      {loading ? (
        <div style={{
          background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0',
          padding: '60px 20px', textAlign: 'center', color: '#94a3b8'
        }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', color: '#0284c7' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>Loading Partner Bookings...</div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Verifying verified partner services and retrieving guest records...
          </div>
        </div>
      ) : error ? (
        <div style={{
          background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '14px',
          padding: '30px 20px', textAlign: 'center', color: '#991b1b'
        }}>
          <AlertCircle size={32} style={{ marginBottom: '10px' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>Could not load bookings</div>
          <p style={{ margin: '0 auto 16px', maxWidth: '480px', fontSize: '0.85rem' }}>{error}</p>
          <button
            onClick={loadBookings}
            style={{
              background: '#dc2626', color: 'white', border: 'none',
              borderRadius: '8px', padding: '8px 18px', fontWeight: '700',
              fontSize: '0.84rem', cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0',
          padding: '60px 20px', textAlign: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: '#f0f9ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
          }}>
            <CalendarCheck size={28} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>No Bookings Found</div>
          <p style={{ margin: '6px auto 16px', maxWidth: '420px', fontSize: '0.82rem', color: '#64748b' }}>
            {search || statusFilter !== 'All' || dateFrom || dateTo
              ? 'No guest bookings match your current search and filter criteria. Try adjusting your filters.'
              : 'You have not received any tourist bookings for your published services yet. As tourists discover your services, new bookings will appear here in real-time.'}
          </p>
          {(search || statusFilter !== 'All' || dateFrom || dateTo) ? (
            <button
              onClick={handleResetFilters}
              style={{
                background: '#0284c7', color: 'white', border: 'none',
                borderRadius: '8px', padding: '8px 16px', fontWeight: '700',
                fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              Clear All Filters
            </button>
          ) : (
            <button
              onClick={loadBookings}
              style={{
                background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                borderRadius: '8px', padding: '8px 16px', fontWeight: '600',
                fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              Refresh Status
            </button>
          )}
        </div>
      ) : (
        /* Bookings List Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bookings.map(b => {
            const statusStyle = STATUS_BADGES[b.bookingStatus] || STATUS_BADGES.Pending;
            const StatusIcon = statusStyle.icon;
            const paymentStyle = PAYMENT_BADGES[b.paymentStatus] || PAYMENT_BADGES.Pending;
            const catIcon = CATEGORY_ICONS[b.category] || '🏢';

            return (
              <div
                key={b.id}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Main Card Header */}
                <div style={{
                  padding: '14px 18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f8fafc',
                  background: '#fafbfc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{catIcon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>
                          {b.serviceName}
                        </span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: '700', color: '#0284c7',
                          background: '#f0f9ff', border: '1px solid #bae6fd',
                          borderRadius: '6px', padding: '2px 7px'
                        }}>
                          {b.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={11} color="#94a3b8" />
                        {b.location}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Booking Reference Pill */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: '#f1f5f9', borderRadius: '7px', padding: '4px 8px',
                      fontSize: '0.74rem', color: '#475569', fontWeight: '700'
                    }}>
                      <span>Ref: {b.bookingReference}</span>
                      <button
                        onClick={() => handleCopy(b.bookingReference, b.id)}
                        title="Copy booking reference"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}
                      >
                        {copiedId === b.id ? <Check size={12} color="#166534" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Payment status badge */}
                    <span style={{
                      fontSize: '0.74rem', fontWeight: '700',
                      background: paymentStyle.bg, color: paymentStyle.text,
                      border: `1px solid ${paymentStyle.border}`,
                      borderRadius: '999px', padding: '3px 10px',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      <CreditCard size={11} />
                      {b.paymentStatus}
                    </span>

                    {/* Booking status badge */}
                    <span style={{
                      fontSize: '0.74rem', fontWeight: '700',
                      background: statusStyle.bg, color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                      borderRadius: '999px', padding: '3px 10px',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      <StatusIcon size={12} />
                      {b.bookingStatus}
                    </span>
                  </div>
                </div>

                {/* Card Body Information Grid */}
                <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  {/* Travel Date */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={12} color="#0284c7" /> Travel Date
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>
                      {formatDate(b.travelDate)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      Booked {formatDate(b.bookingDate)}
                    </div>
                  </div>

                  {/* Guests */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={12} color="#059669" /> Guest Count
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>
                      {b.guestCount} {b.guestCount === 1 ? 'Guest' : 'Guests'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {b.unitPrice ? `${formatCurrency(b.unitPrice)} / ${b.priceUnit || 'unit'}` : 'Standard service rate'}
                    </div>
                  </div>

                  {/* Amount Paid */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <IndianRupee size={12} color="#d97706" /> Total Amount
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#059669' }}>
                      {formatCurrency(b.amount)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      via {b.paymentMethod || 'UPI'}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={12} color="#2563eb" /> Tourist Contact
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.tourist?.name || 'Guest Traveler'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                      {b.tourist?.phone && <span>📞 {b.tourist.phone}</span>}
                      {b.tourist?.email && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>✉️ {b.tourist.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Special Requests (if any) */}
                {b.specialRequests && (
                  <div style={{
                    margin: '0 18px 12px',
                    background: '#fefce8',
                    border: '1px solid #fef08a',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    color: '#854d0e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <FileText size={13} color="#ca8a04" />
                    <strong>Special Requests:</strong> {b.specialRequests}
                  </div>
                )}

                {/* Card Actions Bar */}
                <div style={{
                  padding: '10px 18px',
                  background: '#fafbfc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Booking #{b.id} · Recorded {formatDateTime(b.bookingDate)}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Status updater quick buttons */}
                    {b.bookingStatus === 'Pending' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'Confirmed')}
                        disabled={updatingId === b.id}
                        style={{
                          background: '#059669', color: 'white', border: 'none',
                          borderRadius: '7px', padding: '6px 12px', fontSize: '0.76rem',
                          fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        {updatingId === b.id ? <RefreshCw size={12} className="spin" /> : <CheckCircle2 size={12} />}
                        Confirm Booking
                      </button>
                    )}

                    {b.bookingStatus === 'Confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'Completed')}
                        disabled={updatingId === b.id}
                        style={{
                          background: '#0284c7', color: 'white', border: 'none',
                          borderRadius: '7px', padding: '6px 12px', fontSize: '0.76rem',
                          fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        {updatingId === b.id ? <RefreshCw size={12} className="spin" /> : <ShieldCheck size={12} />}
                        Mark as Completed
                      </button>
                    )}

                    {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to cancel booking #${b.id}?`)) {
                            handleUpdateStatus(b.id, 'Cancelled');
                          }
                        }}
                        disabled={updatingId === b.id}
                        style={{
                          background: 'white', color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: '7px', padding: '6px 10px', fontSize: '0.76rem',
                          fontWeight: '600', cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedBooking(b)}
                      style={{
                        background: 'white', color: '#475569', border: '1px solid #e2e8f0',
                        borderRadius: '7px', padding: '6px 12px', fontSize: '0.76rem',
                        fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <FileText size={12} />
                      View Voucher
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Voucher Detail Modal */}
      {selectedBooking && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '18px', maxWidth: '580px', width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
                  Official Partner Booking Voucher
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '2px' }}>
                  {selectedBooking.serviceName}
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Reference & Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                    Booking Reference
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selectedBooking.bookingReference}
                    <button
                      onClick={() => handleCopy(selectedBooking.bookingReference, 'modal')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7' }}
                    >
                      {copiedId === 'modal' ? <Check size={14} color="#166534" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: '700',
                    background: (STATUS_BADGES[selectedBooking.bookingStatus] || STATUS_BADGES.Pending).bg,
                    color: (STATUS_BADGES[selectedBooking.bookingStatus] || STATUS_BADGES.Pending).text,
                    padding: '4px 12px', borderRadius: '999px'
                  }}>
                    {selectedBooking.bookingStatus}
                  </span>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: '700',
                    background: (PAYMENT_BADGES[selectedBooking.paymentStatus] || PAYMENT_BADGES.Pending).bg,
                    color: (PAYMENT_BADGES[selectedBooking.paymentStatus] || PAYMENT_BADGES.Pending).text,
                    padding: '4px 12px', borderRadius: '999px'
                  }}>
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Service & Location */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Service Details
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a' }}>
                  {CATEGORY_ICONS[selectedBooking.category] || '🏢'} {selectedBooking.serviceName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                  Category: {selectedBooking.category} · Destination: {selectedBooking.location}
                </div>
              </div>

              {/* Schedule and Guests */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Travel Date</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>
                    {formatDate(selectedBooking.travelDate)}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Guest Count</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>
                    {selectedBooking.guestCount} {selectedBooking.guestCount === 1 ? 'Guest' : 'Guests'}
                  </div>
                </div>
              </div>

              {/* Tourist Customer Details */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tourist Guest Details
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                  {selectedBooking.tourist?.name || 'Guest Traveler'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                  {selectedBooking.tourist?.email && (
                    <a href={`mailto:${selectedBooking.tourist.email}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                      ✉️ {selectedBooking.tourist.email}
                    </a>
                  )}
                  {selectedBooking.tourist?.phone && (
                    <a href={`tel:${selectedBooking.tourist.phone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                      📞 {selectedBooking.tourist.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Payment & Settlement Breakdown
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '4px' }}>
                  <span>Service Base Price</span>
                  <span>{formatCurrency(selectedBooking.amount + (selectedBooking.discountAmount || 0))}</span>
                </div>
                {selectedBooking.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#166534', marginBottom: '4px' }}>
                    <span>Tourist Promo Discount</span>
                    <span>- {formatCurrency(selectedBooking.discountAmount)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: '1rem',
                  fontWeight: '800', color: '#0f172a', paddingTop: '8px', borderTop: '1px solid #e2e8f0', marginTop: '6px'
                }}>
                  <span>Total Amount Paid</span>
                  <span style={{ color: '#059669' }}>{formatCurrency(selectedBooking.amount)}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                  Method: {selectedBooking.paymentMethod || 'UPI'} · Payment Status: {selectedBooking.paymentStatus}
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#854d0e', textTransform: 'uppercase' }}>Special Requests</div>
                  <div style={{ fontSize: '0.84rem', color: '#713f12', marginTop: '4px' }}>
                    {selectedBooking.specialRequests}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 22px', background: '#fafbfc', borderTop: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                TouristHub AI Platform Verified
              </span>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: '#0284c7', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '8px 18px', fontWeight: '700',
                  fontSize: '0.84rem', cursor: 'pointer'
                }}
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
