/*
 * ============================================================================
 *  File        : vite.config.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-27
 *  Description : Vite settings: turn on the React plugin and always run the
 *                dev server on port 5173 (the API's CORS list allows this port).
 * ============================================================================
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Reference: Vite, "Configuring Vite" https://vite.dev/config/
// strictPort = fail instead of silently moving to 5174, which the API would block (CORS).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
