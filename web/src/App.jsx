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
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Prosumers from './pages/Prosumers.jsx';
import UserForm from './pages/UserForm.jsx';
import Users from './pages/Users.jsx';
import NotFound from './pages/NotFound.jsx';
import PendingActivations from './pages/PendingActivations.jsx';
import ReservationForm from './pages/ReservationForm.jsx';
import Reservations from './pages/Reservations.jsx';
import SlotForm from './pages/SlotForm.jsx';
import Slots from './pages/Slots.jsx';
import StationForm from './pages/StationForm.jsx';
import Stations from './pages/Stations.jsx';

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/reservations/new" element={<ReservationForm />} />
              <Route path="/reservations/:id/edit" element={<ReservationForm />} />
              <Route path="/stations" element={<Stations />} />
              <Route path="/stations/:id/slots" element={<Slots />} />
              <Route path="/slots/new" element={<SlotForm />} />
              <Route path="/slots/:id/edit" element={<SlotForm />} />

              {/* Backoffice-only pages. */}
              <Route element={<ProtectedRoute roles={BACKOFFICE} />}>
                <Route path="/stations/new" element={<StationForm />} />
                <Route path="/stations/:id/edit" element={<StationForm />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/new" element={<UserForm kind="staff" />} />
                <Route path="/users/:nic/edit" element={<UserForm kind="staff" />} />
                <Route path="/prosumers" element={<Prosumers />} />
                <Route path="/prosumers/new" element={<UserForm kind="prosumer" />} />
                <Route path="/prosumers/:nic/edit" element={<UserForm kind="prosumer" />} />
                <Route path="/activations" element={<PendingActivations />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
