/*
 * ============================================================================
 *  File        : AuthContext.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Keeps "who is logged in" for the whole web app (React
 *                context), saved in localStorage so a page refresh keeps you
 *                logged in. Any component can read it with useAuth().
 * ============================================================================
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, loadSession, saveSession, setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);

// Wraps the app and shares the logged-in user ({ token, nic, fullName, role, expiresAt } or null).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession());
  const navigate = useNavigate();

  // Called after a successful POST /api/auth/login: remember the session.
  const login = useCallback((session) => {
    saveSession(session);
    setUser(session);
  }, []);

  // Forget the session and go back to the login page.
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // If the API answers 401 later (token expired), log out automatically.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for components: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
