/*
 * ============================================================================
 *  File        : App.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-27
 *  Description : Root component: every page address (route) of the web app
 *                and who may open it. Pages not built yet show a placeholder.
 * ============================================================================
 */
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PagePlaceholder from './components/PagePlaceholder.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import UserForm from './pages/UserForm.jsx';
import Users from './pages/Users.jsx';
import NotFound from './pages/NotFound.jsx';

const STAFF = ['Backoffice', 'GridOperator'];
const BACKOFFICE = ['Backoffice'];

// HashRouter keeps the page in the part of the address after "#" (e.g. /#/stations), so IIS
// always serves the same index.html and needs no URL-rewrite setup (docs/11-DECISIONS.md D7).
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Staff pages (Backoffice + Grid Operator), inside the sidebar layout. */}
          <Route element={<ProtectedRoute roles={STAFF} />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<PagePlaceholder title="Dashboard" phase={10} />} />
              <Route path="/reservations" element={<PagePlaceholder title="Reservations" phase={10} />} />
              <Route path="/reservations/new" element={<PagePlaceholder title="New reservation" phase={11} />} />
              <Route path="/reservations/:id/edit" element={<PagePlaceholder title="Edit reservation" phase={11} />} />
              <Route path="/stations" element={<PagePlaceholder title="Stations" phase={9} />} />
              <Route path="/stations/:id/slots" element={<PagePlaceholder title="Slots" phase={9} />} />
              <Route path="/slots/new" element={<PagePlaceholder title="New slot" phase={9} />} />
              <Route path="/slots/:id/edit" element={<PagePlaceholder title="Edit slot" phase={9} />} />

              {/* Backoffice-only pages. */}
              <Route element={<ProtectedRoute roles={BACKOFFICE} />}>
                <Route path="/stations/new" element={<PagePlaceholder title="New station" phase={9} />} />
                <Route path="/stations/:id/edit" element={<PagePlaceholder title="Edit station" phase={9} />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/new" element={<UserForm kind="staff" />} />
                <Route path="/users/:nic/edit" element={<UserForm kind="staff" />} />
                <Route path="/prosumers" element={<PagePlaceholder title="Prosumers" phase={8} />} />
                <Route path="/prosumers/new" element={<PagePlaceholder title="New prosumer" phase={8} />} />
                <Route path="/prosumers/:nic/edit" element={<PagePlaceholder title="Edit prosumer" phase={8} />} />
                <Route path="/activations" element={<PagePlaceholder title="Pending activations" phase={8} />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
