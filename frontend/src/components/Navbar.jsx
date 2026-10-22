import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Search,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
  Compass,
  Package,
  Hotel,
  UserCheck,
  Car,
  Users
} from 'lucide-react';

import BrandLogo from './BrandLogo';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPortal = location.pathname.startsWith('/admin');
  const queryParams = new URLSearchParams(location.search);
  const currentAdminTab = queryParams.get('tab') || 'overview';

  const handleNavClick = (e, targetPath) => {
    if (targetPath === '/') return;
    if (!isAuthenticated) {
      if (e && e.preventDefault) e.preventDefault();
      setMobileMenuOpen(false);
      navigate('/login', { state: { from: targetPath } });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const target = `/explore?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery('');
      setMobileMenuOpen(false);
      if (!isAuthenticated) {
        navigate('/login', { state: { from: target } });
      } else {
        navigate(target);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav style={{
      background: isAdminPortal ? '#0f172a' : 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: isAdminPortal ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(2, 132, 199, 0.14)',
      position: 'sticky',
      top: 0,
      zIndex: 900,
      boxShadow: isAdminPortal ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 20px rgba(2, 132, 199, 0.05)',
      transition: 'all 0.3s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        minHeight: '76px'
      }}>
        {/* Brand Logo - In admin portal, links to /admin and shows Admin Portal badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BrandLogo to={isAdminPortal ? "/admin" : "/"} light={isAdminPortal} />
          {isAdminPortal && (
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontSize: '0.72rem',
              fontWeight: '800',
              letterSpacing: '0.6px',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <ShieldCheck size={14} color="#38bdf8" /> ADMIN PORTAL
            </span>
          )}
        </div>

        {/* Center Navigation */}
        {isAdminPortal ? (
          /* ========================================================= */
          /* ADMIN PORTAL NAVIGATION - ALL TOURIST PAGES ARE REMOVED   */
          /* ========================================================= */
          <div style={{ display: 'none', alignItems: 'center', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }} className="desktop-nav">
            <button
              type="button"
              onClick={() => navigate('/admin?tab=overview')}
              style={{
                border: 'none',
                background: currentAdminTab === 'overview' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: currentAdminTab === 'overview' ? '#38bdf8' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                padding: '7px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                borderBottom: currentAdminTab === 'overview' ? '2px solid #38bdf8' : '2px solid transparent'
              }}
            >
              <CalendarCheck size={14} color={currentAdminTab === 'overview' ? '#38bdf8' : '#94a3b8'} />
              Bookings
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=destinations')}
              style={{
                border: 'none',
                background: currentAdminTab === 'destinations' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                color: currentAdminTab === 'destinations' ? '#fbbf24' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                padding: '7px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                borderBottom: currentAdminTab === 'destinations' ? '2px solid #fbbf24' : '2px solid transparent'
              }}
            >
              <Compass size={14} color={currentAdminTab === 'destinations' ? '#fbbf24' : '#94a3b8'} />
              Destinations
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=packages')}
              style={{
                border: 'none',
                background: currentAdminTab === 'packages' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: currentAdminTab === 'packages' ? '#38bdf8' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                padding: '7px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                borderBottom: currentAdminTab === 'packages' ? '2px solid #38bdf8' : '2px solid transparent'
              }}
            >
              <Package size={14} color={currentAdminTab === 'packages' ? '#38bdf8' : '#94a3b8'} />
              Packages
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=hotels')}
              style={{
                border: 'none',
                background: currentAdminTab === 'hotels' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                color: currentAdminTab === 'hotels' ? '#34d399' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                padding: '7px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                borderBottom: currentAdminTab === 'hotels' ? '2px solid #34d399' : '2px solid transparent'
              }}
            >
              <Hotel size={14} color={currentAdminTab === 'hotels' ? '#34d399' : '#94a3b8'} />
              Hotels
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=guides')}
              style={{
                border: 'none',
                background: currentAdminTab === 'guides' ? 'rgba(52, 211, 153, 0.18)' : 'transparent',
                color: currentAdminTab === 'guides' ? '#34d399' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                padding: '7px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                borderBottom: currentAdminTab === 'guides' ? '2px solid #34d399' : '2px solid transparent'
              }}
            >
              <UserCheck size={14} color={currentAdminTab === 'guides' ? '#34d399' : '#94a3b8'} />
              Guides
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=transport')}
              style={{
                border: 'none',
                background: currentAdminTab === 'transport' ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
                color: currentAdminTab === 'transport' ? '#c084fc' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                padding: '7px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                borderBottom: currentAdminTab === 'transport' ? '2px solid #c084fc' : '2px solid transparent'
              }}
            >
              <Car size={14} color={currentAdminTab === 'transport' ? '#c084fc' : '#94a3b8'} />
              Transport
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=users')}
              style={{
                border: 'none',
                background: currentAdminTab === 'users' ? 'rgba(148, 163, 184, 0.18)' : 'transparent',
                color: currentAdminTab === 'users' ? '#f1f5f9' : '#94a3b8',
                fontWeight: '700',
                fontSize: '0.82rem',
                padding: '7px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                borderBottom: currentAdminTab === 'users' ? '2px solid #f1f5f9' : '2px solid transparent'
              }}
            >
              <Users size={14} color={currentAdminTab === 'users' ? '#f1f5f9' : '#94a3b8'} />
              Users
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* PUBLIC / TOURIST NAVIGATION (SHOWN ONLY OUTSIDE ADMIN)    */
          /* ========================================================= */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '220px', flexShrink: 0 }} className="desktop-search">
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  fontSize: '0.82rem',
                  borderRadius: '30px',
                  border: '1px solid rgba(2, 132, 199, 0.22)',
                  background: '#ffffff',
                  outline: 'none',
                  color: '#0f172a'
                }}
              />
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#0284c7' }} />
            </form>

            <div style={{ display: 'none', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }} className="desktop-nav">
              <NavLink to="/" style={({ isActive }) => ({
                fontSize: '0.82rem',
                fontWeight: '700',
                color: isActive ? '#0284c7' : '#334155',
                transition: 'all 0.2s ease',
                padding: '7px 13px',
                borderRadius: '999px',
                background: isActive ? '#e0f2fe' : 'transparent',
                whiteSpace: 'nowrap'
              })}>
                Home
              </NavLink>

              <NavLink
                to="/explore"
                onClick={(e) => handleNavClick(e, '/explore')}
                style={({ isActive }) => ({
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: isActive ? '#0284c7' : '#334155',
                  transition: 'all 0.2s ease',
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: isActive ? '#e0f2fe' : 'transparent',
                  whiteSpace: 'nowrap'
                })}
              >
                Explore
              </NavLink>

              <NavLink
                to="/ai-planner"
                onClick={(e) => handleNavClick(e, '/ai-planner')}
                style={({ isActive }) => ({
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: isActive ? '#0284c7' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: isActive ? '#e0f2fe' : 'transparent',
                  whiteSpace: 'nowrap'
                })}
              >
                <Sparkles size={15} color="#10b981" /> AI Planner
              </NavLink>

              <NavLink
                to="/packages"
                onClick={(e) => handleNavClick(e, '/packages')}
                style={({ isActive }) => ({
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: isActive ? '#0284c7' : '#334155',
                  transition: 'all 0.2s ease',
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: isActive ? '#e0f2fe' : 'transparent',
                  whiteSpace: 'nowrap'
                })}
              >
                Packages
              </NavLink>

              <NavLink
                to="/hotels"
                onClick={(e) => handleNavClick(e, '/hotels')}
                style={({ isActive }) => ({
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: isActive ? '#0284c7' : '#334155',
                  transition: 'all 0.2s ease',
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: isActive ? '#e0f2fe' : 'transparent',
                  whiteSpace: 'nowrap'
                })}
              >
                Hotels
              </NavLink>

              <NavLink
                to="/transport"
                onClick={(e) => handleNavClick(e, '/transport')}
                style={({ isActive }) => ({
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: isActive ? '#0284c7' : '#334155',
                  transition: 'all 0.2s ease',
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: isActive ? '#e0f2fe' : 'transparent',
                  whiteSpace: 'nowrap'
                })}
              >
                Transport
              </NavLink>

              <NavLink
                to="/guides"
                onClick={(e) => handleNavClick(e, '/guides')}
                style={({ isActive }) => ({
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: isActive ? '#0284c7' : '#334155',
                  transition: 'all 0.2s ease',
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: isActive ? '#e0f2fe' : 'transparent',
                  whiteSpace: 'nowrap'
                })}
              >
                Guides
              </NavLink>

              <NavLink
                to="/emergency"
                onClick={(e) => handleNavClick(e, '/emergency')}
                style={({ isActive }) => ({
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: isActive ? '#dc2626' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  padding: '7px 13px',
                  borderRadius: '999px',
                  background: isActive ? '#fee2e2' : 'transparent',
                  whiteSpace: 'nowrap'
                })}
              >
                <ShieldAlert size={14} /> Emergency
              </NavLink>
            </div>
          </div>
        )}

        <div style={{ display: 'none', alignItems: 'center', gap: '10px', flexShrink: 0 }} className="desktop-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserMenu />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-green btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: isAdminPortal ? '#1e293b' : '#f0f9ff',
            border: isAdminPortal ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            padding: '8px',
            color: isAdminPortal ? '#38bdf8' : '#0284c7',
            display: 'none'
          }}
          className="mobile-only"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div style={{
          background: isAdminPortal ? '#0f172a' : '#ffffff',
          color: isAdminPortal ? '#ffffff' : '#0f172a',
          borderTop: isAdminPortal ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(2, 132, 199, 0.15)',
          padding: '16px',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
          margin: '0 auto 12px auto',
          width: 'calc(100% - 24px)',
          maxWidth: '420px',
          borderRadius: '16px',
          marginTop: '8px'
        }} className="mobile-only">
          {isAdminPortal ? (
            /* ========================================================= */
            /* ADMIN MOBILE MENU - STRICTLY ADMIN CONTROLS               */
            /* ========================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                padding: '10px 12px',
                background: 'rgba(56, 189, 248, 0.1)',
                borderRadius: '10px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}>
                <ShieldCheck size={20} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#38bdf8' }}>
                    Administrator Center
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Logged in as <strong>{user?.name || 'Admin'}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=overview'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'overview' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: currentAdminTab === 'overview' ? '#38bdf8' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <CalendarCheck size={16} color="#38bdf8" /> Bookings Management
              </button>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=destinations'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'destinations' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: currentAdminTab === 'destinations' ? '#fbbf24' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Compass size={16} color="#fbbf24" /> Destinations Management
              </button>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=packages'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'packages' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: currentAdminTab === 'packages' ? '#38bdf8' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Package size={16} color="#38bdf8" /> Tour Packages Inventory
              </button>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=hotels'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'hotels' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: currentAdminTab === 'hotels' ? '#34d399' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Hotel size={16} color="#34d399" /> Hotels & Stays
              </button>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=guides'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'guides' ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
                  color: currentAdminTab === 'guides' ? '#34d399' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <UserCheck size={16} color="#34d399" /> Tourist Guides
              </button>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=transport'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'transport' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                  color: currentAdminTab === 'transport' ? '#c084fc' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Car size={16} color="#c084fc" /> Transport Routes
              </button>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=users'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'users' ? 'rgba(148, 163, 184, 0.2)' : 'transparent',
                  color: currentAdminTab === 'users' ? '#f1f5f9' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Users size={16} color="#f1f5f9" /> User Accounts
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '8px 0' }} />

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.88rem'
                }}
              >
                <User size={16} color="#38bdf8" /> Admin Profile & Settings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                <LogOut size={16} color="#f87171" /> Sign Out
              </button>
            </div>
          ) : (
            /* ========================================================= */
            /* PUBLIC MOBILE MENU                                        */
            /* ========================================================= */
            <>
              <form onSubmit={handleSearchSubmit} style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control"
                  style={{ padding: '9px 12px', fontSize: '0.85rem' }}
                />
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: '600', padding: '8px 10px', borderRadius: '8px', color: '#1e293b' }}>Home</Link>
                <Link to="/explore" onClick={(e) => handleNavClick(e, '/explore')} style={{ fontWeight: '600', padding: '8px 10px', borderRadius: '8px', color: '#1e293b' }}>Explore</Link>
                <Link to="/ai-planner" onClick={(e) => handleNavClick(e, '/ai-planner')} style={{ fontWeight: '600', color: '#0284c7', padding: '8px 10px', borderRadius: '8px' }}>AI Planner</Link>
                <Link to="/packages" onClick={(e) => handleNavClick(e, '/packages')} style={{ fontWeight: '600', padding: '8px 10px', borderRadius: '8px', color: '#1e293b' }}>Packages</Link>
                <Link to="/hotels" onClick={(e) => handleNavClick(e, '/hotels')} style={{ fontWeight: '600', padding: '8px 10px', borderRadius: '8px', color: '#1e293b' }}>Hotels</Link>
                <Link to="/transport" onClick={(e) => handleNavClick(e, '/transport')} style={{ fontWeight: '600', padding: '8px 10px', borderRadius: '8px', color: '#1e293b' }}>Transport</Link>
                <Link to="/guides" onClick={(e) => handleNavClick(e, '/guides')} style={{ fontWeight: '600', padding: '8px 10px', borderRadius: '8px', color: '#1e293b' }}>Guides</Link>
                <Link to="/emergency" onClick={(e) => handleNavClick(e, '/emergency')} style={{ fontWeight: '600', color: '#dc2626', padding: '8px 10px', borderRadius: '8px' }}>Emergency</Link>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(2, 132, 199, 0.15)', margin: '8px 0' }} />

                {isAuthenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Logged in as <strong>{user?.name || user?.fullName || user?.username || 'User'}</strong></span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: '700' }}>
                        {user?.role || 'User'}
                      </span>
                    </div>
                    {isAdmin ? (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm">
                        Admin Portal
                      </Link>
                    ) : (
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm">
                        My Trips
                      </Link>
                    )}
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm">
                      Profile & Settings
                    </Link>
                    <button onClick={handleLogout} className="btn btn-sm" style={{ color: '#dc2626', background: '#fee2e2' }}>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.82rem' }}>
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-green" style={{ flex: 1, fontSize: '0.82rem' }}>
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 1050px) {
          .desktop-nav { display: flex !important; }
          .desktop-search { display: block !important; }
          .desktop-actions { display: flex !important; }
          .mobile-only { display: none !important; }
        }
        @media (max-width: 1049px) {
          .desktop-nav { display: none !important; }
          .desktop-search { display: none !important; }
          .desktop-actions { display: none !important; }
          .mobile-only { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

