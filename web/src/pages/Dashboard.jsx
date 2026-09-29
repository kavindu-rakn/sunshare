/*
 * ============================================================================
 *  File        : Dashboard.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : W3 Dashboard - count cards (pending, approved upcoming,
 *                today, active stations, pending activations) and the next
 *                pending bookings with an Approve button. All numbers come
 *                from GET /api/dashboard/summary.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStaffSummary } from '../api/dashboardApi.js';
import { approveReservation } from '../api/reservationsApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ReservationTable from '../components/ReservationTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// The count cards: which number from the API, its label, icon, colour and where clicking it goes.
const CARDS = [
  { key: 'pendingReservations', label: 'Pending reservations', icon: 'bi-hourglass-split', tone: 'amber', link: '/reservations?view=pending' },
  { key: 'approvedFutureReservations', label: 'Approved upcoming', icon: 'bi-check2-circle', tone: 'teal', link: '/reservations?view=current' },
  { key: 'todayReservations', label: "Today's reservations", icon: 'bi-calendar-day', tone: 'blue', link: '/reservations' },
  { key: 'activeStations', label: 'Active stations', icon: 'bi-geo-alt', tone: 'green', link: '/stations' },
  { key: 'pendingActivations', label: 'Pending activations', icon: 'bi-person-check', tone: 'navy', link: '/activations', backofficeOnly: true },
];

// "Good morning" / "Good afternoon" / "Good evening" from the local hour (display only).
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// The staff home page (Backoffice and Grid Operator).
export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const cards = CARDS.filter((card) => !card.backofficeOnly || user.role === 'Backoffice');

  // Loads the summary (again after every approval). "cancelled" ignores late answers.
  useEffect(() => {
    let cancelled = false;
    getStaffSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Approves one pending booking; the API sets it Approved and creates its QR token (R13).
  async function handleApprove(reservation) {
    setBusyId(reservation.id);
    setError('');
    try {
      await approveReservation(reservation.id);
      setSuccess(`Approved ${reservation.prosumerName}'s booking at ${reservation.stationName}. Their QR code is ready in the app.`);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSuccess('');
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.fullName.split(' ')[0]}`}
        subtitle="Here is what's happening across the SunShare microgrid."
      >
        <Link to="/reservations" className="btn btn-outline-primary">
          <i className="bi bi-calendar-check me-2" aria-hidden="true"></i>All reservations
        </Link>
      </PageHeader>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage message={error} onClose={() => setError('')} />

      {!summary && !error && <LoadingSpinner text="Loading dashboard..." />}

      {summary && (
        <>
          <div className="row g-3 mb-4">
            {cards.map((card) => (
              <div key={card.key} className="col-sm-6 col-xl">
                <div className="card stat-card h-100 p-3 position-relative">
                  <div className="d-flex align-items-center gap-3">
                    <span className={`stat-icon tone-${card.tone}`}><i className={`bi ${card.icon}`} aria-hidden="true"></i></span>
                    <div>
                      <div className="stat-number">{summary[card.key]}</div>
                      <Link to={card.link} className="stretched-link text-decoration-none text-secondary small">{card.label}</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h2 className="h5 mb-0">Waiting for approval</h2>
              <Link to="/reservations?view=pending" className="small">See all pending</Link>
            </div>
            {summary.pendingList.length === 0 ? (
              <EmptyState icon="bi-check2-all" title="Nothing to approve" text="New bookings will appear here." />
            ) : (
              <ReservationTable
                caption="Next pending reservations"
                reservations={summary.pendingList}
                renderActions={(reservation) => (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={busyId === reservation.id}
                    onClick={() => handleApprove(reservation)}
                  >
                    <i className="bi bi-check-lg me-1" aria-hidden="true"></i>Approve
                    <span className="visually-hidden"> {reservation.prosumerName} at {reservation.stationName}</span>
                  </button>
                )}
              />
            )}
          </div>
        </>
      )}
    </>
  );
}
