/*
 * ============================================================================
 *  File        : AppLayout.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : The frame around every staff page: sidebar menu + the page
 *                itself (<Outlet />). On phones the sidebar becomes a top bar
 *                with a menu button.
 * ============================================================================
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import SkipLink from './SkipLink.jsx';

// Staff page frame. menuOpen only matters on small screens (the menu button toggles it).
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <SkipLink />
      <Sidebar
        open={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
        onNavigate={() => setMenuOpen(false)}
      />
      <div className="app-content">
        {/* tabIndex -1 lets the skip link move focus here. */}
        <main id="content" tabIndex={-1} className="container-fluid p-3 p-lg-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
