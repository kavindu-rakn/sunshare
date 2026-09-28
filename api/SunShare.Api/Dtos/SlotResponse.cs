/*
 * ============================================================================
 *  File        : SlotResponse.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : The JSON shape of a slot sent to the clients, with the
 *                station's name and the number of booked places.
 * ============================================================================
 */
using SunShare.Api.Models;

namespace SunShare.Api.Dtos;

// What clients see about a slot (docs/04-API.md "SlotResponse").
public class SlotResponse
{
    public string Id { get; set; } = "";

    public string StationId { get; set; } = "";

    public string StationName { get; set; } = "";

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public int TotalSlots { get; set; }

    public int AvailableSlots { get; set; }

    // Places already taken = total - available.
    public int BookedSlots { get; set; }

    public bool IsActive { get; set; }

    // Builds the response from a stored slot and the name of its station.
    public static SlotResponse FromSlot(EnergyBookingSlot slot, string stationName)
    {
        return new SlotResponse
        {
            Id = slot.Id,
            StationId = slot.StationId,
            StationName = stationName,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            TotalSlots = slot.TotalSlots,
            AvailableSlots = slot.AvailableSlots,
            BookedSlots = slot.TotalSlots - slot.AvailableSlots,
            IsActive = slot.IsActive
        };
    }
}
