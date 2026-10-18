import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('touristhub_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('touristhub_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify session on initial load or token change
  useEffect(() => {
    async function verifyAuth() {
      // Even if no token in localStorage, backend might have httpOnly cookie
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.user) {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem('touristhub_user', JSON.stringify(freshUser));
        }
      } catch (err) {
        // If 401 or no active session
        if (token) {
          // Token in localStorage was invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('touristhub_token');
          localStorage.removeItem('touristhub_user');
        }
      } finally {
        setLoading(false);
      }
    }
    verifyAuth();
  }, [token]);

  /**
   * Unified login supporting email or username, role checking, slider verification, and rememberMe
   */
  const login = async ({ account, password, role, rememberPassword = false, sliderToken = null, sliderVerified = false }) => {
    try {
      const res = await api.post('/auth/login', {
        account,
        password,
        role,
        rememberPassword,
        sliderToken,
        sliderVerified
      });

      if (res.data?.success) {
        const loggedUser = res.data.user;
        const jwtToken = res.data.token;

        setToken(jwtToken);
        setUser(loggedUser);
        localStorage.setItem('touristhub_token', jwtToken);
        localStorage.setItem('touristhub_user', JSON.stringify(loggedUser));

        if (rememberPassword) {
          localStorage.setItem('touristhub_remember_account', account);
        } else {
          localStorage.removeItem('touristhub_remember_account');
        }

        return {
          success: true,
          user: loggedUser,
          token: jwtToken,
          message: res.data.message
        };
      }
      return { success: false, message: res.data?.message || 'Login failed.' };
    } catch (err) {
      const errorResponse = err.response?.data;
      return {
        success: false,
        field: errorResponse?.field,
        locked: errorResponse?.locked,
        message: errorResponse?.message || 'Login failed. Please verify credentials.'
      };
    }
  };

  /**
   * Unified register with full real-time validation support
   */
  const register = async (registerData) => {
    try {
      const res = await api.post('/auth/register', registerData);
      if (res.data?.success) {
        const newUser = res.data.user;
        const jwtToken = res.data.token;

        setToken(jwtToken);
        setUser(newUser);
        localStorage.setItem('touristhub_token', jwtToken);
        localStorage.setItem('touristhub_user', JSON.stringify(newUser));

        return {
          success: true,
          user: newUser,
          token: jwtToken,
          message: res.data.message
        };
      }
      return { success: false, message: res.data?.message || 'Registration failed.' };
    } catch (err) {
      const errorResponse = err.response?.data;
      return {
        success: false,
        field: errorResponse?.field,
        message: errorResponse?.message || 'Registration failed. Check inputs.'
      };
    }
  };

  /**
   * Secure logout clearing cookies and local storage
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('touristhub_token');
    localStorage.removeItem('touristhub_user');
  };

  const updateUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('touristhub_user', JSON.stringify(updated));
  };

  const userRole = (user?.role || '').toLowerCase();
  const isSuperAdmin = userRole === 'super admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isUser = userRole === 'user' || userRole === 'tourist';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isSuperAdmin,
        isAdmin,
        isUser,
        isTourist: isUser,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
