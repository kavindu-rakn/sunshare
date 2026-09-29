/*
 * ============================================================================
 *  File        : StaffDashboardResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Answer of GET /api/dashboard/summary (Grid Operator home):
 *                counts worked out by the API.
 * ============================================================================
 */
package com.sunshare.app.api.models;

import java.util.List;

// Count cards + the next pending bookings (docs/01-SPEC.md section 5).
public class StaffDashboardResponse {
    public long pendingReservations;
    public long approvedFutureReservations;
    public long todayReservations;
    public long activeStations;
    public long pendingActivations;
    public List<ReservationResponse> pendingList;
}
