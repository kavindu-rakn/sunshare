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

// "2026-09-29T05:30:00Z" -> "Tue, 29 Sep" (local date only).
export function formatDate(isoText) {
  if (!isoText) {
    return '';
  }
  return new Date(isoText).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
}

// UTC time from the API -> the "YYYY-MM-DDTHH:mm" local text a <input type="datetime-local"> expects.
export function toDateTimeInput(isoText) {
  const date = new Date(isoText);
  // Two digits: 7 -> "07".
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// The local text from a datetime-local input -> UTC ISO text for the API (the API works in UTC).
export function fromDateTimeInput(localText) {
  return new Date(localText).toISOString();
}

// A <input type="date"> value ("2026-09-30", a local day) -> UTC ISO text of that day's local midnight,
// moved by addDays (the "to" filter uses the next day, so the whole chosen day is included).
export function fromDateInput(dateText, addDays = 0) {
  const date = new Date(`${dateText}T00:00`);
  date.setDate(date.getDate() + addDays);
  return date.toISOString();
}
