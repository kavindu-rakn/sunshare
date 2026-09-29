/*
 * ============================================================================
 *  File        : Reservations.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : W13 Reservations - every booking with a filter bar: view
 *                (all / current / pending / history), status, station, date
 *                range and search. The API does the filtering (rule R16 and
 *                the list definitions in docs/01-SPEC.md §5).
 *                Row actions Edit / Cancel / Approve were added by Part C
 *                (Malkith G W L, IT22630834); they appear only when the API
 *                allows them (canModify, status Pending).
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { approveReservation, cancelReservation, listReservations } from '../api/reservationsApi.js';
import { listStations } from '../api/stationsApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import ConfirmButton from '../components/ConfirmButton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ReservationTable from '../components/ReservationTable.jsx';
import { fromDateInput } from '../utils/format.js';

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'current', label: 'Current' },
  { value: 'pending', label: 'Pending' },
  { value: 'history', label: 'History' },
];

// Staff list of bookings. A "view" can come from the address, e.g. /reservations?view=pending (dashboard cards).
export default function Reservations() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [view, setView] = useState(searchParams.get('view') ?? 'all');
  const [status, setStatus] = useState('');
  const [stationId, setStationId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [stations, setStations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message ?? '');
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState('');

  // Once: load the stations for the station filter.
  useEffect(() => {
    listStations().then(setStations).catch((err) => setError(err.message));
  }, []);

  // Loads the bookings whenever a filter changes. The dates are local days turned into UTC
  // (from = start of that day, to = start of the day after, so the whole "to" day is included).
  useEffect(() => {
    let cancelled = false;
    const filters = {
      view,
      status,
      stationId,
      search,
      from: fromDate ? fromDateInput(fromDate, 0) : '',
      to: toDate ? fromDateInput(toDate, 1) : '',
    };
    listReservations(filters)
      .then((list) => {
        if (!cancelled) {
          setReservations(list);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view, status, stationId, fromDate, toDate, search, reloadKey]);

  // Runs one row action (cancel or approve) and shows the API's answer. The API checks the rules:
  // R10 (12 hours' notice), R15 (finished bookings can't change), R13 (only Pending can be approved).
  async function runAction(reservation, action, successText) {
    setBusyId(reservation.id);
    setError('');
    try {
      await action(reservation.id);
      setSuccess(successText);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSuccess('');
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  // The buttons for one row. Edit / Cancel only if the API says canModify; Approve only for Pending.
  function renderActions(reservation) {
    const busy = busyId === reservation.id;
    const who = `${reservation.prosumerName} at ${reservation.stationName}`;
    return (
      <>
        {reservation.status === 'Pending' && (
          <button type="button" className="btn btn-sm btn-primary me-1" disabled={busy}
            onClick={() => runAction(reservation, approveReservation, `Approved ${reservation.prosumerName}'s booking - the QR code is ready in the app.`)}>
            Approve<span className="visually-hidden"> {who}</span>
          </button>
        )}
        {reservation.canModify && (
          <>
            <Link to={`/reservations/${reservation.id}/edit`} className="btn btn-sm btn-outline-primary me-1">
              Edit<span className="visually-hidden"> {who}</span>
            </Link>
            <ConfirmButton
              message={`Cancel ${reservation.prosumerName}'s booking at ${reservation.stationName}?`}
              onConfirm={() => runAction(reservation, cancelReservation, 'The booking was cancelled and its place is free again.')}
              className="btn btn-sm btn-outline-danger"
              disabled={busy}
            >
              Cancel<span className="visually-hidden"> {who}</span>
            </ConfirmButton>
          </>
        )}
      </>
    );
  }

  // Applies the search box when the filter form is submitted.
  function handleSearch(event) {
    event.preventDefault();
    setSearch(searchText.trim());
  }

  // Clears every filter back to "all bookings".
  function clearFilters() {
    setView('all');
    setStatus('');
    setStationId('');
    setFromDate('');
    setToDate('');
    setSearchText('');
    setSearch('');
  }

  return (
    <>
      <PageHeader title="Reservations" subtitle="Every energy booking. Current = approved and upcoming; History = completed, cancelled or past.">
        <Link to="/reservations/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>New reservation
        </Link>
      </PageHeader>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage message={error} onClose={() => setError('')} />

      <div className="card">
        <form className="p-3 border-bottom" onSubmit={handleSearch}>
          <div className="btn-group mb-3 flex-wrap" role="group" aria-label="View">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`btn btn-sm ${view === option.value ? 'btn-primary' : 'btn-outline-primary'}`}
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="row g-2">
            <div className="col-sm-6 col-lg-2">
              <label htmlFor="status" className="form-label small text-secondary mb-1">Status</label>
              <select id="status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Any status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-sm-6 col-lg-3">
              <label htmlFor="station" className="form-label small text-secondary mb-1">Station</label>
              <select id="station" className="form-select" value={stationId} onChange={(e) => setStationId(e.target.value)}>
                <option value="">All stations</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="fromDate" className="form-label small text-secondary mb-1">From</label>
              <input id="fromDate" type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="col-6 col-lg-2">
              <label htmlFor="toDate" className="form-label small text-secondary mb-1">To</label>
              <input id="toDate" type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="col-lg-3">
              <label htmlFor="search" className="form-label small text-secondary mb-1">Search</label>
              <div className="input-group">
                <input
                  id="search"
                  className="form-control"
                  placeholder="Station, prosumer, NIC or id"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <button type="submit" className="btn btn-outline-primary">
                  <i className="bi bi-search" aria-hidden="true"></i><span className="visually-hidden">Search</span>
                </button>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <span className="small text-secondary" role="status">{loading ? '' : `${reservations.length} booking(s)`}</span>
            <button type="button" className="btn btn-sm btn-link" onClick={clearFilters}>Clear filters</button>
          </div>
        </form>

        {loading && <div className="px-3"><LoadingSpinner text="Loading reservations..." /></div>}
        {!loading && reservations.length === 0 && (
          <EmptyState icon="bi-calendar-x" title="No bookings found" text="Try another view or clear the filters." />
        )}
        {!loading && reservations.length > 0 && (
          <ReservationTable caption="Reservations" reservations={reservations} renderActions={renderActions} />
        )}
      </div>
    </>
  );
}
