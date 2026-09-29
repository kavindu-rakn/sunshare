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
