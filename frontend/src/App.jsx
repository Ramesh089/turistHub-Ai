import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { WeatherProvider } from './context/WeatherContext';
import Navbar from './components/Navbar';
import EmergencyBanner from './components/EmergencyBanner';
import Footer from './components/Footer';
import FloatingWeatherWidget from './components/weather/FloatingWeatherWidget';
import WeatherModal from './components/weather/WeatherModal';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PublicAuthRoute from './components/PublicAuthRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import DestinationDetails from './pages/DestinationDetails';
import AIPlanner from './pages/AIPlanner';
import Packages from './pages/Packages';
import Hotels from './pages/Hotels';
import Transport from './pages/Transport';
import Guides from './pages/Guides';
import Emergency from './pages/Emergency';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PartnerRegister from './pages/PartnerRegister';
import PartnerStatus from './pages/PartnerStatus';
import PartnerActivate from './pages/PartnerActivate';
import PartnerDashboard from './pages/PartnerDashboard';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/partner/');
  const isAdminPortal = location.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAuthPage && !isAdminPortal && <EmergencyBanner />}
      {!isAuthPage && <Navbar />}

      <main style={{ flexGrow: 1 }}>
        <Routes>
          {/* Public Landing Route - Only Home is accessible without login */}
          <Route path="/" element={<Home />} />

          {/* Exploration routes */}
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/destination/:id"
            element={
              <ProtectedRoute>
                <DestinationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-planner"
            element={
              <ProtectedRoute>
                <AIPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <Packages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hotels"
            element={<Hotels />}
          />
          <Route
            path="/transport"
            element={
              <ProtectedRoute>
                <Transport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guides"
            element={
              <ProtectedRoute>
                <Guides />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute>
                <Emergency />
              </ProtectedRoute>
            }
          />

          {/* Authentication Routes (redirect logged-in users away) */}
          <Route
            path="/login"
            element={
              <PublicAuthRoute>
                <Login />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicAuthRoute>
                <Register />
              </PublicAuthRoute>
            }
          />

          {/* User Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-trips"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin & Super Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Partner Routes - Public */}
          <Route path="/partner/register" element={<PartnerRegister />} />
          <Route path="/partner/status" element={<PartnerStatus />} />
          <Route path="/partner/activate" element={<PartnerActivate />} />

          {/* Partner Protected Dashboard */}
          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAuthPage && !isAdminPortal && <Footer />}

      {/* Floating Dynamic Weather Forecast Button & Telemetry Modal */}
      {!isAdminPortal && !isAuthPage && <FloatingWeatherWidget />}
      <WeatherModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <WeatherProvider>
            <AppContent />
          </WeatherProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
