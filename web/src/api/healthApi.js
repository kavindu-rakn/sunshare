/*
 * ============================================================================
 *  File        : healthApi.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Calls GET /api/health (public) - used by the Home page to
 *                show whether the server and database are online.
 * ============================================================================
 */
import { api } from './client.js';

// Asks the API if it is running and connected to MongoDB: { api, database, time }.
export function getHealth() {
  return api.get('/api/health');
}
