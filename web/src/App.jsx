/*
 * ============================================================================
 *  File        : App.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-27
 *  Description : Root component of the web app. Shows a simple placeholder
 *                screen until the page routes are added in the web shell phase.
 * ============================================================================
 */

// Root component: shows the SunShare name with a sun icon (proves Bootstrap + icons load).
export default function App() {
  return (
    <main className="container py-5">
      <h1 className="h3">
        <i className="bi bi-sun-fill text-warning me-2"></i>SunShare
      </h1>
      <p className="text-muted">The web app is being set up.</p>
    </main>
  )
}
