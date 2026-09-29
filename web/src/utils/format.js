/*
 * ============================================================================
 *  File        : format.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Display helpers. The API sends times in UTC; these show them
 *                in the browser's local time (Sri Lanka) - display only, no rules.
 * ============================================================================
 */

// "2026-09-29T05:30:00Z" -> "Tue, 29 Sep, 11:00" (local time). Empty text for no value.
export function formatDateTime(isoText) {
  if (!isoText) {
    return '';
  }
  return new Date(isoText).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// "2026-09-29T05:30:00Z" -> "11:00" (local time only).
export function formatTime(isoText) {
  if (!isoText) {
    return '';
  }
  return new Date(isoText).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Link that opens Google Maps at a GPS point (used to check a station's pin).
// Reference: Google, "Maps URLs" https://developers.google.com/maps/documentation/urls/get-started
export function googleMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
