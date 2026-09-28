/*
 * ============================================================================
 *  File        : UpdateReservationRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-28
 *  Description : JSON body for PUT /api/reservations/{id}: move to another
 *                slot and/or change the energy amount or type.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// The editable parts of a booking. The prosumer can't change (cancel and book again instead).
public class UpdateReservationRequest
{
    // The same slot id to stay, or another one to move the booking (R12).
    public string SlotId { get; set; } = "";

    public double EnergyKwh { get; set; }

    public string Type { get; set; } = "";
}
