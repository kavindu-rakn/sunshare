/*
 * ============================================================================
 *  File        : stationsApi.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Calls the /api/stations endpoints. One small function per
 *                endpoint; the rules (R6, R7) are checked by the API.
 * ============================================================================
 */
import { api } from './client.js';

// GET /api/stations?activeOnly= - all stations (or only active ones), each with activeReservationCount.
export function listStations(activeOnly = false) {
  return api.get(`/api/stations${activeOnly ? '?activeOnly=true' : ''}`);
}

// GET /api/stations/{id} - one station.
export function getStation(id) {
  return api.get(`/api/stations/${id}`);
}

// POST /api/stations - { name, address, latitude, longitude, capacityKw, batterySlots, openTime, closeTime }.
export function createStation(data) {
  return api.post('/api/stations', data);
}

// PUT /api/stations/{id} - same fields as create.
export function updateStation(id, data) {
  return api.put(`/api/stations/${id}`, data);
}

// PATCH /api/stations/{id}/deactivate - refused (409) while it has active reservations (R6).
export function deactivateStation(id) {
  return api.patch(`/api/stations/${id}/deactivate`);
}

// PATCH /api/stations/{id}/activate - switch a deactivated station back on.
export function activateStation(id) {
  return api.patch(`/api/stations/${id}/activate`);
}

// DELETE /api/stations/{id} - refused (409) if it has any booking history (R7).
export function deleteStation(id) {
  return api.delete(`/api/stations/${id}`);
}
