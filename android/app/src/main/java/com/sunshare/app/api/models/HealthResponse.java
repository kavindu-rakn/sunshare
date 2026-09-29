/*
 * ============================================================================
 *  File        : HealthResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Answer of GET /api/health: is the API running and
 *                connected to MongoDB?
 * ============================================================================
 */
package com.sunshare.app.api.models;

// Gson fills these fields from the JSON { "api": "ok", "database": "connected", "time": "..." }.
public class HealthResponse {
    public String api;
    public String database;
    public String time;
}
