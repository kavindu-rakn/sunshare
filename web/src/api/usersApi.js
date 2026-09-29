/*
 * ============================================================================
 *  File        : usersApi.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : Calls the /api/users endpoints (web users, prosumers,
 *                pending activations). One small function per endpoint.
 * ============================================================================
 */
import { api } from './client.js';

// Name of the browser event fired when an account's status changes, so the sidebar
// can refresh its "Pending activations" count badge.
export const ACTIVATIONS_CHANGED = 'sunshare:activations-changed';

// Tells the rest of the page (the sidebar badge) that activations may have changed.
export function notifyActivationsChanged() {
  window.dispatchEvent(new Event(ACTIVATIONS_CHANGED));
}

// GET /api/users?role=&status=&search= - any filter can be left empty.
export function listUsers({ role = '', status = '', search = '' } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  const query = params.toString();
  return api.get(`/api/users${query ? `?${query}` : ''}`);
}

// GET /api/users/pending-activations - prosumers that are Pending or Deactivated.
export function getPendingActivations() {
  return api.get('/api/users/pending-activations');
}

// GET /api/users/{nic} - one account.
export function getUser(nic) {
  return api.get(`/api/users/${encodeURIComponent(nic)}`);
}

// POST /api/users - Backoffice creates an account { nic, fullName, email, phone, address, role, password }.
export function createUser(data) {
  return api.post('/api/users', data);
}

// PUT /api/users/{nic} - edit { fullName, email, phone, address }.
export function updateUser(nic, data) {
  return api.put(`/api/users/${encodeURIComponent(nic)}`, data);
}

// PATCH /api/users/{nic}/activate - Pending or Deactivated -> Active.
export function activateUser(nic) {
  return api.patch(`/api/users/${encodeURIComponent(nic)}/activate`);
}

// PATCH /api/users/{nic}/deactivate - Active -> Deactivated.
export function deactivateUser(nic) {
  return api.patch(`/api/users/${encodeURIComponent(nic)}/deactivate`);
}
