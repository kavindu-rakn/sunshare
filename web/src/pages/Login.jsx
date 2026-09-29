/*
 * ============================================================================
 *  File        : Login.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : W2 Login - NIC + password. Backoffice and Grid Operators go
 *                to their dashboard; Prosumers are told to use the mobile app.
 *                Pending / Deactivated / wrong password messages come from the API.
 * ============================================================================
 */
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { login as loginRequest } from '../api/authApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// The staff login page (public).
export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Logged in (already, or just now after login() below)? Go to the page the user first tried to
  // open, or to the dashboard. This is the only redirect, so the two can't race each other.
  if (user) {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />;
  }

  // Sends the login request. The API checks the NIC, password and account status (R3, R4);
  // this page only makes sure both boxes are filled in.
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!nic.trim() || !password) {
      setError('Please enter your NIC and password.');
      return;
    }

    setBusy(true);
    try {
      const session = await loginRequest(nic.trim(), password);
      // The web app is for staff only; prosumers have the Android app (docs/01-SPEC.md §1).
      if (session.role === 'Prosumer') {
        setError('Prosumers use the SunShare mobile app. Please log in on your phone.');
        return;
      }
      login(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page min-vh-100 d-flex align-items-center justify-content-center p-3">
      <main id="content" className="w-100" style={{ maxWidth: '26rem' }}>
        <div className="text-center mb-4">
          <Link to="/" className="fs-3 fw-bold text-white text-decoration-none">
            <i className="bi bi-sun-fill text-warning me-2" aria-hidden="true"></i>SunShare
          </Link>
        </div>

        <div className="card p-4 hero-card">
          <h1 className="h4 mb-1">Staff login</h1>
          <p className="text-secondary mb-4">For Backoffice officers and Grid Operators.</p>

          <AlertMessage message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="nic" className="form-label">NIC</label>
              <input
                id="nic"
                className="form-control"
                autoComplete="username"
                placeholder="e.g. 200012345678"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={busy}>
              {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              {busy ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="text-center small mt-3 mb-0">
          <Link to="/" className="text-white">
            <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
