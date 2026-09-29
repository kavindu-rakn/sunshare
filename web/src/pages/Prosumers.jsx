/*
 * ============================================================================
 *  File        : Prosumers.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : W6 Prosumers - list with search and status filter, Edit,
 *                Deactivate / Reactivate, and Add prosumer.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listUsers } from '../api/usersApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import UserTable from '../components/UserTable.jsx';

// The prosumer accounts page (Backoffice only).
export default function Prosumers() {
  const location = useLocation();
  const [prosumers, setProsumers] = useState([]);
  const [status, setStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message ?? '');

  const [reloadKey, setReloadKey] = useState(0);

  // Loads prosumers whenever the status / search changes (or reloadKey goes up after an action).
  // "cancelled" stops an older, slower answer from overwriting a newer one.
  useEffect(() => {
    let cancelled = false;
    listUsers({ role: 'Prosumer', status, search })
      .then((list) => {
        if (!cancelled) setProsumers(list);
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
  }, [status, search, reloadKey]);

  // Applies the search box when the filter form is submitted.
  function handleSearch(event) {
    event.preventDefault();
    setSearch(searchText.trim());
  }

  // After Deactivate / Reactivate: show the message and load the list again.
  function handleChanged(message) {
    setSuccess(message);
    setError('');
    setReloadKey((key) => key + 1);
  }

  // When the API refuses an action, show its message (and hide any older success message).
  function handleError(message) {
    setError(message);
    setSuccess('');
  }

  return (
    <>
      <PageHeader title="Prosumers" subtitle="Homes with solar panels that trade energy through SunShare.">
        <Link to="/prosumers/new" className="btn btn-primary">
          <i className="bi bi-person-plus me-2" aria-hidden="true"></i>Add prosumer
        </Link>
      </PageHeader>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage message={error} onClose={() => setError('')} />

      <div className="card">
        <form className="row g-2 p-3 border-bottom" onSubmit={handleSearch}>
          <div className="col-sm-5 col-lg-3">
            <label htmlFor="status" className="form-label small text-secondary mb-1">Status</label>
            <select id="status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>
          <div className="col-sm-7 col-lg-6">
            <label htmlFor="search" className="form-label small text-secondary mb-1">Search</label>
            <div className="input-group">
              <input
                id="search"
                className="form-control"
                placeholder="NIC, name or email"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button type="submit" className="btn btn-outline-primary">
                <i className="bi bi-search" aria-hidden="true"></i><span className="visually-hidden">Search</span>
              </button>
            </div>
          </div>
        </form>

        {loading && <div className="px-3"><LoadingSpinner text="Loading prosumers..." /></div>}
        {!loading && prosumers.length === 0 && (
          <EmptyState icon="bi-house-heart" title="No prosumers found" text="Try other filters, or add a prosumer." />
        )}
        {!loading && prosumers.length > 0 && (
          <UserTable
            caption="Prosumers"
            users={prosumers}
            showAddress
            editBase="/prosumers"
            onChanged={handleChanged}
            onError={handleError}
          />
        )}
      </div>
    </>
  );
}
