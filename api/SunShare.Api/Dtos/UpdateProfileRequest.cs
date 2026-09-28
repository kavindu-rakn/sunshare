/*
 * ============================================================================
 *  File        : UpdateProfileRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : JSON body for PUT /api/profile: a prosumer edits their own
 *                details and can optionally set a new password.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// What the prosumer can change on the mobile Profile screen (M4). There is no NIC here on purpose:
// the NIC comes from the login token (R16).
public class UpdateProfileRequest
{
    public string FullName { get; set; } = "";

    public string Email { get; set; } = "";

    public string Phone { get; set; } = "";

    public string? Address { get; set; }

    // Leave empty/null to keep the current password; otherwise at least 6 characters.
    public string? NewPassword { get; set; }
}
