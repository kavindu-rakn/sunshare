/*
 * ============================================================================
 *  File        : SlotRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : JSON body for POST /api/slots (the Slot form, web W12).
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// A new time window at a station. Times should be sent in UTC, e.g. "2026-09-30T02:30:00Z".
public class SlotRequest
{
    public string StationId { get; set; } = "";

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    // Places in this window: 1 up to the station's battery slots (R8).
    public int TotalSlots { get; set; }
}
