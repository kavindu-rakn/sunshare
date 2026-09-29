/*
 * ============================================================================
 *  File        : ProtectedRoute.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Guards pages: not logged in -> Login page; wrong role ->
 *                "no access" message. Only for a nicer UI - the API still
 *                checks the role on every call (rule R2).
 * ============================================================================
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AlertMessage from './AlertMessage.jsx';

// Shows the pages inside it (<Outlet />) only to logged-in users whose role is in "roles".
export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <AlertMessage message="You don't have access to this page." />;
  }
  return <Outlet />;
}
