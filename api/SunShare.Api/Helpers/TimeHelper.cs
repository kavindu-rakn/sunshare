/*
 * ============================================================================
 *  File        : TimeHelper.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Small time helpers shared by the services. The API stores
 *                and compares all times in UTC (docs/02-ARCHITECTURE.md §8).
 * ============================================================================
 */

namespace SunShare.Api.Helpers;

// One place for time conversions, so every service treats times the same way.
public static class TimeHelper
{
    // Sri Lanka time is UTC + 5 hours 30 minutes (no daylight saving).
    public static readonly TimeSpan SriLankaOffset = TimeSpan.FromHours(5.5);

    // Makes sure a time from a client is in UTC. A time sent with a zone ("...Z" or "...+05:30")
    // is converted; a time sent without one ("2026-09-30T08:00") is taken as UTC already.
    public static DateTime AsUtc(DateTime value)
    {
        if (value.Kind == DateTimeKind.Unspecified)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }
        return value.ToUniversalTime();
    }

    // The moment "today" began in Sri Lanka (local midnight), written in UTC.
    // Example: at 23:00 on 28 Sep in Sri Lanka this returns 27 Sep 18:30 UTC.
    public static DateTime StartOfTodayInSriLankaUtc()
    {
        DateTime todayInSriLanka = (DateTime.UtcNow + SriLankaOffset).Date;
        return DateTime.SpecifyKind(todayInSriLanka - SriLankaOffset, DateTimeKind.Utc);
    }
}
