/*
 * ============================================================================
 *  File        : RegisterRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : JSON body for POST /api/auth/register (mobile self-sign-up
 *                by a prosumer). There is no role field: it is always Prosumer.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// What a prosumer fills in on the mobile Register screen (M2).
public class RegisterRequest
{
    public string Nic { get; set; } = "";

    public string FullName { get; set; } = "";

    public string Email { get; set; } = "";

    public string Phone { get; set; } = "";

    // The prosumer's property address (optional).
    public string? Address { get; set; }

    public string Password { get; set; } = "";
}
