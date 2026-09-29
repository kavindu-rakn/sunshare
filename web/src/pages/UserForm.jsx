/*
 * ============================================================================
 *  File        : UserForm.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : W5 User form and W7 Prosumer form (one component, two kinds):
 *                create an account or edit one. The NIC is read-only when
 *                editing. The API checks every value (R1: NIC format, unique).
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createUser, getUser, updateUser } from '../api/usersApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const EMPTY_FORM = { nic: '', fullName: '', email: '', phone: '', address: '', role: 'GridOperator', password: '', status: '' };

// kind = "staff" (web users: Backoffice / Grid Operator) or "prosumer" (always role Prosumer, has an address).
export default function UserForm({ kind }) {
  const { nic } = useParams();
  const isEdit = Boolean(nic);
  const isProsumer = kind === 'prosumer';
  const listPath = isProsumer ? '/prosumers' : '/users';
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...EMPTY_FORM, role: isProsumer ? 'Prosumer' : 'GridOperator' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // When editing: load the account once and fill the form with it.
  useEffect(() => {
    if (!isEdit) {
      return;
    }
    getUser(nic)
      .then((user) => setForm({ ...EMPTY_FORM, ...user, address: user.address ?? '', password: '' }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isEdit, nic]);

  // Copies what the user typed into the form state (one handler for every field, by its "name").
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  // Saves: POST for a new account (starts Active), PUT for an edit. The browser only checks that
  // required boxes are filled; the API checks the rest and its message is shown if something is wrong.
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const details = { fullName: form.fullName, email: form.email, phone: form.phone, address: form.address };
    try {
      if (isEdit) {
        await updateUser(nic, details);
      } else {
        await createUser({ ...details, nic: form.nic, role: form.role, password: form.password });
      }
      navigate(listPath, { state: { message: isEdit ? `${form.fullName}'s details were saved.` : `${form.fullName}'s account was created.` } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const noun = isProsumer ? 'prosumer' : 'web user';
  const title = isEdit ? `Edit ${noun}` : `New ${noun}`;

  return (
    <>
      <PageHeader title={title} subtitle={isEdit ? 'The NIC is the account key and cannot be changed.' : 'The new account is active straight away.'}>
        {isEdit && form.status && <StatusBadge status={form.status} />}
      </PageHeader>

      <AlertMessage message={error} onClose={() => setError('')} />

      {loading ? (
        <LoadingSpinner text="Loading account..." />
      ) : (
        <form className="card p-4" style={{ maxWidth: '48rem' }} onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="nic" className="form-label">NIC</label>
              <input id="nic" name="nic" className="form-control" value={form.nic} onChange={handleChange} readOnly={isEdit} required />
              {!isEdit && <div className="form-text">Old: 9 digits + V/X (981234567V). New: 12 digits (199812345678).</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="role" className="form-label">Role</label>
              {isProsumer || isEdit ? (
                <input id="role" className="form-control" value={form.role === 'GridOperator' ? 'Grid Operator' : form.role} readOnly />
              ) : (
                <select id="role" name="role" className="form-select" value={form.role} onChange={handleChange}>
                  <option value="GridOperator">Grid Operator</option>
                  <option value="Backoffice">Backoffice</option>
                </select>
              )}
            </div>
            <div className="col-md-6">
              <label htmlFor="fullName" className="form-label">Full name</label>
              <input id="fullName" name="fullName" className="form-control" value={form.fullName} onChange={handleChange} autoComplete="name" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="email" className="form-label">Email</label>
              <input id="email" name="email" className="form-control" inputMode="email" value={form.email} onChange={handleChange} autoComplete="email" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="phone" className="form-label">Phone</label>
              <input id="phone" name="phone" className="form-control" inputMode="tel" value={form.phone} onChange={handleChange} autoComplete="tel" required />
            </div>
            {isProsumer && (
              <div className="col-md-6">
                <label htmlFor="address" className="form-label">Address <span className="text-secondary">(optional)</span></label>
                <input id="address" name="address" className="form-control" value={form.address} onChange={handleChange} autoComplete="street-address" />
              </div>
            )}
            {!isEdit && (
              <div className="col-md-6">
                <label htmlFor="password" className="form-label">Password</label>
                <input id="password" name="password" type="password" className="form-control" value={form.password} onChange={handleChange} autoComplete="new-password" required />
                <div className="form-text">At least 6 characters.</div>
              </div>
            )}
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              {isEdit ? 'Save changes' : 'Create account'}
            </button>
            <Link to={listPath} className="btn btn-outline-secondary">Cancel</Link>
          </div>
        </form>
      )}
    </>
  );
}
