/*
 * ============================================================================
 *  File        : StaffDashboardResponse.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : JSON answer of GET /api/dashboard/summary (web W3 and the
 *                operator's mobile home M10).
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// Count cards + the next pending bookings (definitions in docs/01-SPEC.md §5).
public class StaffDashboardResponse
{
    // Bookings with status Pending.
    public long PendingReservations { get; set; }

    // Bookings with status Approved that haven't started yet.
    public long ApprovedFutureReservations { get; set; }

    // Bookings (not cancelled) that start today, Sri Lanka time.
    public long TodayReservations { get; set; }

    public long ActiveStations { get; set; }

    // Prosumers that are Pending or Deactivated (the Pending Activations page).
    public long PendingActivations { get; set; }

    // Up to 5 upcoming Pending bookings, soonest first (the dashboard table with Approve buttons).
    public List<ReservationResponse> PendingList { get; set; } = [];
}
