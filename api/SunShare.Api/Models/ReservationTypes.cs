/*
 * ============================================================================
 *  File        : ReservationTypes.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : The two kinds of energy booking: Sell and Buy.
 * ============================================================================
 */

namespace SunShare.Api.Models;

// Values of EnergyReservations.type.
public static class ReservationTypes
{
    // Drop-off: the prosumer stores spare solar energy in the station's battery.
    public const string Sell = "Sell";

    // Charging: the prosumer takes energy from the station.
    public const string Buy = "Buy";
}
