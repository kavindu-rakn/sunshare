/*
 * ============================================================================
 *  File        : ReservationResponse.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-28
 *  Description : The JSON shape of a booking sent to the clients, including
 *                the API-calculated canModify and qrData. Built by
 *                ReservationMapper (also used by Part D).
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// What clients see about a booking (docs/04-API.md "ReservationResponse").
public class ReservationResponse
{
    public string Id { get; set; } = "";

    public string ProsumerNic { get; set; } = "";

    public string ProsumerName { get; set; } = "";

    public string StationId { get; set; } = "";

    public string StationName { get; set; } = "";

    public string SlotId { get; set; } = "";

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public double EnergyKwh { get; set; }

    public string Type { get; set; } = "";

    public string Status { get; set; } = "";

    // true = the apps may show Edit / Cancel (Pending or Approved, and at least 12 hours before the start).
    // Calculated by the API so the apps hold no rule logic (R10, R15).
    public bool CanModify { get; set; }

    // The text to put in the QR code, "SUNSHARE|<id>|<token>" - only for Approved bookings, otherwise null.
    public string? QrData { get; set; }

    public string? ApprovedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public string? CompletedBy { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? CancelledBy { get; set; }

    public DateTime? CancelledAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
