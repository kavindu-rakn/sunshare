/*
 * ============================================================================
 *  File        : SolarStation.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : One document in the "SolarStationInfo" collection: a solar
 *                microgrid station (node) with battery places and opening hours.
 * ============================================================================
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SunShare.Api.Models;

// A solar station where prosumers drop off (Sell) or collect (Buy) energy.
[BsonIgnoreExtraElements]
public class SolarStation
{
    // MongoDB ObjectId, handled as a string in C# (e.g. "66f6a1c2e4b0a1b2c3d4e5f1").
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = "";

    [BsonElement("name")]
    public string Name { get; set; } = "";

    [BsonElement("address")]
    public string Address { get; set; } = "";

    // GPS position, used for the map and the "nearby stations" distance (R18).
    [BsonElement("latitude")]
    public double Latitude { get; set; }

    [BsonElement("longitude")]
    public double Longitude { get; set; }

    // Solar generation capacity in kilowatts.
    [BsonElement("capacityKw")]
    public double CapacityKw { get; set; }

    // Number of battery places at the hub; a slot can't offer more places than this (R8).
    [BsonElement("batterySlots")]
    public int BatterySlots { get; set; }

    // Operating schedule as "HH:mm" text, e.g. "06:00" to "18:00".
    [BsonElement("openTime")]
    public string OpenTime { get; set; } = "";

    [BsonElement("closeTime")]
    public string CloseTime { get; set; } = "";

    // false = deactivated (R6).
    [BsonElement("isActive")]
    public bool IsActive { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
