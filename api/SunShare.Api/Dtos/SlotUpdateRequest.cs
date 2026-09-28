/*
 * ============================================================================
 *  File        : SlotUpdateRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : JSON body for PUT /api/slots/{id}: new times, number of
 *                places and whether the window is open for booking.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// The editable parts of a slot. The station can't change (make a new slot instead).
public class SlotUpdateRequest
{
    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public int TotalSlots { get; set; }

    // false = closed: prosumers can't book it any more.
    public bool IsActive { get; set; }
}
