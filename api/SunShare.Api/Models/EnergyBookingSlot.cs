/*
 * ============================================================================
 *  File        : EnergyBookingSlot.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : One document in the "EnergyBookingSlots" collection: a time
 *                window at a station with a number of bookable places.
 * ============================================================================
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SunShare.Api.Models;

// A bookable time window at one station, e.g. tomorrow 08:00-10:00 with 4 places.
[BsonIgnoreExtraElements]
public class EnergyBookingSlot
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = "";

    // Reference to the station (SolarStationInfo._id).
    [BsonElement("stationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string StationId { get; set; } = "";

    // Stored in UTC (docs/02-ARCHITECTURE.md §8). End must be after start (R8).
    [BsonElement("startTime")]
    public DateTime StartTime { get; set; }

    [BsonElement("endTime")]
    public DateTime EndTime { get; set; }

    // Places in this window: 1 up to the station's batterySlots (R8).
    [BsonElement("totalSlots")]
    public int TotalSlots { get; set; }

    // Free places left. Only reservation create / cancel / move change it (R12).
    [BsonElement("availableSlots")]
    public int AvailableSlots { get; set; }

    // Operators can close a window by setting this to false.
    [BsonElement("isActive")]
    public bool IsActive { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
