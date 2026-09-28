/*
 * ============================================================================
 *  File        : StationRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : JSON body for POST /api/stations and PUT /api/stations/{id}
 *                (the Station form, web W10).
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// The station form. StationService checks every field (FAT service).
public class StationRequest
{
    public string Name { get; set; } = "";

    public string Address { get; set; } = "";

    // GPS position: latitude -90..90, longitude -180..180.
    public double Latitude { get; set; }

    public double Longitude { get; set; }

    // Solar generation capacity in kW (more than 0).
    public double CapacityKw { get; set; }

    // Battery places at the hub (at least 1).
    public int BatterySlots { get; set; }

    // Operating schedule, 24-hour "HH:mm", e.g. "06:00" and "18:00".
    public string OpenTime { get; set; } = "";

    public string CloseTime { get; set; } = "";
}
