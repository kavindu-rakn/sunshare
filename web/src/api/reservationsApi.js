/*
 * ============================================================================
 *  File        : reservationsApi.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR (lists) / C - Reservations (actions)
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : Calls the /api/reservations endpoints: the list with its
 *                filters, one booking, and approve (used by the dashboard).
 *                Create / update / cancel were added by Part C (Malkith G W L,
 *                IT22630834) for the reservation form and the row actions.
 * ============================================================================
 */
import { api } from './client.js';

// GET /api/reservations?view=&status=&stationId=&from=&to=&search= - empty filters are left out.
export function listReservations(filters = {}) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value) params.set(name, value);
  }
  const query = params.toString();
  return api.get(`/api/reservations${query ? `?${query}` : ''}`);
}

// GET /api/reservations/{id} - one booking (with canModify and qrData from the API).
export function getReservation(id) {
  return api.get(`/api/reservations/${id}`);
}

// PATCH /api/reservations/{id}/approve - staff approve a Pending booking; the API makes the QR token (R13).
export function approveReservation(id) {
  return api.patch(`/api/reservations/${id}/approve`);
}

// POST /api/reservations - staff book for a prosumer: { prosumerNic, slotId, energyKwh, type }.
// The API checks R9, R11, R12, R13, R17 and answers the new Pending booking.
export function createReservation(data) {
  return api.post('/api/reservations', data);
}

// PUT /api/reservations/{id} - { slotId, energyKwh, type }; an Approved booking goes back to Pending (R13).
export function updateReservation(id, data) {
  return api.put(`/api/reservations/${id}`, data);
}

// PATCH /api/reservations/{id}/cancel - at least 12 hours before the start (R10); frees the place (R12).
export function cancelReservation(id) {
  return api.patch(`/api/reservations/${id}/cancel`);
}
