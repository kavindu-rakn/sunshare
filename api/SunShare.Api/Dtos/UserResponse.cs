/*
 * ============================================================================
 *  File        : UserResponse.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : The JSON shape of a user sent back to the clients.
 *                It never contains the password hash.
 * ============================================================================
 */
using SunShare.Api.Models;

namespace SunShare.Api.Dtos;

// What clients see about a user (docs/04-API.md "UserResponse").
public class UserResponse
{
    public string Nic { get; set; } = "";

    public string FullName { get; set; } = "";

    public string Email { get; set; } = "";

    public string Phone { get; set; } = "";

    public string? Address { get; set; }

    public string Role { get; set; } = "";

    public string Status { get; set; } = "";

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    // Copies the safe fields of a stored User into a response (the password hash is left out on purpose).
    public static UserResponse FromUser(User user)
    {
        return new UserResponse
        {
            Nic = user.Nic,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Address = user.Address,
            Role = user.Role,
            Status = user.Status,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}
