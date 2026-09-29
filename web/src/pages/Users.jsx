/*
 * ============================================================================
 *  File        : Users.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : W4 Web users - Backoffice and Grid Operator accounts with
 *                role / status / search filters, Edit and Activate / Deactivate.
 * ============================================================================
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listUsers } from '../api/usersApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import UserTable from '../components/UserTable.jsx';

// The staff accounts page (Backoffice only).
export default function Users() {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message ?? '');

  // Loads the accounts with the chosen filters. With no role chosen, both staff roles are shown
  // (prosumers have their own page).
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listUsers({ role, status, search });
      setUsers(role ? list : list.filter((u) => u.role !== 'Prosumer'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role, status, search]);

  // Reload whenever a filter changes.
  useEffect(() => {
    load();
  }, [load]);

  // Applies the search box when the filter form is submitted.
  function handleSearch(event) {
    event.preventDefault();
    setSearch(searchText.trim());
  }

  // After Activate / Deactivate: show the message and reload the list.
  function handleChanged(message) {
    setSuccess(message);
    setError('');
    load();
  }

  // When the API refuses an action, show its message (and hide any older success message).
  function handleError(message) {
    setError(message);
    setSuccess('');
  }

  return (
    <>
      <PageHeader title="Web users" subtitle="Backoffice officers and Grid Operators who use the web app.">
        <Link to="/users/new" className="btn btn-primary">
          <i className="bi bi-person-plus me-2" aria-hidden="true"></i>Add user
        </Link>
      </PageHeader>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage message={error} onClose={() => setError('')} />

      <div className="card">
        <form className="row g-2 p-3 border-bottom" onSubmit={handleSearch}>
          <div className="col-sm-6 col-lg-3">
            <label htmlFor="role" className="form-label small text-secondary mb-1">Role</label>
            <select id="role" className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All staff</option>
              <option value="Backoffice">Backoffice</option>
              <option value="GridOperator">Grid Operator</option>
            </select>
          </div>
          <div className="col-sm-6 col-lg-3">
            <label htmlFor="status" className="form-label small text-secondary mb-1">Status</label>
            <select id="status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any status</option>
              <option value="Active">Active</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>
          <div className="col-lg-6">
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

        {loading && <div className="px-3"><LoadingSpinner text="Loading users..." /></div>}
        {!loading && users.length === 0 && (
          <EmptyState icon="bi-person-badge" title="No users found" text="Try other filters, or add a new user." />
        )}
        {!loading && users.length > 0 && (
          <UserTable
            caption="Web users"
            users={users}
            showRole
            editBase="/users"
            onChanged={handleChanged}
            onError={handleError}
          />
        )}
      </div>
    </>
  );
}
