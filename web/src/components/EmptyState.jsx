/*
 * ============================================================================
 *  File        : EmptyState.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Friendly message shown when a list has nothing to show,
 *                with an optional button (e.g. "Add station").
 * ============================================================================
 */

// Example: <EmptyState icon="bi-geo-alt" title="No stations yet" text="Add the first one." />
export default function EmptyState({ icon = 'bi-inbox', title, text, children }) {
  return (
    <div className="text-center py-5 px-3">
      <i className={`bi ${icon} display-5 text-secondary`} aria-hidden="true"></i>
      <h2 className="h5 mt-3">{title}</h2>
      {text && <p className="text-secondary mb-3">{text}</p>}
      {children}
    </div>
  );
}
