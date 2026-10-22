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
  Users,
  BarChart3
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
      background: 'rgba(255, 255, 255, 0.97)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(2, 132, 199, 0.12)',
      position: 'sticky',
      top: 0,
      zIndex: 900,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      transition: 'all 0.25s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        minHeight: '74px'
      }}>
        {/* Brand Logo - In admin portal, links to /admin and shows Admin Portal badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BrandLogo to={isAdminPortal ? "/admin" : "/"} light={false} />
          {isAdminPortal && (
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: '0.72rem',
              fontWeight: '800',
              letterSpacing: '0.5px',
              padding: '4px 9px',
              borderRadius: '6px',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <ShieldCheck size={14} color="#0284c7" /> ADMIN
            </span>
          )}
        </div>

        {/* Center Navigation */}
        {isAdminPortal ? (
          /* ========================================================= */
          /* ADMIN PORTAL NAVIGATION - CLEAN, NEVER-WRAPPING PILL BAR  */
          /* ========================================================= */
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '2px',
            background: '#f1f5f9',
            padding: '3px 6px',
            borderRadius: '999px',
            border: '1px solid #e2e8f0',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }} className="desktop-nav">
            <button
              type="button"
              onClick={() => navigate('/admin?tab=analytics')}
              style={{
                border: 'none',
                background: currentAdminTab === 'analytics' ? '#ffffff' : 'transparent',
                color: currentAdminTab === 'analytics' ? '#0284c7' : '#64748b',
                boxShadow: currentAdminTab === 'analytics' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontWeight: currentAdminTab === 'analytics' ? '700' : '600',
                fontSize: '0.8rem',
                padding: '6px 11px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 size={14} color={currentAdminTab === 'analytics' ? '#0284c7' : '#94a3b8'} />
              Analytics
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=overview')}
              style={{
                border: 'none',
                background: currentAdminTab === 'overview' ? '#ffffff' : 'transparent',
                color: currentAdminTab === 'overview' ? '#0284c7' : '#64748b',
                boxShadow: currentAdminTab === 'overview' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontWeight: currentAdminTab === 'overview' ? '700' : '600',
                fontSize: '0.8rem',
                padding: '6px 11px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <CalendarCheck size={14} color={currentAdminTab === 'overview' ? '#0284c7' : '#94a3b8'} />
              Bookings
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=destinations')}
              style={{
                border: 'none',
                background: currentAdminTab === 'destinations' ? '#ffffff' : 'transparent',
                color: currentAdminTab === 'destinations' ? '#d97706' : '#64748b',
                boxShadow: currentAdminTab === 'destinations' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontWeight: currentAdminTab === 'destinations' ? '700' : '600',
                fontSize: '0.8rem',
                padding: '6px 11px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Compass size={14} color={currentAdminTab === 'destinations' ? '#d97706' : '#94a3b8'} />
              Destinations
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=packages')}
              style={{
                border: 'none',
                background: currentAdminTab === 'packages' ? '#ffffff' : 'transparent',
                color: currentAdminTab === 'packages' ? '#0284c7' : '#64748b',
                boxShadow: currentAdminTab === 'packages' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontWeight: currentAdminTab === 'packages' ? '700' : '600',
                fontSize: '0.8rem',
                padding: '6px 11px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Package size={14} color={currentAdminTab === 'packages' ? '#0284c7' : '#94a3b8'} />
              Packages
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=hotels')}
              style={{
                border: 'none',
                background: currentAdminTab === 'hotels' ? '#ffffff' : 'transparent',
                color: currentAdminTab === 'hotels' ? '#059669' : '#64748b',
                boxShadow: currentAdminTab === 'hotels' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontWeight: currentAdminTab === 'hotels' ? '700' : '600',
                fontSize: '0.8rem',
                padding: '6px 11px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Hotel size={14} color={currentAdminTab === 'hotels' ? '#059669' : '#94a3b8'} />
              Hotels
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=guides')}
              style={{
                border: 'none',
                background: currentAdminTab === 'guides' ? '#ffffff' : 'transparent',
                color: currentAdminTab === 'guides' ? '#10b981' : '#64748b',
                boxShadow: currentAdminTab === 'guides' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontWeight: currentAdminTab === 'guides' ? '700' : '600',
                fontSize: '0.8rem',
                padding: '6px 11px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={14} color={currentAdminTab === 'guides' ? '#10b981' : '#94a3b8'} />
              Guides
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=transport')}
              style={{
                border: 'none',
                background: currentAdminTab === 'transport' ? '#ffffff' : 'transparent',
                color: currentAdminTab === 'transport' ? '#7c3aed' : '#64748b',
                boxShadow: currentAdminTab === 'transport' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontWeight: currentAdminTab === 'transport' ? '700' : '600',
                fontSize: '0.8rem',
                padding: '6px 11px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Car size={14} color={currentAdminTab === 'transport' ? '#7c3aed' : '#94a3b8'} />
              Transport
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin?tab=users')}
              style={{
                border: 'none',
                background: currentAdminTab === 'users' ? '#ffffff' : 'transparent',
                color: currentAdminTab === 'users' ? '#0f172a' : '#64748b',
                boxShadow: currentAdminTab === 'users' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontWeight: currentAdminTab === 'users' ? '700' : '600',
                fontSize: '0.8rem',
                padding: '6px 11px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Users size={14} color={currentAdminTab === 'users' ? '#0f172a' : '#94a3b8'} />
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
            background: '#f0f9ff',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            padding: '8px',
            color: '#0284c7',
            display: 'none'
          }}
          className="mobile-only"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          color: '#0f172a',
          borderTop: '1px solid rgba(2, 132, 199, 0.15)',
          padding: '16px',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
          margin: '0 auto 12px auto',
          width: 'calc(100% - 24px)',
          maxWidth: '420px',
          borderRadius: '16px',
          marginTop: '8px'
        }} className="mobile-only">
          {isAdminPortal ? (
            /* ========================================================= */
            /* ADMIN MOBILE MENU - CLEAN LIGHT DESIGN                    */
            /* ========================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                padding: '10px 12px',
                background: '#f0f9ff',
                borderRadius: '10px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(2, 132, 199, 0.2)'
              }}>
                <ShieldCheck size={20} color="#0284c7" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0369a1' }}>
                    Administrator Workspace
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Logged in as <strong>{user?.name || 'Admin'}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=analytics'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'analytics' ? '#e0f2fe' : 'transparent',
                  color: currentAdminTab === 'analytics' ? '#0369a1' : '#334155',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <BarChart3 size={16} color="#0284c7" /> Data Analytics
              </button>

              <button
                type="button"
                onClick={() => { navigate('/admin?tab=overview'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: currentAdminTab === 'overview' ? '#e0f2fe' : 'transparent',
                  color: currentAdminTab === 'overview' ? '#0369a1' : '#334155',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <CalendarCheck size={16} color="#0284c7" /> Bookings Management
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
                  background: currentAdminTab === 'destinations' ? '#fef3c7' : 'transparent',
                  color: currentAdminTab === 'destinations' ? '#92400e' : '#334155',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Compass size={16} color="#d97706" /> Destinations Catalogue
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
                  background: currentAdminTab === 'packages' ? '#e0f2fe' : 'transparent',
                  color: currentAdminTab === 'packages' ? '#0369a1' : '#334155',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Package size={16} color="#0284c7" /> Tour Packages Inventory
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
                  background: currentAdminTab === 'hotels' ? '#dcfce7' : 'transparent',
                  color: currentAdminTab === 'hotels' ? '#166534' : '#334155',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Hotel size={16} color="#059669" /> Hotels & Stays
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
                  background: currentAdminTab === 'guides' ? '#ecfdf5' : 'transparent',
                  color: currentAdminTab === 'guides' ? '#065f46' : '#334155',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <UserCheck size={16} color="#10b981" /> Tourist Guides
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
                  background: currentAdminTab === 'transport' ? '#f3e8ff' : 'transparent',
                  color: currentAdminTab === 'transport' ? '#6b21a8' : '#334155',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Car size={16} color="#7c3aed" /> Transport Routes
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
                  background: currentAdminTab === 'users' ? '#f1f5f9' : 'transparent',
                  color: currentAdminTab === 'users' ? '#0f172a' : '#334155',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <Users size={16} color="#0f172a" /> User Accounts
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  color: '#334155',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.88rem'
                }}
              >
                <User size={16} color="#0284c7" /> Admin Profile & Settings
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
                  color: '#dc2626',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                <LogOut size={16} color="#dc2626" /> Sign Out
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

