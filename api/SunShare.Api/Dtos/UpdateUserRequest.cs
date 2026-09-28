/*
 * ============================================================================
 *  File        : UpdateUserRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : JSON body for PUT /api/users/{nic}, used by Backoffice to
 *                edit an account. The NIC and role can't be changed.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// The editable details of an account.
public class UpdateUserRequest
{
    public string FullName { get; set; } = "";

    public string Email { get; set; } = "";

    public string Phone { get; set; } = "";

    public string? Address { get; set; }
}
