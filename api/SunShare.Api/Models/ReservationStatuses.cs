/*
 * ============================================================================
 *  File        : ReservationStatuses.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : The reservation statuses from docs/01-SPEC.md §3
 *                (Pending -> Approved -> Completed, or -> Cancelled).
 * ============================================================================
 */

namespace SunShare.Api.Models;

// Values of EnergyReservations.status.
public static class ReservationStatuses
{
    // New booking waiting for staff approval (R13).
    public const string Pending = "Pending";

    // Approved by staff; has a QR token (R13).
    public const string Approved = "Approved";

    // QR scanned and energy transfer finished by an operator (R14). Can't be changed (R15).
    public const string Completed = "Completed";

    // Cancelled at least 12 hours before the start (R10). Can't be changed (R15).
    public const string Cancelled = "Cancelled";
}
