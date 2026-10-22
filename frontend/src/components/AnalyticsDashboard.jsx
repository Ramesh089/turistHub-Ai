import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  TrendingUp,
  IndianRupee,
  CalendarCheck,
  Users,
  Compass,
  Package,
  Hotel,
  UserCheck,
  Car,
  Download,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' or 'monthly'
  const [metricView, setMetricView] = useState('revenue'); // 'revenue' or 'bookings'
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/stats/analytics');
      if (res.data?.success) {
        setAnalytics(res.data.analytics);
      } else {
        setError('Failed to load analytics metrics.');
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError(err.response?.data?.message || 'Failed to connect to analytics service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const downloadReport = () => {
    if (!analytics) return;
    const reportData = {
      generated_at: new Date().toISOString(),
      platform: 'Tourist Hub AI',
      kpis: analytics.kpi,
      payment_methods: analytics.payment_methods,
      top_packages: analytics.top_packages,
      status_breakdown: analytics.status_breakdown,
      category_distribution: analytics.categories
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tourist-hub-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !analytics) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '60px 20px',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <RefreshCw size={32} className="spin" style={{ color: '#0284c7', marginBottom: '12px' }} />
        <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 6px' }}>Computing Analytics & Revenue Metrics</h3>
        <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>Aggregating live bookings, transaction settlements, and catalogue volume...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '40px 24px',
        textAlign: 'center',
        border: '1px solid #fee2e2'
      }}>
        <XCircle size={32} style={{ color: '#ef4444', marginBottom: '10px' }} />
        <h3 style={{ color: '#991b1b', margin: '0 0 6px' }}>Unable to load Analytics</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>{error}</p>
        <button onClick={fetchAnalytics} className="btn btn-primary btn-sm">
          Try Again
        </button>
      </div>
    );
  }

  const { kpi, daily_timeline, monthly_timeline, payment_methods, status_breakdown, top_packages, categories, inventory } = analytics;

  // Chart timeline data based on selected timeframe
  const timelineData = timeframe === 'monthly' ? monthly_timeline : daily_timeline;

  // Status colors
  const STATUS_COLORS = {
    Confirmed: '#10b981',
    Pending: '#f59e0b',
    Cancelled: '#ef4444'
  };

  // Payment colors
  const PAYMENT_COLORS = ['#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Analytics Control Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '16px 20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
          }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Data Analytics & Performance Intelligence
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
              Real-time insights across reservation volume, revenue trends, payment gateways, and inventory traction.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Timeframe selector */}
          <div style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setTimeframe('daily')}
              style={{
                border: 'none',
                background: timeframe === 'daily' ? '#ffffff' : 'transparent',
                color: timeframe === 'daily' ? '#0284c7' : '#64748b',
                boxShadow: timeframe === 'daily' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Daily (30D)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              style={{
                border: 'none',
                background: timeframe === 'monthly' ? '#ffffff' : 'transparent',
                color: timeframe === 'monthly' ? '#0284c7' : '#64748b',
                boxShadow: timeframe === 'monthly' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Monthly (YTD)
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              fontSize: '0.82rem',
              fontWeight: '600',
              borderRadius: '8px'
            }}
            title="Refresh metrics"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={downloadReport}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
            }}
            title="Download JSON analytics report"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 1. Primary KPI Metric Cards (6 cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
        gap: '14px'
      }}>
        {/* Gross Revenue */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Gross Volume
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
              ₹{Number(kpi.total_revenue || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#16a34a', fontWeight: '600', marginTop: '5px' }}>
              <ArrowUpRight size={13} />
              <span>₹{Number(kpi.confirmed_revenue || 0).toLocaleString('en-IN')} Settled</span>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Total Reservations
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
              {kpi.total_bookings}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '500', marginTop: '5px' }}>
              {kpi.confirmed_count} Confirmed • {kpi.pending_count} Pending
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Avg. Order Value
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
              ₹{Number(kpi.avg_order_value || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: '600', marginTop: '5px' }}>
              Per Journey Booking
            </div>
          </div>
        </div>

        {/* Booking Confirmation Rate */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Confirmation Rate
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
              {kpi.conversion_rate}%
            </div>
            <div style={{ fontSize: '0.74rem', color: '#0d9488', fontWeight: '600', marginTop: '5px' }}>
              Successful Bookings Ratio
            </div>
          </div>
        </div>

        {/* Total Guests Hosted */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Travelers Hosted
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
              {kpi.total_guests_hosted || kpi.total_passengers}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '500', marginTop: '5px' }}>
              Total Passenger Headcount
            </div>
          </div>
        </div>

        {/* Registered Tourists */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Tourist Community
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
              {kpi.total_tourists}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '600', marginTop: '5px' }}>
              Registered Explorer Accounts
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Row: Revenue & Booking Growth Chart + Status Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
        gap: '20px'
      }}>
        {/* Timeline Chart Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          gridColumn: 'span 2'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Revenue & Booking Trajectory
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {timeframe === 'monthly' ? 'Monthly trend aggregation for the current fiscal cycle' : 'Daily transaction trend across active booking dates'}
              </span>
            </div>

            {/* Metric view toggle */}
            <div style={{ display: 'inline-flex', background: '#f8fafc', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setMetricView('revenue')}
                style={{
                  border: 'none',
                  background: metricView === 'revenue' ? '#0284c7' : 'transparent',
                  color: metricView === 'revenue' ? '#ffffff' : '#64748b',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                onClick={() => setMetricView('bookings')}
                style={{
                  border: 'none',
                  background: metricView === 'bookings' ? '#0284c7' : 'transparent',
                  color: metricView === 'bookings' ? '#ffffff' : '#64748b',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Booking Volume
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: '310px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {metricView === 'revenue' ? (
                <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Gross Revenue']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [val, 'Confirmed & Active Bookings']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
              Booking Status Split
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Fulfillment breakdown across all historical orders
            </span>

            <div style={{ width: '100%', height: '190px', marginTop: '12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} orders (₹${Number(item.payload.revenue).toLocaleString('en-IN')})`,
                      item.payload.status
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {statusBreakdown.map((s) => {
              const color = STATUS_COLORS[s.status] || '#94a3b8';
              return (
                <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1e293b' }}>{s.status}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a' }}>{s.count}</span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '6px' }}>({s.percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Row: Top Packages + Payment Methods */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
        gap: '20px'
      }}>
        {/* Top Performing Packages */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                Top Performing Experiences
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ranked by revenue contribution & customer reservations</span>
            </div>
            <Package size={20} color="#0284c7" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topPackages.map((pkg, idx) => {
              const maxRev = topPackages[0]?.revenue || 1;
              const barWidth = Math.max(12, Math.round((pkg.revenue / maxRev) * 100));
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '65%' }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: idx === 0 ? '#fef3c7' : '#f1f5f9',
                        color: idx === 0 ? '#d97706' : '#64748b',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {idx + 1}
                      </span>
                      <strong style={{ color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pkg.name}>
                        {pkg.name}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#0284c7' }}>₹{Number(pkg.revenue).toLocaleString('en-IN')}</strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '6px' }}>({pkg.bookings} bkgs)</span>
                    </div>
                  </div>
                  {/* Visual Bar */}
                  <div style={{ width: '100%', height: '7px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: idx === 0 ? 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)' : '#94a3b8',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Channels & Gateways */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                Payment Channel Distribution
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Settlement channels chosen by tourists at checkout</span>
            </div>
            <CreditCard size={20} color="#059669" />
          </div>

          <div style={{ width: '100%', height: '170px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={payment_methods}
                  dataKey="revenue"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={4}
                >
                  {payment_methods.map((entry, index) => (
                    <Cell key={`pay-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, item) => [
                    `₹${Number(val).toLocaleString('en-IN')} (${item.payload.count} transactions)`,
                    item.payload.method
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {payment_methods.map((p, idx) => (
              <div key={p.method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }} />
                  <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1e293b' }}>
                    {p.method === 'UPI' ? 'UPI (GPay / PhonePe / Paytm / BHIM)' : p.method}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                    ₹{Number(p.revenue).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '6px' }}>
                    ({p.share_percent}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Row: Destination Categories & Capacity Intelligence */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '20px'
      }}>
        {/* Destination Categories */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                Destination Categories Catalog
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Curated places & estimated average daily travel cost</span>
            </div>
            <Compass size={20} color="#ea580c" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map((c) => (
              <div key={c.category} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #f1f5f9'
              }}>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '700', color: '#0f172a' }}>{c.category}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Avg. ₹{Number(c.avg_daily_cost).toLocaleString('en-IN')}/day</div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: '#ffedd5',
                  color: '#ea580c',
                  fontSize: '0.76rem',
                  fontWeight: '800'
                }}>
                  {c.count} Places
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Inventory Capacity */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                Operational Resource Capacity
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Certified suppliers, hotels, and intercity transit</span>
            </div>
            <ShieldCheck size={20} color="#16a34a" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Hotels Capacity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hotel size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.86rem', color: '#166534' }}>Hotels & Verified Stays</strong>
                  <span style={{ fontWeight: '800', color: '#166534', fontSize: '0.88rem' }}>{inventory?.hotels?.total || 0} listings</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#15803d', marginTop: '2px' }}>
                  Avg. ₹{Number(inventory?.hotels?.avg_price || 0).toLocaleString('en-IN')}/night • ★ {inventory?.hotels?.avg_rating || '4.2'} Rating
                </div>
              </div>
            </div>

            {/* Guides Capacity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f0fdfa', borderRadius: '10px', border: '1px solid #ccfbf1' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.86rem', color: '#115e59' }}>Certified Tourist Guides</strong>
                  <span style={{ fontWeight: '800', color: '#115e59', fontSize: '0.88rem' }}>{inventory?.guides?.total || 0} experts</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0f766e', marginTop: '2px' }}>
                  Avg. ₹{Number(inventory?.guides?.avg_rate || 0).toLocaleString('en-IN')}/day • {inventory?.guides?.avg_experience || 5} yrs experience
                </div>
              </div>
            </div>

            {/* Transport Capacity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#faf5ff', borderRadius: '10px', border: '1px solid #f3e8ff' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.86rem', color: '#6b21a8' }}>Transit Connections</strong>
                  <span style={{ fontWeight: '800', color: '#6b21a8', fontSize: '0.88rem' }}>
                    {inventory?.transport?.reduce((acc, t) => acc + t.count, 0) || 0} routes
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#7e22ce', marginTop: '2px' }}>
                  Buses, Trains & Cabs across tourist hubs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
