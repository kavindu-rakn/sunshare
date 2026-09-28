/*
 * ============================================================================
 *  File        : ProsumerDashboardResponse.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : JSON answer of GET /api/dashboard/prosumer (the prosumer's
 *                mobile home M3). Only the caller's own bookings are counted.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// The prosumer home screen's count cards and "Next booking" card.
public class ProsumerDashboardResponse
{
    // My bookings with status Pending.
    public long PendingCount { get; set; }

    // My Approved bookings that haven't started yet.
    public long ApprovedFutureCount { get; set; }

    // My Completed bookings.
    public long CompletedCount { get; set; }

    // My soonest upcoming Pending or Approved booking, or null if I have none.
    public ReservationResponse? NextReservation { get; set; }
}
