/*
 * ============================================================================
 *  File        : PendingActivations.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : W8 Pending activations - prosumers waiting for Backoffice:
 *                new sign-ups (Pending, R3) and deactivated accounts that need
 *                reactivation (R4). One click activates them.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { activateUser, getPendingActivations, notifyActivationsChanged } from '../api/usersApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDateTime } from '../utils/format.js';

// The Backoffice "to do" list of accounts to activate. The API gives them longest-waiting first.
export default function PendingActivations() {
  const [prosumers, setProsumers] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyNic, setBusyNic] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Loads the waiting prosumers (again after every activation). "cancelled" ignores late answers.
  useEffect(() => {
    let cancelled = false;
    getPendingActivations()
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
  }, [reloadKey]);

  // Activates one prosumer (R3 / R4 - only Backoffice may do this; the API checks it).
  async function handleActivate(prosumer) {
    setBusyNic(prosumer.nic);
    setError('');
    try {
      await activateUser(prosumer.nic);
      setSuccess(`${prosumer.fullName} can now log in to the mobile app.`);
      notifyActivationsChanged();
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSuccess('');
      setError(err.message);
    } finally {
      setBusyNic('');
    }
  }

  return (
    <>
      <PageHeader
        title="Pending activations"
        subtitle="New prosumer sign-ups and deactivated accounts waiting for a Backoffice officer."
      />

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage message={error} onClose={() => setError('')} />

      <div className="card">
        {loading && <div className="px-3"><LoadingSpinner text="Loading waiting accounts..." /></div>}
        {!loading && prosumers.length === 0 && (
          <EmptyState icon="bi-check2-circle" title="All caught up" text="No prosumers are waiting for activation." />
        )}
        {!loading && prosumers.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <caption className="visually-hidden">Prosumers waiting for activation</caption>
              <thead>
                <tr>
                  <th scope="col">NIC</th>
                  <th scope="col">Prosumer</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Waiting since</th>
                  <th scope="col" className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {prosumers.map((prosumer) => (
                  <tr key={prosumer.nic}>
                    <td className="font-monospace small">{prosumer.nic}</td>
                    <td>
                      <div className="fw-semibold">{prosumer.fullName}</div>
                      <div className="small text-secondary">{prosumer.email}</div>
                    </td>
                    <td>{prosumer.phone}</td>
                    <td>
                      <StatusBadge status={prosumer.status} />
                      <div className="small text-secondary mt-1">
                        {prosumer.status === 'Pending' ? 'New sign-up' : 'Needs reactivation'}
                      </div>
                    </td>
                    <td className="small">{formatDateTime(prosumer.updatedAt)}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        disabled={busyNic === prosumer.nic}
                        onClick={() => handleActivate(prosumer)}
                      >
                        <i className="bi bi-check-lg me-1" aria-hidden="true"></i>
                        {prosumer.status === 'Pending' ? 'Activate' : 'Reactivate'}
                        <span className="visually-hidden"> {prosumer.fullName}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
