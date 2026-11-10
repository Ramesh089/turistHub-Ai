import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../context/WeatherContext';
import {
  Menu,
  X,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Compass,
  Package,
  Hotel,
  UserCheck,
  Car,
  Home,
  CloudSun,
  Briefcase,
  LayoutDashboard,
  LogOut,
  BarChart3,
  CalendarCheck,
  Users
} from 'lucide-react';
import UserMenu from './UserMenu';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { openWeather } = useWeather();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPortal = location.pathname.startsWith('/admin');
  const queryParams = new URLSearchParams(location.search);
  const currentAdminTab = queryParams.get('tab') || 'overview';

  const handleNavClick = (e, targetPath) => {
    setMobileMenuOpen(false);
    if (targetPath === '/') return;
    if (!isAuthenticated) {
      if (e && e.preventDefault) e.preventDefault();
      navigate('/login', { state: { from: targetPath } });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const target = `/explore?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery('');
      setSearchOpen(false);
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
    <>
      <nav
        style={{
          background: '#081624',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 900,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.25s ease'
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            minHeight: '68px',
            paddingTop: '6px',
            paddingBottom: '6px'
          }}
        >
          {/* ========================================================= */}
          {/* LEFT: BRAND LOGO (Matches Screenshot: [T] Tourist AI Hub) */}
          {/* ========================================================= */}
          {/* Official Brand Logo with Authentic Globe & Plane Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrandLogo to={isAdminPortal ? '/admin' : '/'} light={true} size="default" />
            {isAdminPortal && (
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  letterSpacing: '0.5px',
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ShieldCheck size={14} color="#38bdf8" /> ADMIN
              </span>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT ACTION BUTTONS: [ 🔍 ] [ ● SOS ] [ R ▼ ] [ ☰ ]      */}
          {/* ========================================================= */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 1. Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search destinations"
              aria-label="Search"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: searchOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: searchOpen ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                color: searchOpen ? '#38bdf8' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = searchOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = searchOpen ? '#38bdf8' : '#e2e8f0';
              }}
            >
              <Search size={18} />
            </button>

            {/* 2. SOS Button */}
            <Link
              to="/emergency"
              title="Emergency & Safety Helpline (24x7)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.38)',
                borderRadius: '20px',
                padding: '7px 16px',
                color: '#f87171',
                fontWeight: 800,
                fontSize: '0.82rem',
                textDecoration: 'none',
                letterSpacing: '0.4px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.28)';
                e.currentTarget.style.borderColor = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.38)';
                e.currentTarget.style.color = '#f87171';
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px #ef4444',
                  display: 'inline-block'
                }}
              />
              SOS
            </Link>

            {/* 3. User Avatar Pill [ (R) ▼ ] */}
            {isAuthenticated ? (
              <UserMenu compact={true} dark={true} />
            ) : (
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0284c7';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                  e.currentTarget.style.color = '#38bdf8';
                }}
              >
                Sign In
              </Link>
            )}

            {/* 4. Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Open navigation menu"
              aria-label="Navigation Menu"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: mobileMenuOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: mobileMenuOpen ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = mobileMenuOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = mobileMenuOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)';
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* EXPANDABLE SEARCH OVERLAY (TRIGGERED BY [ 🔍 ])           */}
        {/* ========================================================= */}
        {searchOpen && (
          <div
            style={{
              background: '#07131e',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px 0',
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="container">
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '640px', margin: '0 auto' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={16}
                    color="#38bdf8"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search destinations, packages, hotels, guides..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      borderRadius: '12px',
                      border: '1.5px solid rgba(56, 189, 248, 0.35)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0 20px',
                    fontWeight: '700',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================= */}
      {/* SLIDE-OUT NAVIGATION DRAWER (TRIGGERED BY [ ☰ ])          */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div
            style={{
              width: '360px',
              maxWidth: '88vw',
              height: '100%',
              background: '#07131e',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.5)',
              overflowY: 'auto'
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#081624'
              }}
            >
              <BrandLogo to="/" light={true} size="small" showTagline={false} />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '22px', flex: 1 }}>
              {/* Category: Explore & Planning */}
              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    paddingLeft: '6px'
                  }}
                >
                  Explore & Plan
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <NavLink
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      color: isActive ? '#38bdf8' : '#e2e8f0',
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    <Home size={17} color="#38bdf8" />
                    <span>Home</span>
                  </NavLink>

                  <NavLink
                    to="/explore"
                    onClick={(e) => handleNavClick(e, '/explore')}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      color: isActive ? '#38bdf8' : '#e2e8f0',
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    <Compass size={17} color="#38bdf8" />
                    <span>Explore Destinations</span>
                  </NavLink>

                  <NavLink
                    to="/ai-planner"
                    onClick={(e) => handleNavClick(e, '/ai-planner')}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      color: isActive ? '#34d399' : '#e2e8f0',
                      background: isActive ? 'rgba(52, 211, 153, 0.12)' : 'transparent',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    <Sparkles size={17} color="#34d399" />
                    <span>Mitra AI Trip Planner</span>
                  </NavLink>

                  <NavLink
                    to="/packages"
                    onClick={(e) => handleNavClick(e, '/packages')}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      color: isActive ? '#38bdf8' : '#e2e8f0',
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    <Package size={17} color="#38bdf8" />
                    <span>Holiday Tour Packages</span>
                  </NavLink>
                </div>
              </div>

              {/* Category: Stays & Transit */}
              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    paddingLeft: '6px'
                  }}
                >
                  Bookings & Services
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <NavLink
                    to="/hotels"
                    onClick={(e) => handleNavClick(e, '/hotels')}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      color: isActive ? '#38bdf8' : '#e2e8f0',
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent'
                    })}
                  >
                    <Hotel size={17} color="#38bdf8" />
                    <span>Hotels & Verified Stays</span>
                  </NavLink>

                  <NavLink
                    to="/transport"
                    onClick={(e) => handleNavClick(e, '/transport')}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      color: isActive ? '#38bdf8' : '#e2e8f0',
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent'
                    })}
                  >
                    <Car size={17} color="#38bdf8" />
                    <span>Multi-Transport & Transit</span>
                  </NavLink>

                  <NavLink
                    to="/guides"
                    onClick={(e) => handleNavClick(e, '/guides')}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      color: isActive ? '#38bdf8' : '#e2e8f0',
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent'
                    })}
                  >
                    <UserCheck size={17} color="#38bdf8" />
                    <span>Certified Tourist Guides</span>
                  </NavLink>
                </div>
              </div>

              {/* Category: Utilities & Safety */}
              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    paddingLeft: '6px'
                  }}
                >
                  Utilities & Safety
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openWeather();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <CloudSun size={17} color="#38bdf8" />
                    <span>Live Weather Forecast</span>
                  </button>

                  <NavLink
                    to="/emergency"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '800',
                      textDecoration: 'none',
                      color: '#f87171',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)'
                    }}
                  >
                    <ShieldAlert size={17} color="#ef4444" />
                    <span>24x7 Emergency Services</span>
                  </NavLink>
                </div>
              </div>

              {/* Category: Portals */}
              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    paddingLeft: '6px'
                  }}
                >
                  Portals & Workspaces
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <NavLink
                    to="/partner"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      color: '#34d399',
                      background: 'rgba(52, 211, 153, 0.08)'
                    }}
                  >
                    <Briefcase size={17} color="#34d399" />
                    <span>Business Partner Portal</span>
                  </NavLink>

                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        color: '#a78bfa',
                        background: 'rgba(167, 139, 250, 0.08)'
                      }}
                    >
                      <ShieldCheck size={17} color="#a78bfa" />
                      <span>Admin Control Center</span>
                    </NavLink>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer User Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#081624'
              }}
            >
              {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.85rem'
                      }}
                    >
                      {(user?.name || user?.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ffffff' }}>
                        {user?.name || user?.fullName || 'User'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {user?.email || 'Logged in'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '9px 0',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: '#0284c7',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '9px 0',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
