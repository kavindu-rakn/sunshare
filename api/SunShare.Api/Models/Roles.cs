/*
 * ============================================================================
 *  File        : Roles.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : The three account roles (rule R2), written once so every
 *                file uses exactly the same spelling.
 * ============================================================================
 */

namespace SunShare.Api.Models;

// Role names stored in Users.role, put inside the login token, and used in [Authorize(Roles = ...)].
public static class Roles
{
    public const string Backoffice = "Backoffice";

    public const string GridOperator = "GridOperator";

    public const string Prosumer = "Prosumer";

    // Both staff roles, for endpoints Backoffice and GridOperator can both use: [Authorize(Roles = Roles.Staff)].
    public const string Staff = Backoffice + "," + GridOperator;
}
