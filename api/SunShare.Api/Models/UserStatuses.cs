/*
 * ============================================================================
 *  File        : UserStatuses.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : The account statuses from docs/01-SPEC.md §3
 *                (Pending -> Active -> Deactivated -> Active).
 * ============================================================================
 */

namespace SunShare.Api.Models;

// Values of Users.status. Only Active users can log in (R3, R4).
public static class UserStatuses
{
    // Self-registered prosumer waiting for Backoffice activation (R3).
    public const string Pending = "Pending";

    public const string Active = "Active";

    // Can't log in; only Backoffice can reactivate (R4).
    public const string Deactivated = "Deactivated";
}
