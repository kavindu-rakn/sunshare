/*
 * ============================================================================
 *  File        : CreateReservationRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-28
 *  Description : JSON body for POST /api/reservations (web W14 / mobile M6).
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// A new booking. Prosumers leave prosumerNic empty (their NIC comes from the login token, R16);
// Backoffice / Grid Operators booking on behalf of someone must send the prosumer's NIC.
public class CreateReservationRequest
{
    public string? ProsumerNic { get; set; }

    public string SlotId { get; set; } = "";

    // More than 0 and at most 100 kWh (R17).
    public double EnergyKwh { get; set; }

    // "Sell" (drop off energy) or "Buy" (charge).
    public string Type { get; set; } = "";
}
