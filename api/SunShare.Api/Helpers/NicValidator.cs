/*
 * ============================================================================
 *  File        : NicValidator.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : Checks that a Sri Lankan NIC has a valid format (rule R1)
 *                and cleans typed NICs so the same person always matches.
 * ============================================================================
 */
using System.Text.RegularExpressions;

namespace SunShare.Api.Helpers;

// The NIC is every user's primary key (_id), so it must be in one of the two official formats.
public static class NicValidator
{
    // Old NIC: 9 digits + V or X (e.g. 981234567V). New NIC: 12 digits (e.g. 199812345678).
    private static readonly Regex NicPattern = new(@"^(\d{9}[VX]|\d{12})$");

    // Returns true when the (already cleaned) text is a valid old-style or new-style NIC.
    public static bool IsValid(string nic)
    {
        return NicPattern.IsMatch(nic);
    }

    // Cleans a typed NIC: removes spaces around it and makes the V/X letter uppercase,
    // so "981234567v" and "981234567V " are treated as the same person.
    public static string Normalize(string? nic)
    {
        return (nic ?? "").Trim().ToUpperInvariant();
    }
}
