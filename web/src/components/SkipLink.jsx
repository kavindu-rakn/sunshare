/*
 * ============================================================================
 *  File        : SkipLink.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : "Skip to main content" link for keyboard users. It is hidden
 *                until it gets keyboard focus (first Tab on the page).
 * ============================================================================
 */

// HashRouter uses the "#" part of the address for pages, so a normal href="#content" would change
// the page. Instead the click moves keyboard focus to <main id="content"> by code.
export default function SkipLink() {
  // Moves keyboard focus to the main content.
  function handleClick(event) {
    event.preventDefault();
    const main = document.getElementById('content');
    if (main) {
      main.focus();
    }
  }

  return (
    <a href="#content" className="skip-link visually-hidden-focusable" onClick={handleClick}>
      Skip to main content
    </a>
  );
}
