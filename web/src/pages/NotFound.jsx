/*
 * ============================================================================
 *  File        : NotFound.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : W15 - friendly "page not found" screen for unknown addresses.
 * ============================================================================
 */
import { Link } from 'react-router-dom';

// Shown for any address that doesn't match a route.
export default function NotFound() {
  return (
    <main id="content" className="min-vh-100 d-flex align-items-center justify-content-center p-4 text-center">
      <div>
        <i className="bi bi-sun display-1 text-warning" aria-hidden="true"></i>
        <h1 className="display-5 fw-bold mt-3">Page not found</h1>
        <p className="text-secondary mb-4">The page you're looking for isn't here. It may have moved, or the address has a typo.</p>
        <Link to="/" className="btn btn-primary">
          <i className="bi bi-house me-2" aria-hidden="true"></i>Back to home
        </Link>
      </div>
    </main>
  );
}
