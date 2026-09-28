/*
 * ============================================================================
 *  File        : vite.config.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-27
 *  Description : Vite settings: turn on the React plugin and run the dev
 *                server on port 5173 (the API's CORS list allows this port),
 *                unless a PORT environment variable asks for another one.
 * ============================================================================
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Reference: Vite, "Configuring Vite" https://vite.dev/config/
// Port: 5173 by default; a tool (e.g. a preview browser) can set PORT to pick a free one.
// strictPort = fail instead of silently moving to another port, which the API would block (CORS).
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
  },
})
