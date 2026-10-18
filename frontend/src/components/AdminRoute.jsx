import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: '1.1rem', color: '#5B7CFF', fontWeight: '600' }}>Verifying Administrator Privileges...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = (user?.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'super admin') {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ color: '#b91c1c', marginBottom: '12px' }}>Access Denied</h2>
        <p style={{ color: '#475569', marginBottom: '24px' }}>
          This portal is restricted to Administrators only. Your current role is <strong>{user?.role}</strong>.
        </p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return children;
}
