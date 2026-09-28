/*
 * ============================================================================
 *  File        : StationResponse.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : The JSON shape of a station sent to the clients, with the
 *                API-calculated active booking count and (for /nearby) distance.
 * ============================================================================
 */
using SunShare.Api.Models;

namespace SunShare.Api.Dtos;

// What clients see about a station (docs/04-API.md "StationResponse").
public class StationResponse
{
    public string Id { get; set; } = "";

    public string Name { get; set; } = "";

    public string Address { get; set; } = "";

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double CapacityKw { get; set; }

    public int BatterySlots { get; set; }

    public string OpenTime { get; set; } = "";

    public string CloseTime { get; set; } = "";

    public bool IsActive { get; set; }

    // Pending/Approved reservations that haven't started yet (the R6 definition).
    public long ActiveReservationCount { get; set; }

    // Kilometres from the phone; only filled by GET /api/stations/nearby (R18), otherwise null.
    public double? DistanceKm { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    // Builds the response from a stored station plus the numbers the service calculated.
    public static StationResponse FromStation(SolarStation station, long activeReservationCount, double? distanceKm = null)
    {
        return new StationResponse
        {
            Id = station.Id,
            Name = station.Name,
            Address = station.Address,
            Latitude = station.Latitude,
            Longitude = station.Longitude,
            CapacityKw = station.CapacityKw,
            BatterySlots = station.BatterySlots,
            OpenTime = station.OpenTime,
            CloseTime = station.CloseTime,
            IsActive = station.IsActive,
            ActiveReservationCount = activeReservationCount,
            DistanceKm = distanceKm,
            CreatedAt = station.CreatedAt,
            UpdatedAt = station.UpdatedAt
        };
    }
}
