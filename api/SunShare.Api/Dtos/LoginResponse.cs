/*
 * ============================================================================
 *  File        : LoginResponse.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : JSON answer of a successful login: the token plus who the
 *                user is, so the client can pick the right home screen.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// The web saves this in localStorage; Android saves it in the SQLite "session" table.
public class LoginResponse
{
    // The signed JWT to send as "Authorization: Bearer <token>" on every later request.
    public string Token { get; set; } = "";

    public string Nic { get; set; } = "";

    public string FullName { get; set; } = "";

    // Backoffice, GridOperator or Prosumer - decides which menu / home screen to show.
    public string Role { get; set; } = "";

    // When the token stops working (8 hours after login, UTC).
    public DateTime ExpiresAt { get; set; }
}
