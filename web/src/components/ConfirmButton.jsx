/*
 * ============================================================================
 *  File        : ConfirmButton.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : A button that asks "Are you sure?" (the browser's
 *                window.confirm) before deactivate, delete or cancel.
 * ============================================================================
 */

// Example: <ConfirmButton message="Delete this slot?" onConfirm={deleteSlot} className="btn btn-sm btn-outline-danger">Delete</ConfirmButton>
export default function ConfirmButton({ message, onConfirm, className = 'btn btn-outline-danger', disabled = false, children, ...rest }) {
  // Runs onConfirm only if the user clicks OK in the confirmation box.
  function handleClick() {
    if (window.confirm(message)) {
      onConfirm();
    }
  }

  return (
    <button type="button" className={className} disabled={disabled} onClick={handleClick} {...rest}>
      {children}
    </button>
  );
}
