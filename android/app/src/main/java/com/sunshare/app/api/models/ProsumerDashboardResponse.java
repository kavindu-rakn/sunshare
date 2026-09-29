/*
 * ============================================================================
 *  File        : ProsumerDashboardResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Answer of GET /api/dashboard/prosumer (Prosumer home):
 *                the prosumer's own counts and next booking.
 * ============================================================================
 */
package com.sunshare.app.api.models;

// nextReservation is null when the prosumer has no upcoming booking.
public class ProsumerDashboardResponse {
    public long pendingCount;
    public long approvedFutureCount;
    public long completedCount;
    public ReservationResponse nextReservation;
}
