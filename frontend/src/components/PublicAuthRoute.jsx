import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicAuthRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0e1015' }}>
        <p style={{ fontSize: '1.1rem', color: '#5B7CFF', fontWeight: '600' }}>Loading Tourist AI Hub...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const role = (user.role || '').toLowerCase();
    if (role === 'admin' || role === 'super admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
