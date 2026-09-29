/*
 * ============================================================================
 *  File        : main.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-27
 *  Description : Entry point of the React web app. Loads the Bootstrap 5 and
 *                Bootstrap Icons stylesheets plus our SunShare theme on top,
 *                then draws <App /> on the page.
 * ============================================================================
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'
import App from './App.jsx'

// Start-up: find <div id="root"> in index.html and draw the App inside it.
// StrictMode only adds extra warnings while developing; it does nothing in the built site.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
