/*
 * ============================================================================
 *  File        : client.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : The one place the web app talks to the API: builds the URL,
 *                adds the login token, turns { "message" } errors into
 *                JavaScript errors, and logs out on 401. Also saves/loads the
 *                login session in localStorage.
 * ============================================================================
 */

// API address: .env.development (npm run dev) or .env.production (npm run build).
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Key under which the login session is kept in the browser's localStorage.
const SESSION_KEY = 'sunshare.session';

// Function to call when the API says 401 (token missing/expired). AuthContext sets it.
let unauthorizedHandler = null;

// An error from the API: keeps the HTTP status and the API's human-friendly message.
export class ApiError extends Error {
  // Creates the error with the HTTP status (0 = server not reachable) and the message to show.
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Saves the login session ({ token, nic, fullName, role, expiresAt }) in localStorage.
export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// Loads the saved session, or null if there is none or its token has expired.
export function loadSession() {
  const text = localStorage.getItem(SESSION_KEY);
  if (!text) {
    return null;
  }
  const session = JSON.parse(text);
  if (new Date(session.expiresAt) <= new Date()) {
    clearSession();
    return null;
  }
  return session;
}

// Removes the saved session (logout).
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Lets AuthContext say what to do when the API answers 401 (log out and go to the login page).
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

// Sends one request to the API and returns the JSON answer (null for "204 No Content").
// Throws an ApiError with the API's { "message" } when the answer is not OK.
async function request(method, path, body) {
  const session = loadSession();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (session) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  let response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the SunShare server. Please check that the API is running.');
  }

  // Our token was refused (expired or invalid): log out so the user can sign in again.
  if (response.status === 401 && session && unauthorizedHandler) {
    unauthorizedHandler();
  }
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && data.message ? data.message : `Something went wrong (HTTP ${response.status}).`;
    throw new ApiError(response.status, message);
  }
  return data;
}

// Short helpers used by the resource files (usersApi.js, stationsApi.js ...).
export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
