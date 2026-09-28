/*
 * ============================================================================
 *  File        : EnergyReservation.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : One document in the "EnergyReservations" collection: a
 *                prosumer's booking of a slot to sell or buy energy.
 * ============================================================================
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SunShare.Api.Models;

// A booking. MongoDB has no JOINs, so it keeps the ids of the prosumer, station and slot,
// plus copies of the prosumer and station names for fast lists and search.
[BsonIgnoreExtraElements]
public class EnergyReservation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = "";

    // Reference to Users._id (the NIC) and a copy of the name.
    [BsonElement("prosumerNic")]
    public string ProsumerNic { get; set; } = "";

    [BsonElement("prosumerName")]
    public string ProsumerName { get; set; } = "";

    // Reference to SolarStationInfo._id and a copy of the name.
    [BsonElement("stationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string StationId { get; set; } = "";

    [BsonElement("stationName")]
    public string StationName { get; set; } = "";

    // Reference to EnergyBookingSlots._id.
    [BsonElement("slotId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string SlotId { get; set; } = "";

    // Copied from the slot (UTC); used by the 7-day and 12-hour rules (R9, R10).
    [BsonElement("startTime")]
    public DateTime StartTime { get; set; }

    [BsonElement("endTime")]
    public DateTime EndTime { get; set; }

    // Amount of energy, more than 0 and at most 100 kWh (R17).
    [BsonElement("energyKwh")]
    public double EnergyKwh { get; set; }

    // One of ReservationTypes: Sell (drop off energy) or Buy (charge).
    [BsonElement("type")]
    public string Type { get; set; } = "";

    // One of ReservationStatuses: Pending, Approved, Completed, Cancelled.
    [BsonElement("status")]
    public string Status { get; set; } = "";

    // Random 32-character token set on approval (R13); part of the QR code text.
    [BsonElement("qrToken")]
    public string? QrToken { get; set; }

    // NIC of the staff member who approved, and when.
    [BsonElement("approvedBy")]
    public string? ApprovedBy { get; set; }

    [BsonElement("approvedAt")]
    public DateTime? ApprovedAt { get; set; }

    // NIC of the operator who scanned the QR and finished the transfer (R14), and when.
    [BsonElement("completedBy")]
    public string? CompletedBy { get; set; }

    [BsonElement("completedAt")]
    public DateTime? CompletedAt { get; set; }

    // NIC of whoever cancelled, and when.
    [BsonElement("cancelledBy")]
    public string? CancelledBy { get; set; }

    [BsonElement("cancelledAt")]
    public DateTime? CancelledAt { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
