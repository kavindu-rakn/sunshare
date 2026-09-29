/*
 * ============================================================================
 *  File        : StatusBadge.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Coloured pill for a status word: Pending (amber), Approved
 *                (teal), Completed/Active (green), Cancelled (grey),
 *                Deactivated (red). Colours are in styles/theme.css.
 * ============================================================================
 */

// Example: <StatusBadge status="Approved" /> - the status text comes straight from the API.
export default function StatusBadge({ status }) {
  const cssName = `status-${String(status).toLowerCase()}`;
  return <span className={`badge rounded-pill status-badge ${cssName}`}>{status}</span>;
}
