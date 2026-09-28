/*
 * ============================================================================
 *  File        : LoginRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : JSON body for POST /api/auth/login.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// What the user types on the Login screen (web W2 / mobile M1).
public class LoginRequest
{
    public string Nic { get; set; } = "";

    public string Password { get; set; } = "";
}
