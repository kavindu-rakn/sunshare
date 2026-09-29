/*
 * ============================================================================
 *  File        : dashboardApi.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : Calls GET /api/dashboard/summary for the staff dashboard (W3).
 * ============================================================================
 */
import { api } from './client.js';

// The count cards + next pending bookings, all counted by the API (docs/01-SPEC.md §5).
export function getStaffSummary() {
  return api.get('/api/dashboard/summary');
}
