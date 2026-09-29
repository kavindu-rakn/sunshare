/*
 * ============================================================================
 *  File        : UserTable.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : Table of accounts shared by the Web users (W4) and
 *                Prosumers (W6) pages, with Edit and Activate / Deactivate.
 * ============================================================================
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { activateUser, deactivateUser, notifyActivationsChanged } from '../api/usersApi.js';
import ConfirmButton from './ConfirmButton.jsx';
import StatusBadge from './StatusBadge.jsx';

const ROLE_NAMES = { Backoffice: 'Backoffice', GridOperator: 'Grid Operator', Prosumer: 'Prosumer' };

// users = rows from the API; showRole / showAddress = extra columns; editBase = "/users" or "/prosumers";
// onChanged(message) / onError(message) tell the page what happened.
export default function UserTable({ caption, users, showRole = false, showAddress = false, editBase, onChanged, onError }) {
  const [busyNic, setBusyNic] = useState('');

  // Activates or deactivates one account. The API decides if it's allowed (e.g. R4: not your own account)
  // and this table just shows its answer.
  async function changeStatus(user, activate) {
    setBusyNic(user.nic);
    try {
      const updated = activate ? await activateUser(user.nic) : await deactivateUser(user.nic);
      notifyActivationsChanged();
      onChanged(activate ? `${updated.fullName} is now active.` : `${updated.fullName} was deactivated.`);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusyNic('');
    }
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">NIC</th>
            <th scope="col">Name</th>
            <th scope="col">Phone</th>
            {showRole && <th scope="col">Role</th>}
            {showAddress && <th scope="col">Address</th>}
            <th scope="col">Status</th>
            <th scope="col" className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.nic}>
              <td className="font-monospace small">{user.nic}</td>
              <td>
                <div className="fw-semibold">{user.fullName}</div>
                <div className="small text-secondary">{user.email}</div>
              </td>
              <td>{user.phone}</td>
              {showRole && <td>{ROLE_NAMES[user.role] ?? user.role}</td>}
              {showAddress && <td className="small">{user.address || <span className="text-secondary">-</span>}</td>}
              <td><StatusBadge status={user.status} /></td>
              <td className="text-end text-nowrap">
                <Link to={`${editBase}/${encodeURIComponent(user.nic)}/edit`} className="btn btn-sm btn-outline-primary me-1">
                  <i className="bi bi-pencil me-1" aria-hidden="true"></i>Edit<span className="visually-hidden"> {user.fullName}</span>
                </Link>
                {user.status === 'Active' ? (
                  <ConfirmButton
                    message={`Deactivate ${user.fullName}? They won't be able to log in.`}
                    onConfirm={() => changeStatus(user, false)}
                    className="btn btn-sm btn-outline-danger"
                    disabled={busyNic === user.nic}
                  >
                    Deactivate<span className="visually-hidden"> {user.fullName}</span>
                  </ConfirmButton>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    disabled={busyNic === user.nic}
                    onClick={() => changeStatus(user, true)}
                  >
                    {user.status === 'Pending' ? 'Activate' : 'Reactivate'}<span className="visually-hidden"> {user.fullName}</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
