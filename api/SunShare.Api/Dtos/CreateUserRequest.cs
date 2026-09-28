/*
 * ============================================================================
 *  File        : CreateUserRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : JSON body for POST /api/users, used by Backoffice to create
 *                any account (Backoffice, GridOperator or Prosumer).
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// Details for a new account. UserService checks every field and sends friendly messages.
public class CreateUserRequest
{
    public string Nic { get; set; } = "";

    public string FullName { get; set; } = "";

    public string Email { get; set; } = "";

    public string Phone { get; set; } = "";

    public string? Address { get; set; }

    // Backoffice, GridOperator or Prosumer.
    public string Role { get; set; } = "";

    public string Password { get; set; } = "";
}
