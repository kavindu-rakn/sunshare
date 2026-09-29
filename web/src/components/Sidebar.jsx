/*
 * ============================================================================
 *  File        : Sidebar.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Dark navy side menu. Shows only the links for the logged-in
 *                user's role (Backoffice sees everything, Grid Operators see
 *                the operational pages), plus the user's name and Log out.
 *                Backoffice also sees how many prosumers wait for activation
 *                (count badge added with the Pending activations page, Part A).
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ACTIVATIONS_CHANGED, getPendingActivations } from '../api/usersApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const BO = 'Backoffice';
const GO = 'GridOperator';

// Menu items and which roles see them (docs/01-SPEC.md §2 permission matrix).
const MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', roles: [BO, GO] },
  { to: '/reservations', label: 'Reservations', icon: 'bi-calendar-check', roles: [BO, GO] },
  { to: '/stations', label: 'Stations & slots', icon: 'bi-geo-alt', roles: [BO, GO] },
  { to: '/prosumers', label: 'Prosumers', icon: 'bi-house-heart', roles: [BO] },
  { to: '/activations', label: 'Pending activations', icon: 'bi-person-check', roles: [BO] },
  { to: '/users', label: 'Web users', icon: 'bi-person-badge', roles: [BO] },
];

// Friendly names for the roles.
const ROLE_NAMES = { Backoffice: 'Backoffice officer', GridOperator: 'Grid operator', Prosumer: 'Prosumer' };

// The menu. "open" shows the links on small screens; onToggle = menu button; onNavigate = a link was clicked.
export default function Sidebar({ open, onToggle, onNavigate }) {
  const { user, logout } = useAuth();
  const links = MENU.filter((item) => item.roles.includes(user.role));
  const [pendingCount, setPendingCount] = useState(0);

  // Backoffice only: load how many prosumers are waiting for activation, and load it again
  // whenever a page says an account's status changed (the ACTIVATIONS_CHANGED browser event).
  useEffect(() => {
    if (user.role !== BO) {
      return undefined;
    }
    let cancelled = false;

    // Asks the API for the waiting list and keeps only its length. If it fails, the badge just stays as it was.
    function refreshCount() {
      getPendingActivations()
        .then((list) => {
          if (!cancelled) setPendingCount(list.length);
        })
        .catch(() => {});
    }

    refreshCount();
    window.addEventListener(ACTIVATIONS_CHANGED, refreshCount);
    return () => {
      cancelled = true;
      window.removeEventListener(ACTIVATIONS_CHANGED, refreshCount);
    };
  }, [user.role]);

  return (
    <aside className={`app-sidebar ${open ? 'open' : ''}`}>
      <div className="d-flex align-items-center justify-content-between p-3">
        <Link to="/dashboard" className="brand" onClick={onNavigate}>
          <i className="bi bi-sun-fill me-2" aria-hidden="true"></i>SunShare
        </Link>
        <button
          type="button"
          className="btn btn-sm btn-outline-light d-lg-none"
          aria-expanded={open}
          aria-controls="sidebar-menu"
          onClick={onToggle}
        >
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true"></i>
          <span className="visually-hidden">Menu</span>
        </button>
      </div>

      <div id="sidebar-menu" className="sidebar-body">
        <nav aria-label="Main" className="px-3">
          <ul className="nav flex-column gap-1">
            {links.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink to={item.to} className="nav-link" onClick={onNavigate}>
                  <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                  {item.label}
                  {item.to === '/activations' && pendingCount > 0 && (
                    <span className="badge rounded-pill status-pending ms-auto">
                      {pendingCount}<span className="visually-hidden"> waiting</span>
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="user-box mt-auto p-3">
          <div className="text-white fw-semibold">{user.fullName}</div>
          <div>{ROLE_NAMES[user.role] ?? user.role}</div>
          <button type="button" className="btn btn-sm btn-outline-light w-100 mt-2" onClick={logout}>
            <i className="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
