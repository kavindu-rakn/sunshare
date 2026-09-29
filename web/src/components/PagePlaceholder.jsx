/*
 * ============================================================================
 *  File        : PagePlaceholder.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Temporary stand-in for a page that a later build phase
 *                replaces (removed once every page exists).
 * ============================================================================
 */
import PageHeader from './PageHeader.jsx';
import EmptyState from './EmptyState.jsx';

// Example: <PagePlaceholder title="Stations" phase={9} />
export default function PagePlaceholder({ title, phase }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card">
        <EmptyState icon="bi-cone-striped" title="Coming soon" text={`This page is built in phase ${phase}.`} />
      </div>
    </>
  );
}
