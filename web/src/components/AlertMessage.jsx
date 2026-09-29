/*
 * ============================================================================
 *  File        : AlertMessage.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Bootstrap alert that shows the API's message: red for errors,
 *                green for success. Screen readers announce it automatically.
 * ============================================================================
 */

const ICONS = { danger: 'bi-exclamation-triangle-fill', success: 'bi-check-circle-fill', info: 'bi-info-circle-fill' };

// Example: <AlertMessage type="danger" message={error} onClose={() => setError('')} />. Shows nothing if message is empty.
export default function AlertMessage({ type = 'danger', message, onClose }) {
  if (!message) {
    return null;
  }
  return (
    <div
      className={`alert alert-${type} d-flex align-items-start gap-2`}
      role={type === 'danger' ? 'alert' : 'status'}
    >
      <i className={`bi ${ICONS[type] ?? ICONS.info} mt-1`} aria-hidden="true"></i>
      <div className="flex-grow-1">{message}</div>
      {onClose && <button type="button" className="btn-close" aria-label="Close message" onClick={onClose}></button>}
    </div>
  );
}
