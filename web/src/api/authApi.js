/*
 * ============================================================================
 *  File        : authApi.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-29
 *  Description : Calls POST /api/auth/login for the web Login page.
 * ============================================================================
 */
import { api } from './client.js';

// Sends NIC + password; the API answers { token, nic, fullName, role, expiresAt } or an error message.
export function login(nic, password) {
  return api.post('/api/auth/login', { nic, password });
}
