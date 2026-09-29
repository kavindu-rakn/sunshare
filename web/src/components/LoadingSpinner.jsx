/*
 * ============================================================================
 *  File        : LoadingSpinner.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Spinning circle shown while waiting for the API.
 * ============================================================================
 */

// Example: {loading && <LoadingSpinner text="Loading stations..." />}
export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-4" role="status">
      <span className="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
      <span>{text}</span>
    </div>
  );
}
