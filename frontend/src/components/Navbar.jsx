import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
  ShieldAlert
} from 'lucide-react';

import BrandLogo from './BrandLogo';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(2, 132, 199, 0.14)',
      position: 'sticky',
      top: 0,
      zIndex: 900,
      boxShadow: '0 4px 20px rgba(2, 132, 199, 0.05)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        minHeight: '76px'
      }}>
        {/* Brand Logo with Sky Blue & Light Green Accent */}
        <BrandLogo />

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
          borderTop: '1px solid rgba(2, 132, 199, 0.15)',
          padding: '16px',
          boxShadow: '0 12px 28px rgba(2, 132, 199, 0.12)',
          margin: '0 auto 12px auto',
          width: 'calc(100% - 24px)',
          maxWidth: '420px',
          borderRadius: '16px',
          marginTop: '8px'
        }} className="mobile-only">
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

