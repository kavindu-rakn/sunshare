/*
 * ============================================================================
 *  File        : User.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : One document in the "Users" collection: a Backoffice,
 *                GridOperator or Prosumer account. The NIC is the _id.
 * ============================================================================
 */
using MongoDB.Bson.Serialization.Attributes;

namespace SunShare.Api.Models;

// A user account. [BsonElement] gives each field its camelCase name in MongoDB.
// [BsonIgnoreExtraElements] = skip unknown fields instead of crashing when reading old documents.
[BsonIgnoreExtraElements]
public class User
{
    // The NIC is the primary key (_id), as the brief asks. Its format is checked by rule R1.
    [BsonId]
    public string Nic { get; set; } = "";

    [BsonElement("fullName")]
    public string FullName { get; set; } = "";

    [BsonElement("email")]
    public string Email { get; set; } = "";

    [BsonElement("phone")]
    public string Phone { get; set; } = "";

    // Optional: the prosumer's property address.
    [BsonElement("address")]
    public string? Address { get; set; }

    // One of Roles: Backoffice, GridOperator, Prosumer.
    [BsonElement("role")]
    public string Role { get; set; } = "";

    // One of UserStatuses: Pending, Active, Deactivated.
    [BsonElement("status")]
    public string Status { get; set; } = "";

    // BCrypt hash of the password. The plain password is never stored and this is never sent to clients.
    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = "";

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
