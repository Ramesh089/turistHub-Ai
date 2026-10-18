import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  Settings,
  Sparkles
} from 'lucide-react';

export default function UserMenu() {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.name || user.fullName || user.username || 'User';
  const roleName = user.role || 'User';

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = () => {
    const r = roleName.toLowerCase();
    if (r === 'admin') return { bg: 'rgba(91, 124, 255, 0.12)', text: '#5B7CFF', border: 'rgba(91, 124, 255, 0.3)' };
    return { bg: 'rgba(16, 185, 129, 0.12)', text: '#059669', border: 'rgba(16, 185, 129, 0.3)' };
  };

  const roleStyle = getRoleBadgeColor();

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '999px',
          backgroundColor: '#f0f9ff',
          border: '1px solid rgba(2, 132, 199, 0.22)',
          cursor: 'pointer',
          color: '#0369a1',
          fontSize: '0.84rem',
          fontWeight: '600',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0f2fe')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName.split(' ')[0]}
        </span>
        <ChevronDown size={14} color="#0369a1" />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '42px',
            right: 0,
            width: '240px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            padding: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {/* User Details Header */}
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>
                {displayName}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: roleStyle.bg,
                  color: roleStyle.text,
                  border: `1px solid ${roleStyle.border}`
                }}
              >
                {roleName}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
            {user.username && (
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                @{user.username}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: '500',
              color: '#334155',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <User size={16} color="#0284c7" />
            <span>Profile & Settings</span>
          </Link>

          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: '500',
              color: '#334155',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LayoutDashboard size={16} color="#0284c7" />
            <span>My Trips & Itineraries</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: '600',
                color: '#5B7CFF',
                textDecoration: 'none',
                backgroundColor: 'rgba(91, 124, 255, 0.08)'
              }}
            >
              <ShieldCheck size={16} color="#5B7CFF" />
              <span>Admin Portal</span>
            </Link>
          )}

          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '4px', paddingTop: '6px' }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: '600',
                color: '#dc2626',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={16} color="#dc2626" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

