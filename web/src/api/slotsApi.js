/*
 * ============================================================================
 *  File        : slotsApi.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Calls the slot endpoints. Times are sent and received in UTC;
 *                the rules (R8, R9, R11) are checked by the API.
 * ============================================================================
 */
import { api } from './client.js';

// GET /api/stations/{stationId}/slots - a station's slots (the API's default: from today for 14 days).
export function listStationSlots(stationId) {
  return api.get(`/api/stations/${stationId}/slots`);
}

// GET /api/slots/available?stationId= - slots that can be booked now (used by the reservation form).
export function listAvailableSlots(stationId) {
  return api.get(`/api/slots/available${stationId ? `?stationId=${stationId}` : ''}`);
}

// GET /api/slots/{id} - one slot, with its station's name and booked places.
export function getSlot(id) {
  return api.get(`/api/slots/${id}`);
}

// POST /api/slots - { stationId, startTime, endTime, totalSlots } (times in UTC).
export function createSlot(data) {
  return api.post('/api/slots', data);
}

// PUT /api/slots/{id} - { startTime, endTime, totalSlots, isActive }.
export function updateSlot(id, data) {
  return api.put(`/api/slots/${id}`, data);
}

// DELETE /api/slots/{id} - refused (409) while it has active reservations (R8).
export function deleteSlot(id) {
  return api.delete(`/api/slots/${id}`);
}
